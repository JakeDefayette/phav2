import { realtimeQueue } from './realtime-queue';
import { realtimeScheduler } from './realtime-scheduler';
import { realtimeDelivery } from '@/features/reports/services/realtime-delivery';
import { realtimeReportsService } from '@/features/reports/services/realtimeReports';
import { PerformanceMonitor } from '@/shared/utils/performance';
import type { RealtimePayload } from './supabase-realtime';

export interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'critical';
  components: {
    queue: {
      status: 'healthy' | 'degraded' | 'critical';
      metrics: any;
      issues: string[];
    };
    scheduler: {
      status: 'healthy' | 'degraded' | 'critical';
      metrics: any;
      issues: string[];
    };
    delivery: {
      status: 'healthy' | 'degraded' | 'critical';
      metrics: any;
      issues: string[];
    };
    reports: {
      status: 'healthy' | 'degraded' | 'critical';
      metrics: any;
      issues: string[];
    };
  };
  recommendations: string[];
}

export interface PerformanceReport {
  timestamp: number;
  timeWindow: string;
  throughput: {
    queueProcessed: number;
    schedulerExecuted: number;
    deliveriesCompleted: number;
    reportsGenerated: number;
  };
  latency: {
    averageQueueTime: number;
    averageSchedulerTime: number;
    averageDeliveryTime: number;
    averageReportTime: number;
  };
  errors: {
    queueErrors: number;
    schedulerErrors: number;
    deliveryErrors: number;
    reportErrors: number;
  };
  resourceUtilization: {
    queueCapacity: number;
    schedulerLoad: number;
    deliveryBacklog: number;
    activeSubscriptions: number;
  };
}

/**
 * Integration service for real-time system monitoring and coordination
 */
export class RealtimeIntegrationService {
  private static instance: RealtimeIntegrationService;
  private performanceMonitor: PerformanceMonitor;
  private healthCheckInterval?: NodeJS.Timeout;
  private performanceReportInterval?: NodeJS.Timeout;
  private alertThresholds = {
    queueCapacity: 0.8,
    errorRate: 0.1,
    latency: 5000, // 5 seconds
    schedulerLoad: 0.9,
  };

  private constructor() {
    this.performanceMonitor = PerformanceMonitor.getInstance();
    this.startMonitoring();
  }

  static getInstance(): RealtimeIntegrationService {
    if (!RealtimeIntegrationService.instance) {
      RealtimeIntegrationService.instance = new RealtimeIntegrationService();
    }
    return RealtimeIntegrationService.instance;
  }

  /**
   * Initialize the complete real-time system
   */
  async initialize(): Promise<void> {
    console.log('🚀 Initializing Real-time Integration System...');

    try {
      // Setup cross-component coordination
      this.setupComponentCoordination();

      // Register global error handlers
      this.setupErrorHandling();

      // Start health monitoring
      this.startHealthChecks();

      console.log('✅ Real-time Integration System initialized successfully');

      this.performanceMonitor.recordMetric(
        'realtimeIntegration',
        'system_initialized',
        {
          timestamp: Date.now(),
          success: true,
        }
      );
    } catch (error) {
      console.error(
        '❌ Failed to initialize Real-time Integration System:',
        error
      );

      this.performanceMonitor.recordMetric(
        'realtimeIntegration',
        'system_initialization_failed',
        {
          timestamp: Date.now(),
          error: error instanceof Error ? error.message : String(error),
        }
      );

      throw error;
    }
  }

