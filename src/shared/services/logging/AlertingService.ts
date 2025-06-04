/**
 * Alerting Service
 *
 * Real-time alerting and notification management system for error monitoring
 * Integrates with EmailErrorLogger and recovery services for comprehensive alerting
 */

import {
  ErrorLevel,
  ErrorCategory,
  ErrorSource,
  ErrorAlert,
  ErrorAlertCondition,
  ErrorNotificationChannel,
  ErrorLogEntry,
  ErrorMetrics,
} from './types';

// Additional alerting-specific types
export interface AlertRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  severity: ErrorLevel;
  conditions: AlertCondition[];
  actions: AlertAction[];
  throttleMinutes: number;
  lastTriggered?: Date;
  triggerCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AlertCondition {
  type: 'threshold' | 'pattern' | 'anomaly' | 'service_health';
  operator:
    | 'greater_than'
    | 'less_than'
    | 'equals'
    | 'contains'
    | 'regex_match';
  value: string | number;
  timeWindow: number; // minutes
  field: string; // error property to evaluate
}

export interface AlertAction {
  type: 'email' | 'webhook' | 'slack' | 'teams' | 'sms' | 'push' | 'escalate';
  enabled: boolean;
  config: AlertActionConfig;
  delay?: number; // minutes to delay action
}

export interface AlertActionConfig {
  // Email configuration
  email?: {
    recipients: string[];
    subject?: string;
    template?: string;
  };

  // Webhook configuration
  webhook?: {
    url: string;
    method: 'POST' | 'PUT' | 'PATCH';
    headers?: Record<string, string>;
    payload?: Record<string, any>;
    timeout?: number;
  };

  // Slack configuration
  slack?: {
    channel: string;
    token: string;
    username?: string;
    iconEmoji?: string;
  };

  // Escalation configuration
  escalation?: {
    escalateTo: string[]; // User IDs or role names
    escalateAfter: number; // minutes
    maxEscalations: number;
  };
}

export interface AlertInstance {
  id: string;
  ruleId: string;
  ruleName: string;
  triggeredAt: Date;
  severity: ErrorLevel;
  message: string;
  context: Record<string, any>;
  status: 'active' | 'acknowledged' | 'resolved' | 'escalated';
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  escalationLevel: number;
  relatedErrors: string[]; // Error log entry IDs
  actions: AlertActionExecution[];
}

export interface AlertActionExecution {
  actionType: string;
  executedAt: Date;
  success: boolean;
  error?: string;
  response?: any;
  duration: number;
}

export interface AlertMetrics {
  timeWindow: {
    start: Date;
    end: Date;
  };
  totalAlerts: number;
  alertsBySeverity: Record<ErrorLevel, number>;
  alertsByRule: Record<string, number>;
  averageResponseTime: number; // minutes
  acknowledgmentRate: number; // percentage
  resolutionRate: number; // percentage
  falsePositiveRate: number; // percentage
  escalationRate: number; // percentage
  topAlertRules: Array<{
    ruleId: string;
    ruleName: string;
    count: number;
    averageResolutionTime: number;
  }>;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: 'email' | 'slack' | 'webhook';
  subject?: string;
  body: string;
  variables: string[]; // Available template variables
  createdAt: Date;
  updatedAt: Date;
}

export interface AlertingConfig {
  enabled: boolean;
  defaultThrottleMinutes: number;
  maxAlertsPerMinute: number;
  enableEscalation: boolean;
  escalationTimeoutMinutes: number;
  retryFailedActions: boolean;
  maxActionRetries: number;
  actionRetryDelayMs: number;
  enableDeduplication: boolean;
  deduplicationWindowMinutes: number;
  enableTesting: boolean;
  testRecipients: string[];
}

/**
 * AlertingService - Centralized alerting and notification management
 */
