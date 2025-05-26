'use client';

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/atoms/Button';

export default function DashboardPage() {
  const { user, logout, loading } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      // Handle logout error silently or show user-friendly message
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto'></div>
          <p className='mt-4 text-gray-600'>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold text-gray-900 mb-4'>
            Access Denied
          </h1>
          <p className='text-gray-600 mb-4'>
            Please log in to access the dashboard.
          </p>
          <Button
            variant='primary'
            onClick={() => (window.location.href = '/auth/login')}
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <nav className='bg-white shadow'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between h-16'>
            <div className='flex items-center'>
              <h1 className='text-xl font-semibold text-gray-900'>
                Chiropractic Practice Growth Platform
              </h1>
            </div>
            <div className='flex items-center space-x-4'>
              <span className='text-sm text-gray-700'>
                Welcome, {user.firstName} {user.lastName}
              </span>
              <span className='text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded'>
                {user.role}
              </span>
              <Button variant='outline' size='sm' onClick={handleLogout}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className='max-w-7xl mx-auto py-6 sm:px-6 lg:px-8'>
        <div className='px-4 py-6 sm:px-0'>
          <div className='border-4 border-dashed border-gray-200 rounded-lg p-8'>
            <div className='text-center'>
              <h2 className='text-2xl font-bold text-gray-900 mb-4'>
                Dashboard
              </h2>
              <p className='text-gray-600 mb-6'>
                Welcome to your{' '}
                {user.role === 'chiropractor' ? 'practice' : 'parent'}{' '}
                dashboard!
              </p>

              {user.role === 'chiropractor' && user.practiceId && (
                <div className='bg-blue-50 border border-blue-200 rounded-md p-4 mb-6'>
                  <p className='text-sm text-blue-800'>
                    <strong>Practice ID:</strong> {user.practiceId}
                  </p>
                </div>
              )}

              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                <div className='bg-white p-6 rounded-lg shadow'>
                  <h3 className='text-lg font-medium text-gray-900 mb-2'>
                    Profile
                  </h3>
                  <p className='text-gray-600 text-sm'>
                    Manage your account settings and preferences
                  </p>
                </div>

                {user.role === 'chiropractor' && (
                  <>
                    <div className='bg-white p-6 rounded-lg shadow'>
                      <h3 className='text-lg font-medium text-gray-900 mb-2'>
                        Patients
                      </h3>
                      <p className='text-gray-600 text-sm'>
                        View and manage your patient records
                      </p>
                    </div>
                    <div className='bg-white p-6 rounded-lg shadow'>
                      <h3 className='text-lg font-medium text-gray-900 mb-2'>
                        Analytics
                      </h3>
                      <p className='text-gray-600 text-sm'>
                        Track practice growth and performance
                      </p>
                    </div>
                  </>
                )}

                {user.role === 'parent' && (
                  <>
                    <div className='bg-white p-6 rounded-lg shadow'>
                      <h3 className='text-lg font-medium text-gray-900 mb-2'>
                        Children
                      </h3>
                      <p className='text-gray-600 text-sm'>
                        Manage your children's health records
                      </p>
                    </div>
                    <div className='bg-white p-6 rounded-lg shadow'>
                      <h3 className='text-lg font-medium text-gray-900 mb-2'>
                        Appointments
                      </h3>
                      <p className='text-gray-600 text-sm'>
                        Schedule and view upcoming appointments
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
