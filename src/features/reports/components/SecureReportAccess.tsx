'use client';

import React, { ReactNode } from 'react';
import { useAuth } from '@/shared/hooks';
import { Button } from '@/shared/components/atoms/Button';
import { Loading } from '@/shared/components/atoms/Loading';
import { Shield, AlertTriangle, Lock, User } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SecureReportAccessProps {
  children: ReactNode;
  reportId: string;
  requireAuth?: boolean;
  showSecurityIndicator?: boolean;
}

/**
 * Security wrapper component for report access
 * Handles authentication requirements and security indicators
 */
export function SecureReportAccess({
  children,
  reportId,
  requireAuth = true,
  showSecurityIndicator = true,
}: SecureReportAccessProps) {
  const { user, loading, login } = useAuth();
  const router = useRouter();

  // Loading state
  if (loading) {
    return (
      <div className='min-h-screen bg-gray-100 flex items-center justify-center'>
        <div className='text-center'>
          <Loading size='lg' />
          <p className='mt-4 text-gray-600'>Verifying access...</p>
        </div>
      </div>
    );
  }

  // Authentication required but user not logged in
  if (requireAuth && !user) {
    return (
      <div className='min-h-screen bg-gray-100 flex items-center justify-center'>
        <div className='max-w-md mx-auto text-center bg-white p-8 rounded-lg shadow-md'>
          <Lock className='h-12 w-12 text-amber-500 mx-auto mb-4' />
          <h2 className='text-xl font-bold text-gray-900 mb-2'>
            Authentication Required
          </h2>
          <p className='text-gray-600 mb-6'>
            You need to be logged in to view this report. Please sign in to
            continue.
          </p>
          <div className='space-y-2'>
            <Button
              onClick={() => router.push('/auth/login')}
              variant='primary'
              className='w-full'
            >
              Sign In
            </Button>
            <Button
              onClick={() => router.push('/')}
              variant='secondary'
              className='w-full'
            >
              Go Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='relative'>
      {/* Security indicator */}
      {showSecurityIndicator && (
        <div className='bg-green-50 border-l-4 border-green-400 p-3 mb-4'>
          <div className='flex items-center'>
            <Shield className='h-5 w-5 text-green-400 mr-2' />
            <div className='text-sm'>
              <p className='text-green-700 font-medium'>Secure Report Access</p>
              <p className='text-green-600'>
                This report is securely accessed and protected.
                {user && <span className='ml-1'>Viewing as: {user.email}</span>}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Report content */}
      {children}

      {/* Security footer */}
      <div className='mt-8 border-t pt-4'>
        <div className='flex items-center justify-center space-x-4 text-xs text-gray-500'>
          <div className='flex items-center'>
            <Shield className='h-3 w-3 mr-1' />
            Secure Access
          </div>
          <div className='flex items-center'>
            <Lock className='h-3 w-3 mr-1' />
            Protected Content
          </div>
          {user && (
            <div className='flex items-center'>
              <User className='h-3 w-3 mr-1' />
              Authenticated User
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SecureReportAccess;
