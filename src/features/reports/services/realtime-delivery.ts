import { PerformanceMonitor } from '@/shared/utils/performance';
import {
  realtimeQueue,
  type QueueItem,
} from '@/shared/services/realtime-queue';
import { realtimeScheduler } from '@/shared/services/realtime-scheduler';
import type { RealtimePayload } from '@/shared/services/supabase-realtime';
import type { GeneratedReport } from '../types';

export interface DeliveryOptions {
  batchSize?: number;
  debounceMs?: number;
  maxRetries?: number;
  enableDeduplication?: boolean;
  enableCompression?: boolean;
  priority?: 'high' | 'medium' | 'low';
}

export interface DeliveryMetrics {
  totalDelivered: number;
  totalFailed: number;
  averageDeliveryTime: number;
  batchesDelivered: number;
  deduplicatedItems: number;
  compressionRatio: number;
}

export interface DeliverySubscription {
  id: string;
  componentId: string;
  assessmentId?: string;
  practiceId?: string;
  callback: (data: any) => void;
  options: DeliveryOptions;
  lastDelivery: number;
  isActive: boolean;
}

export interface PendingDelivery {
  subscriptionId: string;
  data: any;
  timestamp: number;
  attempts: number;
  priority: 'high' | 'medium' | 'low';
}

/**
 * Efficient real-time delivery service for UI updates
 * Provides batching, deduplication, and intelligent throttling
 */
export class RealtimeDeliveryService {
  private static instance: RealtimeDeliveryService;
  private subscriptions = new Map<string, DeliverySubscription>();
  private pendingDeliveries = new Map<string, PendingDelivery[]>();
  private debounceTimers = new Map<string, NodeJS.Timeout>();
  private metrics: DeliveryMetrics;
  private performanceMonitor: PerformanceMonitor;
  private deliveryInterval?: NodeJS.Timeout;
  private cleanupInterval?: NodeJS.Timeout;

  private constructor() {
    this.metrics = {
      totalDelivered: 0,
      totalFailed: 0,
      averageDeliveryTime: 0,
      batchesDelivered: 0,
      deduplicatedItems: 0,
      compressionRatio: 1.0,
    };

    this.performanceMonitor = PerformanceMonitor.getInstance();
    this.startDeliveryLoop();
    this.startCleanupLoop();
    this.setupQueueProcessors();
  }

  static getInstance(): RealtimeDeliveryService {
    if (!RealtimeDeliveryService.instance) {
      RealtimeDeliveryService.instance = new RealtimeDeliveryService();
    }
    return RealtimeDeliveryService.instance;
  }

