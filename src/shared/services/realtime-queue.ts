import { PerformanceMonitor } from '@/shared/utils/performance';
import type { RealtimePayload } from './supabase-realtime';

export interface QueueItem<T = any> {
  id: string;
  data: T;
  priority: 'high' | 'medium' | 'low';
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  processingStarted?: number;
  processingCompleted?: number;
  error?: Error;
}

export interface QueueMetrics {
  totalProcessed: number;
  totalErrors: number;
  averageProcessingTime: number;
  queueLength: number;
  processing: number;
  pendingByPriority: {
    high: number;
    medium: number;
    low: number;
  };
}

export interface QueueOptions {
  maxQueueSize?: number;
  maxConcurrentProcessing?: number;
  batchSize?: number;
  processingTimeout?: number;
  retryDelay?: number;
  priorityWeights?: {
    high: number;
    medium: number;
    low: number;
  };
}

export type QueueProcessor<T> = (item: QueueItem<T>) => Promise<void>;
export type BatchQueueProcessor<T> = (items: QueueItem<T>[]) => Promise<void>;

/**
 * Priority queue system for managing real-time data processing
 * Supports batching, rate limiting, and priority-based processing
 */
export class RealtimeQueue<T = RealtimePayload> {
  private queue: QueueItem<T>[] = [];
  private processing = new Set<string>();
  private processors = new Map<string, QueueProcessor<T>>();
  private batchProcessors = new Map<string, BatchQueueProcessor<T>>();
  private metrics: QueueMetrics;
  private performanceMonitor: PerformanceMonitor;
  private processingInterval?: NodeJS.Timeout;
  private options: Required<QueueOptions>;

  constructor(options: QueueOptions = {}) {
    this.options = {
      maxQueueSize: options.maxQueueSize ?? 1000,
      maxConcurrentProcessing: options.maxConcurrentProcessing ?? 10,
      batchSize: options.batchSize ?? 5,
      processingTimeout: options.processingTimeout ?? 30000, // 30 seconds
      retryDelay: options.retryDelay ?? 1000,
      priorityWeights: options.priorityWeights ?? {
        high: 3,
        medium: 2,
        low: 1,
      },
    };

    this.metrics = {
      totalProcessed: 0,
      totalErrors: 0,
      averageProcessingTime: 0,
      queueLength: 0,
      processing: 0,
      pendingByPriority: {
        high: 0,
        medium: 0,
        low: 0,
      },
    };

    this.performanceMonitor = PerformanceMonitor.getInstance();
    this.startProcessing();
  }

