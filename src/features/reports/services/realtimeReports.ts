import {
  realtimeManager,
  realtimeUtils,
  type SurveyResponseCallback,
  type AssessmentCallback,
  type ReportCallback,
  type RealtimePayload,
} from '@/shared/services/supabase-realtime';
import { realtimeQueue, RealtimeQueue } from '@/shared/services/realtime-queue';
import { realtimeScheduler } from '@/shared/services/realtime-scheduler';
import { realtimeDelivery } from './realtime-delivery';
import { ReportsService } from './reports';
import { ReportCacheService } from './reportCache';
import { PerformanceMonitor } from '@/shared/utils/performance';
import type { GeneratedReport } from '../types';

// Interface for report regeneration queue data
interface ReportRegenerationData {
  assessmentId: string;
  trigger: 'survey_response' | 'assessment_completed' | 'manual';
  payload: RealtimePayload;
}

// Create a typed queue for report regeneration
const reportRegenerationQueue = new RealtimeQueue<ReportRegenerationData>();

/**
 * Enhanced service for managing real-time report updates
 * Now uses the new queuing, scheduling, and delivery infrastructure
 */
export class RealtimeReportsService {
  private static instance: RealtimeReportsService;
  private reportsService: ReportsService;
  private reportCacheService: ReportCacheService;
  private performanceMonitor: PerformanceMonitor;
  private activeSubscriptions = new Map<string, string[]>();
  private regenerationQueue = new Set<string>(); // Track assessments pending regeneration
  private debounceTimers = new Map<string, NodeJS.Timeout>(); // Debounce rapid updates
  private deliverySubscriptions = new Map<string, string>(); // Map assessment to delivery subscription

  private constructor() {
    this.reportsService = new ReportsService();
    this.reportCacheService = ReportCacheService.getInstance();
    this.performanceMonitor = PerformanceMonitor.getInstance();
    this.setupQueueProcessors();
  }

  static getInstance(): RealtimeReportsService {
    if (!RealtimeReportsService.instance) {
      RealtimeReportsService.instance = new RealtimeReportsService();
    }
    return RealtimeReportsService.instance;
  }

  /**
   * Enable real-time report updates for a specific assessment
   * Now uses the enhanced queuing and delivery system
   */
  enableRealtimeUpdates(
    assessmentId: string,
    options: {
      onReportUpdate?: (report: GeneratedReport) => void;
      onError?: (error: Error) => void;
      debounceMs?: number;
      autoRegenerate?: boolean;
      priority?: 'high' | 'medium' | 'low';
    } = {}
  ): string {
    const {
      onReportUpdate,
      onError,
      debounceMs = 2000,
      autoRegenerate = true,
      priority = 'medium',
    } = options;

    console.log(
      `🔄 Enabling enhanced real-time updates for assessment: ${assessmentId}`
    );

    const subscriptionKey = `realtime-reports-${assessmentId}-${Date.now()}`;

    // Set up delivery subscription for UI updates
    let deliverySubscriptionId: string | undefined;
    if (onReportUpdate) {
      deliverySubscriptionId = realtimeDelivery.subscribe(
        `report-updates-${assessmentId}`,
        onReportUpdate,
        {
          assessmentId,
          priority,
          debounceMs,
          enableDeduplication: true,
          batchSize: 1, // Reports should be delivered individually
        }
      );
      this.deliverySubscriptions.set(assessmentId, deliverySubscriptionId);
    }

    // Enhanced survey response callback with queuing
    const surveyResponseCallback: SurveyResponseCallback = payload => {
      console.log(
        `📝 Survey response ${payload.data.eventType} for assessment ${assessmentId}:`,
        payload
      );

      this.performanceMonitor.recordMetric(
        'realtimeReports',
        'survey_response_event',
        {
          assessmentId,
          eventType: payload.data.eventType,
          table: payload.data.table,
        }
      );

      if (autoRegenerate) {
        // Queue the regeneration with priority
        reportRegenerationQueue.enqueue(
          {
            assessmentId,
            trigger: 'survey_response',
            payload,
          },
          priority,
          3 // max retries
        );
      }
    };

    // Enhanced assessment callback with scheduling
    const assessmentCallback: AssessmentCallback = payload => {
      if (
        payload.data.new?.id === assessmentId ||
        payload.data.old?.id === assessmentId
      ) {
        console.log(
          `📋 Assessment ${payload.data.eventType} for assessment ${assessmentId}:`,
          payload
        );

        this.performanceMonitor.recordMetric(
          'realtimeReports',
          'assessment_event',
          {
            assessmentId,
            eventType: payload.data.eventType,
          }
        );

        // High priority for completed assessments
        if (
          payload.data.eventType === 'UPDATE' &&
          payload.data.new?.status === 'completed' &&
          autoRegenerate
        ) {
          reportRegenerationQueue.enqueue(
            {
              assessmentId,
              trigger: 'assessment_completed',
              payload,
            },
            'high', // High priority for completed assessments
            3
          );
        }
      }
    };

    // Enhanced report callback with delivery system
    const reportCallback: ReportCallback = payload => {
      if (
        payload.data.new?.assessment_id === assessmentId ||
        payload.data.old?.assessment_id === assessmentId
      ) {
        console.log(
          `📊 Report ${payload.data.eventType} for assessment ${assessmentId}:`,
          payload
        );

        this.performanceMonitor.recordMetric(
          'realtimeReports',
          'report_event',
          {
            assessmentId,
            eventType: payload.data.eventType,
          }
        );

        // Use delivery system for report updates
        if (
          payload.data.eventType === 'UPDATE' ||
          payload.data.eventType === 'INSERT'
        ) {
          this.invalidateReportCache(assessmentId);

          if (deliverySubscriptionId && payload.data.new) {
            // Schedule delivery through the delivery service
            realtimeScheduler
              .schedule(
                async () => {
                  const generatedReport = await this.convertToGeneratedReport(
                    payload.data.new
                  );
                  if (generatedReport) {
                    await realtimeDelivery.deliver(
                      deliverySubscriptionId!,
                      generatedReport,
                      {
                        priority: 'high',
                        immediate: true,
                      }
                    );
                  }
                },
                {
                  priority: 'high',
                  resource: 'report-delivery',
                  rateLimitRule: 'supabase-query',
                }
              )
              .catch(error => {
                console.error('Failed to deliver report update:', error);
                if (onError) onError(error);
              });
          }
        }
      }
    };

    // Create subscriptions using utility function
    const channelIds = realtimeUtils.subscribeToAssessment(assessmentId, {
      onSurveyResponse: surveyResponseCallback,
      onAssessmentUpdate: assessmentCallback,
      onReportUpdate: reportCallback,
    });

    // Store subscription info
    this.activeSubscriptions.set(subscriptionKey, channelIds);

    console.log(
      `✅ Enhanced real-time updates enabled for assessment ${assessmentId} with ${channelIds.length} subscriptions`
    );

    return subscriptionKey;
  }

