/**
 * Fallback Service
 *
 * Handles graceful degradation and alternative service implementations
 * when primary email services fail or become unavailable
 */

import { EmailErrorLogger } from './EmailErrorLogger';
import { generateUUID } from '@/shared/utils/uuid';
import { ErrorLevel, ErrorCategory, ErrorSource, ErrorContext } from './types';

export interface FallbackProvider {
  id: string;
  name: string;
  type: 'email_provider' | 'storage' | 'cache' | 'queue' | 'notification';
  priority: number;
  enabled: boolean;
  healthCheckUrl?: string;
  config: Record<string, any>;
  rateLimits?: {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
  };
  failureThreshold: number;
  recoveryTime: number; // minutes
  lastHealthCheck?: Date;
  isHealthy: boolean;
  failureCount: number;
  lastFailure?: Date;
}

export interface FallbackExecution {
  id: string;
  originalService: string;
  fallbackProvider: FallbackProvider;
  startedAt: Date;
  completedAt?: Date;
  status: 'pending' | 'executing' | 'completed' | 'failed' | 'timeout';
  originalRequest: any;
  fallbackRequest?: any;
  response?: any;
  error?: string;
  duration: number;
  metadata: Record<string, any>;
}

export interface DegradedModeConfig {
  level: 'minimal' | 'reduced' | 'emergency';
  features: {
    emailDelivery: boolean;
    tracking: boolean;
    analytics: boolean;
    notifications: boolean;
    scheduling: boolean;
    templates: boolean;
  };
  limitations: {
    maxEmailsPerHour: number;
    maxRecipientsPerEmail: number;
    allowedTemplateTypes: string[];
    reducedTracking: boolean;
  };
  fallbackEndpoints: Record<string, string>;
  cacheStrategy: 'aggressive' | 'normal' | 'disabled';
}

export class FallbackService {
  private static instance: FallbackService;
  private logger: EmailErrorLogger;

  private providers: Map<string, FallbackProvider> = new Map();
  private activeExecutions: Map<string, FallbackExecution> = new Map();
  private executionHistory: FallbackExecution[] = [];
  private degradedMode: DegradedModeConfig | null = null;
  private healthCheckInterval?: NodeJS.Timeout;

  private constructor() {
    this.logger = EmailErrorLogger.getInstance();
    this.initializeDefaultProviders();
    this.startHealthChecks();
  }

  public static getInstance(): FallbackService {
    if (!FallbackService.instance) {
      FallbackService.instance = new FallbackService();
    }
    return FallbackService.instance;
  }

  // =====================
  // Provider Management
  // =====================

  /**
   * Register a fallback provider
   */
  async registerProvider(
    provider: Omit<FallbackProvider, 'id'>
  ): Promise<string> {
    const id = generateUUID();
    const fallbackProvider: FallbackProvider = {
      id,
      isHealthy: true,
      failureCount: 0,
      ...provider,
    };

    this.providers.set(id, fallbackProvider);

    await this.logger.logInfo(
      'configuration',
      'monitoring',
      `Registered fallback provider: ${provider.name}`,
      {
        operation: 'register_provider',
        metadata: { providerId: id, providerType: provider.type },
      }
    );

    return id;
  }

  /**
   * Unregister a fallback provider
   */
  async unregisterProvider(providerId: string): Promise<boolean> {
    const provider = this.providers.get(providerId);
    if (!provider) {
      return false;
    }

    this.providers.delete(providerId);

    await this.logger.logInfo(
      'configuration',
      'monitoring',
      `Unregistered fallback provider: ${provider.name}`,
      {
        operation: 'unregister_provider',
        metadata: { providerId, providerType: provider.type },
      }
    );

    return true;
  }

  /**
   * Get available providers for a specific type
   */
  getAvailableProviders(type: FallbackProvider['type']): FallbackProvider[] {
    return Array.from(this.providers.values())
      .filter(p => p.type === type && p.enabled && p.isHealthy)
      .sort((a, b) => a.priority - b.priority);
  }

