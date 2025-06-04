/**
 * Email Error Logger Service
 *
 * Centralized error logging service with sophisticated error handling capabilities
 * including correlation, alerting, circuit breaking, and automatic recovery.
 */

import { createClient } from '@supabase/supabase-js';
import { PerformanceMonitor } from '@/shared/utils/performance';
import { generateUUID } from '@/shared/utils/uuid';
import { AppError, isAppError } from '@/shared/types/errors';
import {
  ErrorLevel,
  ErrorCategory,
  ErrorSource,
  ErrorContext,
  ErrorLogEntry,
  ErrorLogFilter,
  ErrorLogSummary,
  ErrorAlert,
  ErrorAlertCondition,
  ErrorNotificationChannel,
  ErrorMetrics,
  ErrorPattern,
  CircuitBreakerState,
  RecoveryAction,
  LoggerConfiguration,
} from './types';

const supabase = (() => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL is required for EmailErrorLogger'
    );
  }

  if (!serviceKey) {
    console.warn(
      'SUPABASE_SERVICE_ROLE_KEY not available for EmailErrorLogger, falling back to anon key'
    );
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!anonKey) {
      throw new Error(
        'Either SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY is required for EmailErrorLogger'
      );
    }
    return createClient(url, anonKey);
  }

  return createClient(url, serviceKey);
})();

/**
 * Centralized Email Error Logger with comprehensive error handling
 */
export class EmailErrorLogger {
  private static instance: EmailErrorLogger;
  private performanceMonitor: PerformanceMonitor;
  private config: LoggerConfiguration;
  private pendingLogs: ErrorLogEntry[] = [];
  private alerts: Map<string, ErrorAlert> = new Map();
  private patterns: Map<string, ErrorPattern> = new Map();
  private circuitBreakers: Map<ErrorSource, CircuitBreakerState> = new Map();
  private flushTimer?: NodeJS.Timeout;
  private errorCounts: Map<string, number> = new Map();
  private lastAlertTime: Map<string, Date> = new Map();

  private constructor(config?: Partial<LoggerConfiguration>) {
    this.config = {
      // Logging levels
      minLevel: 'info',
      enabledCategories: [
        'email_delivery',
        'rate_limit',
        'authentication',
        'validation',
        'configuration',
        'network',
        'database',
        'workflow',
        'permission',
        'service_unavailable',
        'bounce',
        'complaint',
        'unknown',
      ],
      enabledSources: [
        'resend_client',
        'email_service',
        'tracking_service',
        'bounce_handler',
        'compliance_service',
        'template_service',
        'workflow_manager',
        'authentication_service',
        'database_service',
        'api_endpoint',
        'webhook',
        'scheduler',
        'monitoring',
        'user_interface',
      ],

      // Storage configuration
      retentionDays: 30,
      maxLogSize: 100, // MB
      batchSize: 50,
      flushIntervalMs: 5000, // 5 seconds

      // Alert configuration
      enableAlerts: true,
      defaultCooldownMinutes: 15,
      criticalErrorThreshold: 5,
      errorRateThreshold: 10, // errors per minute

      // Recovery configuration
      enableAutoRecovery: true,
      maxRetryAttempts: 3,
      retryDelayMs: 1000,
      circuitBreakerThreshold: 5,

      // Performance configuration
      enablePerformanceTracking: true,
      correlationEnabled: true,
      patternDetectionEnabled: true,

      ...config,
    };

    this.performanceMonitor = PerformanceMonitor.getInstance();
    this.setupFlushTimer();
    this.initializeDefaultPatterns();
    this.initializeDefaultAlerts();
  }

  public static getInstance(
    config?: Partial<LoggerConfiguration>
  ): EmailErrorLogger {
    if (!EmailErrorLogger.instance) {
      EmailErrorLogger.instance = new EmailErrorLogger(config);
    }
    return EmailErrorLogger.instance;
  }

  // =====================
  // Core Logging Methods
  // =====================

