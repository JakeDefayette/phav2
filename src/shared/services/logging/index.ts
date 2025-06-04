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
export const errorLogger = (() => {
  if (typeof window === 'undefined') {
    return EmailErrorLogger.getInstance();
  }
  return null;
})();

export const recoveryService = (() => {
  if (typeof window === 'undefined') {
    return ErrorRecoveryService.getInstance();
  }
  return null;
})();

export const fallbackService = (() => {
  if (typeof window === 'undefined') {
    return FallbackService.getInstance();
  }
  return null;
})();

export const alertingService = (() => {
  if (typeof window === 'undefined') {
    return AlertingService.getInstance();
  }
  return null;
})();
