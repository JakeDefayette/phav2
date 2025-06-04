'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/shared/components/atoms/Button';
import { Alert } from '@/shared/components/molecules/Alert';

interface ConfirmPageProps {
  params: {
    token: string;
  };
}

interface ConfirmState {
  loading: boolean;
  success: boolean;
  error: string | null;
  email?: string;
  practiceId?: string;
  confirming: boolean;
}

export default function ConfirmPage({ params }: ConfirmPageProps) {
  const [state, setState] = useState<ConfirmState>({
    loading: true,
    success: false,
    error: null,
    confirming: false,
  });

  const handleConfirm = async () => {
    setState(prev => ({ ...prev, confirming: true, error: null }));

    try {
      // Get client IP for audit trail
      const response = await fetch('/api/email/confirm-optin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: params.token,
          userAgent: navigator.userAgent,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to confirm subscription');
      }

      setState(prev => ({
        ...prev,
        success: true,
        confirming: false,
        email: data.email,
        practiceId: data.practiceId,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to confirm subscription',
        confirming: false,
      }));
    }
  };

  // Auto-attempt confirmation on component mount
  useEffect(() => {
    const autoConfirm = async () => {
      try {
        // First validate the token exists
        const response = await fetch('/api/email/validate-confirmation-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token: params.token }),
        });

        const data = await response.json();

        if (!response.ok) {
          setState(prev => ({
            ...prev,
            error: data.error || 'Invalid confirmation link',
            loading: false,
          }));
          return;
        }

        setState(prev => ({
          ...prev,
          email: data.email,
          practiceId: data.practiceId,
          loading: false,
        }));
      } catch (error) {
        setState(prev => ({
          ...prev,
          error: 'Failed to validate confirmation link',
          loading: false,
        }));
      }
    };

    autoConfirm();
  }, [params.token]);

  if (state.loading) {
    return (
      <div className='min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8'>
        <div className='sm:mx-auto sm:w-full sm:max-w-md'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto'></div>
            <p className='mt-2 text-gray-600'>
              Validating confirmation link...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className='min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8'>
        <div className='sm:mx-auto sm:w-full sm:max-w-md'>
          <h2 className='mt-6 text-center text-3xl font-extrabold text-gray-900'>
            Confirmation Error
          </h2>
        </div>

        <div className='mt-8 sm:mx-auto sm:w-full sm:max-w-md'>
          <div className='bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10'>
            <Alert variant='error'>
              <div>
                <h3 className='font-medium'>Invalid Confirmation Link</h3>
                <p className='mt-1 text-sm'>{state.error}</p>
                <p className='mt-2 text-sm'>
                  This link may have expired. Please try subscribing again or
                  contact support if you continue to have issues.
                </p>
              </div>
            </Alert>
          </div>
        </div>
      </div>
    );
  }

  if (state.success) {
    return (
      <div className='min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8'>
        <div className='sm:mx-auto sm:w-full sm:max-w-md'>
          <h2 className='mt-6 text-center text-3xl font-extrabold text-gray-900'>
            Subscription Confirmed!
          </h2>
        </div>

        <div className='mt-8 sm:mx-auto sm:w-full sm:max-w-md'>
          <div className='bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10'>
            <div className='text-center'>
              <div className='mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100'>
                <svg
                  className='h-6 w-6 text-green-600'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M5 13l4 4L19 7'
                  />
                </svg>
              </div>
              <h3 className='mt-4 text-lg font-medium text-gray-900'>
                Welcome to our mailing list!
              </h3>
              {state.email && (
                <p className='mt-2 text-sm text-gray-600'>
                  Your subscription for <strong>{state.email}</strong> has been
                  confirmed.
                </p>
              )}
              <p className='mt-2 text-sm text-gray-600'>
                You'll start receiving our emails soon. You can manage your
                preferences or unsubscribe at any time.
              </p>
              <div className='mt-4 space-y-2'>
                <a
                  href='/preferences'
                  className='text-blue-600 hover:text-blue-500 text-sm font-medium block'
                >
                  Manage email preferences
                </a>
                <Link
                  href='/'
                  className='text-gray-500 hover:text-gray-400 text-sm block'
                >
                  Return to website
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8'>
      <div className='sm:mx-auto sm:w-full sm:max-w-md'>
        <h2 className='mt-6 text-center text-3xl font-extrabold text-gray-900'>
          Confirm Your Subscription
        </h2>
        <p className='mt-2 text-center text-sm text-gray-600'>
          Please confirm that you want to receive emails from us
        </p>
      </div>

      <div className='mt-8 sm:mx-auto sm:w-full sm:max-w-md'>
        <div className='bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10'>
          {state.email && (
            <div className='bg-gray-50 p-4 rounded-md mb-4'>
              <p className='text-sm text-gray-700'>
                <span className='font-medium'>Email:</span> {state.email}
              </p>
            </div>
          )}

          {state.error && (
            <div className='mb-4'>
              <Alert variant='error'>{state.error}</Alert>
            </div>
          )}

          <div className='space-y-4'>
            <p className='text-sm text-gray-600'>
              By confirming your subscription, you agree to receive marketing
              emails from us. You can unsubscribe at any time using the link in
              our emails.
            </p>

            <Button
              onClick={handleConfirm}
              className='w-full'
              variant='primary'
              isLoading={state.confirming}
              disabled={state.confirming}
            >
              {state.confirming ? 'Confirming...' : 'Confirm Subscription'}
            </Button>

            <div className='text-center'>
              <Link
                href='/'
                className='text-sm text-gray-500 hover:text-gray-400'
              >
                Cancel and return to website
              </Link>
            </div>
          </div>

          <div className='mt-6 text-xs text-gray-500 text-center'>
            <p>
              This confirms your consent to receive marketing emails. We respect
              your privacy and will never share your information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
