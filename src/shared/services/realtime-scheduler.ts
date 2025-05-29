import { PerformanceMonitor } from '@/shared/utils/performance';
import { realtimeQueue, type QueueItem } from './realtime-queue';
import type { RealtimePayload } from './supabase-realtime';

export interface RateLimitRule {
  name: string;
  maxRequests: number;
  windowMs: number;
  priority?: 'high' | 'medium' | 'low';
  resource?: string; // e.g., 'supabase', 'reports', 'survey_responses'
}

export interface SchedulerOptions {
  defaultRateLimit?: RateLimitRule;
  adaptiveThrottling?: boolean;
  loadBalancing?: boolean;
  maxBackpressure?: number;
  healthCheckInterval?: number;
  circuitBreakerThreshold?: number;
}

export interface SchedulerMetrics {
  requestsProcessed: number;
  requestsThrottled: number;
  averageLatency: number;
  currentLoad: number;
  circuitBreakerTrips: number;
  adaptiveAdjustments: number;
}

export interface ScheduledOperation<T = any> {
  id: string;
  operation: () => Promise<T>;
  priority: 'high' | 'medium' | 'low';
  resource: string;
  retryCount: number;
  maxRetries: number;
  scheduledAt: number;
  deadline?: number;
}

/**
 * Advanced scheduler for real-time operations with rate limiting and adaptive throttling
 */
export class RealtimeScheduler {
  private static instance: RealtimeScheduler;
  private rateLimiters = new Map<string, RateLimiter>();
  private operations = new Map<string, ScheduledOperation<any>>();
  private metrics: SchedulerMetrics;
  private performanceMonitor: PerformanceMonitor;
  private options: Required<SchedulerOptions>;
  private circuitBreaker = new Map<string, CircuitBreaker>();
  private loadMonitor: LoadMonitor;
  private schedulingInterval?: NodeJS.Timeout;
  private healthCheckInterval?: NodeJS.Timeout;

  private constructor(options: SchedulerOptions = {}) {
    this.options = {
      defaultRateLimit: options.defaultRateLimit ?? {
        name: 'default',
        maxRequests: 100,
        windowMs: 60000, // 1 minute
        priority: 'medium',
      },
      adaptiveThrottling: options.adaptiveThrottling ?? true,
      loadBalancing: options.loadBalancing ?? true,
      maxBackpressure: options.maxBackpressure ?? 1000,
      healthCheckInterval: options.healthCheckInterval ?? 30000, // 30 seconds
      circuitBreakerThreshold: options.circuitBreakerThreshold ?? 0.5, // 50% error rate
    };

    this.metrics = {
      requestsProcessed: 0,
      requestsThrottled: 0,
      averageLatency: 0,
      currentLoad: 0,
      circuitBreakerTrips: 0,
      adaptiveAdjustments: 0,
    };

    this.performanceMonitor = PerformanceMonitor.getInstance();
    this.loadMonitor = new LoadMonitor();

    this.initializeDefaultRateLimiters();
    this.startScheduling();
    this.startHealthChecks();
  }

  static getInstance(options?: SchedulerOptions): RealtimeScheduler {
    if (!RealtimeScheduler.instance) {
      RealtimeScheduler.instance = new RealtimeScheduler(options);
    }
    return RealtimeScheduler.instance;
  }