export class AlertingService {
  private static instance: AlertingService;
  private alerts: Map<string, AlertRule> = new Map();
  private activeAlerts: Map<string, AlertInstance> = new Map();
  private templates: Map<string, NotificationTemplate> = new Map();
  private config: AlertingConfig;
  private isInitialized = false;
  private actionQueue: Array<{ instance: AlertInstance; action: AlertAction }> =
    [];
  private processingQueue = false;

  private constructor() {
    this.config = this.getDefaultConfig();
    this.initializeDefaultRules();
    this.initializeDefaultTemplates();
    this.startActionProcessor();
  }

  public static getInstance(): AlertingService {
    if (!AlertingService.instance) {
      AlertingService.instance = new AlertingService();
    }
    return AlertingService.instance;
  }

  /**
   * Initialize the alerting service with configuration
   */
  public async initialize(config?: Partial<AlertingConfig>): Promise<void> {
    if (this.isInitialized) {
      console.warn('[AlertingService] Service already initialized');
      return;
    }

    this.config = { ...this.config, ...config };
    this.isInitialized = true;

    console.log('[AlertingService] Initialized successfully', {
      enabled: this.config.enabled,
      alertRules: this.alerts.size,
      templates: this.templates.size,
    });
  }

  /**
   * Evaluate errors against alert rules and trigger alerts if conditions are met
   */
  public async evaluateError(error: ErrorLogEntry): Promise<void> {
    if (!this.config.enabled) return;

    const triggeredRules: AlertRule[] = [];

    for (const rule of this.alerts.values()) {
      if (!rule.enabled) continue;

      // Check if rule is throttled
      if (this.isRuleThrottled(rule)) continue;

      // Evaluate rule conditions
      if (await this.evaluateRuleConditions(rule, error)) {
        triggeredRules.push(rule);
      }
    }

    // Trigger alerts for matching rules
    for (const rule of triggeredRules) {
      await this.triggerAlert(rule, error);
    }
  }

  /**
   * Evaluate metrics against alert rules for threshold-based alerts
   */
  public async evaluateMetrics(metrics: ErrorMetrics): Promise<void> {
    if (!this.config.enabled) return;

    for (const rule of this.alerts.values()) {
      if (!rule.enabled) continue;
      if (this.isRuleThrottled(rule)) continue;

      // Check for threshold-based conditions
      for (const condition of rule.conditions) {
        if (
          condition.type === 'threshold' &&
          this.evaluateMetricCondition(condition, metrics)
        ) {
          await this.triggerMetricAlert(rule, condition, metrics);
        }
      }
    }
  }

