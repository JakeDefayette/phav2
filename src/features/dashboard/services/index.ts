/**
 * Dashboard Feature Services
 *
 * Service layer for dashboard-specific data operations and business logic.
 * These services handle dashboard-related API calls and data processing.
 */

// ==========================================
// CORE DASHBOARD SERVICES
// ==========================================
export { dashboardService } from './dashboardService';
export type { DashboardService } from './dashboardService';

// ==========================================
// FUTURE SERVICES - To be implemented
// ==========================================
// export { appointmentService } from './appointmentService';
// export { analyticsService } from './analyticsService';
// export { notificationService } from './notificationService';
// export { exportService } from './exportService';

export { ChildrenService, childrenService } from './children';
export { PracticeService, practiceService } from './practices';