  /**
   * Schedule an operation with rate limiting and priority
   */
  async schedule<T>(
    operation: () => Promise<T>,
    options: {
      priority?: 'high' | 'medium' | 'low';
      resource?: string;
      maxRetries?: number;
      deadline?: number;
      rateLimitRule?: string;
    } = {}
  ): Promise<T> {
    const {
      priority = 'medium',
      resource = 'default',
      maxRetries = 3,
      deadline,
      rateLimitRule = 'default',
    } = options;

    const operationId = `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Check circuit breaker
    const circuitBreaker = this.getCircuitBreaker(resource);
    if (circuitBreaker.isOpen()) {
      throw new Error(`Circuit breaker is open for resource: ${resource}`);
    }

    // Check rate limiter
    const rateLimiter = this.getRateLimiter(rateLimitRule);
    if (!rateLimiter.tryAcquire()) {
      this.metrics.requestsThrottled++;

      // If high priority, try to queue with adaptive delay
      if (priority === 'high') {
        await this.adaptiveDelay(resource);
        if (!rateLimiter.tryAcquire()) {
          throw new Error(`Rate limit exceeded for resource: ${resource}`);
        }
      } else {
        throw new Error(`Rate limit exceeded for resource: ${resource}`);
      }
    }

    // Create scheduled operation
    const scheduledOp: ScheduledOperation<T> = {
      id: operationId,
      operation,
      priority,
      resource,
      retryCount: 0,
      maxRetries,
      scheduledAt: Date.now(),
      deadline,
    };

    this.operations.set(operationId, scheduledOp);

    try {
      // Execute with monitoring
      const startTime = Date.now();
      const result = await this.executeWithMonitoring(scheduledOp);
      const endTime = Date.now();

      // Update metrics
      this.metrics.requestsProcessed++;
      this.updateLatencyMetrics(endTime - startTime);

      // Update circuit breaker with success
      circuitBreaker.recordSuccess();

      return result;
    } catch (error) {
      // Update circuit breaker with failure
      circuitBreaker.recordFailure();

      // Handle retry logic
      if (scheduledOp.retryCount < scheduledOp.maxRetries) {
        return this.retryOperation(scheduledOp, error);
      }

      throw error;
    } finally {
      this.operations.delete(operationId);
    }
  }

  /**
   * Add or update a rate limiting rule
   */
  addRateLimitRule(rule: RateLimitRule): void {
    this.rateLimiters.set(rule.name, new RateLimiter(rule));
  }

  /**
   * Get current scheduler metrics
   */
  getMetrics(): SchedulerMetrics {
    this.metrics.currentLoad = this.loadMonitor.getCurrentLoad();
    return { ...this.metrics };
  }

  /**
   * Get health status of all resources
   */
  getHealthStatus(): Record<
    string,
    {
      circuitBreakerOpen: boolean;
      rateLimitUtilization: number;
      averageResponseTime: number;
      errorRate: number;
    }
  > {
    const status: Record<string, any> = {};

    for (const [name, circuitBreaker] of this.circuitBreaker) {
      const rateLimiter =
        this.rateLimiters.get(name) || this.rateLimiters.get('default')!;

      status[name] = {
        circuitBreakerOpen: circuitBreaker.isOpen(),
        rateLimitUtilization: rateLimiter.getUtilization(),
        averageResponseTime: circuitBreaker.getAverageResponseTime(),
        errorRate: circuitBreaker.getErrorRate(),
      };
    }

    return status;
  }

  /**
   * Adjust rate limits based on current load (adaptive throttling)
   */
  adaptRateLimits(): void {
    if (!this.options.adaptiveThrottling) return;

    const currentLoad = this.loadMonitor.getCurrentLoad();
    const adjustmentFactor = this.calculateAdjustmentFactor(currentLoad);

    for (const [name, rateLimiter] of this.rateLimiters) {
      rateLimiter.adjust(adjustmentFactor);
    }

    if (adjustmentFactor !== 1.0) {
      this.metrics.adaptiveAdjustments++;

      this.performanceMonitor.recordMetric(
        'realtimeScheduler',
        'adaptive_adjustment',
        {
          currentLoad,
          adjustmentFactor,
          rateLimitersAdjusted: this.rateLimiters.size,
        }
      );
    }
  }

  /**
   * Shutdown the scheduler gracefully
   */
  async shutdown(): Promise<void> {
    // Stop intervals
    if (this.schedulingInterval) {
      clearInterval(this.schedulingInterval);
    }
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // Wait for pending operations
    while (this.operations.size > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Clean up resources
    this.rateLimiters.clear();
    this.circuitBreaker.clear();
  }

  /**
   * Initialize default rate limiters for different resources
   */
  private initializeDefaultRateLimiters(): void {
    // Default rate limiter
    this.rateLimiters.set(
      'default',
      new RateLimiter(this.options.defaultRateLimit)
    );

    // Supabase specific rate limiters
    this.rateLimiters.set(
      'supabase-realtime',
      new RateLimiter({
        name: 'supabase-realtime',
        maxRequests: 50,
        windowMs: 60000, // 1 minute
        priority: 'high',
      })
    );

    this.rateLimiters.set(
      'supabase-query',
      new RateLimiter({
        name: 'supabase-query',
        maxRequests: 200,
        windowMs: 60000, // 1 minute
        priority: 'medium',
      })
    );

    this.rateLimiters.set(
      'report-generation',
      new RateLimiter({
        name: 'report-generation',
        maxRequests: 20,
        windowMs: 60000, // 1 minute
        priority: 'low',
      })
    );
  }

  /**
   * Start the scheduling loop
   */
  private startScheduling(): void {
    this.schedulingInterval = setInterval(() => {
      this.adaptRateLimits();
      this.processQueue();
    }, 1000); // Every second
  }

  /**
   * Start health check monitoring
   */
  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthChecks();
    }, this.options.healthCheckInterval);
  }

  /**
   * Process the queue based on current conditions
   */
  private processQueue(): void {
    const queueStatus = realtimeQueue.getStatus();

    // If queue is unhealthy or at capacity, apply backpressure
    if (!queueStatus.isHealthy || !queueStatus.hasCapacity) {
      this.applyBackpressure();
    }
  }

  /**
   * Execute operation with comprehensive monitoring
   */
  private async executeWithMonitoring<T>(
    operation: ScheduledOperation<T>
  ): Promise<T> {
    const startTime = Date.now();

    try {
      // Monitor resource usage before execution
      const resourceUsageBefore = this.loadMonitor.getResourceUsage(
        operation.resource
      );

      const result = await operation.operation();

      // Monitor resource usage after execution
      const resourceUsageAfter = this.loadMonitor.getResourceUsage(
        operation.resource
      );
      const executionTime = Date.now() - startTime;

      this.performanceMonitor.recordMetric(
        'realtimeScheduler',
        'operation_executed',
        {
          operationId: operation.id,
          resource: operation.resource,
          priority: operation.priority,
          executionTime,
          resourceUsageDelta: resourceUsageAfter - resourceUsageBefore,
        }
      );

      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;

      this.performanceMonitor.recordMetric(
        'realtimeScheduler',
        'operation_failed',
        {
          operationId: operation.id,
          resource: operation.resource,
          priority: operation.priority,
          executionTime,
          error: error instanceof Error ? error.message : String(error),
        }
      );

      throw error;
    }
  }

  /**
   * Retry failed operation with exponential backoff
   */
  private async retryOperation<T>(
    operation: ScheduledOperation<T>,
    lastError: any
  ): Promise<T> {
    operation.retryCount++;

    const delay = Math.min(1000 * Math.pow(2, operation.retryCount - 1), 30000); // Max 30s
    await new Promise(resolve => setTimeout(resolve, delay));

    // Re-schedule the operation
    return this.executeWithMonitoring(operation);
  }

  /**
   * Get or create rate limiter
   */
  private getRateLimiter(name: string): RateLimiter {
    return this.rateLimiters.get(name) || this.rateLimiters.get('default')!;
  }

  /**
   * Get or create circuit breaker
   */
  private getCircuitBreaker(resource: string): CircuitBreaker {
    if (!this.circuitBreaker.has(resource)) {
      this.circuitBreaker.set(
        resource,
        new CircuitBreaker({
          failureThreshold: this.options.circuitBreakerThreshold,
          recoveryTimeout: 30000, // 30 seconds
          monitoringWindow: 60000, // 1 minute
        })
      );
    }
    return this.circuitBreaker.get(resource)!;
  }

  /**
   * Calculate adjustment factor for adaptive throttling
   */
  private calculateAdjustmentFactor(currentLoad: number): number {
    if (currentLoad > 0.9) return 0.5; // Reduce by 50%
    if (currentLoad > 0.8) return 0.7; // Reduce by 30%
    if (currentLoad > 0.7) return 0.85; // Reduce by 15%
    if (currentLoad < 0.3) return 1.2; // Increase by 20%
    if (currentLoad < 0.5) return 1.1; // Increase by 10%
    return 1.0; // No adjustment
  }

  /**
   * Apply backpressure by temporarily reducing rate limits
   */
  private applyBackpressure(): void {
    for (const rateLimiter of this.rateLimiters.values()) {
      rateLimiter.applyBackpressure(0.5); // Reduce by 50%
    }
  }

  /**
   * Perform health checks on all resources
   */
  private performHealthChecks(): void {
    for (const [resource, circuitBreaker] of this.circuitBreaker) {
      if (circuitBreaker.shouldAttemptReset()) {
        circuitBreaker.attemptReset();
      }
    }
  }

  /**
   * Update latency metrics with exponential moving average
   */
  private updateLatencyMetrics(latency: number): void {
    const alpha = 0.1; // Smoothing factor
    this.metrics.averageLatency =
      alpha * latency + (1 - alpha) * this.metrics.averageLatency;
  }

  /**
   * Adaptive delay based on current resource conditions
   */
  private async adaptiveDelay(resource: string): Promise<void> {
    const load = this.loadMonitor.getCurrentLoad();
    const baseDelay = 100; // 100ms base
    const adaptiveDelay = baseDelay * (1 + load * 2); // Scale with load

    await new Promise(resolve => setTimeout(resolve, adaptiveDelay));
  }
}

/**
 * Token bucket rate limiter implementation
 */
class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly maxTokens: number;
  private readonly refillRate: number; // tokens per millisecond
  private readonly rule: RateLimitRule;

  constructor(rule: RateLimitRule) {
    this.rule = rule;
    this.maxTokens = rule.maxRequests;
    this.tokens = this.maxTokens;
    this.lastRefill = Date.now();
    this.refillRate = rule.maxRequests / rule.windowMs;
  }

  tryAcquire(): boolean {
    this.refill();

    if (this.tokens >= 1) {
      this.tokens--;
      return true;
    }
    return false;
  }

  getUtilization(): number {
    this.refill();
    return 1 - this.tokens / this.maxTokens;
  }

  adjust(factor: number): void {
    // Temporarily adjust the rate
    const newMaxTokens = Math.max(1, Math.floor(this.maxTokens * factor));
    this.tokens = Math.min(this.tokens, newMaxTokens);
  }

  applyBackpressure(factor: number): void {
    this.tokens = Math.max(0, this.tokens * factor);
  }

  private refill(): void {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const tokensToAdd = timePassed * this.refillRate;

    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }
}

/**
 * Circuit breaker implementation
 */
class CircuitBreaker {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failures = 0;
  private successes = 0;
  private lastFailureTime = 0;
  private readonly failureThreshold: number;
  private readonly recoveryTimeout: number;
  private responseTimes: number[] = [];

  constructor(options: {
    failureThreshold: number;
    recoveryTimeout: number;
    monitoringWindow: number;
  }) {
    this.failureThreshold = options.failureThreshold;
    this.recoveryTimeout = options.recoveryTimeout;
  }

  recordSuccess(): void {
    this.successes++;
    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED';
      this.failures = 0;
    }
  }

  recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.getErrorRate() >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  isOpen(): boolean {
    return this.state === 'OPEN';
  }

  shouldAttemptReset(): boolean {
    return (
      this.state === 'OPEN' &&
      Date.now() - this.lastFailureTime >= this.recoveryTimeout
    );
  }

  attemptReset(): void {
    if (this.shouldAttemptReset()) {
      this.state = 'HALF_OPEN';
    }
  }

  getErrorRate(): number {
    const total = this.failures + this.successes;
    return total === 0 ? 0 : this.failures / total;
  }

  getAverageResponseTime(): number {
    if (this.responseTimes.length === 0) return 0;
    return (
      this.responseTimes.reduce((sum, time) => sum + time, 0) /
      this.responseTimes.length
    );
  }
}

/**
 * Load monitoring utility
 */
class LoadMonitor {
  private resourceUsage = new Map<string, number>();
  private systemLoad = 0;

  getCurrentLoad(): number {
    // Simple load calculation based on queue size and processing
    const queueStatus = realtimeQueue.getStatus();
    const queueLoad = queueStatus.queueLength / 1000; // Normalize to 0-1
    const processingLoad = queueStatus.processing / 10; // Normalize to 0-1

    this.systemLoad = Math.min(1, queueLoad + processingLoad);
    return this.systemLoad;
  }

  getResourceUsage(resource: string): number {
    return this.resourceUsage.get(resource) || 0;
  }

  updateResourceUsage(resource: string, usage: number): void {
    this.resourceUsage.set(resource, usage);
  }
}

// Export singleton instance
export const realtimeScheduler = RealtimeScheduler.getInstance();