  /**
   * Update provider health status
   */
  async updateProviderHealth(
    providerId: string,
    isHealthy: boolean,
    error?: string
  ): Promise<void> {
    const provider = this.providers.get(providerId);
    if (!provider) {
      return;
    }

    const wasHealthy = provider.isHealthy;
    provider.isHealthy = isHealthy;
    provider.lastHealthCheck = new Date();

    if (!isHealthy) {
      provider.failureCount++;
      provider.lastFailure = new Date();

      if (provider.failureCount >= provider.failureThreshold) {
        provider.enabled = false;

        await this.logger.logCritical(
          'service_unavailable',
          'monitoring',
          `Fallback provider disabled due to failures: ${provider.name}`,
          {
            operation: 'provider_disabled',
            metadata: {
              providerId,
              failureCount: provider.failureCount,
              threshold: provider.failureThreshold,
              error,
            },
          }
        );
      }
    } else if (wasHealthy !== isHealthy) {
      // Provider recovered
      provider.failureCount = 0;
      provider.enabled = true;

      await this.logger.logInfo(
        'service_unavailable',
        'monitoring',
        `Fallback provider recovered: ${provider.name}`,
        {
          operation: 'provider_recovered',
          metadata: { providerId },
        }
      );
    }
  }

  // =====================
  // Fallback Execution
  // =====================

  /**
   * Execute fallback for a failed operation
   */
  async executeFallback(
    originalService: string,
    fallbackType: FallbackProvider['type'],
    originalRequest: any,
    metadata: Record<string, any> = {}
  ): Promise<any> {
    const providers = this.getAvailableProviders(fallbackType);

    if (providers.length === 0) {
      throw new Error(
        `No available fallback providers for type: ${fallbackType}`
      );
    }

    const executionId = generateUUID();
    let lastError: Error | null = null;

    for (const provider of providers) {
      const execution: FallbackExecution = {
        id: executionId,
        originalService,
        fallbackProvider: provider,
        startedAt: new Date(),
        status: 'executing',
        originalRequest,
        duration: 0,
        metadata,
      };

      this.activeExecutions.set(executionId, execution);

      try {
        const result = await this.executeWithProvider(
          execution,
          provider,
          originalRequest
        );

        execution.status = 'completed';
        execution.completedAt = new Date();
        execution.response = result;
        execution.duration =
          execution.completedAt.getTime() - execution.startedAt.getTime();

        this.activeExecutions.delete(executionId);
        this.executionHistory.push(execution);

        await this.logger.logInfo(
          'service_unavailable',
          'monitoring',
          `Fallback execution successful: ${provider.name}`,
          {
            operation: 'fallback_success',
            metadata: {
              executionId,
              providerId: provider.id,
              originalService,
              duration: execution.duration,
            },
            performance: { duration: execution.duration },
          }
        );

        return result;
      } catch (error) {
        execution.status = 'failed';
        execution.completedAt = new Date();
        execution.error =
          error instanceof Error ? error.message : 'Unknown error';
        execution.duration =
          execution.completedAt.getTime() - execution.startedAt.getTime();

        lastError = error instanceof Error ? error : new Error('Unknown error');

        await this.updateProviderHealth(provider.id, false, execution.error);

        await this.logger.logWarning(
          'service_unavailable',
          'monitoring',
          `Fallback execution failed: ${provider.name}`,
          {
            operation: 'fallback_failure',
            metadata: {
              executionId,
              providerId: provider.id,
              originalService,
              error: execution.error,
            },
          }
        );

        this.activeExecutions.delete(executionId);
        this.executionHistory.push(execution);
      }
    }

    // All providers failed
    throw new Error(
      `All fallback providers failed. Last error: ${lastError?.message}`
    );
  }

  /**
   * Execute operation with specific provider
   */
  private async executeWithProvider(
    execution: FallbackExecution,
    provider: FallbackProvider,
    request: any
  ): Promise<any> {
    // Check rate limits
    if (provider.rateLimits && !this.checkRateLimit(provider)) {
      throw new Error(`Rate limit exceeded for provider: ${provider.name}`);
    }

    // Transform request based on provider configuration
    const transformedRequest = this.transformRequest(request, provider);
    execution.fallbackRequest = transformedRequest;

    // Execute based on provider type
    switch (provider.type) {
      case 'email_provider':
        return await this.executeEmailFallback(provider, transformedRequest);

      case 'storage':
        return await this.executeStorageFallback(provider, transformedRequest);

      case 'cache':
        return await this.executeCacheFallback(provider, transformedRequest);

      case 'queue':
        return await this.executeQueueFallback(provider, transformedRequest);

      case 'notification':
        return await this.executeNotificationFallback(
          provider,
          transformedRequest
        );

      default:
        throw new Error(`Unsupported provider type: ${provider.type}`);
    }
  }

  // =====================
  // Provider Type Implementations
  // =====================

