/**
 * Performance monitoring utilities for report generation
 */

export interface PerformanceMetrics {
  startTime: number;
  endTime?: number;
  duration?: number;
  memoryUsage?: {
    heapUsed: number;
    heapTotal: number;
    external: number;
  };
  operationName: string;
  metadata?: Record<string, any>;
}

export interface PerformanceReport {
  totalDuration: number;
  operations: PerformanceMetrics[];
  peakMemoryUsage: number;
  averageOperationTime: number;
}

/**
 * Performance monitor for tracking operation timing and memory usage
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private reports: PerformanceReport[] = [];

  private constructor() {}

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Start timing an operation
   */
  startOperation(
    operationName: string,
    metadata?: Record<string, any>
  ): string {
    const operationId = `${operationName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const metrics: PerformanceMetrics = {
      startTime: performance.now(),
      operationName,
      metadata,
    };

    // Capture memory usage if available (Node.js environment)
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const memUsage = process.memoryUsage();
      metrics.memoryUsage = {
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external,
      };
    }

    this.metrics.set(operationId, metrics);
    return operationId;
  }

  /**
   * End an operation and calculate metrics
   */
  endOperation(operationId: string, error?: Error): PerformanceMetrics | null {
    const metrics = this.metrics.get(operationId);
    if (!metrics) {
      return null;
    }

    const endTime = Date.now();
    const duration = endTime - metrics.startTime;
    const memoryUsage = getMemoryUsage();

    // Fix memory usage type mapping
    metrics.endTime = endTime;
    metrics.duration = duration;
    metrics.memoryUsage = memoryUsage
      ? {
          heapUsed: memoryUsage.used,
          heapTotal: memoryUsage.total,
          external: 0, // Default value since getMemoryUsage doesn't provide this
        }
      : undefined;

    if (error) {
      metrics.metadata = {
        ...metrics.metadata,
        error: error.message,
        errorType: error.constructor.name,
      };
    }

    return metrics;
  }

  /**
   * Get metrics for a specific operation
   */
  getMetrics(operationId: string): PerformanceMetrics | null {
    return this.metrics.get(operationId) || null;
  }

  /**
   * Generate a performance report for all completed operations
   */
  generateReport(): PerformanceReport {
    const completedOperations = Array.from(this.metrics.values()).filter(
      metric => metric.duration !== undefined
    );

    const totalDuration = completedOperations.reduce(
      (sum, metric) => sum + (metric.duration || 0),
      0
    );

    const peakMemoryUsage = completedOperations.reduce((peak, metric) => {
      if (metric.memoryUsage) {
        return Math.max(peak, metric.memoryUsage.heapUsed);
      }
      return peak;
    }, 0);

    const averageOperationTime =
      completedOperations.length > 0
        ? totalDuration / completedOperations.length
        : 0;

    const report: PerformanceReport = {
      totalDuration,
      operations: completedOperations,
      peakMemoryUsage,
      averageOperationTime,
    };

    this.reports.push(report);
    return report;
  }

  /**
   * Clear all metrics (useful for testing or memory management)
   */
  clearMetrics(): void {
    this.metrics.clear();
  }

  /**
   * Reset all metrics and reports
   */
  reset(): void {
    this.metrics.clear();
    this.reports = [];
  }

  /**
   * Get recent performance reports
   */
  getRecentReports(limit: number = 10): PerformanceReport[] {
    return this.reports.slice(-limit);
  }

  /**
   * Log performance metrics to console (development helper)
   */
  logMetrics(operationId?: string): void {
    if (operationId) {
      const metrics = this.metrics.get(operationId);
      if (metrics) {
        console.log(`Performance Metrics for ${metrics.operationName}:`, {
          duration: `${metrics.duration?.toFixed(2)}ms`,
          memoryUsage: metrics.memoryUsage,
          metadata: metrics.metadata,
        });
      }
    } else {
      const report = this.generateReport();
      console.log('Performance Report:', {
        totalDuration: `${report.totalDuration.toFixed(2)}ms`,
        operationCount: report.operations.length,
        averageTime: `${report.averageOperationTime.toFixed(2)}ms`,
        peakMemory: `${(report.peakMemoryUsage / 1024 / 1024).toFixed(2)}MB`,
      });
    }
  }

  /**
   * Record a discrete metric event (e.g., cache hit, error, etc.)
   * This is useful for logging events that don't need timing
   */
  recordMetric(
    operationName: string,
    eventType: string,
    metadata?: Record<string, any>
  ): void {
    const timestamp = Date.now();
    const logData = {
      operationName,
      eventType,
      timestamp,
      metadata,
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${operationName} - ${eventType}:`, metadata);
    }

    // Store as a completed metric for reporting purposes
    const operationId = `${operationName}_${eventType}_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
    const metrics: PerformanceMetrics = {
      startTime: timestamp,
      endTime: timestamp,
      duration: 0, // Instant event
      operationName: `${operationName}_${eventType}`,
      metadata: { ...metadata, eventType },
    };

    this.metrics.set(operationId, metrics);
  }
}

/**
 * Decorator for automatically timing method execution
 */
export function timed(operationName?: string): any {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ): any {
    const originalMethod = descriptor.value;
    const monitor = PerformanceMonitor.getInstance();

    descriptor.value = async function (...args: any[]) {
      const opName =
        operationName || `${target.constructor.name}.${propertyKey}`;
      const operationId = monitor.startOperation(opName, { args: args.length });
      let errorToReport: Error | undefined = undefined;

      try {
        const result = await originalMethod.apply(this, args);
        monitor.endOperation(operationId);
        return result;
      } catch (error) {
        if (error instanceof Error) {
          errorToReport = error;
        } else if (typeof error === 'string') {
          errorToReport = new Error(error);
        } else if (error && typeof error === 'object' && 'message' in error) {
          errorToReport = new Error(String(error.message));
          Object.assign(errorToReport, error); // Preserve other properties
        } else {
          errorToReport = new Error('An unknown error occurred');
        }
        monitor.endOperation(operationId, errorToReport);
        throw errorToReport; // Re-throw the (potentially wrapped) error
      }
    };
    // Ensure the descriptor is returned by the decorator factory
    return descriptor;
  };
}

/**
 * Utility function for timing async operations
 */
export async function timeOperation<T>(
  operationName: string,
  operation: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<{ result: T; metrics: PerformanceMetrics }> {
  const monitor = PerformanceMonitor.getInstance();
  const operationId = monitor.startOperation(operationName, metadata);

  try {
    const result = await operation();
    const metrics = monitor.endOperation(operationId);
    return { result, metrics: metrics! };
  } catch (error) {
    // Handle unknown error types
    const errorObj = error instanceof Error ? error : new Error(String(error));
    monitor.endOperation(operationId, errorObj);
    throw error;
  }
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(null, args), wait);
  };
}

/**
 * Throttle function for performance optimization
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func.apply(null, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Memory usage helper
 */
export function getMemoryUsage(): {
  used: number;
  total: number;
  percentage: number;
} | null {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const usage = process.memoryUsage();
    return {
      used: usage.heapUsed,
      total: usage.heapTotal,
      percentage: (usage.heapUsed / usage.heapTotal) * 100,
    };
  }
  return null;
}
