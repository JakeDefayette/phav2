'use client';

import { useSearchParams } from 'next/navigation';
import { Card } from '@/shared/components/molecules/Card';
import { Button } from '@/shared/components/atoms/Button';

export default function TrackingErrorContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason') || 'unknown';

  const errorMessages = {
    'invalid-link': {
      title: 'Invalid Link',
      message: 'This email tracking link is no longer valid or has expired.',
      suggestion:
        'Please check your email for the correct link or contact support.',
    },
    'invalid-destination': {
      title: 'Invalid Destination',
      message: 'The destination link appears to be invalid or unsafe.',
      suggestion:
        'For security reasons, we cannot redirect you to this destination.',
    },
    'server-error': {
      title: 'Server Error',
      message: 'There was a technical problem processing your request.',
      suggestion:
        'Please try again later or contact support if the problem persists.',
    },
    unknown: {
      title: 'Unknown Error',
      message: 'An unexpected error occurred while processing your request.',
      suggestion:
        'Please try again later or contact support if you continue to experience issues.',
    },
  };

  const error =
    errorMessages[reason as keyof typeof errorMessages] ||
    errorMessages.unknown;

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-md w-full space-y-8'>
        <Card className='p-8 text-center'>
          <div className='mb-6'>
            <div className='mx-auto h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mb-4'>
              <svg
                className='h-8 w-8 text-red-600'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z'
                />
              </svg>
            </div>

            <h1 className='text-2xl font-bold text-gray-900 mb-2'>
              {error.title}
            </h1>

            <p className='text-gray-600 mb-4'>{error.message}</p>

            <p className='text-sm text-gray-500 mb-6'>{error.suggestion}</p>
          </div>

          <div className='space-y-3'>
            <Button
              onClick={() => window.history.back()}
              className='w-full'
              variant='primary'
            >
              Go Back
            </Button>

            <Button
              onClick={() => (window.location.href = '/')}
              className='w-full'
              variant='secondary'
            >
              Return to Home
            </Button>
          </div>

          {reason !== 'unknown' && (
            <div className='mt-6 pt-6 border-t border-gray-200'>
              <p className='text-xs text-gray-400'>Error Code: {reason}</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
