/**
 * AppointmentWidget
 *
 * Dashboard-specific widget for displaying appointment summary information.
 * This component is specific to the dashboard feature and should not be used elsewhere.
 */

import React from 'react';
import { Card, Button } from '@/shared/components';
import { useDashboardData } from '../../hooks/useDashboardData';

interface AppointmentWidgetProps {
  /** Optional CSS class for styling */
  className?: string;
  /** Whether to show quick actions */
  showActions?: boolean;
}

/**
 * A dashboard widget that displays appointment summary statistics and quick actions.
 * Uses shared Card component for layout and custom dashboard hook for data.
 *
 * @example
 * ```tsx
 * <AppointmentWidget showActions={true} />
 * ```
 */
export const AppointmentWidget: React.FC<AppointmentWidgetProps> = ({
  className = '',
  showActions = false,
}) => {
  const { appointmentSummary, isLoading, error, refreshData } =
    useDashboardData();

  if (isLoading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className='animate-pulse'>
          <div className='h-4 bg-gray-200 rounded w-1/3 mb-4'></div>
          <div className='space-y-3'>
            <div className='h-3 bg-gray-200 rounded'></div>
            <div className='h-3 bg-gray-200 rounded w-4/5'></div>
            <div className='h-3 bg-gray-200 rounded w-3/5'></div>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`p-6 border-red-200 ${className}`}>
        <h3 className='text-lg font-medium text-red-800 mb-2'>
          Unable to Load Appointments
        </h3>
        <p className='text-red-600 mb-4'>{error.message}</p>
        <Button
          variant='outline'
          size='sm'
          onClick={refreshData}
          className='text-red-600 border-red-300 hover:bg-red-50'
        >
          Retry
        </Button>
      </Card>
    );
  }

  const summary = appointmentSummary || {
    todayAppointments: 0,
    weekAppointments: 0,
    monthAppointments: 0,
    cancelledToday: 0,
  };

  return (
    <Card className={`p-6 ${className}`}>
      <div className='flex justify-between items-center mb-4'>
        <h3 className='text-lg font-medium text-gray-900'>Appointments</h3>
        {showActions && (
          <Button
            variant='outline'
            size='sm'
            onClick={() => {
              /* Navigate to appointments */
            }}
          >
            View All
          </Button>
        )}
      </div>

      <div className='space-y-4'>
        {/* Today's appointments */}
        <div className='flex justify-between items-center p-3 bg-blue-50 rounded-lg'>
          <div>
            <div className='text-sm font-medium text-blue-900'>Today</div>
            <div className='text-xs text-blue-700'>
              {summary.cancelledToday > 0 &&
                `${summary.cancelledToday} cancelled`}
            </div>
          </div>
          <div className='text-2xl font-bold text-blue-600'>
            {summary.todayAppointments}
          </div>
        </div>

        {/* This week */}
        <div className='flex justify-between items-center p-3 bg-green-50 rounded-lg'>
          <div>
            <div className='text-sm font-medium text-green-900'>This Week</div>
            <div className='text-xs text-green-700'>Including today</div>
          </div>
          <div className='text-2xl font-bold text-green-600'>
            {summary.weekAppointments}
          </div>
        </div>

        {/* This month */}
        <div className='flex justify-between items-center p-3 bg-purple-50 rounded-lg'>
          <div>
            <div className='text-sm font-medium text-purple-900'>
              This Month
            </div>
            <div className='text-xs text-purple-700'>Total scheduled</div>
          </div>
          <div className='text-2xl font-bold text-purple-600'>
            {summary.monthAppointments}
          </div>
        </div>
      </div>

      {showActions && (
        <div className='mt-4 pt-4 border-t border-gray-200'>
          <div className='flex space-x-2'>
            <Button
              variant='primary'
              size='sm'
              className='flex-1'
              onClick={() => {
                /* Navigate to new appointment */
              }}
            >
              New Appointment
            </Button>
            <Button
              variant='outline'
              size='sm'
              className='flex-1'
              onClick={() => {
                /* Navigate to calendar */
              }}
            >
              View Calendar
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};

export default AppointmentWidget;
