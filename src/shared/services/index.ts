export { AuthService } from './auth';
export { BaseService } from './base';
export { BrandingService } from './brandingService';
export { EmailService } from './email';

// Re-export services from features
export { PDFService } from '@/features/reports/services/pdf';
export { ReportsService } from '@/features/reports/services/reports';
export { ChartService } from '@/features/reports/services/chartService';
export { ReportCacheService } from '@/features/reports/services/reportCache';

// Dependency injection
export {
  ServiceContainer,
  container,
  inject,
  registerService,
  getService,
  type ServiceFactory,
  type ServiceInstance,
  type ServiceDefinition,
} from './ServiceContainer';

export { initializeServices, ServiceKeys, type ServiceKey } from './registry';
