'use client';

import React, { Component, ErrorInfo } from 'react';
import { Alert } from '../molecules/Alert';
import { Button } from '../atoms/Button';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{
    error?: Error;
    errorInfo?: ErrorInfo;
    resetError: () => void;
    errorId?: string;
  }>;
  onError?: (error: Error, errorInfo: ErrorInfo, errorId: string) => void;
  isolate?: boolean;
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  private resetTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    const errorId = `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = this.state.errorId || 'unknown';

    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Report error to monitoring service
    this.reportError(error, errorInfo, errorId);

    // Call onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo, errorId);
    }

    this.setState({
      errorInfo,
    });
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;

    if (hasError && prevProps.resetKeys !== resetKeys) {
      if (resetKeys && resetKeys.length > 0) {
        this.resetError();
      }
    }

    if (
      hasError &&
      resetOnPropsChange &&
      prevProps.children !== this.props.children
    ) {
      this.resetError();
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  private reportError = (
    error: Error,
    errorInfo: ErrorInfo,
    errorId: string
  ) => {
    // Report to monitoring service (implement based on your monitoring solution)
    try {
      // Example: Report to external service
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'exception', {
          description: error.message,
          fatal: false,
          error_id: errorId,
        });
      }
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  };

  private resetError = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorId: undefined,
    });
  };

  private handleRetry = () => {
    this.resetError();
  };

  private handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render() {
    const { hasError, error, errorInfo, errorId } = this.state;
    const { children, fallback: Fallback } = this.props;

    if (hasError) {
      if (Fallback) {
        return (
          <Fallback
            error={error}
            errorInfo={errorInfo}
            resetError={this.resetError}
            errorId={errorId}
          />
        );
      }

      return (
        <div className='error-boundary-container p-6 max-w-2xl mx-auto'>
          <Alert variant='destructive' className='mb-6'>
            <h2 className='text-lg font-semibold mb-2'>Something went wrong</h2>
            <p className='text-sm text-gray-600 mb-4'>
              We encountered an unexpected error. This has been reported to our
              team.
            </p>
            {errorId && (
              <p className='text-xs text-gray-500 mb-4'>Error ID: {errorId}</p>
            )}
            <div className='flex gap-3'>
              <Button variant='outline' size='sm' onClick={this.handleRetry}>
                Try Again
              </Button>
              <Button variant='secondary' size='sm' onClick={this.handleReload}>
                Reload Page
              </Button>
            </div>
          </Alert>

          {/* Development details */}
          {process.env.NODE_ENV === 'development' && (
            <details className='mt-6 p-4 bg-gray-50 rounded border'>
              <summary className='cursor-pointer font-medium text-sm'>
                Error Details (Development)
              </summary>
              <div className='mt-3 text-xs space-y-2'>
                <div>
                  <strong>Error:</strong>
                  <pre className='mt-1 p-2 bg-red-50 rounded text-red-700 overflow-auto'>
                    {error?.message}
                  </pre>
                </div>
                <div>
                  <strong>Stack:</strong>
                  <pre className='mt-1 p-2 bg-red-50 rounded text-red-700 overflow-auto max-h-32'>
                    {error?.stack}
                  </pre>
                </div>
                {errorInfo && (
                  <div>
                    <strong>Component Stack:</strong>
                    <pre className='mt-1 p-2 bg-red-50 rounded text-red-700 overflow-auto max-h-32'>
                      {errorInfo.componentStack}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          )}
        </div>
      );
    }

    return children;
  }
}

export default ErrorBoundary;
