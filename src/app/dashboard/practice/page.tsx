'use client';

import React from 'react';
import { useRole } from '@/shared/hooks';
import { Button } from '@/shared/components/atoms/Button';
import { RoleGuard } from '@/shared/components/atoms/RoleGuard';
import { BrandingProvider } from '@/shared/components/BrandingProvider';
import { BrandingSettingsPanel } from '@/features/dashboard/components/BrandingSettingsPanel';

export default function PracticePage() {
  const { roleInfo, permissions } = useRole();

  return (
    <BrandingProvider>
      <RoleGuard
        requiredRole='practitioner'
        fallback={
          <div className='min-h-screen flex items-center justify-center'>
            <div className='text-center'>
              <h1 className='text-2xl font-bold text-gray-900 mb-4'>
                Access Denied
              </h1>
              <p className='text-gray-600 mb-4'>
                This page is only accessible to practitioners.
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
                    Practice Management
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
              <div className='bg-white shadow rounded-lg p-6 mb-6'>
                <h2 className='text-2xl font-bold text-gray-900 mb-6'>
                  Practice Management Dashboard
                </h2>

                <div className='mb-6'>
                  <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
                    <h3 className='text-lg font-semibold text-blue-900 mb-2'>
                      Welcome, {roleInfo?.displayName}!
                    </h3>
                    <p className='text-blue-700'>
                      This page is only accessible to users with the
                      practitioner role. You have successfully accessed a
                      role-protected route.
                    </p>
                  </div>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                  <div className='bg-gray-50 p-6 rounded-lg'>
                    <h3 className='text-lg font-semibold text-gray-900 mb-3'>
                      Patient Management
                    </h3>
                    <p className='text-gray-600 mb-4'>
                      View and manage all patients in your practice.
                    </p>
                    <Button variant='primary' size='sm'>
                      Manage Patients
                    </Button>
                  </div>

                  <div className='bg-gray-50 p-6 rounded-lg'>
                    <h3 className='text-lg font-semibold text-gray-900 mb-3'>
                      Assessment Templates
                    </h3>
                    <p className='text-gray-600 mb-4'>
                      Create and manage assessment templates.
                    </p>
                    <Button variant='primary' size='sm'>
                      Manage Templates
                    </Button>
                  </div>

                  <div className='bg-gray-50 p-6 rounded-lg'>
                    <h3 className='text-lg font-semibold text-gray-900 mb-3'>
                      Staff Management
                    </h3>
                    <p className='text-gray-600 mb-4'>
                      Manage staff members and their permissions.
                    </p>
                    <Button variant='primary' size='sm'>
                      Manage Staff
                    </Button>
                  </div>

                  <div className='bg-gray-50 p-6 rounded-lg'>
                    <h3 className='text-lg font-semibold text-gray-900 mb-3'>
                      Analytics & Reports
                    </h3>
                    <p className='text-gray-600 mb-4'>
                      View detailed practice analytics and generate reports.
                    </p>
                    <Button variant='primary' size='sm'>
                      View Analytics
                    </Button>
                  </div>

                  <div className='bg-gray-50 p-6 rounded-lg'>
                    <h3 className='text-lg font-semibold text-gray-900 mb-3'>
                      Billing & Payments
                    </h3>
                    <p className='text-gray-600 mb-4'>
                      Manage billing, payments, and financial reports.
                    </p>
                    <Button variant='primary' size='sm'>
                      Billing
                    </Button>
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
                      Can Manage Practice:{' '}
                      {permissions.canManagePractice ? 'Yes' : 'No'}
                    </p>
                    <p>
                      Can View All Assessments:{' '}
                      {permissions.canViewAllAssessments ? 'Yes' : 'No'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Practice Branding Settings */}
              <BrandingSettingsPanel />
            </div>
          </main>
        </div>
      </RoleGuard>
    </BrandingProvider>
  );
}
