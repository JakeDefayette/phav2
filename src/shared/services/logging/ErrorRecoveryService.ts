/**
 * Error Recovery Service
 *
 * Advanced error recovery system with intelligent retry strategies,
 * fallback mechanisms, and recovery validation
 */

import { EmailErrorLogger } from './EmailErrorLogger';
import { PerformanceMonitor } from '@/shared/utils/performance';
import { generateUUID } from '@/shared/utils/uuid';
import {
  ErrorLevel,
  ErrorCategory,
  ErrorSource,
  RecoveryAction,
  ErrorLogEntry,
  ErrorContext,
} from './types';

export interface RetryStrategy {
  type:
    | 'immediate'
    | 'exponential_backoff'
    | 'linear_backoff'
    | 'fibonacci'
    | 'custom';
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier?: number;
  jitterEnabled?: boolean;
  customDelayFunction?: (attempt: number, baseDelay: number) => number;
}

export interface FallbackStrategy {
  type:
    | 'alternative_service'
    | 'cached_response'
    | 'degraded_mode'
    | 'queue_for_later'
    | 'manual_intervention';
  enabled: boolean;
  config: Record<string, any>;
  timeoutMs?: number;
  priority: number;
}

export interface RecoveryPlan {
  id: string;
  errorSignature: string; // Pattern to match errors
  retryStrategy: RetryStrategy;
  fallbackStrategies: FallbackStrategy[];
  escalationThreshold: number;
  autoRecoveryEnabled: boolean;
  requiredPermissions?: string[];
  estimatedRecoveryTime: number; // seconds
  successRate: number; // Historical success rate 0-1
}

export interface RecoveryExecution {
  id: string;
  errorId: string;
  planId: string;
  startedAt: Date;
  completedAt?: Date;
  status: 'pending' | 'in_progress' | 'succeeded' | 'failed' | 'cancelled';
  currentAttempt: number;
  retryHistory: Array<{
    attempt: number;
    timestamp: Date;
    strategy: string;
    result: 'success' | 'failure' | 'timeout';
    duration: number;
    error?: string;
  }>;
  fallbacksExecuted: string[];
  finalResult?: {
    strategy: string;
    success: boolean;
    message: string;
    metadata?: Record<string, any>;
  };
}

export interface RecoveryMetrics {
  totalRecoveries: number;
  successfulRecoveries: number;
  failedRecoveries: number;
  averageRecoveryTime: number;
  recoverySuccessRate: number;
  strategiesUsed: Record<string, number>;
  commonFailurePatterns: Array<{
    pattern: string;
    count: number;
    lastOccurrence: Date;
  }>;
}

export class ErrorRecoveryService {
  private static instance: ErrorRecoveryService;
  private logger: EmailErrorLogger;
  private performanceMonitor: PerformanceMonitor;

  private recoveryPlans: Map<string, RecoveryPlan> = new Map();
  private activeRecoveries: Map<string, RecoveryExecution> = new Map();
  private recoveryHistory: RecoveryExecution[] = [];

  private constructor() {
    this.logger = EmailErrorLogger.getInstance();
    this.performanceMonitor = PerformanceMonitor.getInstance();
    this.initializeDefaultRecoveryPlans();
  }

  public static getInstance(): ErrorRecoveryService {
    if (!ErrorRecoveryService.instance) {
      ErrorRecoveryService.instance = new ErrorRecoveryService();
    }
    return ErrorRecoveryService.instance;
  }

  // =====================
  // Recovery Plan Management
  // =====================

  /**
   * Add a new recovery plan
   */
  async addRecoveryPlan(plan: Omit<RecoveryPlan, 'id'>): Promise<string> {
    const id = generateUUID();
    const recoveryPlan: RecoveryPlan = {
      id,
      ...plan,
    };

    this.recoveryPlans.set(id, recoveryPlan);

    await this.logger.logInfo(
      'configuration',
      'monitoring',
      `Added recovery plan: ${recoveryPlan.errorSignature}`,
      {
        operation: 'add_recovery_plan',
        metadata: { planId: id, errorSignature: plan.errorSignature },
      }
    );

    return id;
  }