  /**
   * Log an error with full context and processing
   */
  async logError(
    level: ErrorLevel,
    category: ErrorCategory,
    source: ErrorSource,
    message: string,
    context: Partial<ErrorContext>,
    originalError?: Error | AppError
  ): Promise<string> {
    // Check if logging is enabled for this level/category/source
    if (!this.shouldLog(level, category, source)) {
      return '';
    }

    const errorId = generateUUID();
    const correlationId =
      context.technical?.correlationId || this.generateCorrelationId(context);

    const logEntry: ErrorLogEntry = {
      id: errorId,
      timestamp: new Date(),
      level,
      category,
      source,
      message,
      errorCode:
        originalError instanceof AppError ? originalError.code : undefined,
      stackTrace: originalError?.stack,
      context: this.enrichContext(context, source),
      correlationId,
      resolved: false,
      occurrenceCount: 1,
      firstOccurrence: new Date(),
      lastOccurrence: new Date(),
    };

    // Check for duplicate errors and update occurrence count
    const existingErrorKey = this.getErrorKey(logEntry);
    const existingCount = this.errorCounts.get(existingErrorKey) || 0;
    this.errorCounts.set(existingErrorKey, existingCount + 1);

    if (existingCount > 0) {
      logEntry.occurrenceCount = existingCount + 1;
      // Don't update firstOccurrence for duplicates
    }

    // Add to pending logs for batch processing
    this.pendingLogs.push(logEntry);

    // Process patterns for this error
    if (this.config.patternDetectionEnabled) {
      await this.processErrorPatterns(logEntry);
    }

    // Check alert conditions
    if (this.config.enableAlerts) {
      await this.checkAlertConditions(logEntry);
    }

    // Update circuit breaker state
    this.updateCircuitBreaker(source, level === 'critical');

    // Record performance metrics
    if (this.config.enablePerformanceTracking) {
      this.performanceMonitor.recordMetric('emailErrorLogger', 'error_logged', {
        level,
        category,
        source,
        correlationId,
      });
    }

    // Auto-flush if critical or batch is full
    if (
      level === 'critical' ||
      this.pendingLogs.length >= this.config.batchSize
    ) {
      await this.flush();
    }

    return errorId;
  }

  /**
   * Log critical error (convenience method)
   */
  async logCritical(
    category: ErrorCategory,
    source: ErrorSource,
    message: string,
    context: Partial<ErrorContext> = {},
    originalError?: Error | AppError
  ): Promise<string> {
    return this.logError(
      'critical',
      category,
      source,
      message,
      context,
      originalError
    );
  }

  /**
   * Log warning (convenience method)
   */
  async logWarning(
    category: ErrorCategory,
    source: ErrorSource,
    message: string,
    context: Partial<ErrorContext> = {},
    originalError?: Error | AppError
  ): Promise<string> {
    return this.logError(
      'warning',
      category,
      source,
      message,
      context,
      originalError
    );
  }

  /**
   * Log info (convenience method)
   */
  async logInfo(
    category: ErrorCategory,
    source: ErrorSource,
    message: string,
    context: Partial<ErrorContext> = {},
    originalError?: Error | AppError
  ): Promise<string> {
    return this.logError(
      'info',
      category,
      source,
      message,
      context,
      originalError
    );
  }

  /**
   * Log debug (convenience method)
   */
  async logDebug(
    category: ErrorCategory,
    source: ErrorSource,
    message: string,
    context: Partial<ErrorContext> = {},
    originalError?: Error | AppError
  ): Promise<string> {
    return this.logError(
      'debug',
      category,
      source,
      message,
      context,
      originalError
    );
  }

  // =====================
  // Error Recovery
  // =====================

  /**
   * Attempt to recover from an error using predefined recovery actions
   */
  async recoverFromError(
    errorId: string,
    recoveryAction?: RecoveryAction
  ): Promise<boolean> {
    if (!this.config.enableAutoRecovery && !recoveryAction) {
      return false;
    }

    try {
      const logEntry = await this.getErrorById(errorId);
      if (!logEntry) {
        return false;
      }

      const action = recoveryAction || this.getDefaultRecoveryAction(logEntry);
      if (!action) {
        return false;
      }

      const success = await this.executeRecoveryAction(action, logEntry);

      if (success) {
        await this.markErrorResolved(errorId, `Auto-recovery: ${action.type}`);
        await this.logInfo(
          'workflow',
          'monitoring',
          `Successfully recovered from error: ${logEntry.message}`,
          {
            operation: 'error_recovery',
            technical: { correlationId: logEntry.correlationId },
            metadata: { recoveryAction: action.type, originalErrorId: errorId },
          }
        );
      }

      return success;
    } catch (error) {
      await this.logWarning(
        'workflow',
        'monitoring',
        `Recovery attempt failed for error ${errorId}`,
        {
          operation: 'error_recovery',
          metadata: { originalErrorId: errorId },
        },
        error instanceof Error ? error : new Error(String(error))
      );
      return false;
    }
  }

