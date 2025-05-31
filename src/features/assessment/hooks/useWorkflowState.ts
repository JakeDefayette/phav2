'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  workflowStateManager,
  WorkflowState,
  WorkflowRecoveryOptions,
} from '../services/workflowStateManager';
import { SurveyFormData } from '../components/MultiStepSurveyForm/types';
import { AssessmentProgress } from '../types/progress';

export interface UseWorkflowStateOptions {
  autoStart?: boolean;
  anonymous?: boolean;
  onStateChange?: (state: WorkflowState) => void;
  onError?: (error: Error) => void;
}

export interface UseWorkflowStateReturn {
  // State
  state: WorkflowState | null;
  isLoading: boolean;
  error: Error | null;
  canResume: boolean;

  // Actions
  startSession: (anonymous?: boolean) => Promise<WorkflowState>;
  resumeSession: () => Promise<WorkflowState | null>;
  updateFormData: (
    step: number,
    data: Partial<SurveyFormData>,
    immediate?: boolean
  ) => Promise<void>;
  updateProgress: (progress: AssessmentProgress) => Promise<void>;
  reportError: (error: {
    code: string;
    message: string;
    stage: string;
    recoverable?: boolean;
  }) => Promise<void>;
  recoverFromErrors: (options?: WorkflowRecoveryOptions) => Promise<boolean>;
  convertToAuthenticated: () => Promise<boolean>;
  completeWorkflow: () => Promise<void>;
  clearState: () => Promise<void>;

  // Utilities
  getFormDataForStep: (step: number) => Partial<SurveyFormData>;
  hasUnsavedChanges: () => boolean;
  getRecentErrors: () => WorkflowState['errors'];
}

/**
 * Hook for managing workflow state in assessment components
 */