  /**
   * Subscribe a component to receive real-time updates
   */
  subscribe(
    componentId: string,
    callback: (data: any) => void,
    options: DeliveryOptions & {
      assessmentId?: string;
      practiceId?: string;
    } = {}
  ): string {
    const subscriptionId = `sub-${componentId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const subscription: DeliverySubscription = {
      id: subscriptionId,
      componentId,
      assessmentId: options.assessmentId,
      practiceId: options.practiceId,
      callback,
      options: {
        batchSize: options.batchSize ?? 10,
        debounceMs: options.debounceMs ?? 500,
        maxRetries: options.maxRetries ?? 3,
        enableDeduplication: options.enableDeduplication ?? true,
        enableCompression: options.enableCompression ?? false,
        priority: options.priority ?? 'medium',
      },
      lastDelivery: 0,
      isActive: true,
    };

    this.subscriptions.set(subscriptionId, subscription);
    this.pendingDeliveries.set(subscriptionId, []);

    this.performanceMonitor.recordMetric(
      'realtimeDelivery',
      'subscription_created',
      {
        subscriptionId,
        componentId,
        assessmentId: options.assessmentId,
        practiceId: options.practiceId,
      }
    );

    console.log(
      `📡 Created delivery subscription for component ${componentId}: ${subscriptionId}`
    );

    return subscriptionId;
  }

  /**
   * Unsubscribe a component
   */
  unsubscribe(subscriptionId: string): boolean {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      return false;
    }

    // Mark as inactive and clean up
    subscription.isActive = false;
    this.subscriptions.delete(subscriptionId);
    this.pendingDeliveries.delete(subscriptionId);

    // Clear any pending debounce timer
    const timer = this.debounceTimers.get(subscriptionId);
    if (timer) {
      clearTimeout(timer);
      this.debounceTimers.delete(subscriptionId);
    }

    this.performanceMonitor.recordMetric(
      'realtimeDelivery',
      'subscription_removed',
      {
        subscriptionId,
        componentId: subscription.componentId,
      }
    );

    console.log(`📡 Removed delivery subscription: ${subscriptionId}`);

    return true;
  }

  /**
   * Deliver data to specific subscription
   */
  async deliver(
    subscriptionId: string,
    data: any,
    options: {
      immediate?: boolean;
      priority?: 'high' | 'medium' | 'low';
    } = {}
  ): Promise<void> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription || !subscription.isActive) {
      return;
    }

    const delivery: PendingDelivery = {
      subscriptionId,
      data,
      timestamp: Date.now(),
      attempts: 0,
      priority: options.priority ?? subscription.options.priority ?? 'medium',
    };

    // Add to pending deliveries
    const pending = this.pendingDeliveries.get(subscriptionId) || [];
    pending.push(delivery);
    this.pendingDeliveries.set(subscriptionId, pending);

    // Handle immediate delivery or debounced delivery
    if (options.immediate) {
      await this.processDelivery(subscriptionId);
    } else {
      this.scheduleDebounceDelivery(
        subscriptionId,
        subscription.options.debounceMs!
      );
    }
  }

  /**
   * Broadcast data to multiple subscriptions
   */
  async broadcast(
    data: any,
    filter: {
      assessmentId?: string;
      practiceId?: string;
      componentId?: string;
      priority?: 'high' | 'medium' | 'low';
    } = {},
    options: {
      immediate?: boolean;
    } = {}
  ): Promise<number> {
    let deliveryCount = 0;

    for (const subscription of this.subscriptions.values()) {
      if (!subscription.isActive) continue;

      // Apply filters
      if (
        filter.assessmentId &&
        subscription.assessmentId !== filter.assessmentId
      )
        continue;
      if (filter.practiceId && subscription.practiceId !== filter.practiceId)
        continue;
      if (filter.componentId && subscription.componentId !== filter.componentId)
        continue;

      await this.deliver(subscription.id, data, {
        immediate: options.immediate,
        priority: filter.priority,
      });

      deliveryCount++;
    }

    this.performanceMonitor.recordMetric('realtimeDelivery', 'broadcast_sent', {
      deliveryCount,
      filter,
      immediate: options.immediate,
    });

    return deliveryCount;
  }

  /**
   * Get delivery metrics
   */
  getMetrics(): DeliveryMetrics {
    return { ...this.metrics };
  }

  /**
   * Get subscription status
   */
  getSubscriptionStatus(): {
    totalSubscriptions: number;
    activeSubscriptions: number;
    pendingDeliveries: number;
    pendingByPriority: Record<'high' | 'medium' | 'low', number>;
  } {
    const active = Array.from(this.subscriptions.values()).filter(
      sub => sub.isActive
    );
    const allPending = Array.from(this.pendingDeliveries.values()).flat();

    const pendingByPriority = {
      high: allPending.filter(p => p.priority === 'high').length,
      medium: allPending.filter(p => p.priority === 'medium').length,
      low: allPending.filter(p => p.priority === 'low').length,
    };

    return {
      totalSubscriptions: this.subscriptions.size,
      activeSubscriptions: active.length,
      pendingDeliveries: allPending.length,
      pendingByPriority,
    };
  }

  /**
   * Pause all deliveries (for maintenance, etc.)
   */
  pauseDeliveries(): void {
    if (this.deliveryInterval) {
      clearInterval(this.deliveryInterval);
      this.deliveryInterval = undefined;
    }
  }

  /**
   * Resume deliveries
   */
  resumeDeliveries(): void {
    if (!this.deliveryInterval) {
      this.startDeliveryLoop();
    }
  }

  /**
   * Shutdown the delivery service gracefully
   */
  async shutdown(): Promise<void> {
    this.pauseDeliveries();

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // Clear all debounce timers
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();

    // Process any remaining deliveries
    for (const subscriptionId of this.subscriptions.keys()) {
      await this.processDelivery(subscriptionId);
    }

    this.subscriptions.clear();
    this.pendingDeliveries.clear();
  }

  /**
   * Setup queue processors for handling real-time data
   */
  private setupQueueProcessors(): void {
    // Register a processor for real-time payloads
    realtimeQueue.registerProcessor(
      'delivery',
      async (item: QueueItem<RealtimePayload>) => {
        await this.handleRealtimePayload(item.data);
      }
    );

    // Register batch processor for efficient handling
    realtimeQueue.registerBatchProcessor(
      'delivery-batch',
      async (items: QueueItem<RealtimePayload>[]) => {
        await this.handleRealtimePayloadBatch(items.map(item => item.data));
      }
    );
  }

  /**
   * Handle individual real-time payload
   */
  private async handleRealtimePayload(payload: RealtimePayload): Promise<void> {
    // Determine which subscriptions should receive this payload
    const relevantSubscriptions = this.findRelevantSubscriptions(payload);

    for (const subscription of relevantSubscriptions) {
      await this.deliver(subscription.id, payload, {
        priority: this.determinePriority(payload),
      });
    }
  }

  /**
   * Handle batch of real-time payloads
   */
  private async handleRealtimePayloadBatch(
    payloads: RealtimePayload[]
  ): Promise<void> {
    // Group payloads by subscription
    const payloadsBySubscription = new Map<string, RealtimePayload[]>();

    for (const payload of payloads) {
      const relevantSubscriptions = this.findRelevantSubscriptions(payload);

      for (const subscription of relevantSubscriptions) {
        const existing = payloadsBySubscription.get(subscription.id) || [];
        existing.push(payload);
        payloadsBySubscription.set(subscription.id, existing);
      }
    }

    // Deliver batches to each subscription
    for (const [subscriptionId, batchPayloads] of payloadsBySubscription) {
      await this.deliver(subscriptionId, batchPayloads, {
        priority: 'medium',
      });
    }
  }

  /**
   * Find subscriptions relevant to a payload
   */
  private findRelevantSubscriptions(
    payload: RealtimePayload
  ): DeliverySubscription[] {
    const relevant: DeliverySubscription[] = [];

    for (const subscription of this.subscriptions.values()) {
      if (!subscription.isActive) continue;

      // Check if payload is relevant to this subscription
      if (this.isPayloadRelevant(payload, subscription)) {
        relevant.push(subscription);
      }
    }

    return relevant;
  }

  /**
   * Check if payload is relevant to subscription
   */
  private isPayloadRelevant(
    payload: RealtimePayload,
    subscription: DeliverySubscription
  ): boolean {
    // Survey response relevance
    if (payload.table === 'survey_responses') {
      if (subscription.assessmentId) {
        return (
          (payload as any).new?.assessment_id === subscription.assessmentId ||
          (payload as any).old?.assessment_id === subscription.assessmentId
        );
      }
    }

    // Assessment relevance
    if (payload.table === 'assessments') {
      if (subscription.assessmentId) {
        return (
          (payload as any).new?.id === subscription.assessmentId ||
          (payload as any).old?.id === subscription.assessmentId
        );
      }
      if (subscription.practiceId) {
        return (
          (payload as any).new?.practice_id === subscription.practiceId ||
          (payload as any).old?.practice_id === subscription.practiceId
        );
      }
    }

    // Report relevance
    if (payload.table === 'reports') {
      if (subscription.assessmentId) {
        return (
          (payload as any).new?.assessment_id === subscription.assessmentId ||
          (payload as any).old?.assessment_id === subscription.assessmentId
        );
      }
      if (subscription.practiceId) {
        return (
          (payload as any).new?.practice_id === subscription.practiceId ||
          (payload as any).old?.practice_id === subscription.practiceId
        );
      }
    }

    return false;
  }

  /**
   * Determine priority based on payload type
   */
  private determinePriority(
    payload: RealtimePayload
  ): 'high' | 'medium' | 'low' {
    // Supabase uses 'type' not 'eventType' for the change type
    const eventType = (payload as any).type;
    if (eventType === 'INSERT') return 'high';
    if (eventType === 'UPDATE') return 'medium';
    return 'low';
  }

  /**
   * Schedule debounced delivery
   */
  private scheduleDebounceDelivery(
    subscriptionId: string,
    debounceMs: number
  ): void {
    // Clear existing timer
    const existingTimer = this.debounceTimers.get(subscriptionId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new timer
    const timer = setTimeout(async () => {
      await this.processDelivery(subscriptionId);
      this.debounceTimers.delete(subscriptionId);
    }, debounceMs);

    this.debounceTimers.set(subscriptionId, timer);
  }

  /**
   * Process pending deliveries for a subscription
   */
  private async processDelivery(subscriptionId: string): Promise<void> {
    const subscription = this.subscriptions.get(subscriptionId);
    const pending = this.pendingDeliveries.get(subscriptionId);

    if (
      !subscription ||
      !pending ||
      pending.length === 0 ||
      !subscription.isActive
    ) {
      return;
    }

    const startTime = Date.now();

    try {
      // Apply deduplication if enabled
      let dataToDeliver = pending.map(p => p.data);
      if (subscription.options.enableDeduplication) {
        const originalLength = dataToDeliver.length;
        dataToDeliver = this.deduplicateData(dataToDeliver);
        const deduplicatedCount = originalLength - dataToDeliver.length;
        this.metrics.deduplicatedItems += deduplicatedCount;
      }

      // Apply compression if enabled
      if (subscription.options.enableCompression) {
        dataToDeliver = this.compressData(dataToDeliver);
      }

      // Determine delivery format
      const deliveryData =
        dataToDeliver.length === 1 ? dataToDeliver[0] : dataToDeliver;

      // Schedule the actual delivery through the scheduler
      await realtimeScheduler.schedule(
        async () => {
          subscription.callback(deliveryData);
        },
        {
          priority: subscription.options.priority,
          resource: 'ui-delivery',
          rateLimitRule: 'default',
        }
      );

      // Update metrics
      const deliveryTime = Date.now() - startTime;
      this.metrics.totalDelivered++;
      this.updateAverageDeliveryTime(deliveryTime);
      subscription.lastDelivery = Date.now();

      // Clear processed deliveries
      this.pendingDeliveries.set(subscriptionId, []);

      this.performanceMonitor.recordMetric(
        'realtimeDelivery',
        'delivery_completed',
        {
          subscriptionId,
          itemCount: pending.length,
          deliveryTime,
          deduplicated: subscription.options.enableDeduplication,
          compressed: subscription.options.enableCompression,
        }
      );
    } catch (error) {
      this.metrics.totalFailed++;

      // Handle retry logic
      for (const delivery of pending) {
        delivery.attempts++;
        if (delivery.attempts < subscription.options.maxRetries!) {
          // Keep for retry
          continue;
        }
      }

      // Remove failed deliveries that exceeded max retries
      const filteredPending = pending.filter(
        d => d.attempts < subscription.options.maxRetries!
      );
      this.pendingDeliveries.set(subscriptionId, filteredPending);

      this.performanceMonitor.recordMetric(
        'realtimeDelivery',
        'delivery_failed',
        {
          subscriptionId,
          error: error instanceof Error ? error.message : String(error),
          retryCount: pending[0]?.attempts || 0,
        }
      );

      console.error(
        `❌ Delivery failed for subscription ${subscriptionId}:`,
        error
      );
    }
  }

  /**
   * Deduplicate data array
   */
  private deduplicateData(data: any[]): any[] {
    // Simple deduplication based on JSON serialization
    const seen = new Set<string>();
    return data.filter(item => {
      const key = JSON.stringify(item);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Compress data (simple implementation)
   */
  private compressData(data: any[]): any {
    // For now, just return the data as-is
    // In a real implementation, you might use actual compression
    return data;
  }

  /**
   * Start the delivery processing loop
   */
  private startDeliveryLoop(): void {
    this.deliveryInterval = setInterval(() => {
      this.processAllPendingDeliveries();
    }, 200); // Every 200ms
  }

  /**
   * Start cleanup loop for inactive subscriptions
   */
  private startCleanupLoop(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupInactiveSubscriptions();
    }, 60000); // Every minute
  }

  /**
   * Process all pending deliveries
   */
  private async processAllPendingDeliveries(): Promise<void> {
    const subscriptionIds = Array.from(this.pendingDeliveries.keys());

    for (const subscriptionId of subscriptionIds) {
      const subscription = this.subscriptions.get(subscriptionId);
      const pending = this.pendingDeliveries.get(subscriptionId);

      if (!subscription || !pending || pending.length === 0) continue;

      // Check if enough time has passed since last delivery
      const timeSinceLastDelivery = Date.now() - subscription.lastDelivery;
      const shouldProcess =
        timeSinceLastDelivery >= subscription.options.debounceMs! ||
        pending.length >= subscription.options.batchSize!;

      if (shouldProcess) {
        await this.processDelivery(subscriptionId);
      }
    }
  }

  /**
   * Clean up inactive subscriptions
   */
  private cleanupInactiveSubscriptions(): void {
    const toRemove: string[] = [];

    for (const [id, subscription] of this.subscriptions) {
      if (!subscription.isActive) {
        toRemove.push(id);
      }
    }

    for (const id of toRemove) {
      this.unsubscribe(id);
    }
  }

  /**
   * Update average delivery time with exponential moving average
   */
  private updateAverageDeliveryTime(newTime: number): void {
    const alpha = 0.1;
    this.metrics.averageDeliveryTime =
      alpha * newTime + (1 - alpha) * this.metrics.averageDeliveryTime;
  }
}

// Export singleton instance
export const realtimeDelivery = RealtimeDeliveryService.getInstance();
