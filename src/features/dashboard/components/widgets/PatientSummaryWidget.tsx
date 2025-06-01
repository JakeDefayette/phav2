/**
 * PatientSummaryWidget
 *
 * Dashboard-specific widget for displaying patient summary information.
 * This component is specific to the dashboard feature and should not be used elsewhere.
 */

import React from 'react';
import { Card } from '@/shared/components';
import { useDashboardData } from '../../hooks/useDashboardData';

interface PatientSummaryWidgetProps {
  /** Optional CSS class for styling */
  className?: string;
  /** Whether to show detailed view */
  detailed?: boolean;
}

interface PatientSummary {
  totalPatients: number;
  newPatientsThisWeek: number;
  activePatients: number;
  upcomingAppointments: number;
}

/**
 * A dashboard widget that displays patient summary statistics.
 * Uses shared Card component for layout and custom dashboard hook for data.
 *
 * @example
 * ```tsx
 * <PatientSummaryWidget detailed={true} />
 * ```
 */
export const PatientSummaryWidget: React.FC<PatientSummaryWidgetProps> = ({
  className = '',
  detailed = false,
}) => {
  // Use dashboard-specific hook (would be implemented in hooks directory)
  const { patientSummary, isLoading, error } = useDashboardData();

  if (isLoading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className='animate-pulse'>
          <div className='h-4 bg-gray-200 rounded w-1/4 mb-4'></div>
          <div className='space-y-3'>
            <div className='h-3 bg-gray-200 rounded'></div>
            <div className='h-3 bg-gray-200 rounded w-5/6'></div>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`p-6 border-red-200 ${className}`}>
        <h3 className='text-lg font-medium text-red-800 mb-2'>
          Unable to Load Patient Summary
        </h3>
        <p className='text-red-600'>{error.message}</p>
      </Card>
    );
  }

  const summary: PatientSummary = patientSummary || {
    totalPatients: 0,
    newPatientsThisWeek: 0,
    activePatients: 0,
    upcomingAppointments: 0,
  };

  return (
    <Card className={`p-6 ${className}`}>
      <h3 className='text-lg font-medium text-gray-900 mb-4'>
        Patient Summary
      </h3>

      <div className='grid grid-cols-2 gap-4'>
        <div className='text-center'>
          <div className='text-2xl font-bold text-blue-600'>
            {summary.totalPatients}
          </div>
          <div className='text-sm text-gray-500'>Total Patients</div>
        </div>

        <div className='text-center'>
          <div className='text-2xl font-bold text-green-600'>
            {summary.activePatients}
          </div>
          <div className='text-sm text-gray-500'>Active Patients</div>
        </div>

        {detailed && (
          <>
            <div className='text-center'>
              <div className='text-2xl font-bold text-purple-600'>
                {summary.newPatientsThisWeek}
              </div>
              <div className='text-sm text-gray-500'>New This Week</div>
            </div>

            <div className='text-center'>
              <div className='text-2xl font-bold text-orange-600'>
                {summary.upcomingAppointments}
              </div>
              <div className='text-sm text-gray-500'>Upcoming</div>
            </div>
          </>
        )}
      </div>

      {detailed && (
        <div className='mt-4 pt-4 border-t border-gray-200'>
          <div className='flex justify-between items-center'>
            <span className='text-sm text-gray-500'>Last updated:</span>
            <span className='text-sm text-gray-700'>
              {new Date().toLocaleDateString()}
            </span>
          </div>
        </div>
      )}
    </Card>
  );
};

export default PatientSummaryWidget;
