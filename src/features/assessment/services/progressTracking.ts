import { RealtimeDeliveryService } from '@/features/reports/services/realtime-delivery';
import { PerformanceMonitor } from '@/shared/utils/performance';
import type {
  AssessmentProgress,
  AssessmentStage,
  ProgressError,
  ProgressUpdate,
  ProgressSubscription,
  AssessmentCompletionResult,
  ReportGenerationProgress,
  ReportGenerationStage,
} from '../types/progress';

/**
 * Progress tracking service for assessment submission workflow
 * Integrates with real-time delivery system for live updates
 */
export class AssessmentProgressService {
  private static instance: AssessmentProgressService;
  private realtimeDelivery: RealtimeDeliveryService;
  private performanceMonitor: PerformanceMonitor;
  private activeProgressTracking = new Map<string, AssessmentProgress>();
  private subscriptions = new Map<string, string[]>(); // assessmentId -> subscriptionIds

  private constructor() {
    this.realtimeDelivery = RealtimeDeliveryService.getInstance();
    this.performanceMonitor = PerformanceMonitor.getInstance();
  }

  static getInstance(): AssessmentProgressService {
    if (!AssessmentProgressService.instance) {
      AssessmentProgressService.instance = new AssessmentProgressService();
    }
    return AssessmentProgressService.instance;
  }

  /**
   * Subscribe to progress updates for an assessment
   */
  subscribe(subscription: ProgressSubscription): string {
    const { assessmentId, onProgress, onError, onComplete } = subscription;

    // Create real-time subscription with delivery service
    const subscriptionId = this.realtimeDelivery.subscribe(
      `progress-${assessmentId}`,
      (data: any) => {
        this.handleProgressUpdate(data, { onProgress, onError, onComplete });
      },
      {
        assessmentId,
        priority: 'high',
        debounceMs: 100, // Fast updates for progress
        enableDeduplication: true,
      }
    );

    // Track subscription
    const existingSubscriptions = this.subscriptions.get(assessmentId) || [];
    existingSubscriptions.push(subscriptionId);
    this.subscriptions.set(assessmentId, existingSubscriptions);

    this.performanceMonitor.recordMetric(
      'progressTracking',
      'subscription_created',
      {
        assessmentId,
        subscriptionId,
      }
    );

    console.log(
      `📊 Created progress subscription for assessment ${assessmentId}: ${subscriptionId}`
    );

    return subscriptionId;
  }

  /**
   * Unsubscribe from progress updates
   */
  unsubscribe(subscriptionId: string): boolean {
    const success = this.realtimeDelivery.unsubscribe(subscriptionId);

    // Remove from tracking
    for (const [
      assessmentId,
      subscriptionIds,
    ] of this.subscriptions.entries()) {
      const index = subscriptionIds.indexOf(subscriptionId);
      if (index !== -1) {
        subscriptionIds.splice(index, 1);
        if (subscriptionIds.length === 0) {
          this.subscriptions.delete(assessmentId);
          this.activeProgressTracking.delete(assessmentId);
        }
        break;
      }
    }

    return success;
  }

  /**
   * Start tracking progress for an assessment
   */
  startProgress(assessmentId: string): AssessmentProgress {
    const progress: AssessmentProgress = {
      assessmentId,
      stage: 'validating',
      progress: 0,
      currentStep: 'Validating assessment data',
      totalSteps: 5,
      completedSteps: 0,
      startTime: new Date().toISOString(),
    };

    this.activeProgressTracking.set(assessmentId, progress);
    this.broadcastProgress(assessmentId, progress);

    this.performanceMonitor.recordMetric(
      'progressTracking',
      'progress_started',
      {
        assessmentId,
      }
    );

    return progress;
  }

  /**
   * Update progress for a specific stage
   */
  updateProgress(
    assessmentId: string,
    stage: AssessmentStage,
    progress: number,
    currentStep: string,
    additionalData?: Partial<AssessmentProgress>
  ): void {
    const existingProgress = this.activeProgressTracking.get(assessmentId);
    if (!existingProgress) {
      console.warn(
        `No active progress tracking for assessment ${assessmentId}`
      );
      return;
    }

    const completedSteps = this.getCompletedStepsForStage(stage);
    const estimatedTimeRemaining = this.calculateEstimatedTime(
      existingProgress.startTime,
      progress
    );

    const updatedProgress: AssessmentProgress = {
      ...existingProgress,
      stage,
      progress,
      currentStep,
      completedSteps,
      estimatedTimeRemaining,
      ...additionalData,
    };

    this.activeProgressTracking.set(assessmentId, updatedProgress);
    this.broadcastProgress(assessmentId, updatedProgress);

    this.performanceMonitor.recordMetric(
      'progressTracking',
      'progress_updated',
      {
        assessmentId,
        stage,
        progress,
      }
    );
  }

