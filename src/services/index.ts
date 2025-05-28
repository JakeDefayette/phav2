// Services barrel export
// This file will be used to export all service modules

// Example exports (to be added as services are created):
// export { authService } from './auth';
// export { apiService } from './api';
// export { storageService } from './storage';

// Base service and error handling
export { BaseService, ServiceError } from './base';

// Auth service (functions)
export {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  isAuthenticated,
  refreshUserSession,
  getUserSessionInfo,
  AuthError,
} from './auth';

// Core entity services
export {
  practiceService as practicesService,
  type Practice,
  type PracticeInsert,
  type PracticeUpdate,
} from './practices';
export {
  childrenService,
  type Child,
  type ChildInsert,
  type ChildUpdate,
  type ChildWithAssessments,
} from './children';
export {
  assessmentsService,
  type Assessment,
  type AssessmentInsert,
  type AssessmentUpdate,
  type AssessmentWithResponses,
  type AssessmentStats,
} from './assessments';
export {
  surveyResponsesService,
  type SurveyResponse,
  type SurveyResponseInsert,
  type SurveyResponseUpdate,
  type SurveyResponseWithQuestion,
  type ResponseSummary,
} from './surveyResponses';
export {
  reportsService,
  type Report,
  type ReportInsert,
  type ReportUpdate,
  type ReportShare,
  type ReportShareInsert,
  type ReportWithShares,
  type ViralMetrics,
} from './reports';
export { pdfService, PDFService, type PDFReportProps, PDFReport } from './pdf';

// Additional services
export {
  brandingService,
  BrandingService,
  type BrandingConfig,
} from './brandingService';
export { ChartService } from './chartService';
export { SurveyDataMapper, type ReportDataStructure } from './SurveyDataMapper';
export {
  EmailService,
  type EmailResult,
  type ReportDeliveryEmailOptions,
} from './email';
export { ReportCacheService } from './reportCache';

// Import service instances
import { practiceService } from './practices';
import { childrenService } from './children';
import { assessmentsService } from './assessments';
import { surveyResponsesService } from './surveyResponses';
import { reportsService } from './reports';
import { pdfService } from './pdf';
import { brandingService } from './brandingService';
import { ChartService } from './chartService';
import { ReportCacheService } from './reportCache';
import {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  isAuthenticated,
  refreshUserSession,
  getUserSessionInfo,
} from './auth';

// Create auth service object
export const authService = {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  isAuthenticated,
  refreshUserSession,
  getUserSessionInfo,
} as const;

// Service instances for easy access
export const services = {
  auth: authService,
  practices: practiceService,
  children: childrenService,
  assessments: assessmentsService,
  surveyResponses: surveyResponsesService,
  reports: reportsService,
  pdf: pdfService,
  branding: brandingService,
  charts: ChartService.getInstance(),
  reportCache: ReportCacheService.getInstance(),
} as const;