  /**
   * Enable real-time updates for practice-wide reports
   * Enhanced with new delivery system
   */
  enablePracticeRealtime(
    practiceId: string,
    options: {
      onNewAssessment?: (assessmentId: string) => void;
      onReportGenerated?: (report: GeneratedReport) => void;
      onError?: (error: Error) => void;
      priority?: 'high' | 'medium' | 'low';
    } = {}
  ): string {
    const {
      onNewAssessment,
      onReportGenerated,
      onError,
      priority = 'medium',
    } = options;

    console.log(
      `🏢 Enabling enhanced practice-wide real-time updates for practice: ${practiceId}`
    );

    const subscriptionKey = `practice-realtime-${practiceId}-${Date.now()}`;

    // Set up delivery subscription for practice-wide updates
    let deliverySubscriptionId: string | undefined;
    if (onReportGenerated) {
      deliverySubscriptionId = realtimeDelivery.subscribe(
        `practice-reports-${practiceId}`,
        onReportGenerated,
        {
          practiceId,
          priority,
          enableDeduplication: true,
          batchSize: 5, // Can batch practice-wide reports
        }
      );
    }

    // Enhanced new assessment callback
    const newAssessmentCallback: AssessmentCallback = payload => {
      if (
        payload.data.eventType === 'INSERT' &&
        payload.data.new?.practice_id === practiceId
      ) {
        console.log(
          `📋 New assessment created for practice ${practiceId}:`,
          payload.data.new.id
        );

        this.performanceMonitor.recordMetric(
          'realtimeReports',
          'new_assessment',
          {
            practiceId,
            assessmentId: payload.data.new.id,
          }
        );

        // Queue notification with scheduling
        if (onNewAssessment) {
          realtimeScheduler
            .schedule(async () => onNewAssessment(payload.data.new.id), {
              priority,
              resource: 'practice-notifications',
              rateLimitRule: 'default',
            })
            .catch(error => {
              console.error(
                'Failed to deliver new assessment notification:',
                error
              );
              if (onError) onError(error);
            });
        }
      }
    };

    // Enhanced report generation callback
    const reportGeneratedCallback: ReportCallback = payload => {
      if (
        payload.data.eventType === 'INSERT' &&
        payload.data.new?.practice_id === practiceId
      ) {
        console.log(
          `📊 New report generated for practice ${practiceId}:`,
          payload.data.new
        );

        this.performanceMonitor.recordMetric(
          'realtimeReports',
          'report_generated',
          {
            practiceId,
            reportId: payload.data.new.id,
          }
        );

        if (deliverySubscriptionId) {
          // Use delivery system for new reports
          realtimeScheduler
            .schedule(
              async () => {
                const generatedReport = await this.convertToGeneratedReport(
                  payload.data.new
                );
                if (generatedReport) {
                  await realtimeDelivery.deliver(
                    deliverySubscriptionId!,
                    generatedReport,
                    {
                      priority,
                      immediate: false, // Allow batching for practice-wide updates
                    }
                  );
                }
              },
              {
                priority,
                resource: 'practice-reports',
                rateLimitRule: 'report-generation',
              }
            )
            .catch(error => {
              console.error('Failed to deliver practice report:', error);
              if (onError) onError(error);
            });
        }
      }
    };

    // Create practice-wide subscriptions
    const channelIds = realtimeUtils.subscribeToPractice(practiceId, {
      onNewAssessment: newAssessmentCallback,
      onReportGenerated: reportGeneratedCallback,
    });

    this.activeSubscriptions.set(subscriptionKey, channelIds);

    console.log(
      `✅ Enhanced practice real-time updates enabled for ${practiceId} with ${channelIds.length} subscriptions`
    );

    return subscriptionKey;
  }

