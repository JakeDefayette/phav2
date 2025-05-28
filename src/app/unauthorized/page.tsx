'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/molecules/Card';

export default function UnauthorizedPage() {
  const { user, logout } = useAuth();

  const handleGoBack = () => {
    window.history.back();
  };

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
                  d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z'
                />
              </svg>
            </div>

            {/* Title */}
            <h1 className='text-2xl font-bold text-gray-900 mb-4'>
              Access Denied
            </h1>

            {/* Message */}
            <p className='text-gray-600 mb-6'>
              {user ? (
                <>
                  You don't have permission to access this page. Your current
                  role (
                  <span className='font-medium text-gray-900'>
                    {user.role === 'chiropractor'
                      ? 'Chiropractor'
                      : 'Parent/Guardian'}
                  </span>
                  ) doesn't allow access to this resource.
                </>
              ) : (
                'You need to be logged in to access this page.'
              )}
            </p>

            {/* Actions */}
            <div className='space-y-4'>
              {user ? (
                <>
                  <Link href='/dashboard'>
                    <Button className='w-full'>Go to Dashboard</Button>
                  </Link>
                  <Button
                    variant='outline'
                    onClick={handleGoBack}
                    className='w-full'
                  >
                    Go Back
                  </Button>
                  <Button
                    variant='ghost'
                    onClick={logout}
                    className='w-full text-red-600 hover:text-red-700 hover:bg-red-50'
                  >
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Link href='/auth/login'>
                    <Button className='w-full'>Sign In</Button>
                  </Link>
                  <Button
                    variant='outline'
                    onClick={handleGoBack}
                    className='w-full'
                  >
                    Go Back
                  </Button>
                </>
              )}
            </div>
          </div>
        </Card>

        {/* Help text */}
        <div className='text-center'>
          <p className='text-sm text-gray-500'>
            If you believe this is an error, please contact your administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
