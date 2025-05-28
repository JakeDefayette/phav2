'use client';

import React, { Component, ReactNode } from 'react';
import { AppError, isAppError, createError } from '@/shared/types/errors';
import { Button } from '@/shared/components/atoms/Button';

/**
 * Props for the ErrorBoundary component
 */
export interface ErrorBoundaryProps {
  /** Child components to render */
  children: ReactNode;
  /** Fallback component to render when an error occurs */
  fallback?: (error: AppError, retry: () => void) => ReactNode;
  /** Whether to log errors to console */
  logErrors?: boolean;
  /** Custom error handler */
  onError?: (error: AppError, errorInfo: React.ErrorInfo) => void;
  /** Whether to show detailed error information in development */
  showDetails?: boolean;
}

/**
 * State for the ErrorBoundary component
 */
export interface ErrorBoundaryState {
  hasError: boolean;
  error: AppError | null;
  errorId: string | null;
}

/**
 * Global Error Boundary Component
 *
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of the component tree that crashed.
 *
 * @example
 * ```tsx
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    const appError = isAppError(error) ? error : createError(error);
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    return {
      hasError: true,
      error: appError,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const appError = this.state.error || createError(error);

    // Log error details
    if (this.props.logErrors !== false) {
      console.error('ErrorBoundary caught an error:', {
        error: appError.toJSON(),
        componentStack: errorInfo.componentStack,
        errorBoundary: this.constructor.name,
      });
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(appError, errorInfo);
    }

    // Report to error monitoring service
    this.reportError(appError, errorInfo);
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  /**
   * Report error to monitoring service
   */
  private reportError = (error: AppError, errorInfo: React.ErrorInfo) => {
    // In a real application, you would send this to an error monitoring service
    // like Sentry, LogRocket, or Bugsnag
    console.warn('Error reported to monitoring service:', {
      errorId: this.state.errorId,
      error: error.toJSON(),
      errorInfo,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
    });
  };

  /**
   * Retry mechanism - reset error boundary state
   */
  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorId: null,
    });
  };

  /**
   * Auto-retry with delay for transient errors
   */
  private handleAutoRetry = () => {
    this.retryTimeoutId = setTimeout(() => {
      this.handleRetry();
    }, 5000);
  };

  /**
   * Render error fallback UI
   */
  private renderErrorFallback = (): ReactNode => {
    const { error } = this.state;
    const { fallback, showDetails = process.env.NODE_ENV === 'development' } =
      this.props;

    if (!error) return null;

    // Use custom fallback if provided
    if (fallback) {
      return fallback(error, this.handleRetry);
    }

    // Default error UI
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
        <div className='max-w-md w-full space-y-8'>
          <div className='text-center'>
            <div className='mx-auto h-24 w-24 text-red-500'>
              <svg
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
                className='h-24 w-24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={1}
                  d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
                />
              </svg>
            </div>

            <h2 className='mt-6 text-3xl font-extrabold text-gray-900'>
              Something went wrong
            </h2>

            <p className='mt-2 text-sm text-gray-600'>
              {error.getUserMessage()}
            </p>

            {showDetails && (
              <details className='mt-4 text-left'>
                <summary className='text-sm text-gray-500 cursor-pointer hover:text-gray-700'>
                  Technical Details
                </summary>
                <div className='mt-2 p-3 bg-gray-100 rounded-md text-xs text-gray-700 overflow-auto'>
                  <div>
                    <strong>Error Code:</strong> {error.code}
                  </div>
                  <div>
                    <strong>Error ID:</strong> {this.state.errorId}
                  </div>
                  <div>
                    <strong>Message:</strong> {error.message}
                  </div>
                  <div>
                    <strong>Timestamp:</strong>{' '}
                    {error.timestamp.toLocaleString()}
                  </div>
                  {error.context && (
                    <div>
                      <strong>Context:</strong>
                      <pre className='mt-1 text-xs'>
                        {JSON.stringify(error.context, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>

          <div className='flex flex-col space-y-3'>
            <Button
              variant='primary'
              size='lg'
              onClick={this.handleRetry}
              className='w-full'
            >
              Try Again
            </Button>

            <Button
              variant='outline'
              size='lg'
              onClick={() => window.location.reload()}
              className='w-full'
            >
              Reload Page
            </Button>

            <Button
              variant='ghost'
              size='md'
              onClick={() => (window.location.href = '/')}
              className='w-full'
            >
              Go to Home
            </Button>
          </div>

          <div className='text-center'>
            <p className='text-xs text-gray-500'>
              Error ID: {this.state.errorId}
            </p>
            <p className='text-xs text-gray-500 mt-1'>
              If this problem persists, please contact support with the error ID
              above.
            </p>
          </div>
        </div>
      </div>
    );
  };

  render() {
    if (this.state.hasError) {
      return this.renderErrorFallback();
    }

    return this.props.children;
  }
}

/**
 * Higher-order component for wrapping components with error boundary
 *
 * @example
 * ```tsx
 * const SafeComponent = withErrorBoundary(MyComponent, {
 *   fallback: (error, retry) => <div>Error: {error.message}</div>
 * });
 * ```
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = React.forwardRef<any, P>((props, ref) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...(props as any)} ref={ref} />
    </ErrorBoundary>
  ));

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

/**
 * Hook for programmatically triggering error boundary
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const throwError = useErrorHandler();
 *
 *   const handleError = () => {
 *     throwError(new Error('Something went wrong'));
 *   };
 * }
 * ```
 */
export function useErrorHandler() {
  return React.useCallback((error: Error | AppError) => {
    throw error;
  }, []);
}

export default ErrorBoundary;
