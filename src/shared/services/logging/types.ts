/**
 * Error Logging Service Types
 *
 * Comprehensive type definitions for centralized error handling and logging
 */

export type ErrorLevel = 'critical' | 'warning' | 'info' | 'debug';

export type ErrorCategory =
  | 'email_delivery'
  | 'rate_limit'
  | 'authentication'
  | 'validation'
  | 'configuration'
  | 'network'
  | 'database'
  | 'workflow'
  | 'permission'
  | 'service_unavailable'
  | 'bounce'
  | 'complaint'
  | 'unknown';

export type ErrorSource =
  | 'resend_client'
  | 'email_service'
  | 'tracking_service'
  | 'bounce_handler'
  | 'compliance_service'
  | 'template_service'
  | 'workflow_manager'
  | 'authentication_service'
  | 'database_service'
  | 'api_endpoint'
  | 'webhook'
  | 'scheduler'
  | 'monitoring'
  | 'user_interface';

export interface ErrorContext {
  // Operation context
  operation: string;
  source: ErrorSource;

  // Email-specific context
  email?: {
    messageId?: string;
    recipientEmail?: string;
    practiceId?: string;
    templateType?: string;
    campaignId?: string;
    scheduledEmailId?: string;
  };

  // Technical context
  technical?: {
    httpStatus?: number;
    apiEndpoint?: string;
    requestId?: string;
    userAgent?: string;
    ipAddress?: string;
    sessionId?: string;
    userId?: string;
    correlationId?: string;
  };

  // Performance context
  performance?: {
    duration?: number;
    memoryUsage?: number;
    retryAttempt?: number;
    maxRetries?: number;
  };

  // Additional metadata
  metadata?: Record<string, any>;
}

export interface ErrorLogEntry {
  id: string;
  timestamp: Date;
  level: ErrorLevel;
  category: ErrorCategory;
  source: ErrorSource;
  message: string;
  errorCode?: string;
  stackTrace?: string;
  context: ErrorContext;
  correlationId?: string;
  resolved: boolean;
  resolvedAt?: Date;
  resolutionNote?: string;
  occurrenceCount: number;
  firstOccurrence: Date;
  lastOccurrence: Date;
  relatedErrors?: string[]; // IDs of related errors
}

export interface ErrorLogFilter {
  level?: ErrorLevel | ErrorLevel[];
  category?: ErrorCategory | ErrorCategory[];
  source?: ErrorSource | ErrorSource[];
  startTime?: Date;
  endTime?: Date;
  resolved?: boolean;
  correlationId?: string;
  practiceId?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface ErrorLogSummary {
  totalErrors: number;
  criticalErrors: number;
  warningErrors: number;
  infoErrors: number;
  debugErrors: number;
  resolvedErrors: number;
  unresolvedErrors: number;
  errorsByCategory: Record<ErrorCategory, number>;
  errorsBySource: Record<ErrorSource, number>;
  recentErrors: ErrorLogEntry[];
  topErrors: Array<{
    message: string;
    count: number;
    lastOccurrence: Date;
  }>;
}

export interface ErrorAlert {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  conditions: ErrorAlertCondition[];
  notifications: ErrorNotificationChannel[];
  lastTriggered?: Date;
  triggerCount: number;
  cooldownMinutes: number;
}

export interface ErrorAlertCondition {
  type: 'error_rate' | 'error_count' | 'critical_error' | 'pattern_match';
  threshold: number;
  timeWindowMinutes: number;
  level?: ErrorLevel;
  category?: ErrorCategory;
  source?: ErrorSource;
  pattern?: string; // Regex pattern for pattern_match type
}

export interface ErrorNotificationChannel {
  type: 'email' | 'webhook' | 'slack' | 'console' | 'database';
  enabled: boolean;
  config: Record<string, any>;
}

export interface ErrorMetrics {
  timeWindow: {
    start: Date;
    end: Date;
  };
  errorRate: number; // Errors per minute
  errorCount: number;
  errorsByLevel: Record<ErrorLevel, number>;
  errorsByCategory: Record<ErrorCategory, number>;
  errorsBySource: Record<ErrorSource, number>;
  meanTimeToResolution: number; // Minutes
  topErrorMessages: Array<{
    message: string;
    count: number;
    percentage: number;
  }>;
  trends: {
    errorRateTrend: 'increasing' | 'decreasing' | 'stable';
    mostProblematicSource: ErrorSource;
    mostCommonCategory: ErrorCategory;
  };
}

export interface ErrorPattern {
  id: string;
  name: string;
  pattern: string; // Regex pattern
  description: string;
  category: ErrorCategory;
  severity: ErrorLevel;
  detectionCount: number;
  lastDetected?: Date;
  suggestedAction?: string;
  autoResolve: boolean;
}

export interface CircuitBreakerState {
  source: ErrorSource;
  state: 'closed' | 'open' | 'half_open';
  failureCount: number;
  successCount: number;
  lastFailureTime?: Date;
  nextRetryTime?: Date;
  failureThreshold: number;
  recoveryTimeout: number;
}

export interface RecoveryAction {
  type:
    | 'retry'
    | 'fallback'
    | 'circuit_breaker'
    | 'escalate'
    | 'ignore'
    | 'degraded_mode';
  description: string;
  automated: boolean;
  config?: Record<string, any>;
}

export interface LoggerConfiguration {
  // Logging levels
  minLevel: ErrorLevel;
  enabledCategories: ErrorCategory[];
  enabledSources: ErrorSource[];

  // Storage configuration
  retentionDays: number;
  maxLogSize: number; // MB
  batchSize: number;
  flushIntervalMs: number;

  // Alert configuration
  enableAlerts: boolean;
  defaultCooldownMinutes: number;
  criticalErrorThreshold: number;
  errorRateThreshold: number;

  // Recovery configuration
  enableAutoRecovery: boolean;
  maxRetryAttempts: number;
  retryDelayMs: number;
  circuitBreakerThreshold: number;

  // Performance configuration
  enablePerformanceTracking: boolean;
  correlationEnabled: boolean;
  patternDetectionEnabled: boolean;
}