  /**
   * Get comprehensive system health status
   */
  getSystemHealth(): SystemHealth {
    const queueMetrics = realtimeQueue.getMetrics();
    const queueStatus = realtimeQueue.getStatus();
    const schedulerMetrics = realtimeScheduler.getMetrics();
    const schedulerHealth = realtimeScheduler.getHealthStatus();
    const deliveryMetrics = realtimeDelivery.getMetrics();
    const deliveryStatus = realtimeDelivery.getSubscriptionStatus();
    const reportsStatus = realtimeReportsService.getStatus();

    // Analyze queue health
    const queueHealth = this.analyzeQueueHealth(queueMetrics, queueStatus);

    // Analyze scheduler health
    const schedulerHealthStatus = this.analyzeSchedulerHealth(
      schedulerMetrics,
      schedulerHealth
    );

    // Analyze delivery health
    const deliveryHealthStatus = this.analyzeDeliveryHealth(
      deliveryMetrics,
      deliveryStatus
    );

    // Analyze reports health
    const reportsHealthStatus = this.analyzeReportsHealth(reportsStatus);

    const components = {
      queue: queueHealth,
      scheduler: schedulerHealthStatus,
      delivery: deliveryHealthStatus,
      reports: reportsHealthStatus,
    };

    // Determine overall health
    const componentStatuses = Object.values(components).map(c => c.status);
    let overall: 'healthy' | 'degraded' | 'critical';

    if (componentStatuses.includes('critical')) {
      overall = 'critical';
    } else if (componentStatuses.includes('degraded')) {
      overall = 'degraded';
    } else {
      overall = 'healthy';
    }

    // Generate recommendations
    const recommendations = this.generateRecommendations(components);

    return {
      overall,
      components,
      recommendations,
    };
  }

  /**
   * Generate performance report for the specified time window
   */
  generatePerformanceReport(timeWindowMinutes: number = 60): PerformanceReport {
    const now = Date.now();
    const timeWindow = `${timeWindowMinutes}m`;

    // Get metrics from all components
    const queueMetrics = realtimeQueue.getMetrics();
    const queueStatus = realtimeQueue.getStatus();
    const schedulerMetrics = realtimeScheduler.getMetrics();
    const deliveryMetrics = realtimeDelivery.getMetrics();
    const deliveryStatus = realtimeDelivery.getSubscriptionStatus();
    const reportsStatus = realtimeReportsService.getStatus();

    return {
      timestamp: now,
      timeWindow,
      throughput: {
        queueProcessed: queueMetrics.totalProcessed,
        schedulerExecuted: schedulerMetrics.requestsProcessed,
        deliveriesCompleted: deliveryMetrics.totalDelivered,
        reportsGenerated: reportsStatus.activeSubscriptions,
      },
      latency: {
        averageQueueTime: queueMetrics.averageProcessingTime,
        averageSchedulerTime: schedulerMetrics.averageLatency,
        averageDeliveryTime: deliveryMetrics.averageDeliveryTime,
        averageReportTime: 0, // Would need to be tracked in reports service
      },
      errors: {
        queueErrors: queueMetrics.totalErrors,
        schedulerErrors: schedulerMetrics.requestsThrottled,
        deliveryErrors: deliveryMetrics.totalFailed,
        reportErrors: 0, // Would need to be tracked in reports service
      },
      resourceUtilization: {
        queueCapacity: queueStatus.queueLength / 1000, // Normalize to 0-1
        schedulerLoad: schedulerMetrics.currentLoad,
        deliveryBacklog: deliveryStatus.pendingDeliveries,
        activeSubscriptions: deliveryStatus.activeSubscriptions,
      },
    };
  }

