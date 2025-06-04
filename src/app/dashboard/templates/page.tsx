'use client';

import React from 'react';
import { DashboardLayout } from '@/features/dashboard/components/DashboardLayout';
import { RoleGuard } from '@/shared/components/atoms/RoleGuard';
import { Card } from '@/shared/components/molecules/Card';

export default function TemplatesPage() {
  return (
    <DashboardLayout>
      <RoleGuard requiredPermission='canManagePractice'>
        <div className='container mx-auto px-6 py-8'>
          <div className='mb-8'>
            <h1 className='text-3xl font-bold text-gray-900'>Templates</h1>
            <p className='text-gray-600 mt-2'>
              Manage your email templates and communication templates
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            <Card className='p-6'>
              <div className='flex items-center mb-4'>
                <div className='w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center'>
                  <svg
                    className='w-6 h-6 text-blue-600'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
                    />
                  </svg>
                </div>
                <h3 className='text-lg font-semibold text-gray-900 ml-3'>
                  Email Templates
                </h3>
              </div>
              <p className='text-gray-600 mb-4'>
                Create and manage email templates for patient communications
              </p>
              <button
                onClick={() =>
                  (window.location.href = '/dashboard/templates/email')
                }
                className='w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors'
              >
                Manage Email Templates
              </button>
            </Card>

            <Card className='p-6'>
              <div className='flex items-center mb-4'>
                <div className='w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center'>
                  <svg
                    className='w-6 h-6 text-green-600'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                    />
                  </svg>
                </div>
                <h3 className='text-lg font-semibold text-gray-900 ml-3'>
                  Report Templates
                </h3>
              </div>
              <p className='text-gray-600 mb-4'>
                Customize report templates and formats for assessment results
              </p>
              <button className='w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors'>
                Manage Report Templates
              </button>
            </Card>

            <Card className='p-6'>
              <div className='flex items-center mb-4'>
                <div className='w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center'>
                  <svg
                    className='w-6 h-6 text-purple-600'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
                    />
                  </svg>
                </div>
                <h3 className='text-lg font-semibold text-gray-900 ml-3'>
                  SMS Templates
                </h3>
              </div>
              <p className='text-gray-600 mb-4'>
                Create text message templates for appointment reminders and
                follow-ups
              </p>
              <button className='w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors'>
                Manage SMS Templates
              </button>
            </Card>
          </div>

          <div className='mt-8'>
            <Card className='p-6'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                Recent Templates
              </h3>
              <div className='space-y-3'>
                <div className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
                  <div>
                    <h4 className='font-medium text-gray-900'>Welcome Email</h4>
                    <p className='text-sm text-gray-600'>
                      Last modified: 2 days ago
                    </p>
                  </div>
                  <button className='text-blue-600 hover:text-blue-800 font-medium'>
                    Edit
                  </button>
                </div>
                <div className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
                  <div>
                    <h4 className='font-medium text-gray-900'>
                      Assessment Complete Report
                    </h4>
                    <p className='text-sm text-gray-600'>
                      Last modified: 1 week ago
                    </p>
                  </div>
                  <button className='text-blue-600 hover:text-blue-800 font-medium'>
                    Edit
                  </button>
                </div>
                <div className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
                  <div>
                    <h4 className='font-medium text-gray-900'>
                      Appointment Reminder
                    </h4>
                    <p className='text-sm text-gray-600'>
                      Last modified: 3 days ago
                    </p>
                  </div>
                  <button className='text-blue-600 hover:text-blue-800 font-medium'>
                    Edit
                  </button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </RoleGuard>
    </DashboardLayout>
  );
}
