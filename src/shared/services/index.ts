// Services barrel export
// This file will be used to export all service modules

// Example exports (to be added as services are created):
// export { authService } from './auth';
// export { apiService } from './api';
// export { storageService } from './storage';

// Re-export services from their new locations after refactoring

// Shared services
export {
  BaseService,
  withRetry,
  type RetryOptions,
} from '@/shared/services/base';

export {
  AuthService,
  authService,
  type LoginCredentials,
  type RegisterData,
  type AuthUser,
} from '@/shared/services/auth';

export {
  BrandingService,
  brandingService,
  type BrandingConfig,
} from '@/shared/services/brandingService';

export {
  EmailService,
  emailService,
  type ReportDeliveryEmailOptions,
  type ReportReadyNotificationOptions,
  type EmailResult,
} from '@/shared/services/email';

// Feature services - Reports
export {
  ReportsService,
  PDFService,
  DeliveryService,
  ChartService,
} from '@/features/reports/services';

export type {
  Report,
  ReportInsert,
  ReportUpdate,
  ReportWithShares,
  ReportShare,
  ReportShareInsert,
  ViralMetrics,
} from '@/features/reports/types';

export {
  SurveyDataMapper,
  type ReportDataStructure,
} from '@/features/assessment/services/SurveyDataMapper';

export { ReportCacheService } from '@/features/reports/services/reportCache';

// Feature services - Dashboard
export {
  PracticeService,
  practiceService,
} from '@/features/dashboard/services/practices';

export {
  ChildrenService,
  childrenService,
} from '@/features/dashboard/services/children';

// Feature services - Assessment
export {
  AssessmentsService,
  assessmentsService,
} from '@/features/assessment/services/assessments';

export {
  SurveyResponsesService,
  surveyResponsesService,
} from '@/features/assessment/services/surveyResponses';

// Service instances for backward compatibility
import { authService } from '@/shared/services/auth';
import { brandingService } from '@/shared/services/brandingService';

export { authService as auth, brandingService as branding };