  /**
   * Setup queue processors for handling real-time report operations
   */
  private setupQueueProcessors(): void {
    // Register processor for report regeneration
    reportRegenerationQueue.registerProcessor(
      'report-regeneration',
      async item => {
        const { assessmentId, trigger } = item.data;

        try {
          console.log(
            `🔄 Processing report regeneration for assessment: ${assessmentId} (trigger: ${trigger})`
          );

          // Invalidate cache to force fresh generation
          this.invalidateReportCache(assessmentId);

          // Schedule the actual regeneration with rate limiting
          const report = await realtimeScheduler.schedule(
            async () => {
              return await this.reportsService.generateReport(
                assessmentId,
                'standard'
              );
            },
            {
              priority: item.priority,
              resource: 'report-generation',
              rateLimitRule: 'report-generation',
              maxRetries: 3,
            }
          );

          console.log(`✅ Report regenerated for assessment: ${assessmentId}`);

          this.performanceMonitor.recordMetric(
            'realtimeReports',
            'report_regenerated',
            {
              assessmentId,
              trigger,
              success: true,
            }
          );

          // Deliver the updated report through the delivery system
          const deliverySubscriptionId =
            this.deliverySubscriptions.get(assessmentId);
          if (deliverySubscriptionId) {
            await realtimeDelivery.deliver(deliverySubscriptionId, report, {
              priority: 'high',
              immediate: true,
            });
          }
        } catch (error) {
          console.error(
            `❌ Error regenerating report for assessment ${assessmentId}:`,
            error
          );

          this.performanceMonitor.recordMetric(
            'realtimeReports',
            'report_regeneration_error',
            {
              assessmentId,
              trigger,
              error: error instanceof Error ? error.message : String(error),
            }
          );

          throw error; // Re-throw to trigger retry logic
        }
      }
    );

    // Register batch processor for efficient handling of multiple regenerations
    reportRegenerationQueue.registerBatchProcessor(
      'report-regeneration-batch',
      async items => {
        const assessmentIds = items.map(item => item.data.assessmentId);
        console.log(
          `🔄 Processing batch report regeneration for assessments: ${assessmentIds.join(', ')}`
        );

        // Process in parallel with rate limiting
        const results = await Promise.allSettled(
          items.map(async item => {
            const { assessmentId, trigger } = item.data;

            return realtimeScheduler.schedule(
              async () => {
                this.invalidateReportCache(assessmentId);
                return await this.reportsService.generateReport(
                  assessmentId,
                  'standard'
                );
              },
              {
                priority: item.priority,
                resource: 'report-generation',
                rateLimitRule: 'report-generation',
              }
            );
          })
        );

        // Process results and deliver updates
        for (let i = 0; i < results.length; i++) {
          const result = results[i];
          const assessmentId = assessmentIds[i];

          if (result.status === 'fulfilled') {
            const deliverySubscriptionId =
              this.deliverySubscriptions.get(assessmentId);
            if (deliverySubscriptionId) {
              await realtimeDelivery.deliver(
                deliverySubscriptionId,
                result.value,
                {
                  priority: 'medium',
                  immediate: false, // Allow batching
                }
              );
            }
          } else {
            console.error(
              `❌ Batch regeneration failed for assessment ${assessmentId}:`,
              result.reason
            );
          }
        }
      }
    );
  }

