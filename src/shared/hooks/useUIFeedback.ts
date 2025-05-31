'use client';

import { useCallback } from 'react';
import { useToast, ToastVariant } from '@/shared/components/molecules/Toast';

export interface UIFeedbackOptions {
  /** Toast notification options */
  toast?: {
    duration?: number;
    closable?: boolean;
    action?: {
      label: string;
      onClick: () => void;
    };
  };
}

export interface LoadingState {
  isLoading: boolean;
  message?: string;
  progress?: number;
}

/**
 * Hook for managing unified UI feedback patterns
 * Provides convenient methods for showing success, error, warning, and info messages
 */
export const useUIFeedback = () => {
  const { addToast } = useToast();

  // Success feedback
  const showSuccess = useCallback(
    (message: string, title?: string, options?: UIFeedbackOptions) => {
      addToast({
        variant: 'success' as ToastVariant,
        title,
        message,
        duration: options?.toast?.duration ?? 4000,
        closable: options?.toast?.closable,
        action: options?.toast?.action,
      });
    },
    [addToast]
  );

  // Error feedback
  const showError = useCallback(
    (message: string, title?: string, options?: UIFeedbackOptions) => {
      addToast({
        variant: 'error' as ToastVariant,
        title,
        message,
        duration: options?.toast?.duration ?? 6000,
        closable: options?.toast?.closable,
        action: options?.toast?.action,
      });
    },
    [addToast]
  );

  // Warning feedback
  const showWarning = useCallback(
    (message: string, title?: string, options?: UIFeedbackOptions) => {
      addToast({
        variant: 'warning' as ToastVariant,
        title,
        message,
        duration: options?.toast?.duration ?? 5000,
        closable: options?.toast?.closable,
        action: options?.toast?.action,
      });
    },
    [addToast]
  );

  // Info feedback
  const showInfo = useCallback(
    (message: string, title?: string, options?: UIFeedbackOptions) => {
      addToast({
        variant: 'info' as ToastVariant,
        title,
        message,
        duration: options?.toast?.duration ?? 4000,
        closable: options?.toast?.closable,
        action: options?.toast?.action,
      });
    },
    [addToast]
  );

  // Loading feedback (can be used with external state management)
  const showLoading = useCallback(
    (message = 'Loading...') => {
      return addToast({
        variant: 'info' as ToastVariant,
        message,
        duration: 0, // Persistent until manually dismissed
        closable: false,
      });
    },
    [addToast]
  );

  // Operation feedback with automatic success/error handling
  const withFeedback = useCallback(
    async <T>(
      operation: () => Promise<T>,
      {
        loadingMessage = 'Processing...',
        successMessage = 'Operation completed successfully',
        errorMessage = 'Operation failed',
        successTitle,
        errorTitle,
      }: {
        loadingMessage?: string;
        successMessage?: string;
        errorMessage?: string;
        successTitle?: string;
        errorTitle?: string;
      } = {}
    ): Promise<T> => {
      const loadingToastId = showLoading(loadingMessage);

      try {
        const result = await operation();

        // Remove loading toast and show success
        addToast({
          variant: 'success',
          title: successTitle,
          message: successMessage,
        });

        return result;
      } catch (error) {
        // Remove loading toast and show error
        const errorMsg = error instanceof Error ? error.message : errorMessage;
        showError(errorMsg, errorTitle);
        throw error;
      }
    },
    [addToast, showLoading, showError]
  );

  // Form validation feedback
  const showValidationError = useCallback(
    (field: string, message: string) => {
      showError(message, `Validation Error: ${field}`);
    },
    [showError]
  );

  // Network/API feedback
  const showNetworkError = useCallback(
    (action?: string) => {
      showError(
        'Please check your internet connection and try again.',
        `Network Error${action ? `: ${action}` : ''}`,
        {
          toast: {
            action: {
              label: 'Retry',
              onClick: () => window.location.reload(),
            },
          },
        }
      );
    },
    [showError]
  );

  // Progress feedback
  const showProgress = useCallback(
    (message: string, progress?: number) => {
      const progressText =
        progress !== undefined
          ? `${message} (${Math.round(progress)}%)`
          : message;

      return showInfo(progressText, 'Progress Update');
    },
    [showInfo]
  );

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoading,
    withFeedback,
    showValidationError,
    showNetworkError,
    showProgress,
  };
};