  /**
   * Remove a recovery plan
   */
  async removeRecoveryPlan(planId: string): Promise<boolean> {
    const plan = this.recoveryPlans.get(planId);
    if (!plan) {
      return false;
    }

    this.recoveryPlans.delete(planId);

    await this.logger.logInfo(
      'configuration',
      'monitoring',
      `Removed recovery plan: ${plan.errorSignature}`,
      {
        operation: 'remove_recovery_plan',
        metadata: { planId, errorSignature: plan.errorSignature },
      }
    );

    return true;
  }

  /**
   * Get all recovery plans
   */
  getRecoveryPlans(): RecoveryPlan[] {
    return Array.from(this.recoveryPlans.values());
  }

  /**
   * Find the best recovery plan for an error
   */
  private findRecoveryPlan(error: ErrorLogEntry): RecoveryPlan | null {
    const errorSignature = this.generateErrorSignature(error);

    // First, try exact match
    for (const plan of this.recoveryPlans.values()) {
      if (plan.errorSignature === errorSignature) {
        return plan;
      }
    }

    // Then try pattern matching
    for (const plan of this.recoveryPlans.values()) {
      try {
        const regex = new RegExp(plan.errorSignature, 'i');
        if (regex.test(error.message) || regex.test(errorSignature)) {
          return plan;
        }
      } catch (e) {
        // Invalid regex pattern, skip
        continue;
      }
    }

    // Return default plan if available
    return this.recoveryPlans.get('default') || null;
  }

  private generateErrorSignature(error: ErrorLogEntry): string {
    return `${error.level}:${error.category}:${error.source}`;
  }

  // =====================
  // Recovery Execution
  // =====================

  /**
   * Execute recovery for an error
   */
  async executeRecovery(
    errorId: string,
    manualAction?: RecoveryAction
  ): Promise<string> {
    const error = await this.getErrorById(errorId);
    if (!error) {
      throw new Error(`Error not found: ${errorId}`);
    }

    // Check if recovery is already in progress
    const existingRecovery = Array.from(this.activeRecoveries.values()).find(
      r => r.errorId === errorId && r.status === 'in_progress'
    );

    if (existingRecovery) {
      return existingRecovery.id;
    }

    const recoveryPlan = this.findRecoveryPlan(error);
    if (!recoveryPlan && !manualAction) {
      throw new Error(`No recovery plan found for error: ${errorId}`);
    }

    const executionId = generateUUID();
    const execution: RecoveryExecution = {
      id: executionId,
      errorId,
      planId: recoveryPlan?.id || 'manual',
      startedAt: new Date(),
      status: 'in_progress',
      currentAttempt: 0,
      retryHistory: [],
      fallbacksExecuted: [],
    };

    this.activeRecoveries.set(executionId, execution);

    // Start recovery execution asynchronously
    this.performRecovery(execution, recoveryPlan, manualAction).catch(
      async error => {
        await this.logger.logCritical(
          'service_unavailable',
          'monitoring',
          `Recovery execution failed: ${error.message}`,
          {
            operation: 'recovery_execution',
            metadata: { executionId, errorId, error: error.message },
          }
        );
      }
    );

    return executionId;
  }

  /**
   * Cancel an active recovery
   */
  async cancelRecovery(executionId: string): Promise<boolean> {
    const execution = this.activeRecoveries.get(executionId);
    if (!execution || execution.status !== 'in_progress') {
      return false;
    }

    execution.status = 'cancelled';
    execution.completedAt = new Date();

    this.activeRecoveries.delete(executionId);
    this.recoveryHistory.push(execution);

    await this.logger.logWarning(
      'workflow',
      'monitoring',
      `Recovery cancelled: ${executionId}`,
      {
        operation: 'cancel_recovery',
        metadata: { executionId, errorId: execution.errorId },
      }
    );

    return true;
  }

  /**
   * Get recovery status
   */
  getRecoveryStatus(executionId: string): RecoveryExecution | null {
    return (
      this.activeRecoveries.get(executionId) ||
      this.recoveryHistory.find(r => r.id === executionId) ||
      null
    );
  }

