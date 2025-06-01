/**
 * Dashboard Feature Components
 *
 * Components specific to the dashboard feature.
 * These components are NOT shared across other features.
 */

// ==========================================
// LAYOUT COMPONENTS - Dashboard-specific layouts
// ==========================================
export { DashboardLayout } from './DashboardLayout';
export { DashboardContent } from './DashboardContent';
export { DashboardGrid } from './DashboardGrid';

// ==========================================
// DASHBOARD WIDGETS - Feature-specific display components
// ==========================================
export { PatientSummaryWidget } from './widgets/PatientSummaryWidget';
export { AppointmentWidget } from './widgets/AppointmentWidget';
export { QuickActionsWidget } from './widgets/QuickActionsWidget';
export { RecentActivityWidget } from './widgets/RecentActivityWidget';
// Example: export { RevenueWidget } from './widgets/RevenueWidget';

// ==========================================
// DATA VISUALIZATION - Dashboard-specific charts and graphs
// ==========================================
// Example: export { PatientTrendChart } from './charts/PatientTrendChart';
// Example: export { AppointmentCalendar } from './charts/AppointmentCalendar';

// ==========================================
// ADMIN COMPONENTS - Administrative dashboard components
// ==========================================
export { PerformanceDashboard } from './admin/PerformanceDashboard';

// ==========================================
// FORMS & MODALS - Dashboard-specific forms
// ==========================================
export { BrandingSettingsPanel } from './BrandingSettingsPanel';
// Example: export { QuickAppointmentForm } from './forms/QuickAppointmentForm';
// Example: export { PatientNoteModal } from './modals/PatientNoteModal';

// ==========================================
// NAVIGATION & MENUS - Dashboard-specific navigation
// ==========================================
export { DashboardSidebar } from './navigation/DashboardSidebar';
// Example: export { QuickActions } from './navigation/QuickActions';