  /**
   * Create a new alert rule
   */
  public async createAlertRule(
    rule: Omit<AlertRule, 'id' | 'createdAt' | 'updatedAt' | 'triggerCount'>
  ): Promise<string> {
    const alertRule: AlertRule = {
      ...rule,
      id: this.generateId(),
      triggerCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.alerts.set(alertRule.id, alertRule);

    console.log('[AlertingService] Created alert rule', {
      ruleId: alertRule.id,
      name: alertRule.name,
      conditions: alertRule.conditions.length,
      actions: alertRule.actions.length,
    });

    return alertRule.id;
  }

  /**
   * Update an existing alert rule
   */
  public async updateAlertRule(
    ruleId: string,
    updates: Partial<AlertRule>
  ): Promise<boolean> {
    const rule = this.alerts.get(ruleId);
    if (!rule) {
      console.warn('[AlertingService] Alert rule not found for update', {
        ruleId,
      });
      return false;
    }

    const updatedRule = {
      ...rule,
      ...updates,
      updatedAt: new Date(),
    };

    this.alerts.set(ruleId, updatedRule);

    console.log('[AlertingService] Updated alert rule', {
      ruleId,
      changes: Object.keys(updates),
    });

    return true;
  }

  /**
   * Delete an alert rule
   */
  public async deleteAlertRule(ruleId: string): Promise<boolean> {
    const deleted = this.alerts.delete(ruleId);

    if (deleted) {
      // Also remove any active alerts for this rule
      for (const [alertId, alert] of this.activeAlerts) {
        if (alert.ruleId === ruleId) {
          this.activeAlerts.delete(alertId);
        }
      }

      console.log('[AlertingService] Deleted alert rule', { ruleId });
    }

    return deleted;
  }

  /**
   * Get alert rule by ID
   */
  public getAlertRule(ruleId: string): AlertRule | undefined {
    return this.alerts.get(ruleId);
  }

  /**
   * Get all alert rules
   */
  public getAllAlertRules(): AlertRule[] {
    return Array.from(this.alerts.values());
  }

  /**
   * Get active alerts
   */
  public getActiveAlerts(): AlertInstance[] {
    return Array.from(this.activeAlerts.values()).filter(
      alert => alert.status === 'active'
    );
  }

  /**
   * Acknowledge an alert
   */
  public async acknowledgeAlert(
    alertId: string,
    acknowledgedBy: string
  ): Promise<boolean> {
    const alert = this.activeAlerts.get(alertId);
    if (!alert || alert.status !== 'active') {
      return false;
    }

    alert.status = 'acknowledged';
    alert.acknowledgedBy = acknowledgedBy;
    alert.acknowledgedAt = new Date();

    console.log('[AlertingService] Alert acknowledged', {
      alertId,
      acknowledgedBy,
      ruleName: alert.ruleName,
    });

    return true;
  }

  /**
   * Resolve an alert
   */
  public async resolveAlert(alertId: string): Promise<boolean> {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) {
      return false;
    }

    alert.status = 'resolved';
    alert.resolvedAt = new Date();

    console.log('[AlertingService] Alert resolved', {
      alertId,
      ruleName: alert.ruleName,
      duration: alert.resolvedAt.getTime() - alert.triggeredAt.getTime(),
    });

    return true;
  }

  /**
   * Get alerting metrics for a time window
   */
  public async getAlertMetrics(
    startTime: Date,
    endTime: Date
  ): Promise<AlertMetrics> {
    const alerts = Array.from(this.activeAlerts.values()).filter(
      alert => alert.triggeredAt >= startTime && alert.triggeredAt <= endTime
    );

    const alertsBySeverity: Record<ErrorLevel, number> = {
      critical: 0,
      warning: 0,
      info: 0,
      debug: 0,
    };

    const alertsByRule: Record<string, number> = {};

    for (const alert of alerts) {
      alertsBySeverity[alert.severity]++;
      alertsByRule[alert.ruleId] = (alertsByRule[alert.ruleId] || 0) + 1;
    }

    const acknowledgedAlerts = alerts.filter(a => a.acknowledgedAt);
    const resolvedAlerts = alerts.filter(a => a.resolvedAt);
    const escalatedAlerts = alerts.filter(a => a.escalationLevel > 0);

    return {
      timeWindow: { start: startTime, end: endTime },
      totalAlerts: alerts.length,
      alertsBySeverity,
      alertsByRule,
      averageResponseTime:
        this.calculateAverageResponseTime(acknowledgedAlerts),
      acknowledgmentRate:
        alerts.length > 0
          ? (acknowledgedAlerts.length / alerts.length) * 100
          : 0,
      resolutionRate:
        alerts.length > 0 ? (resolvedAlerts.length / alerts.length) * 100 : 0,
      falsePositiveRate: 0, // TODO: Implement false positive tracking
      escalationRate:
        alerts.length > 0 ? (escalatedAlerts.length / alerts.length) * 100 : 0,
      topAlertRules: this.calculateTopAlertRules(alerts),
    };
  }