export function useWorkflowState(
  options: UseWorkflowStateOptions = {}
): UseWorkflowStateReturn {
  const {
    autoStart = true,
    anonymous = true,
    onStateChange,
    onError,
  } = options;

  const [state, setState] = useState<WorkflowState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [canResume, setCanResume] = useState(false);

  const unsubscribeRef = useRef<(() => void) | null>(null);
  const lastSavedDataRef = useRef<string>('');

  // Subscribe to workflow state changes
  useEffect(() => {
    const handleStateChange = (newState: WorkflowState) => {
      setState(newState);
      lastSavedDataRef.current = JSON.stringify(newState.formData);

      if (onStateChange) {
        onStateChange(newState);
      }
    };

    // Subscribe to state changes
    unsubscribeRef.current = workflowStateManager.subscribe(handleStateChange);

    // Initialize
    const initialize = async () => {
      try {
        setIsLoading(true);

        // Check if we can resume
        const resumable = workflowStateManager.canResume();
        setCanResume(resumable);

        if (resumable) {
          // Try to resume existing session
          const resumed = await workflowStateManager.resumeSession();
          if (resumed) {
            setState(resumed);
            lastSavedDataRef.current = JSON.stringify(resumed.formData);
          } else if (autoStart) {
            // Resume failed, start new session
            const newState = await workflowStateManager.startSession(anonymous);
            setState(newState);
          }
        } else if (autoStart) {
          // Start new session
          const newState = await workflowStateManager.startSession(anonymous);
          setState(newState);
        }
      } catch (err) {
        const error =
          err instanceof Error
            ? err
            : new Error('Failed to initialize workflow');
        setError(error);
        if (onError) {
          onError(error);
        }
      } finally {
        setIsLoading(false);
      }
    };

    initialize();

    // Cleanup
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [autoStart, anonymous, onStateChange, onError]);

  // Actions
  const startSession = useCallback(
    async (isAnonymous = true): Promise<WorkflowState> => {
      try {
        setError(null);
        setIsLoading(true);
        const newState = await workflowStateManager.startSession(isAnonymous);
        return newState;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error('Failed to start session');
        setError(error);
        if (onError) {
          onError(error);
        }
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [onError]
  );

  const resumeSession = useCallback(async (): Promise<WorkflowState | null> => {
    try {
      setError(null);
      setIsLoading(true);
      const resumed = await workflowStateManager.resumeSession();
      setCanResume(false); // We've attempted resume
      return resumed;
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error('Failed to resume session');
      setError(error);
      if (onError) {
        onError(error);
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [onError]);

  const updateFormData = useCallback(
    async (
      step: number,
      data: Partial<SurveyFormData>,
      immediate = false
    ): Promise<void> => {
      try {
        await workflowStateManager.updateFormData(step, data, { immediate });
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error('Failed to update form data');
        setError(error);
        if (onError) {
          onError(error);
        }
        throw error;
      }
    },
    [onError]
  );

  const updateProgress = useCallback(
    async (progress: AssessmentProgress): Promise<void> => {
      try {
        await workflowStateManager.updateProgress(progress);
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error('Failed to update progress');
        setError(error);
        if (onError) {
          onError(error);
        }
      }
    },
    [onError]
  );

  const reportError = useCallback(
    async (errorInfo: {
      code: string;
      message: string;
      stage: string;
      recoverable?: boolean;
    }): Promise<void> => {
      try {
        await workflowStateManager.reportError(errorInfo);
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error('Failed to report error');
        setError(error);
        if (onError) {
          onError(error);
        }
      }
    },
    [onError]
  );

  const recoverFromErrors = useCallback(
    async (options?: WorkflowRecoveryOptions): Promise<boolean> => {
      try {
        setError(null);
        const recovered = await workflowStateManager.recoverFromErrors(options);
        return recovered;
      } catch (err) {
        const error =
          err instanceof Error
            ? err
            : new Error('Failed to recover from errors');
        setError(error);
        if (onError) {
          onError(error);
        }
        return false;
      }
    },
    [onError]
  );

  const convertToAuthenticated = useCallback(async (): Promise<boolean> => {
    try {
      const converted = await workflowStateManager.convertToAuthenticated();
      return converted;
    } catch (err) {
      const error =
        err instanceof Error
          ? err
          : new Error('Failed to convert to authenticated');
      setError(error);
      if (onError) {
        onError(error);
      }
      return false;
    }
  }, [onError]);

  const completeWorkflow = useCallback(async (): Promise<void> => {
    try {
      await workflowStateManager.completeWorkflow();
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error('Failed to complete workflow');
      setError(error);
      if (onError) {
        onError(error);
      }
    }
  }, [onError]);

  const clearState = useCallback(async (): Promise<void> => {
    try {
      await workflowStateManager.clearState();
      setState(null);
      setCanResume(false);
      lastSavedDataRef.current = '';
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error('Failed to clear state');
      setError(error);
      if (onError) {
        onError(error);
      }
    }
  }, [onError]);

  // Utilities
  const getFormDataForStep = useCallback(
    (step: number): Partial<SurveyFormData> => {
      if (!state) return {};

      // Return form data relevant to the specific step
      const { formData } = state;

      switch (step) {
        case 1:
          return {
            lifestyleStressors: formData.lifestyleStressors || [],
          };
        case 2:
          return {
            lifestyleStressors: formData.lifestyleStressors || [],
            symptoms: formData.symptoms || [],
          };
        case 3:
          return formData; // All data for final step
        default:
          return formData;
      }
    },
    [state]
  );

  const hasUnsavedChanges = useCallback((): boolean => {
    if (!state) return false;

    const currentData = JSON.stringify(state.formData);
    return currentData !== lastSavedDataRef.current;
  }, [state]);

  const getRecentErrors = useCallback((): WorkflowState['errors'] => {
    if (!state) return [];

    // Return errors from the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return state.errors.filter(error => new Date(error.timestamp) > oneHourAgo);
  }, [state]);

  return {
    // State
    state,
    isLoading,
    error,
    canResume,

    // Actions
    startSession,
    resumeSession,
    updateFormData,
    updateProgress,
    reportError,
    recoverFromErrors,
    convertToAuthenticated,
    completeWorkflow,
    clearState,

    // Utilities
    getFormDataForStep,
    hasUnsavedChanges,
    getRecentErrors,
  };
}