  /**
   * Demonstrate the complete real-time flow
   */
  async demonstrateFlow(assessmentId: string): Promise<void> {
    console.log(
      `🎯 Demonstrating complete real-time flow for assessment: ${assessmentId}`
    );

    try {
      // 1. Enable real-time updates with monitoring
      const subscriptionKey = realtimeReportsService.enableRealtimeUpdates(
        assessmentId,
        {
          onReportUpdate: report => {
            console.log(`📊 Received report update for ${assessmentId}:`, {
              id: report.id,
              status: report.content.assessment.status,
              generatedAt: report.generated_at,
            });
          },
          onError: error => {
            console.error(`❌ Report update error for ${assessmentId}:`, error);
          },
          priority: 'high',
          autoRegenerate: true,
        }
      );

      // 2. Simulate some load by queueing operations
      console.log('📋 Simulating survey response updates...');

      for (let i = 0; i < 5; i++) {
        // Create a mock SurveyResponsePayload for simulation
        const mockPayload: RealtimePayload = {
          data: {
            schema: 'public',
            table: 'survey_responses',
            commit_timestamp: new Date().toISOString(),
            eventType: 'INSERT',
            new: {
              id: `sim-${i}`,
              assessment_id: assessmentId,
              question_id: `q${i}`,
              response_value: Math.random() * 5,
              created_at: new Date().toISOString(),
            },
            old: {},
            errors: null,
          },
          ids: [i],
        } as any; // Type assertion for simulation

        realtimeQueue.enqueue(mockPayload, 'medium', 2);
      }

      // 3. Wait a bit and then check system status
      await new Promise(resolve => setTimeout(resolve, 2000));

      const health = this.getSystemHealth();
      console.log('🏥 System Health:', {
        overall: health.overall,
        queueStatus: health.components.queue.status,
        schedulerStatus: health.components.scheduler.status,
        deliveryStatus: health.components.delivery.status,
      });

      // 4. Generate performance report
      const performance = this.generatePerformanceReport(5); // Last 5 minutes
      console.log('📈 Performance Report:', {
        throughput: performance.throughput,
        latency: performance.latency,
        errors: performance.errors,
      });

      // 5. Clean up
      setTimeout(() => {
        realtimeReportsService.disableRealtimeUpdates(subscriptionKey);
        console.log('🧹 Demonstration cleanup completed');
      }, 5000);
    } catch (error) {
      console.error('❌ Demonstration failed:', error);
      throw error;
    }
  }

  /**
   * Shutdown the integration service gracefully
   */
  async shutdown(): Promise<void> {
    console.log('🔄 Shutting down Real-time Integration System...');

    // Stop monitoring
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    if (this.performanceReportInterval) {
      clearInterval(this.performanceReportInterval);
    }

    // Shutdown components in order
    try {
      await realtimeDelivery.shutdown();
      await realtimeScheduler.shutdown();
      await realtimeQueue.shutdown();

      console.log('✅ Real-time Integration System shutdown completed');
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      throw error;
    }
  }

  /**
   * Setup coordination between components
   */
  private setupComponentCoordination(): void {
    // Register processors that handle coordination between components
    realtimeQueue.registerProcessor('coordination', async item => {
      // Handle cross-component coordination events
      console.log('🔗 Processing coordination event:', item.data);
    });
  }

  /**
   * Setup global error handling
   */
  private setupErrorHandling(): void {
    // Global error handler for unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error(
        '🚨 Unhandled promise rejection in real-time system:',
        reason
      );