  private async executeEmailFallback(
    provider: FallbackProvider,
    request: any
  ): Promise<any> {
    // Simulate email provider fallback
    // In real implementation, this would integrate with alternative email services
    return {
      messageId: `fallback-${generateUUID()}`,
      status: 'queued',
      provider: provider.name,
      timestamp: new Date().toISOString(),
    };
  }

  private async executeStorageFallback(
    provider: FallbackProvider,
    request: any
  ): Promise<any> {
    // Simulate storage fallback
    return {
      stored: true,
      location: `${provider.config.baseUrl}/${generateUUID()}`,
      provider: provider.name,
    };
  }

  private async executeCacheFallback(
    provider: FallbackProvider,
    request: any
  ): Promise<any> {
    // Simulate cache fallback
    return {
      cached: true,
      key: request.key,
      ttl: provider.config.defaultTtl || 3600,
      provider: provider.name,
    };
  }

  private async executeQueueFallback(
    provider: FallbackProvider,
    request: any
  ): Promise<any> {
    // Simulate queue fallback
    return {
      queued: true,
      jobId: generateUUID(),
      estimatedDelay: provider.config.processingDelay || 0,
      provider: provider.name,
    };
  }

  private async executeNotificationFallback(
    provider: FallbackProvider,
    request: any
  ): Promise<any> {
    // Simulate notification fallback
    return {
      notified: true,
      channel: provider.config.channel || 'email',
      provider: provider.name,
    };
  }

  // =====================
  // Degraded Mode Management
  // =====================

  /**
   * Enter degraded mode
   */
  async enterDegradedMode(
    level: DegradedModeConfig['level'],
    reason: string
  ): Promise<void> {
    this.degradedMode = this.createDegradedModeConfig(level);

    await this.logger.logCritical(
      'service_unavailable',
      'monitoring',
      `Entered degraded mode: ${level}`,
      {
        operation: 'enter_degraded_mode',
        metadata: {
          level,
          reason,
          config: this.degradedMode,
        },
      }
    );
  }

  /**
   * Exit degraded mode
   */
  async exitDegradedMode(): Promise<void> {
    if (!this.degradedMode) {
      return;
    }

    const previousLevel = this.degradedMode.level;
    this.degradedMode = null;

    await this.logger.logInfo(
      'service_unavailable',
      'monitoring',
      `Exited degraded mode: ${previousLevel}`,
      {
        operation: 'exit_degraded_mode',
        metadata: { previousLevel },
      }
    );
  }

  /**
   * Check if system is in degraded mode
   */
  isInDegradedMode(): boolean {
    return this.degradedMode !== null;
  }

  /**
   * Get current degraded mode configuration
   */
  getDegradedModeConfig(): DegradedModeConfig | null {
    return this.degradedMode;
  }

  /**
   * Check if a feature is available in current mode
   */
  isFeatureAvailable(feature: keyof DegradedModeConfig['features']): boolean {
    if (!this.degradedMode) {
      return true;
    }
    return this.degradedMode.features[feature];
  }

  // =====================
  // Helper Methods
  // =====================

  private transformRequest(request: any, provider: FallbackProvider): any {
    // Apply provider-specific request transformations
    const transformed = { ...request };

    // Apply provider configuration
    if (provider.config.requestTransform) {
      // Apply custom transformations based on provider config
      Object.assign(transformed, provider.config.requestTransform);
    }

    return transformed;
  }

  private checkRateLimit(provider: FallbackProvider): boolean {
    if (!provider.rateLimits) {
      return true;
    }

    // Simple rate limiting check
    // In real implementation, this would use a proper rate limiter
    const now = Date.now();
    const recentExecutions = this.executionHistory.filter(
      e =>
        e.fallbackProvider.id === provider.id &&
        e.startedAt.getTime() > now - 60000 // Last minute
    );

    return recentExecutions.length < provider.rateLimits.requestsPerMinute;
  }