  // =====================
  // Circuit Breaker
  // =====================

  /**
   * Check if a source is currently circuit broken
   */
  isCircuitOpen(source: ErrorSource): boolean {
    const breaker = this.circuitBreakers.get(source);
    if (!breaker) {
      return false;
    }

    // Check if we should attempt recovery
    if (
      breaker.state === 'open' &&
      breaker.nextRetryTime &&
      new Date() > breaker.nextRetryTime
    ) {
      breaker.state = 'half_open';
      this.circuitBreakers.set(source, breaker);
      return false;
    }

    return breaker.state === 'open';
  }

  /**
   * Record a success for circuit breaker
   */
  recordSuccess(source: ErrorSource): void {
    const breaker = this.circuitBreakers.get(source);
    if (breaker) {
      breaker.successCount++;
      if (breaker.state === 'half_open') {
        breaker.state = 'closed';
        breaker.failureCount = 0;
      }
      this.circuitBreakers.set(source, breaker);
    }
  }

  /**
   * Get circuit breaker state
   */
  getCircuitBreakerState(source: ErrorSource): CircuitBreakerState | null {
    return this.circuitBreakers.get(source) || null;
  }

  // =====================
  // Alert Management
  // =====================

  /**
   * Add or update an alert configuration
   */
  async addAlert(
    alert: Omit<ErrorAlert, 'id' | 'lastTriggered' | 'triggerCount'>
  ): Promise<string> {
    const id = generateUUID();
    const fullAlert: ErrorAlert = {
      id,
      lastTriggered: undefined,
      triggerCount: 0,
      ...alert,
    };

    this.alerts.set(id, fullAlert);

    // Persist to database
    try {
      await supabase.from('error_alerts').insert({
        id,
        name: alert.name,
        description: alert.description,
        enabled: alert.enabled,
        conditions: alert.conditions,
        notifications: alert.notifications,
        cooldown_minutes: alert.cooldownMinutes,
        trigger_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to persist alert configuration:', error);
    }

    return id;
  }

  /**
   * Remove an alert
   */
  async removeAlert(alertId: string): Promise<boolean> {
    const removed = this.alerts.delete(alertId);

    if (removed) {
      try {
        await supabase.from('error_alerts').delete().eq('id', alertId);
      } catch (error) {
        console.error('Failed to remove alert from database:', error);
      }
    }

    return removed;
  }

  // =====================
  // Query and Analysis
  // =====================

  /**
   * Get errors with filtering and pagination
   */
  async getErrors(filter: ErrorLogFilter = {}): Promise<ErrorLogEntry[]> {
    try {
      let query = supabase.from('error_logs').select('*');

      // Apply filters
      if (filter.level) {
        const levels = Array.isArray(filter.level)
          ? filter.level
          : [filter.level];
        query = query.in('level', levels);
      }

      if (filter.category) {
        const categories = Array.isArray(filter.category)
          ? filter.category
          : [filter.category];
        query = query.in('category', categories);
      }

      if (filter.source) {
        const sources = Array.isArray(filter.source)
          ? filter.source
          : [filter.source];
        query = query.in('source', sources);
      }

      if (filter.startTime) {
        query = query.gte('timestamp', filter.startTime.toISOString());
      }

      if (filter.endTime) {
        query = query.lte('timestamp', filter.endTime.toISOString());
      }

      if (filter.resolved !== undefined) {
        query = query.eq('resolved', filter.resolved);
      }

      if (filter.correlationId) {
        query = query.eq('correlation_id', filter.correlationId);
      }

      if (filter.practiceId) {
        query = query.eq('context->email->practiceId', filter.practiceId);
      }

      if (filter.search) {
        query = query.or(
          `message.ilike.%${filter.search}%,error_code.ilike.%${filter.search}%`
        );
      }

      // Apply ordering and pagination
      query = query.order('timestamp', { ascending: false });

      if (filter.limit) {
        query = query.limit(filter.limit);
      }

      if (filter.offset) {
        query = query.range(
          filter.offset,
          filter.offset + (filter.limit || 50) - 1
        );
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return (data || []).map(this.mapDatabaseRowToLogEntry);
    } catch (error) {
      console.error('Failed to query errors:', error);
      return [];
    }
  }

  /**
   * Get error summary statistics
   */
  async getErrorSummary(
    timeWindowHours: number = 24
  ): Promise<ErrorLogSummary> {
    const startTime = new Date(Date.now() - timeWindowHours * 60 * 60 * 1000);

    try {
      const { data, error } = await supabase
        .from('error_logs')
        .select('level, category, source, message, timestamp, resolved')
        .gte('timestamp', startTime.toISOString());

      if (error) {
        throw error;
      }

      const errors = data || [];
      const totalErrors = errors.length;
      const resolvedErrors = errors.filter(e => e.resolved).length;

      // Count by level
      const criticalErrors = errors.filter(e => e.level === 'critical').length;
      const warningErrors = errors.filter(e => e.level === 'warning').length;
      const infoErrors = errors.filter(e => e.level === 'info').length;
      const debugErrors = errors.filter(e => e.level === 'debug').length;

      // Count by category
      const errorsByCategory = errors.reduce(
        (acc, error) => {
          acc[error.category as ErrorCategory] =
            (acc[error.category as ErrorCategory] || 0) + 1;
          return acc;
        },
        {} as Record<ErrorCategory, number>
      );

      // Count by source
      const errorsBySource = errors.reduce(
        (acc, error) => {
          acc[error.source as ErrorSource] =
            (acc[error.source as ErrorSource] || 0) + 1;
          return acc;
        },
        {} as Record<ErrorSource, number>
      );

      // Top errors by message
      const messageCounts = errors.reduce(
        (acc, error) => {
          acc[error.message] = (acc[error.message] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      const topErrors = Object.entries(messageCounts)
        .map(([message, count]) => ({
          message,
          count,
          lastOccurrence: new Date(
            Math.max(
              ...errors
                .filter(e => e.message === message)
                .map(e => new Date(e.timestamp).getTime())
            )
          ),
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Recent errors
      const recentErrors = errors
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
        .slice(0, 20)
        .map(this.mapDatabaseRowToLogEntry);

      return {
        totalErrors,
        criticalErrors,
        warningErrors,
        infoErrors,
        debugErrors,
        resolvedErrors,
        unresolvedErrors: totalErrors - resolvedErrors,
        errorsByCategory,
        errorsBySource,
        recentErrors,
        topErrors,
      };
    } catch (error) {
      console.error('Failed to generate error summary:', error);

      // Return empty summary on error
      return {
        totalErrors: 0,
        criticalErrors: 0,
        warningErrors: 0,
        infoErrors: 0,
        debugErrors: 0,
        resolvedErrors: 0,
        unresolvedErrors: 0,
        errorsByCategory: {} as Record<ErrorCategory, number>,
        errorsBySource: {} as Record<ErrorSource, number>,
        recentErrors: [],
        topErrors: [],
      };
    }
  }

  /**
   * Get error metrics for dashboard
   */
  async getErrorMetrics(timeWindowHours: number = 24): Promise<ErrorMetrics> {
    const endTime = new Date();
    const startTime = new Date(
      endTime.getTime() - timeWindowHours * 60 * 60 * 1000
    );

    try {
      const errors = await this.getErrors({ startTime, endTime });
      const totalMinutes = timeWindowHours * 60;
      const errorRate = errors.length / totalMinutes;

      // Group by level
      const errorsByLevel = errors.reduce(
        (acc, error) => {
          acc[error.level] = (acc[error.level] || 0) + 1;
          return acc;
        },
        {} as Record<ErrorLevel, number>
      );

      // Group by category
      const errorsByCategory = errors.reduce(
        (acc, error) => {
          acc[error.category] = (acc[error.category] || 0) + 1;
          return acc;
        },
        {} as Record<ErrorCategory, number>
      );

      // Group by source
      const errorsBySource = errors.reduce(
        (acc, error) => {
          acc[error.source] = (acc[error.source] || 0) + 1;
          return acc;
        },
        {} as Record<ErrorSource, number>
      );

      // Calculate mean time to resolution
      const resolvedErrors = errors.filter(e => e.resolved && e.resolvedAt);
      const meanTimeToResolution =
        resolvedErrors.length > 0
          ? resolvedErrors.reduce((sum, error) => {
              const resolutionTime =
                error.resolvedAt!.getTime() - error.firstOccurrence.getTime();
              return sum + resolutionTime / (1000 * 60); // Convert to minutes
            }, 0) / resolvedErrors.length
          : 0;

      // Top error messages
      const messageCounts = errors.reduce(
        (acc, error) => {
          acc[error.message] = (acc[error.message] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      const topErrorMessages = Object.entries(messageCounts)
        .map(([message, count]) => ({
          message,
          count,
          percentage: (count / errors.length) * 100,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Trends analysis
      const mostProblematicSource =
        (Object.entries(errorsBySource).sort(
          ([, a], [, b]) => b - a
        )[0]?.[0] as ErrorSource) || 'unknown';

      const mostCommonCategory =
        (Object.entries(errorsByCategory).sort(
          ([, a], [, b]) => b - a
        )[0]?.[0] as ErrorCategory) || 'unknown';

      // Simple trend calculation (compare first half vs second half)
      const midPoint =
        startTime.getTime() + (endTime.getTime() - startTime.getTime()) / 2;
      const firstHalfErrors = errors.filter(
        e => e.timestamp.getTime() < midPoint
      ).length;
      const secondHalfErrors = errors.filter(
        e => e.timestamp.getTime() >= midPoint
      ).length;

      let errorRateTrend: 'increasing' | 'decreasing' | 'stable' = 'stable';
      if (secondHalfErrors > firstHalfErrors * 1.1) {
        errorRateTrend = 'increasing';
      } else if (secondHalfErrors < firstHalfErrors * 0.9) {
        errorRateTrend = 'decreasing';
      }

      return {
        timeWindow: { start: startTime, end: endTime },
        errorRate,
        errorCount: errors.length,
        errorsByLevel,
        errorsByCategory,
        errorsBySource,
        meanTimeToResolution,
        topErrorMessages,
        trends: {
          errorRateTrend,
          mostProblematicSource,
          mostCommonCategory,
        },
      };
    } catch (error) {
      console.error('Failed to calculate error metrics:', error);

      // Return empty metrics on error
      return {
        timeWindow: { start: startTime, end: endTime },
        errorRate: 0,
        errorCount: 0,
        errorsByLevel: {} as Record<ErrorLevel, number>,
        errorsByCategory: {} as Record<ErrorCategory, number>,
        errorsBySource: {} as Record<ErrorSource, number>,
        meanTimeToResolution: 0,
        topErrorMessages: [],
        trends: {
          errorRateTrend: 'stable',
          mostProblematicSource: 'email_service',
          mostCommonCategory: 'unknown',
        },
      };
    }
  }

  /**
   * Mark an error as resolved
   */
  async markErrorResolved(
    errorId: string,
    resolutionNote?: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('error_logs')
        .update({
          resolved: true,
          resolved_at: new Date().toISOString(),
          resolution_note: resolutionNote,
          updated_at: new Date().toISOString(),
        })
        .eq('id', errorId);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Failed to mark error as resolved:', error);
      return false;
    }
  }

  // =====================
  // Private Helper Methods
  // =====================

  private shouldLog(
    level: ErrorLevel,
    category: ErrorCategory,
    source: ErrorSource
  ): boolean {
    // Check minimum level
    const levelPriority = { debug: 0, info: 1, warning: 2, critical: 3 };
    const minLevelPriority = levelPriority[this.config.minLevel];
    const currentLevelPriority = levelPriority[level];

    if (currentLevelPriority < minLevelPriority) {
      return false;
    }

    // Check enabled categories and sources
    return (
      this.config.enabledCategories.includes(category) &&
      this.config.enabledSources.includes(source)
    );
  }

  private enrichContext(
    context: Partial<ErrorContext>,
    source: ErrorSource
  ): ErrorContext {
    return {
      operation: context.operation || 'unknown',
      source,
      email: context.email,
      technical: {
        correlationId: context.technical?.correlationId || generateUUID(),
        ...context.technical,
      },
      performance: context.performance,
      metadata: context.metadata,
    };
  }

  private generateCorrelationId(context: Partial<ErrorContext>): string {
    // Generate correlation ID based on email context if available
    if (context.email?.messageId) {
      return `email-${context.email.messageId}`;
    }
    if (context.technical?.requestId) {
      return `request-${context.technical.requestId}`;
    }
    if (context.technical?.sessionId) {
      return `session-${context.technical.sessionId}`;
    }

    return generateUUID();
  }

  private getErrorKey(logEntry: ErrorLogEntry): string {
    return `${logEntry.level}-${logEntry.category}-${logEntry.source}-${logEntry.message}`;
  }

  private async processErrorPatterns(logEntry: ErrorLogEntry): Promise<void> {
    for (const pattern of this.patterns.values()) {
      const regex = new RegExp(pattern.pattern, 'i');
      if (regex.test(logEntry.message)) {
        pattern.detectionCount++;
        pattern.lastDetected = new Date();

        if (pattern.autoResolve && pattern.suggestedAction) {
          // Attempt auto-resolution
          const action: RecoveryAction = {
            type: 'retry',
            description: pattern.suggestedAction,
            automated: true,
          };

          await this.recoverFromError(logEntry.id, action);
        }
      }
    }
  }

  private async checkAlertConditions(logEntry: ErrorLogEntry): Promise<void> {
    for (const alert of this.alerts.values()) {
      if (!alert.enabled) continue;

      // Check cooldown
      const lastAlertTime = this.lastAlertTime.get(alert.id);
      if (lastAlertTime) {
        const cooldownMs = alert.cooldownMinutes * 60 * 1000;
        if (Date.now() - lastAlertTime.getTime() < cooldownMs) {
          continue;
        }
      }

      // Check conditions
      let shouldTrigger = false;
      for (const condition of alert.conditions) {
        if (await this.checkAlertCondition(condition, logEntry)) {
          shouldTrigger = true;
          break;
        }
      }

      if (shouldTrigger) {
        await this.triggerAlert(alert, logEntry);
      }
    }
  }

  private async checkAlertCondition(
    condition: ErrorAlertCondition,
    logEntry: ErrorLogEntry
  ): Promise<boolean> {
    const timeWindow = new Date(
      Date.now() - condition.timeWindowMinutes * 60 * 1000
    );

    switch (condition.type) {
      case 'critical_error':
        return logEntry.level === 'critical';

      case 'pattern_match':
        if (condition.pattern) {
          const regex = new RegExp(condition.pattern, 'i');
          return regex.test(logEntry.message);
        }
        return false;

      case 'error_count':
      case 'error_rate':
        // Query recent errors matching conditions
        const filter: ErrorLogFilter = {
          startTime: timeWindow,
          level: condition.level,
          category: condition.category,
          source: condition.source,
        };

        const recentErrors = await this.getErrors(filter);
        const count = recentErrors.length;

        if (condition.type === 'error_count') {
          return count >= condition.threshold;
        } else {
          const rate = count / condition.timeWindowMinutes;
          return rate >= condition.threshold;
        }

      default:
        return false;
    }
  }

  private async triggerAlert(
    alert: ErrorAlert,
    triggerError: ErrorLogEntry
  ): Promise<void> {
    alert.lastTriggered = new Date();
    alert.triggerCount++;
    this.lastAlertTime.set(alert.id, new Date());

    // Send notifications
    for (const notification of alert.notifications) {
      if (!notification.enabled) continue;

      try {
        await this.sendNotification(notification, alert, triggerError);
      } catch (error) {
        console.error(
          `Failed to send ${notification.type} notification:`,
          error
        );
      }
    }

    // Update alert in database
    try {
      await supabase
        .from('error_alerts')
        .update({
          last_triggered: alert.lastTriggered.toISOString(),
          trigger_count: alert.triggerCount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', alert.id);
    } catch (error) {
      console.error('Failed to update alert trigger count:', error);
    }
  }

  private async sendNotification(
    notification: ErrorNotificationChannel,
    alert: ErrorAlert,
    triggerError: ErrorLogEntry
  ): Promise<void> {
    switch (notification.type) {
      case 'console':
        console.error(`🚨 Alert: ${alert.name}`, {
          alert: alert.name,
          description: alert.description,
          triggerError: {
            id: triggerError.id,
            level: triggerError.level,
            category: triggerError.category,
            source: triggerError.source,
            message: triggerError.message,
            timestamp: triggerError.timestamp,
          },
        });
        break;

      case 'database':
        await supabase.from('error_notifications').insert({
          alert_id: alert.id,
          notification_type: 'database',
          error_id: triggerError.id,
          message: `Alert "${alert.name}" triggered by ${triggerError.level} error: ${triggerError.message}`,
          sent_at: new Date().toISOString(),
        });
        break;

      case 'email':
        // TODO: Implement email notification
        console.log(`Email notification for alert: ${alert.name}`);
        break;

      case 'webhook':
        // TODO: Implement webhook notification
        console.log(`Webhook notification for alert: ${alert.name}`);
        break;

      case 'slack':
        // TODO: Implement Slack notification
        console.log(`Slack notification for alert: ${alert.name}`);
        break;
    }
  }

  private updateCircuitBreaker(source: ErrorSource, isFailure: boolean): void {
    let breaker = this.circuitBreakers.get(source);

    if (!breaker) {
      breaker = {
        source,
        state: 'closed',
        failureCount: 0,
        successCount: 0,
        failureThreshold: this.config.circuitBreakerThreshold,
        recoveryTimeout: 60000, // 1 minute
      };
    }

    if (isFailure) {
      breaker.failureCount++;
      breaker.lastFailureTime = new Date();

      if (breaker.failureCount >= breaker.failureThreshold) {
        breaker.state = 'open';
        breaker.nextRetryTime = new Date(Date.now() + breaker.recoveryTimeout);
      }
    } else {
      breaker.successCount++;
      if (breaker.state === 'half_open') {
        breaker.state = 'closed';
        breaker.failureCount = 0;
      }
    }

    this.circuitBreakers.set(source, breaker);
  }

  private getDefaultRecoveryAction(
    logEntry: ErrorLogEntry
  ): RecoveryAction | null {
    // Determine default recovery action based on error characteristics
    if (logEntry.category === 'rate_limit') {
      return {
        type: 'retry',
        description: 'Wait and retry with exponential backoff',
        automated: true,
        config: { delayMs: 30000, maxRetries: 3 },
      };
    }

    if (
      logEntry.category === 'network' ||
      logEntry.category === 'service_unavailable'
    ) {
      return {
        type: 'circuit_breaker',
        description: 'Enable circuit breaker to prevent cascade failures',
        automated: true,
        config: { timeout: 60000 },
      };
    }

    if (logEntry.level === 'critical') {
      return {
        type: 'escalate',
        description: 'Escalate critical error for manual intervention',
        automated: false,
      };
    }

    return null;
  }

  private async executeRecoveryAction(
    action: RecoveryAction,
    logEntry: ErrorLogEntry
  ): Promise<boolean> {
    switch (action.type) {
      case 'retry':
        // For email operations, we might retry sending
        if (logEntry.context.email?.messageId) {
          // Implementation depends on the specific email operation
          return true; // Placeholder
        }
        return false;

      case 'circuit_breaker':
        // Already handled in updateCircuitBreaker
        return true;

      case 'fallback':
        // Implement fallback mechanism (e.g., different email provider)
        return true; // Placeholder

      case 'degraded_mode':
        // Enable degraded mode operation
        return true; // Placeholder

      case 'escalate':
        // Create escalation (admin notification, ticket, etc.)
        return true; // Placeholder

      case 'ignore':
        // Mark as resolved without action
        return true;

      default:
        return false;
    }
  }

  private async getErrorById(errorId: string): Promise<ErrorLogEntry | null> {
    try {
      const { data, error } = await supabase
        .from('error_logs')
        .select('*')
        .eq('id', errorId)
        .single();

      if (error || !data) {
        return null;
      }

      return this.mapDatabaseRowToLogEntry(data);
    } catch (error) {
      console.error('Failed to get error by ID:', error);
      return null;
    }
  }

  private mapDatabaseRowToLogEntry(row: any): ErrorLogEntry {
    return {
      id: row.id,
      timestamp: new Date(row.timestamp),
      level: row.level,
      category: row.category,
      source: row.source,
      message: row.message,
      errorCode: row.error_code,
      stackTrace: row.stack_trace,
      context: row.context || {},
      correlationId: row.correlation_id,
      resolved: row.resolved,
      resolvedAt: row.resolved_at ? new Date(row.resolved_at) : undefined,
      resolutionNote: row.resolution_note,
      occurrenceCount: row.occurrence_count || 1,
      firstOccurrence: new Date(row.first_occurrence || row.timestamp),
      lastOccurrence: new Date(row.last_occurrence || row.timestamp),
      relatedErrors: row.related_errors || [],
    };
  }

  private setupFlushTimer(): void {
    this.flushTimer = setInterval(async () => {
      if (this.pendingLogs.length > 0) {
        await this.flush();
      }
    }, this.config.flushIntervalMs);
  }

  private initializeDefaultPatterns(): void {
    const defaultPatterns: Array<
      Omit<ErrorPattern, 'id' | 'detectionCount' | 'lastDetected'>
    > = [
      {
        name: 'Rate Limit Exceeded',
        pattern: 'rate.?limit|too.?many.?requests|429',
        description: 'API rate limiting detected',
        category: 'rate_limit',
        severity: 'warning',
        suggestedAction: 'Implement exponential backoff and retry',
        autoResolve: true,
      },
      {
        name: 'Authentication Failure',
        pattern: 'auth|unauthorized|401|invalid.?key|invalid.?token',
        description: 'Authentication or authorization failure',
        category: 'authentication',
        severity: 'critical',
        suggestedAction: 'Check API keys and permissions',
        autoResolve: false,
      },
      {
        name: 'Network Timeout',
        pattern: 'timeout|network.?error|connection.?refused|ECONNREFUSED',
        description: 'Network connectivity issues',
        category: 'network',
        severity: 'warning',
        suggestedAction: 'Retry with circuit breaker pattern',
        autoResolve: true,
      },
    ];

    defaultPatterns.forEach(pattern => {
      const id = generateUUID();
      this.patterns.set(id, {
        id,
        detectionCount: 0,
        ...pattern,
      });
    });
  }

  private initializeDefaultAlerts(): void {
    const defaultAlerts: Array<
      Omit<ErrorAlert, 'id' | 'lastTriggered' | 'triggerCount'>
    > = [
      {
        name: 'Critical Error Alert',
        description: 'Alert when critical errors occur',
        enabled: true,
        conditions: [
          {
            type: 'critical_error',
            threshold: 1,
            timeWindowMinutes: 5,
          },
        ],
        notifications: [
          {
            type: 'console',
            enabled: true,
            config: {},
          },
          {
            type: 'database',
            enabled: true,
            config: {},
          },
        ],
        cooldownMinutes: 15,
      },
      {
        name: 'High Error Rate Alert',
        description: 'Alert when error rate exceeds threshold',
        enabled: true,
        conditions: [
          {
            type: 'error_rate',
            threshold: this.config.errorRateThreshold,
            timeWindowMinutes: 10,
          },
        ],
        notifications: [
          {
            type: 'console',
            enabled: true,
            config: {},
          },
        ],
        cooldownMinutes: 30,
      },
    ];

    defaultAlerts.forEach(alert => {
      const id = generateUUID();
      this.alerts.set(id, {
        id,
        lastTriggered: undefined,
        triggerCount: 0,
        ...alert,
      });
    });
  }

  /**
   * Flush pending logs to database
   */
  async flush(): Promise<void> {
    if (this.pendingLogs.length === 0) return;

    const logsToFlush = [...this.pendingLogs];
    this.pendingLogs = [];

    try {
      const dbLogs = logsToFlush.map(log => ({
        id: log.id,
        timestamp: log.timestamp.toISOString(),
        level: log.level,
        category: log.category,
        source: log.source,
        message: log.message,
        error_code: log.errorCode,
        stack_trace: log.stackTrace,
        context: log.context,
        correlation_id: log.correlationId,
        resolved: log.resolved,
        resolved_at: log.resolvedAt?.toISOString(),
        resolution_note: log.resolutionNote,
        occurrence_count: log.occurrenceCount,
        first_occurrence: log.firstOccurrence.toISOString(),
        last_occurrence: log.lastOccurrence.toISOString(),
        related_errors: log.relatedErrors,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      const { error } = await supabase.from('error_logs').upsert(dbLogs, {
        onConflict: 'id',
      });

      if (error) {
        console.error('Failed to flush error logs to database:', error);
        // Re-add failed logs to pending (with limit to prevent infinite growth)
        this.pendingLogs.unshift(...logsToFlush.slice(0, 10));
      }
    } catch (error) {
      console.error('Failed to flush error logs:', error);
      // Re-add failed logs to pending (with limit to prevent infinite growth)
      this.pendingLogs.unshift(...logsToFlush.slice(0, 10));
    }
  }

  /**
   * Graceful shutdown - flush remaining logs
   */
  async shutdown(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    await this.flush();
  }
}

// Export singleton instance
export const emailErrorLogger = EmailErrorLogger.getInstance();
