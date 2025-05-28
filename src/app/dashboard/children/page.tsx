'use client';

import React from 'react';
import { useRole } from '@/shared/hooks';
import { Button } from '@/shared/components/atoms/Button';
import { RoleGuard } from '@/shared/components/atoms/RoleGuard';

export default function ChildrenPage() {
  const { roleInfo, permissions } = useRole();

  return (
    <RoleGuard
      requiredRole='parent'
      fallback={
        <div className='min-h-screen flex items-center justify-center'>
          <div className='text-center'>
            <h1 className='text-2xl font-bold text-gray-900 mb-4'>
              Access Denied
            </h1>
            <p className='text-gray-600 mb-4'>
              This page is only accessible to parents/guardians.
            </p>
            <Button
              variant='primary'
              onClick={() => (window.location.href = '/dashboard')}
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      }
    >
      <div className='min-h-screen bg-gray-50'>
        <nav className='bg-white shadow'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='flex justify-between h-16'>
              <div className='flex items-center'>
                <h1 className='text-xl font-semibold text-gray-900'>
                  My Children
                </h1>
              </div>
              <div className='flex items-center space-x-4'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => (window.location.href = '/dashboard')}
                >
                  Back to Dashboard
                </Button>
              </div>
            </div>
          </div>
        </nav>

        <main className='max-w-7xl mx-auto py-6 sm:px-6 lg:px-8'>
          <div className='px-4 py-6 sm:px-0'>
            <div className='bg-white shadow rounded-lg p-6'>
              <h2 className='text-2xl font-bold text-gray-900 mb-6'>
                Children Management Dashboard
              </h2>

              <div className='mb-6'>
                <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
                  <h3 className='text-lg font-semibold text-green-900 mb-2'>
                    Welcome, {roleInfo?.displayName}!
                  </h3>
                  <p className='text-green-700'>
                    This page is only accessible to users with the parent role.
                    Here you can manage your children's posture assessments and
                    track their progress.
                  </p>
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                <div className='bg-gray-50 p-6 rounded-lg'>
                  <h3 className='text-lg font-semibold text-gray-900 mb-3'>
                    Add Child
                  </h3>
                  <p className='text-gray-600 mb-4'>
                    Register a new child for posture assessments.
                  </p>
                  <Button variant='primary' size='sm'>
                    Add New Child
                  </Button>
                </div>

                <div className='bg-gray-50 p-6 rounded-lg'>
                  <h3 className='text-lg font-semibold text-gray-900 mb-3'>
                    View Assessments
                  </h3>
                  <p className='text-gray-600 mb-4'>
                    View all posture assessments for your children.
                  </p>
                  <Button variant='primary' size='sm'>
                    View Assessments
                  </Button>
                </div>

                <div className='bg-gray-50 p-6 rounded-lg'>
                  <h3 className='text-lg font-semibold text-gray-900 mb-3'>
                    Progress Reports
                  </h3>
                  <p className='text-gray-600 mb-4'>
                    Track your children's posture improvement over time.
                  </p>
                  <Button variant='primary' size='sm'>
                    View Progress
                  </Button>
                </div>

                <div className='bg-gray-50 p-6 rounded-lg'>
                  <h3 className='text-lg font-semibold text-gray-900 mb-3'>
                    Appointment History
                  </h3>
                  <p className='text-gray-600 mb-4'>
                    View past and upcoming appointments.
                  </p>
                  <Button variant='primary' size='sm'>
                    View Appointments
                  </Button>
                </div>

                <div className='bg-gray-50 p-6 rounded-lg'>
                  <h3 className='text-lg font-semibold text-gray-900 mb-3'>
                    Exercise Plans
                  </h3>
                  <p className='text-gray-600 mb-4'>
                    Access recommended exercises for your children.
                  </p>
                  <Button variant='primary' size='sm'>
                    View Exercises
                  </Button>
                </div>

                <div className='bg-gray-50 p-6 rounded-lg'>
                  <h3 className='text-lg font-semibold text-gray-900 mb-3'>
                    Communication
                  </h3>
                  <p className='text-gray-600 mb-4'>
                    Message your chiropractor about your children's care.
                  </p>
                  <Button variant='primary' size='sm'>
                    Send Message
                  </Button>
                </div>
              </div>

              {/* Sample children list */}
              <div className='mt-8'>
                <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                  Your Children
                </h3>
                <div className='bg-gray-50 rounded-lg p-4'>
                  <p className='text-gray-600 text-center'>
                    No children registered yet. Click "Add New Child" to get
                    started.
                  </p>
                </div>
              </div>

              {/* Debug info */}
              <div className='mt-8 bg-gray-100 p-4 rounded-lg'>
                <h4 className='text-sm font-semibold text-gray-700 mb-2'>
                  Role Verification (Debug Info):
                </h4>
                <div className='text-xs text-gray-600'>
                  <p>Current Role: {roleInfo?.role}</p>
                  <p>Display Name: {roleInfo?.displayName}</p>
                  <p>
                    Can Manage Children:{' '}
                    {permissions.canManageChildren ? 'Yes' : 'No'}
                  </p>
                  <p>
                    Can View Reports:{' '}
                    {permissions.canViewReports ? 'Yes' : 'No'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </RoleGuard>
  );
}
