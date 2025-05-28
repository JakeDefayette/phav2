/**
 * Service Registry - Central configuration for all application services
 *
 * This file registers all services with the dependency injection container,
 * ensuring proper service initialization and dependency management.
 */

import { registerService } from './ServiceContainer';
import { config } from '@/shared/config';

// Core services
import { AuthService } from './auth';
import { BaseService } from './base';
import { BrandingService } from './brandingService';
import { EmailService } from './email';

// Feature services
import {
  SurveyDataMapper,
  AssessmentsService,
  SurveyResponsesService,
} from '@/features/assessment/services';

import {
  ReportsService,
  PDFService,
  DeliveryService,
  ChartService,
  ReportCacheService,
} from '@/features/reports/services';

import {
  ChildrenService,
  PracticeService,
} from '@/features/dashboard/services';

// Supabase clients
import { supabase } from '@/shared/services/supabase';
import { supabaseServer } from '@/shared/services/supabase-server';

/**
 * Initialize and register all application services
 * Call this once at application startup
 */
export function initializeServices(): void {
  // Core infrastructure services
  registerService('supabase', () => supabase);
  registerService('supabaseServer', () => supabaseServer);

  // Shared services
  registerService('authService', () => new AuthService());
  registerService('brandingService', () => BrandingService.getInstance());
  registerService('emailService', () => new EmailService());

  // Assessment feature services
  registerService('surveyDataMapper', () => SurveyDataMapper.getInstance());
  registerService('assessmentsService', () => new AssessmentsService());
  registerService('surveyResponsesService', () => new SurveyResponsesService());

  // Reports feature services
  registerService('reportsService', () => new ReportsService());
  registerService('pdfService', () => PDFService.getInstance());
  registerService('deliveryService', () => new DeliveryService());
  registerService('chartService', () => ChartService.getInstance());
  registerService('reportCacheService', () => ReportCacheService.getInstance());

  // Dashboard feature services
  registerService('childrenService', () => new ChildrenService());
  registerService('practiceService', () => new PracticeService());
}

/**
 * Service keys for type-safe access
 */
export const ServiceKeys = {
  // Infrastructure
  SUPABASE: 'supabase',
  SUPABASE_SERVER: 'supabaseServer',

  // Shared services
  AUTH_SERVICE: 'authService',
  BASE_SERVICE: 'baseService',
  BRANDING_SERVICE: 'brandingService',
  EMAIL_SERVICE: 'emailService',

  // Assessment services
  SURVEY_DATA_MAPPER: 'surveyDataMapper',
  ASSESSMENTS_SERVICE: 'assessmentsService',
  SURVEY_RESPONSES_SERVICE: 'surveyResponsesService',

  // Reports services
  REPORTS_SERVICE: 'reportsService',
  PDF_SERVICE: 'pdfService',
  DELIVERY_SERVICE: 'deliveryService',
  CHART_SERVICE: 'chartService',
  REPORT_CACHE_SERVICE: 'reportCacheService',

  // Dashboard services
  CHILDREN_SERVICE: 'childrenService',
  PRACTICE_SERVICE: 'practiceService',
} as const;

export type ServiceKey = (typeof ServiceKeys)[keyof typeof ServiceKeys];