  /**
   * Test an alert rule with sample data
   */
  public async testAlertRule(
    ruleId: string,
    testData?: any
  ): Promise<{ success: boolean; message: string; details?: any }> {
    const rule = this.alerts.get(ruleId);
    if (!rule) {
      return { success: false, message: 'Alert rule not found' };
    }

    if (!this.config.enableTesting) {
      return { success: false, message: 'Alert testing is disabled' };
    }

    try {
      // Create a test alert instance
      const testAlert: AlertInstance = {
        id: this.generateId(),
        ruleId: rule.id,
        ruleName: rule.name,
        triggeredAt: new Date(),
        severity: rule.severity,
        message: `Test alert for rule: ${rule.name}`,
        context: testData || { test: true },
        status: 'active',
        escalationLevel: 0,
        relatedErrors: [],
        actions: [],
      };

      // Execute test actions (to test recipients only)
      for (const action of rule.actions) {
        if (action.enabled) {
          await this.executeTestAction(testAlert, action);
        }
      }

      return {
        success: true,
        message: 'Alert rule test completed successfully',
        details: {
          ruleId,
          actionsExecuted: rule.actions.filter(a => a.enabled).length,
          testRecipients: this.config.testRecipients,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Alert rule test failed',
        details: {
          error: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  // Private helper methods

  private getDefaultConfig(): AlertingConfig {
    return {
      enabled: true,
      defaultThrottleMinutes: 15,
      maxAlertsPerMinute: 10,
      enableEscalation: true,
      escalationTimeoutMinutes: 30,
      retryFailedActions: true,
      maxActionRetries: 3,
      actionRetryDelayMs: 5000,
      enableDeduplication: true,
      deduplicationWindowMinutes: 5,
      enableTesting: true,
      testRecipients: ['test@example.com'],
    };
  }

  private initializeDefaultRules(): void {
    // Critical error rate alert
    const criticalErrorRule: AlertRule = {
      id: 'critical-error-rate',
      name: 'High Critical Error Rate',
      description: 'Triggers when critical error rate exceeds threshold',
      enabled: true,
      severity: 'critical',
      conditions: [
        {
          type: 'threshold',
          operator: 'greater_than',
          value: 5,
          timeWindow: 5,
          field: 'error_rate',
        },
      ],
      actions: [
        {
          type: 'email',
          enabled: true,
          config: {
            email: {
              recipients: ['admin@practice.com'],
              subject: 'CRITICAL: High Error Rate Detected',
            },
          },
        },
      ],
      throttleMinutes: 30,
      triggerCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.alerts.set(criticalErrorRule.id, criticalErrorRule);
  }

  private initializeDefaultTemplates(): void {
    const emailTemplate: NotificationTemplate = {
      id: 'default-email',
      name: 'Default Email Alert',
      type: 'email',
      subject: 'Alert: {{alertName}} - {{severity}}',
      body: `
        Alert Triggered: {{alertName}}
        Severity: {{severity}}
        Time: {{triggeredAt}}
        Message: {{message}}
        
        Context: {{context}}
        
        Please investigate and take appropriate action.
      `,
      variables: ['alertName', 'severity', 'triggeredAt', 'message', 'context'],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.templates.set(emailTemplate.id, emailTemplate);
  }

  private isRuleThrottled(rule: AlertRule): boolean {
    if (!rule.lastTriggered) return false;

    const timeSinceLastTrigger = Date.now() - rule.lastTriggered.getTime();
    const throttleMs = rule.throttleMinutes * 60 * 1000;

    return timeSinceLastTrigger < throttleMs;
  }

  private async evaluateRuleConditions(
    rule: AlertRule,
    error: ErrorLogEntry
  ): Promise<boolean> {
    for (const condition of rule.conditions) {
      if (!this.evaluateCondition(condition, error)) {
        return false;
      }
    }
    return true;
  }

  private evaluateCondition(
    condition: AlertCondition,
    error: ErrorLogEntry
  ): boolean {
    // Simple condition evaluation - can be extended
    switch (condition.field) {
      case 'level':
        return error.level === condition.value;
      case 'category':
        return error.category === condition.value;
      case 'source':
        return error.source === condition.value;
      default:
        return false;
    }
  }

  private evaluateMetricCondition(
    condition: AlertCondition,
    metrics: ErrorMetrics
  ): boolean {
    switch (condition.field) {
      case 'error_rate':
        return this.compareValues(
          metrics.errorRate,
          condition.operator,
          condition.value
        );
      case 'error_count':
        return this.compareValues(
          metrics.errorCount,
          condition.operator,
          condition.value
        );
      default:
        return false;
    }
  }

  private compareValues(
    actual: number,
    operator: string,
    expected: string | number
  ): boolean {
    const expectedNum =
      typeof expected === 'string' ? parseFloat(expected) : expected;

    switch (operator) {
      case 'greater_than':
        return actual > expectedNum;
      case 'less_than':
        return actual < expectedNum;
      case 'equals':
        return actual === expectedNum;
      default:
        return false;
    }
  }

  private async triggerAlert(
    rule: AlertRule,
    error: ErrorLogEntry
  ): Promise<void> {
    const alertInstance: AlertInstance = {
      id: this.generateId(),
      ruleId: rule.id,
      ruleName: rule.name,
      triggeredAt: new Date(),
      severity: rule.severity,
      message: `Alert triggered: ${rule.name}`,
      context: { error: error.id, errorMessage: error.message },
      status: 'active',
      escalationLevel: 0,
      relatedErrors: [error.id],
      actions: [],
    };

    this.activeAlerts.set(alertInstance.id, alertInstance);
    rule.lastTriggered = new Date();
    rule.triggerCount++;

    // Queue actions for execution
    for (const action of rule.actions) {
      if (action.enabled) {
        this.actionQueue.push({ instance: alertInstance, action });
      }
    }

    console.log('[AlertingService] Alert triggered', {
      alertId: alertInstance.id,
      ruleId: rule.id,
      ruleName: rule.name,
      severity: rule.severity,
    });
  }

  private async triggerMetricAlert(
    rule: AlertRule,
    condition: AlertCondition,
    metrics: ErrorMetrics
  ): Promise<void> {
    const alertInstance: AlertInstance = {
      id: this.generateId(),
      ruleId: rule.id,
      ruleName: rule.name,
      triggeredAt: new Date(),
      severity: rule.severity,
      message: `Metric threshold exceeded: ${condition.field} ${condition.operator} ${condition.value}`,
      context: { condition, metrics },
      status: 'active',
      escalationLevel: 0,
      relatedErrors: [],
      actions: [],
    };

    this.activeAlerts.set(alertInstance.id, alertInstance);
    rule.lastTriggered = new Date();
    rule.triggerCount++;

    // Queue actions for execution
    for (const action of rule.actions) {
      if (action.enabled) {
        this.actionQueue.push({ instance: alertInstance, action });
      }
    }
  }

  private startActionProcessor(): void {
    setInterval(() => {
      if (!this.processingQueue && this.actionQueue.length > 0) {
        this.processActionQueue();
      }
    }, 1000);
  }

  private async processActionQueue(): Promise<void> {
    if (this.processingQueue) return;

    this.processingQueue = true;

    try {
      while (this.actionQueue.length > 0) {
        const { instance, action } = this.actionQueue.shift()!;
        await this.executeAction(instance, action);
      }
    } finally {
      this.processingQueue = false;
    }
  }

  private async executeAction(
    instance: AlertInstance,
    action: AlertAction
  ): Promise<void> {
    const execution: AlertActionExecution = {
      actionType: action.type,
      executedAt: new Date(),
      success: false,
      duration: 0,
    };

    const startTime = Date.now();

    try {
      switch (action.type) {
        case 'email':
          await this.executeEmailAction(instance, action);
          break;
        case 'webhook':
          await this.executeWebhookAction(instance, action);
          break;
        case 'escalate':
          await this.executeEscalationAction(instance, action);
          break;
        default:
          console.warn('[AlertingService] Unknown action type', {
            type: action.type,
          });
      }

      execution.success = true;
    } catch (error) {
      execution.success = false;
      execution.error = error instanceof Error ? error.message : String(error);

      console.error('[AlertingService] Action execution failed', {
        alertId: instance.id,
        actionType: action.type,
        error: execution.error,
      });
    } finally {
      execution.duration = Date.now() - startTime;
      instance.actions.push(execution);
    }
  }

  private async executeEmailAction(
    instance: AlertInstance,
    action: AlertAction
  ): Promise<void> {
    const emailConfig = action.config.email;
    if (!emailConfig) throw new Error('Email configuration missing');

    // In a real implementation, this would integrate with the email service
    console.log('[AlertingService] Sending email alert', {
      alertId: instance.id,
      recipients: emailConfig.recipients,
      subject: emailConfig.subject || `Alert: ${instance.ruleName}`,
    });

    // Simulate email sending
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private async executeWebhookAction(
    instance: AlertInstance,
    action: AlertAction
  ): Promise<void> {
    const webhookConfig = action.config.webhook;
    if (!webhookConfig) throw new Error('Webhook configuration missing');

    // In a real implementation, this would make an HTTP request
    console.log('[AlertingService] Sending webhook alert', {
      alertId: instance.id,
      url: webhookConfig.url,
      method: webhookConfig.method,
    });

    // Simulate webhook call
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  private async executeEscalationAction(
    instance: AlertInstance,
    action: AlertAction
  ): Promise<void> {
    const escalationConfig = action.config.escalation;
    if (!escalationConfig) throw new Error('Escalation configuration missing');

    instance.escalationLevel++;
    instance.status = 'escalated';

    console.log('[AlertingService] Escalating alert', {
      alertId: instance.id,
      escalationLevel: instance.escalationLevel,
      escalateTo: escalationConfig.escalateTo,
    });
  }

  private async executeTestAction(
    instance: AlertInstance,
    action: AlertAction
  ): Promise<void> {
    // Execute action but send to test recipients only
    const modifiedAction = { ...action };

    if (modifiedAction.config.email) {
      modifiedAction.config.email.recipients = this.config.testRecipients;
    }

    await this.executeAction(instance, modifiedAction);
  }

  private calculateAverageResponseTime(
    acknowledgedAlerts: AlertInstance[]
  ): number {
    if (acknowledgedAlerts.length === 0) return 0;

    const totalResponseTime = acknowledgedAlerts.reduce((sum, alert) => {
      if (alert.acknowledgedAt) {
        return (
          sum + (alert.acknowledgedAt.getTime() - alert.triggeredAt.getTime())
        );
      }
      return sum;
    }, 0);

    return totalResponseTime / acknowledgedAlerts.length / (1000 * 60); // Convert to minutes
  }

  private calculateTopAlertRules(alerts: AlertInstance[]): Array<{
    ruleId: string;
    ruleName: string;
    count: number;
    averageResolutionTime: number;
  }> {
    const ruleStats: Record<
      string,
      {
        count: number;
        totalResolutionTime: number;
        resolvedCount: number;
      }
    > = {};

    for (const alert of alerts) {
      if (!ruleStats[alert.ruleId]) {
        ruleStats[alert.ruleId] = {
          count: 0,
          totalResolutionTime: 0,
          resolvedCount: 0,
        };
      }

      ruleStats[alert.ruleId].count++;

      if (alert.resolvedAt) {
        ruleStats[alert.ruleId].totalResolutionTime +=
          alert.resolvedAt.getTime() - alert.triggeredAt.getTime();
        ruleStats[alert.ruleId].resolvedCount++;
      }
    }

    return Object.entries(ruleStats)
      .map(([ruleId, stats]) => ({
        ruleId,
        ruleName: this.alerts.get(ruleId)?.name || 'Unknown',
        count: stats.count,
        averageResolutionTime:
          stats.resolvedCount > 0
            ? stats.totalResolutionTime / stats.resolvedCount / (1000 * 60)
            : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}

// Export singleton instance
export const alertingService = AlertingService.getInstance();
