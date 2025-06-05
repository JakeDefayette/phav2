'use client';

import React from 'react';
import { useAuth, useRole } from '@/shared/hooks';
import { Button } from '@/shared/components/atoms/Button';
import { RoleGuard } from '@/shared/components/atoms/RoleGuard';
import { DashboardLayout } from '@/features/dashboard/components';
import {
  ErrorMonitoringWidget,
  AlertManagementWidget,
} from '@/features/dashboard/components/widgets';
import { AlertTriangle, Shield, Activity, Settings } from 'lucide-react';

export default function MonitoringDashboardPage() {
  const { user, loading } = useAuth();
  const { roleInfo, permissions } = useRole();

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto'></div>
          <p className='mt-4 text-gray-600'>Loading monitoring dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold text-gray-900 mb-4'>
            Access Denied
          </h1>
          <p className='text-gray-600 mb-4'>
            Please log in to access the monitoring dashboard.
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
    <DashboardLayout>
      <RoleGuard
        requiredRole='practitioner'
        fallback={
          <div className='min-h-screen flex items-center justify-center bg-gray-50'>
            <div className='text-center'>
              <Shield className='w-16 h-16 text-gray-400 mx-auto mb-4' />
              <h1 className='text-2xl font-bold text-gray-900 mb-4'>
                Access Restricted
              </h1>
              <p className='text-gray-600 mb-4'>
                System monitoring is only available to practitioners and
                administrators.
              </p>
              <Button
                variant='secondary'
                onClick={() => (window.location.href = '/dashboard')}
              >
                Return to Dashboard
              </Button>
            </div>
          </div>
        }
      >
        <div className='space-y-6'>
          {/* Header Section */}
          <div className='bg-white overflow-hidden shadow rounded-lg'>
            <div className='px-4 py-5 sm:p-6'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center space-x-3'>
                  <div className='flex-shrink-0'>
                    <Activity className='w-8 h-8 text-blue-600' />
                  </div>
                  <div>
                    <h1 className='text-2xl font-bold text-gray-900'>
                      System Monitoring Dashboard
                    </h1>
                    <p className='text-sm text-gray-600'>
                      Real-time error tracking, alerting, and system health
                      monitoring
                    </p>
                  </div>
                </div>
                <div className='flex items-center space-x-2'>
                  {roleInfo && (
                    <div className='inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800'>
                      {roleInfo.displayName}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Monitoring Widgets - Full Size */}
          <div className='space-y-6'>
            {/* Error Monitoring Widget */}
            <ErrorMonitoringWidget
              className='w-full'
              autoRefresh={true}
              refreshInterval={15} // More frequent updates on dedicated page
              showDetailedMetrics={true}
              compactMode={false}
            />

            {/* Alert Management Widget */}
            <AlertManagementWidget />
          </div>

          {/* Advanced Monitoring Tools Section */}
          <div className='bg-white overflow-hidden shadow rounded-lg'>
            <div className='px-4 py-5 sm:p-6'>
              <h3 className='text-lg font-medium text-gray-900 mb-4'>
                Advanced Monitoring Tools
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                {/* System Logs */}
                <div className='border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors'>
                  <div className='flex items-center space-x-3 mb-2'>
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
                          d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className='text-sm font-medium text-gray-900'>
                        System Logs
                      </h4>
                      <p className='text-xs text-gray-600'>
                        View detailed application logs
                      </p>
                    </div>
                  </div>
                  <Button
                    variant='outline'
                    size='sm'
                    className='w-full'
                    disabled
                  >
                    Coming Soon
                  </Button>
                </div>

                {/* Performance Metrics */}
                <div className='border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors'>
                  <div className='flex items-center space-x-3 mb-2'>
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
                          d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className='text-sm font-medium text-gray-900'>
                        Performance Metrics
                      </h4>
                      <p className='text-xs text-gray-600'>
                        Monitor app performance
                      </p>
                    </div>
                  </div>
                  <Button
                    variant='outline'
                    size='sm'
                    className='w-full'
                    disabled
                  >
                    Coming Soon
                  </Button>
                </div>

                {/* Security Monitoring */}
                <div className='border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors'>
                  <div className='flex items-center space-x-3 mb-2'>
                    <div className='w-8 h-8 bg-red-500 rounded-md flex items-center justify-center'>
                      <Shield className='w-5 h-5 text-white' />
                    </div>
                    <div>
                      <h4 className='text-sm font-medium text-gray-900'>
                        Security Monitoring
                      </h4>
                      <p className='text-xs text-gray-600'>
                        Track security events
                      </p>
                    </div>
                  </div>
                  <Button
                    variant='outline'
                    size='sm'
                    className='w-full'
                    disabled
                  >
                    Coming Soon
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className='bg-white overflow-hidden shadow rounded-lg'>
            <div className='px-4 py-5 sm:p-6'>
              <h3 className='text-lg font-medium text-gray-900 mb-4'>
                Quick Actions
              </h3>
              <div className='flex flex-wrap gap-3'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => window.location.reload()}
                  className='flex items-center space-x-2'
                >
                  <Activity className='w-4 h-4' />
                  <span>Refresh Dashboard</span>
                </Button>

                <Button
                  variant='outline'
                  size='sm'
                  disabled
                  className='flex items-center space-x-2'
                >
                  <Settings className='w-4 h-4' />
                  <span>Configure Alerts</span>
                </Button>

                <Button
                  variant='outline'
                  size='sm'
                  disabled
                  className='flex items-center space-x-2'
                >
                  <AlertTriangle className='w-4 h-4' />
                  <span>Export Logs</span>
                </Button>

                <Button
                  variant='secondary'
                  size='sm'
                  onClick={() => (window.location.href = '/dashboard')}
                  className='flex items-center space-x-2'
                >
                  <svg
                    className='w-4 h-4'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M10 19l-7-7m0 0l7-7m-7 7h18'
                    />
                  </svg>
                  <span>Back to Main Dashboard</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </RoleGuard>
    </DashboardLayout>
  );
}