      this.performanceMonitor.recordMetric(
        'realtimeIntegration',
        'unhandled_rejection',
        {
          reason: String(reason),
          timestamp: Date.now(),
        }
      );
    });
  }

  /**
   * Start health check monitoring
   */
  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(() => {
      const health = this.getSystemHealth();

      if (health.overall !== 'healthy') {
        console.warn(
          `⚠️ System health is ${health.overall}:`,
          health.recommendations
        );

        this.performanceMonitor.recordMetric(
          'realtimeIntegration',
          'health_warning',
          {
            status: health.overall,
            recommendations: health.recommendations.length,
          }
        );
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Start monitoring and generate regular performance reports
   */
  private startMonitoring(): void {
    this.performanceReportInterval = setInterval(() => {
      const report = this.generatePerformanceReport(5); // Last 5 minutes

      this.performanceMonitor.recordMetric(
        'realtimeIntegration',
        'performance_report',
        {
          throughput:
            report.throughput.queueProcessed +
            report.throughput.deliveriesCompleted,
          averageLatency:
            (report.latency.averageQueueTime +
              report.latency.averageDeliveryTime) /
            2,
          errorRate:
            (report.errors.queueErrors + report.errors.deliveryErrors) /
            Math.max(
              1,
              report.throughput.queueProcessed +
                report.throughput.deliveriesCompleted
            ),
        }
      );
    }, 300000); // Every 5 minutes
  }

  /**
   * Analyze queue health
   */
  private analyzeQueueHealth(metrics: any, status: any): any {
    const issues: string[] = [];

    if (!status.hasCapacity) {
      issues.push('Queue is at capacity');
    }

    if (!status.isHealthy) {
      issues.push('Queue is not healthy');
    }

    if (
      metrics.totalErrors / Math.max(1, metrics.totalProcessed) >
      this.alertThresholds.errorRate
    ) {
      issues.push('High error rate in queue processing');
    }

    const healthStatus =
      issues.length === 0
        ? 'healthy'
        : issues.length <= 2
          ? 'degraded'
          : 'critical';

    return {
      status: healthStatus,
      metrics,
      issues,
    };
  }

  /**
   * Analyze scheduler health
   */
  private analyzeSchedulerHealth(metrics: any, healthStatus: any): any {
    const issues: string[] = [];

    if (metrics.currentLoad > this.alertThresholds.schedulerLoad) {
      issues.push('High scheduler load');
    }

    if (metrics.averageLatency > this.alertThresholds.latency) {
      issues.push('High average latency');
    }

    // Check circuit breakers
    for (const [resource, status] of Object.entries(healthStatus)) {
      if ((status as any).circuitBreakerOpen) {
        issues.push(`Circuit breaker open for ${resource}`);
      }
    }

    const status =
      issues.length === 0
        ? 'healthy'
        : issues.length <= 2
          ? 'degraded'
          : 'critical';

    return {
      status,
      metrics,
      issues,
    };
  }

  /**
   * Analyze delivery health
   */
  private analyzeDeliveryHealth(metrics: any, status: any): any {
    const issues: string[] = [];

    if (
      metrics.totalFailed / Math.max(1, metrics.totalDelivered) >
      this.alertThresholds.errorRate
    ) {
      issues.push('High delivery failure rate');
    }

    if (metrics.averageDeliveryTime > this.alertThresholds.latency) {
      issues.push('High average delivery time');
    }

    if (status.pendingDeliveries > 100) {
      issues.push('High delivery backlog');
    }

    const healthStatus =
      issues.length === 0
        ? 'healthy'
        : issues.length <= 2
          ? 'degraded'
          : 'critical';

    return {
      status: healthStatus,
      metrics,
      issues,
    };
  }

  /**
   * Analyze reports service health
   */
  private analyzeReportsHealth(status: any): any {
    const issues: string[] = [];

    if (status.pendingRegenerations > 10) {
      issues.push('High number of pending report regenerations');
    }

    const healthStatus =
      issues.length === 0
        ? 'healthy'
        : issues.length <= 2
          ? 'degraded'
          : 'critical';

    return {
      status: healthStatus,
      metrics: status,
      issues,
    };
  }

  /**
   * Generate system recommendations based on component health
   */
  private generateRecommendations(components: any): string[] {
    const recommendations: string[] = [];

    if (components.queue.status !== 'healthy') {
      recommendations.push(
        'Consider increasing queue capacity or processing power'
      );
    }

    if (components.scheduler.status !== 'healthy') {
      recommendations.push(
        'Review rate limits and consider scaling scheduler resources'
      );
    }

    if (components.delivery.status !== 'healthy') {
      recommendations.push(
        'Optimize delivery batching or increase delivery capacity'
      );
    }

    if (components.reports.status !== 'healthy') {
      recommendations.push(
        'Review report generation performance and caching strategies'
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('System is operating optimally');
    }

    return recommendations;
  }
}

// Export singleton instance
export const realtimeIntegration = RealtimeIntegrationService.getInstance();
