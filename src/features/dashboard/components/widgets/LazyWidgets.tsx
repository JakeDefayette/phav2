'use client';

import React, { Suspense } from 'react';
import { Skeleton } from '@/shared/components/atoms/Skeleton';

// Lazy-loaded widget components
const AlertManagementWidget = React.lazy(
  () => import('./AlertManagementWidget')
);
const EmailDeliverabilityWidget = React.lazy(
  () => import('./EmailDeliverabilityWidget')
);
const ErrorMonitoringWidget = React.lazy(
  () => import('./ErrorMonitoringWidget')
);
const PatientSummaryWidget = React.lazy(() => import('./PatientSummaryWidget'));
const QuickActionsWidget = React.lazy(() => import('./QuickActionsWidget'));
const RecentActivityWidget = React.lazy(() => import('./RecentActivityWidget'));
const ScheduledEmailsWidget = React.lazy(
  () => import('./ScheduledEmailsWidget')
);
const AppointmentWidget = React.lazy(() => import('./AppointmentWidget'));

// Widget loading skeleton
const WidgetSkeleton: React.FC = () => (
  <div className='p-6 border rounded-lg bg-white space-y-4'>
    <div className='flex items-center justify-between'>
      <Skeleton className='h-5 w-32' />
      <Skeleton className='h-4 w-4 rounded' />
    </div>
    <div className='space-y-2'>
      <Skeleton className='h-4 w-full' />
      <Skeleton className='h-4 w-3/4' />
      <Skeleton className='h-4 w-1/2' />
    </div>
    <div className='flex justify-end'>
      <Skeleton className='h-8 w-20' />
    </div>
  </div>
);

// Lazy wrapper for widgets
interface LazyWidgetWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const LazyWidgetWrapper: React.FC<LazyWidgetWrapperProps> = ({
  children,
  fallback,
}) => <Suspense fallback={fallback || <WidgetSkeleton />}>{children}</Suspense>;

// Exported lazy widget components
export const LazyAlertManagementWidget: React.FC<
  React.ComponentProps<typeof AlertManagementWidget>
> = props => (
  <LazyWidgetWrapper>
    <AlertManagementWidget {...props} />
  </LazyWidgetWrapper>
);

export const LazyEmailDeliverabilityWidget: React.FC<
  React.ComponentProps<typeof EmailDeliverabilityWidget>
> = props => (
  <LazyWidgetWrapper>
    <EmailDeliverabilityWidget {...props} />
  </LazyWidgetWrapper>
);

export const LazyErrorMonitoringWidget: React.FC<
  React.ComponentProps<typeof ErrorMonitoringWidget>
> = props => (
  <LazyWidgetWrapper>
    <ErrorMonitoringWidget {...props} />
  </LazyWidgetWrapper>
);

export const LazyPatientSummaryWidget: React.FC<
  React.ComponentProps<typeof PatientSummaryWidget>
> = props => (
  <LazyWidgetWrapper>
    <PatientSummaryWidget {...props} />
  </LazyWidgetWrapper>
);

export const LazyQuickActionsWidget: React.FC<
  React.ComponentProps<typeof QuickActionsWidget>
> = props => (
  <LazyWidgetWrapper>
    <QuickActionsWidget {...props} />
  </LazyWidgetWrapper>
);

export const LazyRecentActivityWidget: React.FC<
  React.ComponentProps<typeof RecentActivityWidget>
> = props => (
  <LazyWidgetWrapper>
    <RecentActivityWidget {...props} />
  </LazyWidgetWrapper>
);

export const LazyScheduledEmailsWidget: React.FC<
  React.ComponentProps<typeof ScheduledEmailsWidget>
> = props => (
  <LazyWidgetWrapper>
    <ScheduledEmailsWidget {...props} />
  </LazyWidgetWrapper>
);

export const LazyAppointmentWidget: React.FC<
  React.ComponentProps<typeof AppointmentWidget>
> = props => (
  <LazyWidgetWrapper>
    <AppointmentWidget {...props} />
  </LazyWidgetWrapper>
);

// Export all lazy widgets as a single object
export const LazyWidgets = {
  AlertManagement: LazyAlertManagementWidget,
  EmailDeliverability: LazyEmailDeliverabilityWidget,
  ErrorMonitoring: LazyErrorMonitoringWidget,
  PatientSummary: LazyPatientSummaryWidget,
  QuickActions: LazyQuickActionsWidget,
  RecentActivity: LazyRecentActivityWidget,
  ScheduledEmails: LazyScheduledEmailsWidget,
  Appointment: LazyAppointmentWidget,
};

// Hook for dynamically loading widgets based on user permissions or preferences
export function useWidgetLoader() {
  const loadWidget = React.useCallback(async (widgetType: string) => {
    switch (widgetType) {
      case 'alerts':
        return (await import('./AlertManagementWidget')).default;
      case 'email':
        return (await import('./EmailDeliverabilityWidget')).default;
      case 'errors':
        return (await import('./ErrorMonitoringWidget')).default;
      case 'patients':
        return (await import('./PatientSummaryWidget')).default;
      case 'actions':
        return (await import('./QuickActionsWidget')).default;
      case 'activity':
        return (await import('./RecentActivityWidget')).default;
      case 'emails':
        return (await import('./ScheduledEmailsWidget')).default;
      case 'appointments':
        return (await import('./AppointmentWidget')).default;
      default:
        throw new Error(`Unknown widget type: ${widgetType}`);
    }
  }, []);

  return { loadWidget };
}

export default LazyWidgets;
