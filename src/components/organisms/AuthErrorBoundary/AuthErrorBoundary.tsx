'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import Link from 'next/link';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/molecules/Card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class AuthErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // You can also log the error to an error reporting service here
    // Example: logErrorToService(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleRefresh = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Check if it's an authentication-related error
      const isAuthError =
        this.state.error?.message?.toLowerCase().includes('auth') ||
        this.state.error?.message?.toLowerCase().includes('session') ||
        this.state.error?.message?.toLowerCase().includes('token') ||
        this.state.error?.message?.toLowerCase().includes('unauthorized');

      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className='min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8'>
          <div className='max-w-md w-full space-y-8'>
            <Card className='p-8'>
              <div className='text-center'>
                {/* Icon */}
                <div className='mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6'>
                  <svg
                    className='h-8 w-8 text-red-600'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                    aria-hidden='true'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                    />
                  </svg>
                </div>

                {/* Title */}
                <h1 className='text-2xl font-bold text-gray-900 mb-4'>
                  {isAuthError
                    ? 'Authentication Error'
                    : 'Something went wrong'}
                </h1>

                {/* Message */}
                <p className='text-gray-600 mb-6'>
                  {isAuthError
                    ? 'There was a problem with your authentication. Please try signing in again.'
                    : 'An unexpected error occurred. Please try again or refresh the page.'}
                </p>

                {/* Error details (only in development) */}
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <details className='mb-6 text-left'>
                    <summary className='cursor-pointer text-sm text-gray-500 hover:text-gray-700'>
                      Error Details (Development)
                    </summary>
                    <div className='mt-2 p-3 bg-gray-100 rounded text-xs text-gray-700 overflow-auto'>
                      <p className='font-medium'>
                        Error: {this.state.error.message}
                      </p>
                      {this.state.errorInfo && (
                        <pre className='mt-2 whitespace-pre-wrap'>
                          {this.state.errorInfo.componentStack}
                        </pre>
                      )}
                    </div>
                  </details>
                )}

                {/* Actions */}
                <div className='space-y-4'>
                  {isAuthError ? (
                    <>
                      <Link href='/auth/login'>
                        <Button className='w-full'>Sign In Again</Button>
                      </Link>
                      <Button
                        variant='outline'
                        onClick={this.handleRefresh}
                        className='w-full'
                      >
                        Refresh Page
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button onClick={this.handleRetry} className='w-full'>
                        Try Again
                      </Button>
                      <Button
                        variant='outline'
                        onClick={this.handleRefresh}
                        className='w-full'
                      >
                        Refresh Page
                      </Button>
                      <Link href='/dashboard'>
                        <Button variant='ghost' className='w-full'>
                          Go to Dashboard
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </Card>

            {/* Help text */}
            <div className='text-center'>
              <p className='text-sm text-gray-500'>
                If this problem persists, please contact support.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AuthErrorBoundary;