  /**
   * Disable real-time updates and clean up resources
   */
  disableRealtimeUpdates(subscriptionKey: string): boolean {
    const channelIds = this.activeSubscriptions.get(subscriptionKey);
    if (!channelIds) {
      return false;
    }

    // Cleanup real-time subscriptions
    realtimeUtils.cleanup(channelIds);
    this.activeSubscriptions.delete(subscriptionKey);

    // Find and cleanup delivery subscriptions
    for (const [assessmentId, deliverySubId] of this.deliverySubscriptions) {
      if (subscriptionKey.includes(assessmentId)) {
        realtimeDelivery.unsubscribe(deliverySubId);
        this.deliverySubscriptions.delete(assessmentId);
        break;
      }
    }

    console.log(`🔌 Disabled enhanced real-time updates: ${subscriptionKey}`);
    return true;
  }

  /**
   * Disable all real-time updates
   */
  disableAllRealtimeUpdates(): void {
    console.log('🔌 Disabling all enhanced real-time updates...');

    const subscriptionKeys = Array.from(this.activeSubscriptions.keys());
    for (const key of subscriptionKeys) {
      this.disableRealtimeUpdates(key);
    }

    // Clear any remaining debounce timers
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();

    // Clear regeneration queue
    this.regenerationQueue.clear();
  }

  /**
   * Get enhanced status including queue and delivery metrics
   */
  getStatus(): {
    activeSubscriptions: number;
    pendingRegenerations: number;
    subscriptions: string[];
    queueMetrics: any;
    schedulerMetrics: any;
    deliveryMetrics: any;
  } {
    return {
      activeSubscriptions: this.activeSubscriptions.size,
      pendingRegenerations: this.regenerationQueue.size,
      subscriptions: Array.from(this.activeSubscriptions.keys()),
      queueMetrics: realtimeQueue.getMetrics(),
      schedulerMetrics: realtimeScheduler.getMetrics(),
      deliveryMetrics: realtimeDelivery.getMetrics(),
    };
  }

  /**
   * Force regeneration with enhanced scheduling
   */
  async forceRegeneration(
    assessmentId: string,
    reportType: 'standard' | 'detailed' | 'summary' = 'standard'
  ): Promise<GeneratedReport> {
    console.log(
      `🔄 Force regenerating ${reportType} report for assessment: ${assessmentId}`
    );

    // Add to regeneration queue for tracking
    this.regenerationQueue.add(assessmentId);

    try {
      // Use scheduler for rate-limited execution
      const report = await realtimeScheduler.schedule(
        async () => {
          this.invalidateReportCache(assessmentId);
          return await this.reportsService.generateReport(
            assessmentId,
            reportType
          );
        },
        {
          priority: 'high',
          resource: 'report-generation',
          rateLimitRule: 'report-generation',
          maxRetries: 3,
        }
      );

      // Deliver through delivery system
      const deliverySubscriptionId =
        this.deliverySubscriptions.get(assessmentId);
      if (deliverySubscriptionId) {
        await realtimeDelivery.deliver(deliverySubscriptionId, report, {
          priority: 'high',
          immediate: true,
        });
      }

      console.log(
        `✅ Force regeneration completed for assessment: ${assessmentId}`
      );
      return report;
    } finally {
      this.regenerationQueue.delete(assessmentId);
    }
  }

  /**
   * Check if assessment has pending regeneration
   */
  hasPendingRegeneration(assessmentId: string): boolean {
    return this.regenerationQueue.has(assessmentId);
  }

  /**
   * Convert database report to GeneratedReport format
   */
  private async convertToGeneratedReport(
    dbReport: any
  ): Promise<GeneratedReport | null> {
    try {
      // This would convert the database report format to the GeneratedReport interface
      // Implementation depends on your specific data structures
      return dbReport as GeneratedReport;
    } catch (error) {
      console.error('Failed to convert database report:', error);
      return null;
    }
  }

  /**
   * Invalidate all caches related to an assessment
   */
  private invalidateReportCache(assessmentId: string): void {
    console.log(`🗑️ Invalidating cache for assessment: ${assessmentId}`);

    // Clear all cache entries for this assessment
    // The invalidateAssessment method removes all cache entries that include the assessmentId
    this.reportCacheService.invalidateAssessment(assessmentId);
  }
}

// Export the enhanced singleton instance
export const realtimeReportsService = RealtimeReportsService.getInstance();