  /**
   * Add item to the queue with priority
   */
  enqueue(
    data: T,
    priority: 'high' | 'medium' | 'low' = 'medium',
    maxRetries: number = 3
  ): string {
    // Check queue size limit
    if (this.queue.length >= this.options.maxQueueSize) {
      // Remove oldest low priority items to make space
      this.evictLowPriorityItems();

      if (this.queue.length >= this.options.maxQueueSize) {
        throw new Error(
          `Queue is at maximum capacity (${this.options.maxQueueSize})`
        );
      }
    }

    const id = `queue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const item: QueueItem<T> = {
      id,
      data,
      priority,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries,
    };

    // Insert in priority order
    this.insertByPriority(item);
    this.updateMetrics();

    this.performanceMonitor.recordMetric('realtimeQueue', 'item_enqueued', {
      priority,
      queueLength: this.queue.length,
      id,
    });

    return id;
  }

  /**
   * Register a processor for individual items
   */
  registerProcessor(name: string, processor: QueueProcessor<T>): void {
    this.processors.set(name, processor);
  }

  /**
   * Register a batch processor for multiple items
   */
  registerBatchProcessor(
    name: string,
    processor: BatchQueueProcessor<T>
  ): void {
    this.batchProcessors.set(name, processor);
  }

  /**
   * Remove processor
   */
  unregisterProcessor(name: string): boolean {
    return this.processors.delete(name) || this.batchProcessors.delete(name);
  }

  /**
   * Get queue metrics
   */
  getMetrics(): QueueMetrics {
    return { ...this.metrics };
  }

  /**
   * Get queue status
   */
  getStatus(): {
    queueLength: number;
    processing: number;
    hasCapacity: boolean;
    isHealthy: boolean;
  } {
    const queueLength = this.queue.length;
    const processing = this.processing.size;
    const hasCapacity = queueLength < this.options.maxQueueSize * 0.8;
    const isHealthy =
      processing < this.options.maxConcurrentProcessing &&
      this.metrics.totalErrors / Math.max(this.metrics.totalProcessed, 1) < 0.1;

    return {
      queueLength,
      processing,
      hasCapacity,
      isHealthy,
    };
  }

  /**
   * Clear the queue
   */
  clear(): number {
    const cleared = this.queue.length;
    this.queue = [];
    this.processing.clear();
    this.updateMetrics();
    return cleared;
  }

  /**
   * Pause processing
   */
  pause(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = undefined;
    }
  }

  /**
   * Resume processing
   */
  resume(): void {
    if (!this.processingInterval) {
      this.startProcessing();
    }
  }

  /**
   * Shutdown the queue gracefully
   */
  async shutdown(): Promise<void> {
    this.pause();

    // Wait for current processing to complete
    while (this.processing.size > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.processors.clear();
    this.batchProcessors.clear();
  }

  /**
   * Insert item maintaining priority order
   */
  private insertByPriority(item: QueueItem<T>): void {
    const weights = this.options.priorityWeights;
    const itemWeight = weights[item.priority];

    let insertIndex = this.queue.length;

    // Find insertion point based on priority and timestamp
    for (let i = 0; i < this.queue.length; i++) {
      const existingWeight = weights[this.queue[i].priority];

      if (
        itemWeight > existingWeight ||
        (itemWeight === existingWeight &&
          item.timestamp < this.queue[i].timestamp)
      ) {
        insertIndex = i;
        break;
      }
    }

    this.queue.splice(insertIndex, 0, item);
  }

  /**
   * Remove low priority items when queue is full
   */
  private evictLowPriorityItems(): void {
    const lowPriorityItems = this.queue.filter(item => item.priority === 'low');
    if (lowPriorityItems.length > 0) {
      // Remove oldest low priority items first
      const itemsToRemove = Math.min(
        lowPriorityItems.length,
        Math.ceil(this.options.maxQueueSize * 0.1)
      );
      for (let i = 0; i < itemsToRemove; i++) {
        const index = this.queue.findIndex(item => item.priority === 'low');
        if (index !== -1) {
          this.queue.splice(index, 1);
        }
      }
    }
  }

  /**
   * Start the processing loop
   */
  private startProcessing(): void {
    this.processingInterval = setInterval(() => {
      this.processQueue();
    }, 100); // Process every 100ms
  }

  /**
   * Process items from the queue
   */
  private async processQueue(): Promise<void> {
    if (this.processing.size >= this.options.maxConcurrentProcessing) {
      return;
    }

    // Get next batch of items to process
    const itemsToProcess = this.getNextBatch();
    if (itemsToProcess.length === 0) {
      return;
    }

    // Process batch if we have batch processors
    if (
      this.batchProcessors.size > 0 &&
      itemsToProcess.length >= this.options.batchSize
    ) {
      await this.processBatch(itemsToProcess.slice(0, this.options.batchSize));
    } else {
      // Process individual items
      for (const item of itemsToProcess) {
        if (this.processing.size >= this.options.maxConcurrentProcessing) {
          break;
        }
        this.processItem(item);
      }
    }
  }

  /**
   * Get next batch of items to process
   */
  private getNextBatch(): QueueItem<T>[] {
    const available =
      this.options.maxConcurrentProcessing - this.processing.size;
    const items: QueueItem<T>[] = [];

    for (let i = 0; i < this.queue.length && items.length < available; i++) {
      const item = this.queue[i];
      if (!this.processing.has(item.id)) {
        items.push(item);
      }
    }

    return items;
  }

  /**
   * Process a batch of items
   */
  private async processBatch(items: QueueItem<T>[]): Promise<void> {
    const batchId = `batch-${Date.now()}`;
    const processingStarted = Date.now();

    // Mark all items as processing
    items.forEach(item => {
      this.processing.add(item.id);
      item.processingStarted = processingStarted;
    });

    try {
      // Process with all batch processors
      for (const [name, processor] of this.batchProcessors) {
        try {
          await Promise.race([
            processor(items),
            new Promise((_, reject) =>
              setTimeout(
                () => reject(new Error('Processing timeout')),
                this.options.processingTimeout
              )
            ),
          ]);
        } catch (error) {
          console.error(`Batch processor ${name} failed:`, error);
          items.forEach(
            item =>
              (item.error =
                error instanceof Error ? error : new Error(String(error)))
          );
        }
      }

      // Mark successful items as completed
      const completionTime = Date.now();
      items.forEach(item => {
        item.processingCompleted = completionTime;
        if (!item.error) {
          this.removeFromQueue(item.id);
          this.metrics.totalProcessed++;
        }
      });

      this.performanceMonitor.recordMetric('realtimeQueue', 'batch_processed', {
        batchSize: items.length,
        processingTime: completionTime - processingStarted,
        success: items.filter(item => !item.error).length,
      });
    } catch (error) {
      console.error('Batch processing failed:', error);
      items.forEach(item => {
        item.error = error instanceof Error ? error : new Error(String(error));
        this.handleItemError(item);
      });
    } finally {
      // Remove from processing set
      items.forEach(item => this.processing.delete(item.id));
      this.updateMetrics();
    }
  }

  /**
   * Process individual item
   */
  private async processItem(item: QueueItem<T>): Promise<void> {
    this.processing.add(item.id);
    item.processingStarted = Date.now();

    try {
      // Process with all individual processors
      for (const [name, processor] of this.processors) {
        try {
          await Promise.race([
            processor(item),
            new Promise((_, reject) =>
              setTimeout(
                () => reject(new Error('Processing timeout')),
                this.options.processingTimeout
              )
            ),
          ]);
        } catch (error) {
          console.error(`Processor ${name} failed for item ${item.id}:`, error);
          throw error;
        }
      }

      // Mark as completed
      item.processingCompleted = Date.now();
      this.removeFromQueue(item.id);
      this.metrics.totalProcessed++;

      this.performanceMonitor.recordMetric('realtimeQueue', 'item_processed', {
        itemId: item.id,
        priority: item.priority,
        processingTime: item.processingCompleted - item.processingStarted!,
        success: true,
      });
    } catch (error) {
      item.error = error instanceof Error ? error : new Error(String(error));
      this.handleItemError(item);
    } finally {
      this.processing.delete(item.id);
      this.updateMetrics();
    }
  }

  /**
   * Handle item processing error
   */
  private handleItemError(item: QueueItem<T>): void {
    this.metrics.totalErrors++;

    if (item.retryCount < item.maxRetries) {
      item.retryCount++;
      item.error = undefined;

      // Delay retry
      setTimeout(
        () => {
          // Re-insert into queue with lower priority
          const retryPriority = item.priority === 'high' ? 'medium' : 'low';
          item.priority = retryPriority;
          this.insertByPriority(item);
        },
        this.options.retryDelay * Math.pow(2, item.retryCount - 1)
      );
    } else {
      // Max retries exceeded, remove from queue
      this.removeFromQueue(item.id);

      this.performanceMonitor.recordMetric('realtimeQueue', 'item_failed', {
        itemId: item.id,
        priority: item.priority,
        retryCount: item.retryCount,
        error: item.error?.message,
      });
    }
  }

  /**
   * Remove item from queue
   */
  private removeFromQueue(itemId: string): boolean {
    const index = this.queue.findIndex(item => item.id === itemId);
    if (index !== -1) {
      this.queue.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Update queue metrics
   */
  private updateMetrics(): void {
    this.metrics.queueLength = this.queue.length;
    this.metrics.processing = this.processing.size;

    // Update priority counts
    this.metrics.pendingByPriority = {
      high: this.queue.filter(item => item.priority === 'high').length,
      medium: this.queue.filter(item => item.priority === 'medium').length,
      low: this.queue.filter(item => item.priority === 'low').length,
    };

    // Calculate average processing time
    const completedItems = this.queue.filter(
      item => item.processingCompleted && item.processingStarted
    );

    if (completedItems.length > 0) {
      const totalTime = completedItems.reduce(
        (sum, item) =>
          sum + (item.processingCompleted! - item.processingStarted!),
        0
      );
      this.metrics.averageProcessingTime = totalTime / completedItems.length;
    }
  }
}

// Export default instance for global use
export const realtimeQueue = new RealtimeQueue();
