/**
 * DashboardGrid
 *
 * Dashboard-specific grid layout component for arranging widgets.
 * This component is specific to the dashboard feature and should not be used elsewhere.
 */

import React from 'react';
import {
  PatientSummaryWidget,
  AppointmentWidget,
  QuickActionsWidget,
  RecentActivityWidget,
  ErrorMonitoringWidget,
  AlertManagementWidget,
} from './widgets';

interface DashboardGridProps {
  /** Optional CSS class for styling */
  className?: string;
  /** Layout variant for different dashboard views */
  layout?: 'default' | 'compact' | 'detailed';
  /** Whether to show monitoring widgets (for admin/practitioner users) */
  showMonitoring?: boolean;
}

/**
 * A responsive grid layout for dashboard widgets.
 * Automatically arranges widgets based on screen size and layout preference.
 *
 * @example
 * ```tsx
 * <DashboardGrid layout="detailed" showMonitoring={true} />
 * ```
 */
export const DashboardGrid: React.FC<DashboardGridProps> = ({
  className = '',
  layout = 'default',
  showMonitoring = false,
}) => {
  const getGridClasses = () => {
    switch (layout) {
      case 'compact':
        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4';
      case 'detailed':
        return 'grid grid-cols-1 lg:grid-cols-3 gap-6';
      case 'default':
      default:
        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';
    }
  };

  const renderCompactLayout = () => (
    <div className={`${getGridClasses()} ${className}`}>
      <PatientSummaryWidget className='col-span-1' />
      <AppointmentWidget className='col-span-1' />
      <QuickActionsWidget compact={true} className='col-span-1' />
      <RecentActivityWidget maxItems={3} className='col-span-1' />

      {/* Compact monitoring widgets */}
      {showMonitoring && (
        <>
          <ErrorMonitoringWidget
            className='col-span-1'
            compactMode={true}
            autoRefresh={true}
            refreshInterval={60}
          />
          <AlertManagementWidget className='col-span-1' compactMode={true} />
        </>
      )}
    </div>
  );

  const renderDetailedLayout = () => (
    <div className={`space-y-6 ${className}`}>
      {/* System Monitoring Section - Only show if enabled */}
      {showMonitoring && (
        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <h3 className='text-lg font-semibold text-gray-900'>
              System Monitoring
            </h3>
            <span className='text-sm text-gray-600'>
              Real-time error tracking and alerts
            </span>
          </div>
          <div className='grid grid-cols-1 xl:grid-cols-2 gap-6'>
            <ErrorMonitoringWidget
              className='col-span-1'
              autoRefresh={true}
              refreshInterval={30}
              showDetailedMetrics={true}
              compactMode={false}
            />
            <AlertManagementWidget className='col-span-1' compactMode={false} />
          </div>
        </div>
      )}

      {/* Top row - Key metrics */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <PatientSummaryWidget detailed={true} />
        <AppointmentWidget showActions={true} />
      </div>

      {/* Bottom row - Actions and activity */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        <QuickActionsWidget className='lg:col-span-1' />
        <RecentActivityWidget maxItems={8} className='lg:col-span-2' />
      </div>
    </div>
  );

  const renderDefaultLayout = () => (
    <div className={`space-y-6 ${className}`}>
      {/* Monitoring Section - Compact view for default layout */}
      {showMonitoring && (
        <div className='space-y-4'>
          <h3 className='text-lg font-semibold text-gray-900'>System Health</h3>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <ErrorMonitoringWidget
              compactMode={true}
              autoRefresh={true}
              refreshInterval={60}
            />
            <AlertManagementWidget compactMode={true} />
          </div>
        </div>
      )}

      {/* Top row - Summary widgets */}
      <div className={getGridClasses()}>
        <PatientSummaryWidget className='col-span-1' />
        <AppointmentWidget className='col-span-1' showActions={true} />
        <QuickActionsWidget className='col-span-1 md:col-span-2 lg:col-span-1' />
      </div>

      {/* Bottom row - Activity feed */}
      <div className='grid grid-cols-1'>
        <RecentActivityWidget maxItems={6} />
      </div>
    </div>
  );

  switch (layout) {
    case 'compact':
      return renderCompactLayout();
    case 'detailed':
      return renderDetailedLayout();
    case 'default':
    default:
      return renderDefaultLayout();
  }
};

export default DashboardGrid;
