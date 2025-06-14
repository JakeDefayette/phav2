/**
 * Dashboard Widgets Index
 *
 * Centralized exports for all dashboard widgets.
 * These components are specific to the dashboard feature.
 */

export { PatientSummaryWidget } from './PatientSummaryWidget';
export { AppointmentWidget } from './AppointmentWidget';
export { QuickActionsWidget } from './QuickActionsWidget';
export { RecentActivityWidget } from './RecentActivityWidget';
export { default as ErrorMonitoringWidget } from './ErrorMonitoringWidget';
export { default as AlertManagementWidget } from './AlertManagementWidget';

// Type exports for widget props
export type { default as PatientSummaryWidgetProps } from './PatientSummaryWidget';
export type { default as AppointmentWidgetProps } from './AppointmentWidget';
export type { default as QuickActionsWidgetProps } from './QuickActionsWidget';
export type { default as RecentActivityWidgetProps } from './RecentActivityWidget';
