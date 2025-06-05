/**
 * Error Handling and Logging Services
 *
 * Centralized exports for the comprehensive error handling system
 */

// Core types
export * from './types';

// Main services
export { EmailErrorLogger } from './EmailErrorLogger';
export { ErrorRecoveryService } from './ErrorRecoveryService';
export { FallbackService } from './FallbackService';
export { AlertingService } from './AlertingService';

// Additional types from services
export type {
  RetryStrategy,
  FallbackStrategy,
  RecoveryPlan,
  RecoveryExecution,
  RecoveryMetrics,
} from './ErrorRecoveryService';

export type {
  FallbackProvider,
  FallbackExecution,
  DegradedModeConfig,
} from './FallbackService';

export type {
  AlertRule,
  AlertCondition,
  AlertAction,
  AlertActionConfig,
  AlertInstance,
  AlertActionExecution,
  AlertMetrics,
  NotificationTemplate,
  AlertingConfig,
} from './AlertingService';

// Service instances for convenience (server-side only)
// Note: These instances should only be used in API routes or server-side code
// Client components should call API endpoints instead
import { EmailErrorLogger as EmailErrorLoggerClass } from './EmailErrorLogger';

export const errorLogger = (() => {
  if (typeof window === 'undefined') {
    return EmailErrorLoggerClass.getInstance();
  }
  return null;
})();

import { ErrorRecoveryService as ErrorRecoveryServiceClass } from './ErrorRecoveryService';
import { FallbackService as FallbackServiceClass } from './FallbackService';
import { AlertingService as AlertingServiceClass } from './AlertingService';

export const recoveryService = (() => {
  if (typeof window === 'undefined') {
    return ErrorRecoveryServiceClass.getInstance();
  }
  return null;
})();

export const fallbackService = (() => {
  if (typeof window === 'undefined') {
    return FallbackServiceClass.getInstance();
  }
  return null;
})();

export const alertingService = (() => {
  if (typeof window === 'undefined') {
    return AlertingServiceClass.getInstance();
  }
  return null;
})();
