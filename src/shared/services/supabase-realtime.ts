import {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from '@supabase/supabase-js';
import { supabase, SupabaseError } from './supabase';
import { Database } from '@/shared/types/database';

// Type definitions for database tables
type Tables = Database['public']['Tables'];
type SurveyResponse = Tables['survey_responses']['Row'];
type Assessment = Tables['assessments']['Row'];
type Report = Tables['reports']['Row'];

// Real-time event types
export type RealtimeEventType = 'INSERT' | 'UPDATE' | 'DELETE';

// Payload types for different tables
export interface SurveyResponsePayload
  extends RealtimePostgresChangesPayload<SurveyResponse> {
  table: 'survey_responses';
}

export interface AssessmentPayload
  extends RealtimePostgresChangesPayload<Assessment> {
  table: 'assessments';
}

export interface ReportPayload extends RealtimePostgresChangesPayload<Report> {
  table: 'reports';
}

// Union type for all possible payloads
export type RealtimePayload =
  | SurveyResponsePayload
  | AssessmentPayload
  | ReportPayload;

// Callback function types
export type SurveyResponseCallback = (payload: SurveyResponsePayload) => void;
export type AssessmentCallback = (payload: AssessmentPayload) => void;
export type ReportCallback = (payload: ReportPayload) => void;

// Subscription configuration
export interface SubscriptionConfig {
  channel: string;
  table: string;
  event?: RealtimeEventType | '*';
  schema?: string;
  filter?: string;
}

// Subscription manager class
export class RealtimeSubscriptionManager {
  private channels = new Map<string, RealtimeChannel>();
  private isConnected = false;
  private retryAttempts = 0;
  private maxRetries = 3;
  private retryDelay = 1000; // Start with 1 second

  constructor() {
    this.setupConnectionMonitoring();
  }

  /**
   * Set up connection monitoring and error handling
   */
  private setupConnectionMonitoring(): void {
    // Listen for connection events if available
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log(
          'Network connection restored, reconnecting real-time subscriptions...'
        );
        this.reconnectAll();
      });

      window.addEventListener('offline', () => {
        console.log('Network connection lost, real-time subscriptions paused');
        this.isConnected = false;
      });
    }
  }

  /**
   * Subscribe to survey response changes
   */
  subscribeSurveyResponses(
    callback: SurveyResponseCallback,
    options: {
      assessmentId?: string;
      event?: RealtimeEventType | '*';
    } = {}
  ): string {
    const channelName = `survey_responses_${options.assessmentId || 'all'}_${Date.now()}`;

    let filter = '';
    if (options.assessmentId) {
      filter = `assessment_id=eq.${options.assessmentId}`;
    }

    const config: SubscriptionConfig = {
      channel: channelName,
      table: 'survey_responses',
      event: options.event || '*',
      filter,
    };

    return this.createSubscription(config, callback);
  }

  /**
   * Subscribe to assessment changes
   */
  subscribeAssessments(
    callback: AssessmentCallback,
    options: {
      practiceId?: string;
      childId?: string;
      event?: RealtimeEventType | '*';
    } = {}
  ): string {
    const channelName = `assessments_${options.practiceId || options.childId || 'all'}_${Date.now()}`;

    let filter = '';
    if (options.practiceId) {
      filter = `practice_id=eq.${options.practiceId}`;
    } else if (options.childId) {
      filter = `child_id=eq.${options.childId}`;
    }

    const config: SubscriptionConfig = {
      channel: channelName,
      table: 'assessments',
      event: options.event || '*',
      filter,
    };

    return this.createSubscription(config, callback);
  }

  /**
   * Subscribe to report changes
   */
  subscribeReports(
    callback: ReportCallback,
    options: {
      assessmentId?: string;
      practiceId?: string;
      event?: RealtimeEventType | '*';
    } = {}
  ): string {
    const channelName = `reports_${options.assessmentId || options.practiceId || 'all'}_${Date.now()}`;

    let filter = '';
    if (options.assessmentId) {
      filter = `assessment_id=eq.${options.assessmentId}`;
    } else if (options.practiceId) {
      filter = `practice_id=eq.${options.practiceId}`;
    }

    const config: SubscriptionConfig = {
      channel: channelName,
      table: 'reports',
      event: options.event || '*',
      filter,
    };

    return this.createSubscription(config, callback);
  }

  /**
   * Create a generic subscription
   */
  private createSubscription(
    config: SubscriptionConfig,
    callback: (payload: RealtimePayload) => void
  ): string {
    try {
      const channel = supabase.channel(config.channel);

      // Configure the subscription based on config
      let subscription = channel.on(
        'postgres_changes',
        {
          event: config.event || '*',
          schema: config.schema || 'public',
          table: config.table,
          ...(config.filter && { filter: config.filter }),
        },
        payload => {
          try {
            this.handleRealtimeEvent(payload, callback);
          } catch (error) {
            console.error(
              `Error handling real-time event for ${config.table}:`,
              error
            );
            this.handleSubscriptionError(error, config);
          }
        }
      );

      // Subscribe and handle connection
      subscription.subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log(
            `✅ Successfully subscribed to ${config.table} changes on channel ${config.channel}`
          );
          this.isConnected = true;
          this.retryAttempts = 0; // Reset retry counter on successful connection
        } else if (status === 'CHANNEL_ERROR') {
          console.error(
            `❌ Failed to subscribe to ${config.table} changes:`,
            err
          );
          this.handleSubscriptionError(err, config);
        } else if (status === 'TIMED_OUT') {
          console.warn(
            `⏱️ Subscription to ${config.table} timed out, retrying...`
          );
          this.retrySubscription(config, callback);
        } else if (status === 'CLOSED') {
          console.log(`📡 Subscription to ${config.table} closed`);
          this.isConnected = false;
        }
      });

      // Store channel for management
      this.channels.set(config.channel, channel);

      return config.channel;
    } catch (error) {
      console.error(
        `Failed to create subscription for ${config.table}:`,
        error
      );
      throw new SupabaseError(
        `Failed to create real-time subscription for ${config.table}`,
        'SUBSCRIPTION_ERROR',
        error
      );
    }
  }

  /**
   * Handle real-time events with proper error boundaries
   */
  private handleRealtimeEvent(
    payload: RealtimePostgresChangesPayload<any>,
    callback: (payload: RealtimePayload) => void
  ): void {
    try {
      // Add timestamp to payload for tracking
      const enhancedPayload = {
        ...payload,
        timestamp: new Date().toISOString(),
        processed_at: Date.now(),
      } as RealtimePayload;

      callback(enhancedPayload);
    } catch (error) {
      console.error('Error in real-time event callback:', error);
      // Don't throw here to prevent breaking the subscription
    }
  }

  /**
   * Handle subscription errors with retry logic
   */
  private handleSubscriptionError(
    error: any,
    config: SubscriptionConfig
  ): void {
    console.error(`Subscription error for ${config.table}:`, error);

    if (this.retryAttempts < this.maxRetries) {
      this.retryAttempts++;
      const delay = this.retryDelay * Math.pow(2, this.retryAttempts - 1); // Exponential backoff

      console.log(
        `Retrying subscription to ${config.table} in ${delay}ms (attempt ${this.retryAttempts}/${this.maxRetries})`
      );

      setTimeout(() => {
        this.retrySubscription(config, () => {});
      }, delay);
    } else {
      console.error(
        `Max retry attempts reached for ${config.table} subscription`
      );
    }
  }

  /**
   * Retry a failed subscription
   */
  private retrySubscription(
    config: SubscriptionConfig,
    callback: (payload: RealtimePayload) => void
  ): void {
    // Remove old channel first
    this.unsubscribe(config.channel);

    // Create new subscription
    this.createSubscription(config, callback);
  }

  /**
   * Unsubscribe from a specific channel
   */
  unsubscribe(channelName: string): boolean {
    const channel = this.channels.get(channelName);
    if (channel) {
      try {
        supabase.removeChannel(channel);
        this.channels.delete(channelName);
        console.log(`🔌 Unsubscribed from channel: ${channelName}`);
        return true;
      } catch (error) {
        console.error(
          `Error unsubscribing from channel ${channelName}:`,
          error
        );
        return false;
      }
    }
    return false;
  }

  /**
   * Unsubscribe from all channels
   */
  unsubscribeAll(): void {
    console.log('🔌 Unsubscribing from all real-time channels...');

    for (const [channelName, channel] of this.channels) {
      try {
        supabase.removeChannel(channel);
        console.log(`✅ Unsubscribed from ${channelName}`);
      } catch (error) {
        console.error(`❌ Error unsubscribing from ${channelName}:`, error);
      }
    }

    this.channels.clear();
    this.isConnected = false;
  }

  /**
   * Reconnect all existing subscriptions
   */
  private reconnectAll(): void {
    // This would need to store subscription configs to recreate them
    // For now, we'll just log that reconnection is needed
    console.log(
      'Reconnection logic would go here - requires storing subscription configs'
    );
  }

  /**
   * Get subscription status
   */
  getStatus(): {
    isConnected: boolean;
    activeChannels: number;
    channels: string[];
  } {
    return {
      isConnected: this.isConnected,
      activeChannels: this.channels.size,
      channels: Array.from(this.channels.keys()),
    };
  }

  /**
   * Check if a specific channel is active
   */
  isChannelActive(channelName: string): boolean {
    return this.channels.has(channelName);
  }
}

