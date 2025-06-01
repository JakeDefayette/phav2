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
} from './widgets';

interface DashboardGridProps {
  /** Optional CSS class for styling */
  className?: string;
  /** Layout variant for different dashboard views */
  layout?: 'default' | 'compact' | 'detailed';
}

/**
 * A responsive grid layout for dashboard widgets.
 * Automatically arranges widgets based on screen size and layout preference.
 *
 * @example
 * ```tsx
 * <DashboardGrid layout="detailed" />
 * ```
 */
export const DashboardGrid: React.FC<DashboardGridProps> = ({
  className = '',
  layout = 'default',
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
    </div>
  );

  const renderDetailedLayout = () => (
    <div className={`space-y-6 ${className}`}>
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