  /**
   * Update report generation progress
   */
  updateReportProgress(
    assessmentId: string,
    reportProgress: ReportGenerationProgress
  ): void {
    const existingProgress = this.activeProgressTracking.get(assessmentId);
    if (!existingProgress || existingProgress.stage !== 'generating_report') {
      return;
    }

    // Calculate overall progress within the report generation stage (60-90% of total)
    const reportStageProgress = 60 + reportProgress.progress * 0.3;

    this.updateProgress(
      assessmentId,
      'generating_report',
      reportStageProgress,
      `Generating report: ${reportProgress.currentOperation}`,
      {
        // Additional metadata about report generation
        error: undefined, // Clear any previous errors
      }
    );
  }

  /**
   * Report an error during progress
   */
  reportError(assessmentId: string, error: ProgressError): void {
    const existingProgress = this.activeProgressTracking.get(assessmentId);
    if (!existingProgress) {
      return;
    }

    const updatedProgress: AssessmentProgress = {
      ...existingProgress,
      stage: 'error',
      error,
    };

    this.activeProgressTracking.set(assessmentId, updatedProgress);
    this.broadcastProgress(assessmentId, updatedProgress);

    this.performanceMonitor.recordMetric('progressTracking', 'progress_error', {
      assessmentId,
      errorCode: error.code,
      stage: error.stage,
    });
  }

  /**
   * Complete progress tracking
   */
  completeProgress(
    assessmentId: string,
    result: AssessmentCompletionResult
  ): void {
    const existingProgress = this.activeProgressTracking.get(assessmentId);
    if (!existingProgress) {
      return;
    }

    const completedProgress: AssessmentProgress = {
      ...existingProgress,
      stage: 'completed',
      progress: 100,
      currentStep: 'Assessment completed successfully',
      completedSteps: existingProgress.totalSteps,
    };

    this.activeProgressTracking.set(assessmentId, completedProgress);

    // Broadcast final progress and completion result
    this.broadcastProgress(assessmentId, completedProgress);
    this.broadcastCompletion(assessmentId, result);

    // Clean up after a delay
    setTimeout(() => {
      this.activeProgressTracking.delete(assessmentId);
    }, 30000); // Keep for 30 seconds for any final UI updates

    this.performanceMonitor.recordMetric(
      'progressTracking',
      'progress_completed',
      {
        assessmentId,
        totalDuration:
          Date.now() - new Date(existingProgress.startTime).getTime(),
      }
    );
  }

  /**
   * Get current progress for an assessment
   */
  getProgress(assessmentId: string): AssessmentProgress | null {
    return this.activeProgressTracking.get(assessmentId) || null;
  }

  /**
   * Broadcast progress update via real-time delivery
   */
  private broadcastProgress(
    assessmentId: string,
    progress: AssessmentProgress
  ): void {
    const update: ProgressUpdate = {
      assessmentId,
      update: progress,
      timestamp: new Date().toISOString(),
    };

    this.realtimeDelivery.broadcast(
      { type: 'progress_update', data: update },
      { assessmentId, priority: 'high' },
      { immediate: true }
    );
  }

  /**
   * Broadcast completion result
   */
  private broadcastCompletion(
    assessmentId: string,
    result: AssessmentCompletionResult
  ): void {
    this.realtimeDelivery.broadcast(
      { type: 'assessment_completed', data: result },
      { assessmentId, priority: 'high' },
      { immediate: true }
    );
  }

  /**
   * Handle incoming progress updates and route to appropriate callbacks
   */
  private handleProgressUpdate(
    data: any,
    callbacks: {
      onProgress: (progress: AssessmentProgress) => void;
      onError: (error: ProgressError) => void;
      onComplete: (result: AssessmentCompletionResult) => void;
    }
  ): void {
    try {
      if (data.type === 'progress_update') {
        const progressUpdate = data.data as ProgressUpdate;
        if (progressUpdate.update.error) {
          callbacks.onError(progressUpdate.update.error);
        } else {
          callbacks.onProgress(progressUpdate.update as AssessmentProgress);
        }
      } else if (data.type === 'assessment_completed') {
        callbacks.onComplete(data.data as AssessmentCompletionResult);
      }
    } catch (error) {
      console.error('Error handling progress update:', error);
    }
  }

  /**
   * Calculate completed steps based on current stage
   */
  private getCompletedStepsForStage(stage: AssessmentStage): number {
    const stageSteps: Record<AssessmentStage, number> = {
      validating: 0,
      saving_responses: 1,
      completing_assessment: 2,
      generating_report: 3,
      finalizing: 4,
      completed: 5,
      error: 0,
    };

    return stageSteps[stage] || 0;
  }

  /**
   * Calculate estimated time remaining based on current progress
   */
  private calculateEstimatedTime(
    startTime: string,
    currentProgress: number
  ): number {
    if (currentProgress <= 0) return 0;

    const elapsed = Date.now() - new Date(startTime).getTime();
    const totalEstimated = (elapsed / currentProgress) * 100;
    return Math.max(0, totalEstimated - elapsed);
  }
}