// Create singleton instance
export const realtimeManager = new RealtimeSubscriptionManager();

// Utility functions for common use cases
export const realtimeUtils = {
  /**
   * Subscribe to changes for a specific assessment
   */
  subscribeToAssessment(
    assessmentId: string,
    callbacks: {
      onSurveyResponse?: SurveyResponseCallback;
      onAssessmentUpdate?: AssessmentCallback;
      onReportUpdate?: ReportCallback;
    }
  ): string[] {
    const subscriptions: string[] = [];

    if (callbacks.onSurveyResponse) {
      const channelId = realtimeManager.subscribeSurveyResponses(
        callbacks.onSurveyResponse,
        { assessmentId }
      );
      subscriptions.push(channelId);
    }

    if (callbacks.onAssessmentUpdate) {
      const channelId = realtimeManager.subscribeAssessments(
        callbacks.onAssessmentUpdate,
        { event: 'UPDATE' }
      );
      subscriptions.push(channelId);
    }

    if (callbacks.onReportUpdate) {
      const channelId = realtimeManager.subscribeReports(
        callbacks.onReportUpdate,
        { assessmentId }
      );
      subscriptions.push(channelId);
    }

    return subscriptions;
  },

  /**
   * Subscribe to practice-wide changes
   */
  subscribeToPractice(
    practiceId: string,
    callbacks: {
      onNewAssessment?: AssessmentCallback;
      onReportGenerated?: ReportCallback;
    }
  ): string[] {
    const subscriptions: string[] = [];

    if (callbacks.onNewAssessment) {
      const channelId = realtimeManager.subscribeAssessments(
        callbacks.onNewAssessment,
        { practiceId, event: 'INSERT' }
      );
      subscriptions.push(channelId);
    }

    if (callbacks.onReportGenerated) {
      const channelId = realtimeManager.subscribeReports(
        callbacks.onReportGenerated,
        { practiceId, event: 'INSERT' }
      );
      subscriptions.push(channelId);
    }

    return subscriptions;
  },

  /**
   * Clean up multiple subscriptions
   */
  cleanup(channelIds: string[]): void {
    channelIds.forEach(channelId => {
      realtimeManager.unsubscribe(channelId);
    });
  },
};

// Cleanup function for component unmounting
export const cleanupRealtime = (): void => {
  realtimeManager.unsubscribeAll();
};

// Export types for external use
export type {
  RealtimeEventType,
  SurveyResponse,
  Assessment,
  Report,
  SubscriptionConfig,
};