  private createDegradedModeConfig(
    level: DegradedModeConfig['level']
  ): DegradedModeConfig {
    const baseConfig: DegradedModeConfig = {
      level,
      features: {
        emailDelivery: true,
        tracking: true,
        analytics: true,
        notifications: true,
        scheduling: true,
        templates: true,
      },
      limitations: {
        maxEmailsPerHour: 1000,
        maxRecipientsPerEmail: 100,
        allowedTemplateTypes: ['basic', 'notification'],
        reducedTracking: false,
      },
      fallbackEndpoints: {},
      cacheStrategy: 'normal',
    };

    switch (level) {
      case 'minimal':
        baseConfig.features = {
          emailDelivery: true,
          tracking: false,
          analytics: false,
          notifications: true,
          scheduling: false,
          templates: false,
        };
        baseConfig.limitations = {
          maxEmailsPerHour: 100,
          maxRecipientsPerEmail: 10,
          allowedTemplateTypes: ['basic'],
          reducedTracking: true,
        };
        baseConfig.cacheStrategy = 'aggressive';
        break;

      case 'reduced':
        baseConfig.features.analytics = false;
        baseConfig.features.scheduling = false;
        baseConfig.limitations = {
          maxEmailsPerHour: 500,
          maxRecipientsPerEmail: 50,
          allowedTemplateTypes: ['basic', 'notification'],
          reducedTracking: true,
        };
        baseConfig.cacheStrategy = 'aggressive';
        break;

      case 'emergency':
        baseConfig.features = {
          emailDelivery: true,
          tracking: false,
          analytics: false,
          notifications: false,
          scheduling: false,
          templates: false,
        };
        baseConfig.limitations = {
          maxEmailsPerHour: 50,
          maxRecipientsPerEmail: 5,
          allowedTemplateTypes: ['basic'],
          reducedTracking: true,
        };
        baseConfig.cacheStrategy = 'disabled';
        break;
    }

    return baseConfig;
  }

  private async performHealthCheck(
    provider: FallbackProvider
  ): Promise<boolean> {
    if (!provider.healthCheckUrl) {
      return true; // Assume healthy if no health check URL
    }

    try {
      const response = await fetch(provider.healthCheckUrl, {
        method: 'GET',
        timeout: 5000,
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(async () => {
      for (const provider of this.providers.values()) {
        if (provider.enabled) {
          const isHealthy = await this.performHealthCheck(provider);
          await this.updateProviderHealth(provider.id, isHealthy);
        }
      }
    }, 60000); // Check every minute
  }

  private initializeDefaultProviders(): void {
    // Default email fallback provider
    this.providers.set('default_email', {
      id: 'default_email',
      name: 'Default Email Queue',
      type: 'email_provider',
      priority: 999,
      enabled: true,
      config: {
        queueName: 'fallback_email_queue',
        processingDelay: 300000, // 5 minutes
      },
      failureThreshold: 10,
      recoveryTime: 60,
      isHealthy: true,
      failureCount: 0,
    });

    // Default storage fallback
    this.providers.set('default_storage', {
      id: 'default_storage',
      name: 'Local File Storage',
      type: 'storage',
      priority: 999,
      enabled: true,
      config: {
        basePath: '/tmp/pha_fallback',
      },
      failureThreshold: 5,
      recoveryTime: 30,
      isHealthy: true,
      failureCount: 0,
    });
  }

  /**
   * Get execution metrics
   */
  getExecutionMetrics(timeWindowHours: number = 24): {
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    averageExecutionTime: number;
    providerUsage: Record<string, number>;
  } {
    const cutoffTime = new Date(Date.now() - timeWindowHours * 60 * 60 * 1000);
    const recentExecutions = this.executionHistory.filter(
      e => e.startedAt >= cutoffTime
    );

    const totalExecutions = recentExecutions.length;
    const successfulExecutions = recentExecutions.filter(
      e => e.status === 'completed'
    ).length;
    const failedExecutions = recentExecutions.filter(
      e => e.status === 'failed'
    ).length;

    const executionTimes = recentExecutions.map(e => e.duration);
    const averageExecutionTime =
      executionTimes.length > 0
        ? executionTimes.reduce((sum, time) => sum + time, 0) /
          executionTimes.length
        : 0;

    const providerUsage: Record<string, number> = {};
    recentExecutions.forEach(execution => {
      const providerId = execution.fallbackProvider.id;
      providerUsage[providerId] = (providerUsage[providerId] || 0) + 1;
    });

    return {
      totalExecutions,
      successfulExecutions,
      failedExecutions,
      averageExecutionTime,
      providerUsage,
    };
  }

  /**
   * Cleanup method
   */
  async shutdown(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    await this.logger.logInfo(
      'configuration',
      'monitoring',
      'FallbackService shutting down',
      {
        operation: 'shutdown',
        metadata: {
          activeExecutions: this.activeExecutions.size,
          registeredProviders: this.providers.size,
        },
      }
    );
  }
}
