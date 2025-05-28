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
   * End timing an operation
   */
  endOperation(operationId: string): PerformanceMetrics | null {
    const metrics = this.metrics.get(operationId);
    if (!metrics) {
      console.warn(`Performance monitor: Operation ${operationId} not found`);
      return null;
    }

    metrics.endTime = performance.now();
    metrics.duration = metrics.endTime - metrics.startTime;

    // Update memory usage
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const memUsage = process.memoryUsage();
      if (metrics.memoryUsage) {
        metrics.memoryUsage = {
          heapUsed: Math.max(metrics.memoryUsage.heapUsed, memUsage.heapUsed),
          heapTotal: Math.max(
            metrics.memoryUsage.heapTotal,
            memUsage.heapTotal
          ),
          external: Math.max(metrics.memoryUsage.external, memUsage.external),
        };
      }
    }

    this.metrics.set(operationId, metrics);
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
}

/**
 * Decorator for automatically timing method execution
 */
export function timed(operationName?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const monitor = PerformanceMonitor.getInstance();

    descriptor.value = async function (...args: any[]) {
      const opName =
        operationName || `${target.constructor.name}.${propertyKey}`;
      const operationId = monitor.startOperation(opName, { args: args.length });

      try {
        const result = await originalMethod.apply(this, args);
        monitor.endOperation(operationId);
        return result;
      } catch (error) {
        monitor.endOperation(operationId);
        throw error;
      }
    };

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
    monitor.endOperation(operationId);
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
