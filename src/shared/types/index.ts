// Type definitions barrel export
export * from './auth';
export * from './branding';
export * from './common';
export * from './errors';

// Export database types explicitly to avoid conflicts with API imports
export type {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
  Enums,
} from './database';

// Export specific database entity types
export type {
  Practice,
  Assessment,
  Report,
  Child,
  SurveyResponse,
  UserProfile,
} from './database';

// Export specific database insert types
export type {
  PracticeInsert,
  AssessmentInsert,
  ReportInsert,
  ChildInsert,
  SurveyResponseInsert,
  UserProfileInsert,
} from './database';

// Export specific database update types
export type {
  PracticeUpdate,
  AssessmentUpdate,
  ReportUpdate,
  ChildUpdate,
  SurveyResponseUpdate,
  UserProfileUpdate,
} from './database';

// Export API response types (not the namespaces to avoid conflicts)
export type { ApiResponse, ApiErrorResponse, PaginatedResponse } from './api';

// Export API data types for hooks
export type CreateAssessmentData = import('./api').AssessmentAPI.CreateRequest;
export type UpdateAssessmentData = import('./api').AssessmentAPI.UpdateRequest;
export type CreateChildData = import('./api').ChildrenAPI.CreateRequest;
export type UpdateChildData = import('./api').ChildrenAPI.UpdateRequest;
export type CreatePracticeData = import('./api').PracticesAPI.CreateRequest;
export type UpdatePracticeData = import('./api').PracticesAPI.UpdateRequest;
export type CreateReportData = import('./api').ReportsAPI.CreateRequest;
export type DeliveryOptions = import('./api').ReportsAPI.DeliveryRequest;

// Note: API namespaces (AssessmentAPI, ReportsAPI, etc.) should be imported directly
// from './api' where needed to avoid conflicts with database types
