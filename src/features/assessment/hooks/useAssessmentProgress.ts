import { useState, useEffect, useCallback, useRef } from 'react';
import { AssessmentProgressService } from '../services/progressTracking';
import type {
  AssessmentProgress,
  ProgressError,
  AssessmentCompletionResult,
  ProgressSubscription,
} from '../types/progress';

interface UseAssessmentProgressOptions {
  assessmentId: string;
  onComplete?: (result: AssessmentCompletionResult) => void;
  onError?: (error: ProgressError) => void;
  autoUnsubscribe?: boolean;
}

interface UseAssessmentProgressReturn {
  progress: AssessmentProgress | null;
  error: ProgressError | null;
  isCompleted: boolean;
  isInProgress: boolean;
  hasError: boolean;
  completionResult: AssessmentCompletionResult | null;
  subscribe: () => void;
  unsubscribe: () => void;
  resetProgress: () => void;
}

/**
 * React hook for tracking real-time assessment progress
 *
 * @example
 * ```tsx
 * function AssessmentSubmissionDialog({ assessmentId }) {
 *   const {
 *     progress,
 *     error,
 *     isCompleted,
 *     isInProgress,
 *     completionResult
 *   } = useAssessmentProgress({
 *     assessmentId,
 *     onComplete: (result) => {
 *       console.log('Assessment completed:', result);
 *       navigate(`/reports/${result.reportId}`);
 *     },
 *     onError: (error) => {
 *       console.error('Assessment error:', error);
 *       showErrorNotification(error.message);
 *     }
 *   });
 *
 *   return (
 *     <div>
 *       {isInProgress && (
 *         <ProgressIndicator
 *           progress={progress?.progress || 0}
 *           stage={progress?.currentStep || 'Starting...'}
 *         />
 *       )}
 *       {hasError && (
 *         <ErrorMessage error={error} />
 *       )}
 *       {isCompleted && (
 *         <SuccessMessage result={completionResult} />
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useAssessmentProgress({
  assessmentId,
  onComplete,
  onError,
  autoUnsubscribe = true,
}: UseAssessmentProgressOptions): UseAssessmentProgressReturn {
  const [progress, setProgress] = useState<AssessmentProgress | null>(null);
  const [error, setError] = useState<ProgressError | null>(null);
  const [completionResult, setCompletionResult] =
    useState<AssessmentCompletionResult | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const progressServiceRef = useRef(AssessmentProgressService.getInstance());
  const subscriptionIdRef = useRef<string | null>(null);

  // Computed states
  const isCompleted = progress?.stage === 'completed' || !!completionResult;
  const isInProgress = !!(progress && !isCompleted && !error);
  const hasError = !!error || progress?.stage === 'error';

  // Handle progress updates
  const handleProgressUpdate = useCallback(
    (newProgress: AssessmentProgress) => {
      setProgress(newProgress);

      // Clear error if we receive a successful progress update
      if (newProgress.stage !== 'error' && !newProgress.error) {
        setError(null);
      }
    },
    []
  );

  // Handle error updates
  const handleError = useCallback(
    (newError: ProgressError) => {
      setError(newError);
      if (onError) {
        onError(newError);
      }
    },
    [onError]
  );

  // Handle completion
  const handleComplete = useCallback(
    (result: AssessmentCompletionResult) => {
      setCompletionResult(result);
      if (onComplete) {
        onComplete(result);
      }

      // Auto-unsubscribe if enabled
      if (autoUnsubscribe) {
        unsubscribe();
      }
    },
    [onComplete, autoUnsubscribe, unsubscribe]
  );

  // Subscribe to progress updates
  const subscribe = useCallback(() => {
    if (isSubscribed || !assessmentId) {
      return;
    }

    const subscription: ProgressSubscription = {
      assessmentId,
      onProgress: handleProgressUpdate,
      onError: handleError,
      onComplete: handleComplete,
    };

    try {
      const subscriptionId = progressServiceRef.current.subscribe(subscription);
      subscriptionIdRef.current = subscriptionId;
      setIsSubscribed(true);

      console.log(
        `📊 Subscribed to progress for assessment ${assessmentId}: ${subscriptionId}`
      );
    } catch (error) {
      console.error('Failed to subscribe to progress updates:', error);
    }
  }, [
    assessmentId,
    isSubscribed,
    handleProgressUpdate,
    handleError,
    handleComplete,
  ]);

  // Unsubscribe from progress updates
  const unsubscribe = useCallback(() => {
    if (!isSubscribed || !subscriptionIdRef.current) {
      return;
    }

    try {
      const success = progressServiceRef.current.unsubscribe(
        subscriptionIdRef.current
      );
      if (success) {
        console.log(
          `📊 Unsubscribed from progress: ${subscriptionIdRef.current}`
        );
      }
    } catch (error) {
      console.error('Failed to unsubscribe from progress updates:', error);
    } finally {
      subscriptionIdRef.current = null;
      setIsSubscribed(false);
    }
  }, [isSubscribed]);

  // Reset progress state
  const resetProgress = useCallback(() => {
    setProgress(null);
    setError(null);
    setCompletionResult(null);
  }, []);

  // Auto-subscribe on mount if assessmentId is provided
  useEffect(() => {
    if (assessmentId && !isSubscribed) {
      subscribe();
    }
  }, [assessmentId, isSubscribed, subscribe]);

  // Auto-unsubscribe on unmount
  useEffect(() => {
    return () => {
      if (isSubscribed) {
        unsubscribe();
      }
    };
  }, [isSubscribed, unsubscribe]);

  // Get current progress from service if not already tracking
  useEffect(() => {
    if (assessmentId && !progress && !isSubscribed) {
      const currentProgress =
        progressServiceRef.current.getProgress(assessmentId);
      if (currentProgress) {
        setProgress(currentProgress);
      }
    }
  }, [assessmentId, progress, isSubscribed]);

  return {
    progress,
    error,
    isCompleted,
    isInProgress,
    hasError,
    completionResult,
    subscribe,
    unsubscribe,
    resetProgress,
  };
}

/**
 * Lightweight hook for just getting current progress without subscriptions
 */
export function useCurrentAssessmentProgress(
  assessmentId: string
): AssessmentProgress | null {
  const [progress, setProgress] = useState<AssessmentProgress | null>(null);
  const progressServiceRef = useRef(AssessmentProgressService.getInstance());

  useEffect(() => {
    if (assessmentId) {
      const currentProgress =
        progressServiceRef.current.getProgress(assessmentId);
      setProgress(currentProgress);
    }
  }, [assessmentId]);

  return progress;
}
