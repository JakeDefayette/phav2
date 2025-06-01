'use client';

import React from 'react';
import { useAuth, useRole } from '@/shared/hooks';
import { Button } from '@/shared/components/atoms/Button';
import { RoleGuard } from '@/shared/components/atoms/RoleGuard';

export function DashboardContent() {
  const { user } = useAuth();
  const { roleInfo, permissions } = useRole();

  return (
    <div className='space-y-6'>
      {/* Welcome Section */}
      <div className='bg-white overflow-hidden shadow rounded-lg'>
        <div className='px-4 py-5 sm:p-6'>
          <div className='text-center'>
            <h1 className='text-3xl font-bold text-gray-900 mb-4'>
              Welcome to Your Dashboard
            </h1>
            <p className='text-lg text-gray-600 mb-6'>
              Hello, {user?.firstName || user?.email}! Manage your posture
              health assessments and practice.
            </p>
            {roleInfo && (
              <div className='mb-6'>
                <div className='inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800'>
                  <span className='mr-2'>Role:</span> {roleInfo.displayName}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Feature Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {/* Chiropractor-only features */}
        <RoleGuard requiredRole='chiropractor'>
          <div className='bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200'>
            <div className='px-4 py-5 sm:p-6'>
              <div className='flex items-center'>
                <div className='flex-shrink-0'>
                  <div className='w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center'>
                    <svg
                      className='w-5 h-5 text-white'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
                      />
                    </svg>
                  </div>
                </div>
                <div className='ml-5 w-0 flex-1'>
                  <dl>
                    <dt className='text-sm font-medium text-gray-500 truncate'>
                      Practice Management
                    </dt>
                    <dd className='text-lg font-medium text-gray-900'>
                      Manage Settings
                    </dd>
                  </dl>
                </div>
              </div>
              <div className='mt-5'>
                <p className='text-sm text-gray-600 mb-4'>
                  Configure your practice settings, branding, and view all
                  patient assessments.
                </p>
                <Button
                  variant='primary'
                  size='sm'
                  onClick={() => (window.location.href = '/dashboard/practice')}
                  className='w-full'
                >
                  Manage Practice
                </Button>
              </div>
            </div>
          </div>
        </RoleGuard>

        <RoleGuard requiredPermission='canCreateAssessments'>
          <div className='bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200'>
            <div className='px-4 py-5 sm:p-6'>
              <div className='flex items-center'>
                <div className='flex-shrink-0'>
                  <div className='w-8 h-8 bg-green-500 rounded-md flex items-center justify-center'>
                    <svg
                      className='w-5 h-5 text-white'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 8l2 2 4-4'
                      />
                    </svg>
                  </div>
                </div>
                <div className='ml-5 w-0 flex-1'>
                  <dl>
                    <dt className='text-sm font-medium text-gray-500 truncate'>
                      Create Assessment
                    </dt>
                    <dd className='text-lg font-medium text-gray-900'>
                      New Assessment
                    </dd>
                  </dl>
                </div>
              </div>
              <div className='mt-5'>
                <p className='text-sm text-gray-600 mb-4'>
                  Create new posture assessments for your patients with
                  customizable questions.
                </p>
                <Button variant='primary' size='sm' className='w-full'>
                  New Assessment
                </Button>
              </div>
            </div>
          </div>
        </RoleGuard>

        <RoleGuard requiredPermission='canViewAllAssessments'>
          <div className='bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200'>
            <div className='px-4 py-5 sm:p-6'>
              <div className='flex items-center'>
                <div className='flex-shrink-0'>
                  <div className='w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center'>
                    <svg
                      className='w-5 h-5 text-white'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01'
                      />
                    </svg>
                  </div>
                </div>
                <div className='ml-5 w-0 flex-1'>
                  <dl>
                    <dt className='text-sm font-medium text-gray-500 truncate'>
                      All Assessments
                    </dt>
                    <dd className='text-lg font-medium text-gray-900'>
                      View & Manage
                    </dd>
                  </dl>
                </div>
              </div>
              <div className='mt-5'>
                <p className='text-sm text-gray-600 mb-4'>
                  View and manage all patient assessments in your practice.
                </p>
                <Button variant='primary' size='sm' className='w-full'>
                  View All
                </Button>
              </div>
            </div>
          </div>
        </RoleGuard>

        {/* Parent-only features */}
        <RoleGuard requiredRole='parent'>
          <div className='bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200'>
            <div className='px-4 py-5 sm:p-6'>
              <div className='flex items-center'>
                <div className='flex-shrink-0'>
                  <div className='w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center'>
                    <svg
                      className='w-5 h-5 text-white'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
                      />
                    </svg>
                  </div>
                </div>
                <div className='ml-5 w-0 flex-1'>
                  <dl>
                    <dt className='text-sm font-medium text-gray-500 truncate'>
                      My Children
                    </dt>
                    <dd className='text-lg font-medium text-gray-900'>
                      Manage Children
                    </dd>
                  </dl>
                </div>
              </div>
              <div className='mt-5'>
                <p className='text-sm text-gray-600 mb-4'>
                  View and manage your children's posture assessments and
                  progress.
                </p>
                <Button
                  variant='primary'
                  size='sm'
                  onClick={() => (window.location.href = '/dashboard/children')}
                  className='w-full'
                >
                  View Children
                </Button>
              </div>
            </div>
          </div>
        </RoleGuard>

        {/* Shared features */}
        <RoleGuard requiredPermission='canViewReports'>
          <div className='bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200'>
            <div className='px-4 py-5 sm:p-6'>
              <div className='flex items-center'>
                <div className='flex-shrink-0'>
                  <div className='w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center'>
                    <svg
                      className='w-5 h-5 text-white'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
                      />
                    </svg>
                  </div>
                </div>
                <div className='ml-5 w-0 flex-1'>
                  <dl>
                    <dt className='text-sm font-medium text-gray-500 truncate'>
                      Reports & Analytics
                    </dt>
                    <dd className='text-lg font-medium text-gray-900'>
                      View Progress
                    </dd>
                  </dl>
                </div>
              </div>
              <div className='mt-5'>
                <p className='text-sm text-gray-600 mb-4'>
                  View detailed reports and progress tracking for assessments.
                </p>
                <Button variant='primary' size='sm' className='w-full'>
                  View Reports
                </Button>
              </div>
            </div>
          </div>
        </RoleGuard>

        {/* Profile management - available to all */}
        <div className='bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200'>
          <div className='px-4 py-5 sm:p-6'>
            <div className='flex items-center'>
              <div className='flex-shrink-0'>
                <div className='w-8 h-8 bg-gray-500 rounded-md flex items-center justify-center'>
                  <svg
                    className='w-5 h-5 text-white'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z'
                    />
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
                    />
                  </svg>
                </div>
              </div>
              <div className='ml-5 w-0 flex-1'>
                <dl>
                  <dt className='text-sm font-medium text-gray-500 truncate'>
                    Profile Settings
                  </dt>
                  <dd className='text-lg font-medium text-gray-900'>
                    Account Settings
                  </dd>
                </dl>
              </div>
            </div>
            <div className='mt-5'>
              <p className='text-sm text-gray-600 mb-4'>
                Manage your account settings and personal preferences.
              </p>
              <Button variant='secondary' size='sm' className='w-full'>
                Edit Profile
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Permissions Debug Panel - Only show in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className='bg-gray-50 overflow-hidden shadow rounded-lg'>
          <div className='px-4 py-5 sm:p-6'>
            <h3 className='text-lg font-medium text-gray-900 mb-4'>
              Development: Permissions Debug
            </h3>
            <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3'>
              <div
                className={`p-3 rounded-md text-xs font-medium ${
                  permissions.canCreateAssessments
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                <div className='font-semibold mb-1'>Create Assessments</div>
                <div>{permissions.canCreateAssessments ? '✓ Yes' : '✗ No'}</div>
              </div>
              <div
                className={`p-3 rounded-md text-xs font-medium ${
                  permissions.canViewAllAssessments
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                <div className='font-semibold mb-1'>View All Assessments</div>
                <div>
                  {permissions.canViewAllAssessments ? '✓ Yes' : '✗ No'}
                </div>
              </div>
              <div
                className={`p-3 rounded-md text-xs font-medium ${
                  permissions.canManagePractice
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                <div className='font-semibold mb-1'>Manage Practice</div>
                <div>{permissions.canManagePractice ? '✓ Yes' : '✗ No'}</div>
              </div>
              <div
                className={`p-3 rounded-md text-xs font-medium ${
                  permissions.canViewReports
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                <div className='font-semibold mb-1'>View Reports</div>
                <div>{permissions.canViewReports ? '✓ Yes' : '✗ No'}</div>
              </div>
              <div
                className={`p-3 rounded-md text-xs font-medium ${
                  permissions.canManageChildren
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                <div className='font-semibold mb-1'>Manage Children</div>
                <div>{permissions.canManageChildren ? '✓ Yes' : '✗ No'}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