  /**
   * Get all active recoveries
   */
  getActiveRecoveries(): RecoveryExecution[] {
    return Array.from(this.activeRecoveries.values());
  }

  // =====================
  // Recovery Strategies
  // =====================

  private async performRecovery(
    execution: RecoveryExecution,
    plan: RecoveryPlan | null,
    manualAction?: RecoveryAction
  ): Promise<void> {
    const startTime = Date.now();

    try {
      let success = false;

      if (manualAction) {
        success = await this.executeManualAction(execution, manualAction);
      } else if (plan) {
        success = await this.executeRecoveryPlan(execution, plan);
      }

      // Complete recovery
      execution.status = success ? 'succeeded' : 'failed';
      execution.completedAt = new Date();
      execution.finalResult = {
        strategy: manualAction?.type || plan?.retryStrategy.type || 'unknown',
        success,
        message: success
          ? 'Recovery completed successfully'
          : 'Recovery failed after all attempts',
      };

      // Move to history
      this.activeRecoveries.delete(execution.id);
      this.recoveryHistory.push(execution);

      // Log completion
      const duration = Date.now() - startTime;
      await this.logger.logInfo(
        'workflow',
        'monitoring',
        `Recovery ${success ? 'succeeded' : 'failed'}: ${execution.id}`,
        {
          operation: 'recovery_completed',
          metadata: {
            executionId: execution.id,
            success,
            duration,
            attempts: execution.currentAttempt,
          },
          performance: { duration },
        }
      );
    } catch (error) {
      execution.status = 'failed';
      execution.completedAt = new Date();
      execution.finalResult = {
        strategy: 'error',
        success: false,
        message: `Recovery execution error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };

      this.activeRecoveries.delete(execution.id);
      this.recoveryHistory.push(execution);

      throw error;
    }
  }

  private async executeManualAction(
    execution: RecoveryExecution,
    action: RecoveryAction
  ): Promise<boolean> {
    execution.currentAttempt = 1;
    const attempt = {
      attempt: 1,
      timestamp: new Date(),
      strategy: action.type,
      result: 'failure' as 'success' | 'failure' | 'timeout',
      duration: 0,
      error: undefined as string | undefined,
    };

    const startTime = Date.now();

    try {
      const success = await this.executeRecoveryAction(
        action,
        execution.errorId
      );

      attempt.result = success ? 'success' : 'failure';
      attempt.duration = Date.now() - startTime;
      execution.retryHistory.push(attempt);

      return success;
    } catch (error) {
      attempt.result = 'failure';
      attempt.duration = Date.now() - startTime;
      attempt.error = error instanceof Error ? error.message : 'Unknown error';
      execution.retryHistory.push(attempt);

      return false;
    }
  }

  private async executeRecoveryPlan(
    execution: RecoveryExecution,
    plan: RecoveryPlan
  ): Promise<boolean> {
    // Execute retry strategy
    const retrySuccess = await this.executeRetryStrategy(
      execution,
      plan.retryStrategy
    );
    if (retrySuccess) {
      return true;
    }

    // Execute fallback strategies
    for (const fallback of plan.fallbackStrategies.sort(
      (a, b) => a.priority - b.priority
    )) {
      if (!fallback.enabled) continue;

      const fallbackSuccess = await this.executeFallbackStrategy(
        execution,
        fallback
      );
      execution.fallbacksExecuted.push(fallback.type);

      if (fallbackSuccess) {
        return true;
      }
    }

    return false;
  }

  private async executeRetryStrategy(
    execution: RecoveryExecution,
    strategy: RetryStrategy
  ): Promise<boolean> {
    for (let attempt = 1; attempt <= strategy.maxAttempts; attempt++) {
      execution.currentAttempt = attempt;

      const attemptRecord = {
        attempt,
        timestamp: new Date(),
        strategy: strategy.type,
        result: 'failure' as 'success' | 'failure' | 'timeout',
        duration: 0,
        error: undefined as string | undefined,
      };

      // Calculate delay
      if (attempt > 1) {
        const delay = this.calculateDelay(attempt - 1, strategy);
        await this.sleep(delay);
      }

      const startTime = Date.now();

      try {
        const action: RecoveryAction = {
          type: 'retry',
          description: `Retry attempt ${attempt} using ${strategy.type}`,
          automated: true,
          config: { attempt, strategy: strategy.type },
        };

        const success = await this.executeRecoveryAction(
          action,
          execution.errorId
        );

        attemptRecord.result = success ? 'success' : 'failure';
        attemptRecord.duration = Date.now() - startTime;
        execution.retryHistory.push(attemptRecord);

        if (success) {
          return true;
        }
      } catch (error) {
        attemptRecord.result = 'failure';
        attemptRecord.duration = Date.now() - startTime;
        attemptRecord.error =
          error instanceof Error ? error.message : 'Unknown error';
        execution.retryHistory.push(attemptRecord);
      }
    }

    return false;
  }

  private async executeFallbackStrategy(
    execution: RecoveryExecution,
    strategy: FallbackStrategy
  ): Promise<boolean> {
    const action: RecoveryAction = {
      type: 'fallback',
      description: `Fallback strategy: ${strategy.type}`,
      automated: true,
      config: strategy.config,
    };

    try {
      return await this.executeRecoveryAction(action, execution.errorId);
    } catch (error) {
      await this.logger.logWarning(
        'workflow',
        'monitoring',
        `Fallback strategy failed: ${strategy.type}`,
        {
          operation: 'fallback_execution',
          metadata: {
            executionId: execution.id,
            strategy: strategy.type,
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        }
      );
      return false;
    }
  }

  private calculateDelay(attempt: number, strategy: RetryStrategy): number {
    let delay = strategy.initialDelayMs;

    switch (strategy.type) {
      case 'immediate':
        delay = 0;
        break;

      case 'exponential_backoff':
        delay =
          strategy.initialDelayMs *
          Math.pow(strategy.backoffMultiplier || 2, attempt);
        break;

      case 'linear_backoff':
        delay =
          strategy.initialDelayMs +
          attempt * (strategy.backoffMultiplier || 1000);
        break;

      case 'fibonacci':
        delay = strategy.initialDelayMs * this.fibonacci(attempt + 1);
        break;

      case 'custom':
        if (strategy.customDelayFunction) {
          delay = strategy.customDelayFunction(
            attempt,
            strategy.initialDelayMs
          );
        }
        break;
    }

    // Apply jitter if enabled
    if (strategy.jitterEnabled) {
      const jitter = Math.random() * 0.1 * delay; // ±10% jitter
      delay += (Math.random() > 0.5 ? 1 : -1) * jitter;
    }

    // Ensure delay doesn't exceed maximum
    return Math.min(delay, strategy.maxDelayMs);
  }

  private fibonacci(n: number): number {
    if (n <= 1) return n;
    let a = 0,
      b = 1;
    for (let i = 2; i <= n; i++) {
      [a, b] = [b, a + b];
    }
    return b;
  }

  private async executeRecoveryAction(
    action: RecoveryAction,
    errorId: string
  ): Promise<boolean> {
    // This would be implemented based on the specific action type
    // For now, we'll simulate different recovery scenarios

    switch (action.type) {
      case 'retry':
        // Simulate retry logic
        return Math.random() > 0.3; // 70% success rate for retries

      case 'fallback':
        // Simulate fallback logic
        return Math.random() > 0.1; // 90% success rate for fallbacks

      case 'circuit_breaker':
        // Check if circuit breaker allows execution
        return !this.logger.isCircuitOpen('email_service');

      case 'degraded_mode':
        // Simulate degraded mode
        return true; // Always succeeds but with reduced functionality

      default:
        return false;
    }
  }

  // =====================
  // Metrics and Reporting
  // =====================

  /**
   * Get recovery metrics
   */
  getRecoveryMetrics(timeWindowHours: number = 24): RecoveryMetrics {
    const cutoffTime = new Date(Date.now() - timeWindowHours * 60 * 60 * 1000);
    const recentRecoveries = this.recoveryHistory.filter(
      r => r.startedAt >= cutoffTime
    );

    const totalRecoveries = recentRecoveries.length;
    const successfulRecoveries = recentRecoveries.filter(
      r => r.status === 'succeeded'
    ).length;
    const failedRecoveries = recentRecoveries.filter(
      r => r.status === 'failed'
    ).length;

    const recoveryTimes = recentRecoveries
      .filter(r => r.completedAt)
      .map(r => r.completedAt!.getTime() - r.startedAt.getTime());

    const averageRecoveryTime =
      recoveryTimes.length > 0
        ? recoveryTimes.reduce((sum, time) => sum + time, 0) /
          recoveryTimes.length /
          1000
        : 0;

    const strategiesUsed: Record<string, number> = {};
    recentRecoveries.forEach(recovery => {
      recovery.retryHistory.forEach(attempt => {
        strategiesUsed[attempt.strategy] =
          (strategiesUsed[attempt.strategy] || 0) + 1;
      });
    });

    return {
      totalRecoveries,
      successfulRecoveries,
      failedRecoveries,
      averageRecoveryTime,
      recoverySuccessRate:
        totalRecoveries > 0 ? successfulRecoveries / totalRecoveries : 0,
      strategiesUsed,
      commonFailurePatterns: [], // Would be implemented with pattern analysis
    };
  }

  // =====================
  // Helper Methods
  // =====================

  private async getErrorById(errorId: string): Promise<ErrorLogEntry | null> {
    // This would typically query the database
    // For now, we'll use the logger's method
    const errors = await this.logger.getErrors({ limit: 1000 });
    return errors.find(e => e.id === errorId) || null;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private initializeDefaultRecoveryPlans(): void {
    // Email delivery failures
    this.recoveryPlans.set('email_delivery_failure', {
      id: 'email_delivery_failure',
      errorSignature: 'critical:email_delivery:.*',
      retryStrategy: {
        type: 'exponential_backoff',
        maxAttempts: 3,
        initialDelayMs: 1000,
        maxDelayMs: 30000,
        backoffMultiplier: 2,
        jitterEnabled: true,
      },
      fallbackStrategies: [
        {
          type: 'queue_for_later',
          enabled: true,
          config: { delayMinutes: 30 },
          priority: 1,
        },
        {
          type: 'manual_intervention',
          enabled: true,
          config: { alertLevel: 'critical' },
          priority: 2,
        },
      ],
      escalationThreshold: 3,
      autoRecoveryEnabled: true,
      estimatedRecoveryTime: 120,
      successRate: 0.85,
    });

    // Rate limit errors
    this.recoveryPlans.set('rate_limit_error', {
      id: 'rate_limit_error',
      errorSignature: '.*:rate_limit:.*',
      retryStrategy: {
        type: 'linear_backoff',
        maxAttempts: 5,
        initialDelayMs: 60000, // 1 minute
        maxDelayMs: 300000, // 5 minutes
        backoffMultiplier: 60000, // 1 minute increments
      },
      fallbackStrategies: [
        {
          type: 'queue_for_later',
          enabled: true,
          config: { delayMinutes: 60 },
          priority: 1,
        },
      ],
      escalationThreshold: 5,
      autoRecoveryEnabled: true,
      estimatedRecoveryTime: 300,
      successRate: 0.95,
    });

    // Default recovery plan
    this.recoveryPlans.set('default', {
      id: 'default',
      errorSignature: '.*',
      retryStrategy: {
        type: 'exponential_backoff',
        maxAttempts: 2,
        initialDelayMs: 500,
        maxDelayMs: 10000,
        backoffMultiplier: 2,
      },
      fallbackStrategies: [
        {
          type: 'degraded_mode',
          enabled: true,
          config: {},
          priority: 1,
        },
      ],
      escalationThreshold: 2,
      autoRecoveryEnabled: true,
      estimatedRecoveryTime: 60,
      successRate: 0.6,
    });
  }
}
