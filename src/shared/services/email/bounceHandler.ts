import { createClient } from '@supabase/supabase-js';
import { EmailTrackingEvent, ResendWebhookEvent } from './types';
import { emailTrackingService } from './tracking';

const supabase = (() => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is required for BounceHandler');
  }

  if (!serviceKey) {
    console.warn(
      'SUPABASE_SERVICE_ROLE_KEY not available for BounceHandler, falling back to anon key'
    );
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!anonKey) {
      throw new Error(
        'Either SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY is required for BounceHandler'
      );
    }
    return createClient(url, anonKey);
  }

  return createClient(url, serviceKey);
})();

export interface BounceAnalysis {
  classification: 'hard' | 'soft' | 'unknown';
  severity: 'high' | 'medium' | 'low';
  category: string;
  action: 'suppress' | 'retry' | 'flag' | 'ignore';
  retryAfter?: number; // seconds
  reason: string;
}

export interface ComplaintAnalysis {
  feedbackType: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  action: 'suppress' | 'investigate' | 'monitor';
  reputationImpact: number; // 1-10 scale
  reason: string;
}

export interface DeliverabilityAlert {
  type:
    | 'high_bounce_rate'
    | 'complaint_spike'
    | 'reputation_decline'
    | 'quota_exceeded';
  practiceId: string;
  severity: 'critical' | 'warning' | 'info';
  threshold: number;
  currentValue: number;
  message: string;
  recommendedActions: string[];
  timestamp: Date;
}

export interface SuppressionListEntry {
  id: string;
  practiceId: string;
  email: string;
  suppressionType: 'bounce' | 'complaint' | 'unsubscribe' | 'manual';
  suppressionReason: string;
  suppressedAt: Date;
  bounceType?: 'hard' | 'soft';
  canBeResubscribed: boolean;
  expiresAt?: Date;
}

export class EmailBounceHandler {
  private static instance: EmailBounceHandler;

  // Bounce classification patterns
  private readonly bouncePatterns = {
    hard: [
      /user unknown/i,
      /mailbox not found/i,
      /invalid recipient/i,
      /no such user/i,
      /recipient address rejected/i,
      /domain not found/i,
      /permanent failure/i,
      /5\.\d\.\d/,
    ],
    soft: [
      /mailbox full/i,
      /quota exceeded/i,
      /temporary failure/i,
      /try again later/i,
      /server temporarily unavailable/i,
      /4\.\d\.\d/,
      /greylist/i,
    ],
  };

  // Complaint feedback type mappings
  private readonly complaintSeverity = {
    abuse: 'critical',
    fraud: 'critical',
    phishing: 'critical',
    virus: 'critical',
    'not-spam': 'low',
    'opt-out': 'medium',
    other: 'medium',
  } as const;

  private constructor() {}

  public static getInstance(): EmailBounceHandler {
    if (!EmailBounceHandler.instance) {
      EmailBounceHandler.instance = new EmailBounceHandler();
    }
    return EmailBounceHandler.instance;
  }

  // =====================
  // Bounce Processing
  // =====================

  /**
   * Process bounce event with sophisticated classification
   */
  async processBounce(
    event: ResendWebhookEvent,
    trackingEvent: EmailTrackingEvent
  ): Promise<BounceAnalysis> {
    const bounceReason =
      trackingEvent.bounceReason || event.data.bounce?.reason || '';
    const bounceType = event.data.bounce?.type || 'unknown';

    const analysis = this.analyzeBounce(bounceReason, bounceType);

    // Execute appropriate action based on analysis
    await this.executeBounceAction(trackingEvent, analysis);

    // Check for alerts and notifications
    await this.checkBounceThresholds(trackingEvent.practiceId);

    // Log the bounce processing
    await this.logBounceProcessing(trackingEvent, analysis);

    return analysis;
  }

  /**
   * Analyze bounce to determine classification and recommended action
   */
  private analyzeBounce(
    bounceReason: string,
    bounceType: string
  ): BounceAnalysis {
    // Check for hard bounce patterns
    for (const pattern of this.bouncePatterns.hard) {
      if (pattern.test(bounceReason)) {
        return {
          classification: 'hard',
          severity: 'high',
          category: this.getBounceCategory(bounceReason),
          action: 'suppress',
          reason: bounceReason,
        };
      }
    }

    // Check for soft bounce patterns
    for (const pattern of this.bouncePatterns.soft) {
      if (pattern.test(bounceReason)) {
        return {
          classification: 'soft',
          severity: 'medium',
          category: this.getBounceCategory(bounceReason),
          action: 'retry',
          retryAfter: this.calculateRetryDelay(bounceReason),
          reason: bounceReason,
        };
      }
    }

    // Fallback classification based on Resend's bounce type
    if (bounceType === 'hard') {
      return {
        classification: 'hard',
        severity: 'high',
        category: 'permanent_failure',
        action: 'suppress',
        reason: bounceReason || 'Hard bounce detected',
      };
    }

    if (bounceType === 'soft') {
      return {
        classification: 'soft',
        severity: 'medium',
        category: 'temporary_failure',
        action: 'retry',
        retryAfter: 3600, // 1 hour default
        reason: bounceReason || 'Soft bounce detected',
      };
    }

    // Unknown bounce type - treat cautiously
    return {
      classification: 'unknown',
      severity: 'medium',
      category: 'unknown',
      action: 'flag',
      reason: bounceReason || 'Unknown bounce type',
    };
  }

  /**
   * Execute the recommended action for a bounce
   */
  private async executeBounceAction(
    trackingEvent: EmailTrackingEvent,
    analysis: BounceAnalysis
  ): Promise<void> {
    switch (analysis.action) {
      case 'suppress':
        await this.addToSuppressionList({
          practiceId: trackingEvent.practiceId,
          email: trackingEvent.recipientEmail,
          suppressionType: 'bounce',
          suppressionReason: analysis.reason,
          bounceType: analysis.classification === 'unknown' ? undefined : analysis.classification,
          canBeResubscribed: analysis.classification === 'soft',
          expiresAt:
            analysis.classification === 'soft'
              ? this.calculateExpiryDate()
              : undefined,
        });
        break;

      case 'retry':
        await this.scheduleRetry(trackingEvent, analysis.retryAfter || 3600);
        break;

      case 'flag':
        await this.flagForManualReview(trackingEvent, analysis);
        break;

      case 'ignore':
        // Log but take no action
        console.log(
          `Ignoring bounce for ${trackingEvent.recipientEmail}: ${analysis.reason}`
        );
        break;
    }
  }

  // =====================
  // Complaint Processing
  // =====================

  /**
   * Process spam complaint with analysis and action
   */
  async processComplaint(
    event: ResendWebhookEvent,
    trackingEvent: EmailTrackingEvent
  ): Promise<ComplaintAnalysis> {
    const feedbackType =
      trackingEvent.complaintFeedbackType ||
      event.data.complaint?.type ||
      'other';

    const analysis = this.analyzeComplaint(feedbackType);

    // Execute appropriate action
    await this.executeComplaintAction(trackingEvent, analysis);

    // Check for reputation alerts
    await this.checkComplaintThresholds(trackingEvent.practiceId);

    // Log complaint processing
    await this.logComplaintProcessing(trackingEvent, analysis);

    return analysis;
  }

  /**
   * Analyze complaint to determine severity and action
   */
  private analyzeComplaint(feedbackType: string): ComplaintAnalysis {
    const severity = (
      this.complaintSeverity[
        feedbackType as keyof typeof this.complaintSeverity
      ] || 'medium'
    ) as ComplaintAnalysis['severity'];

    let action: ComplaintAnalysis['action'] = 'suppress';
    let reputationImpact = 5; // Medium impact by default

    switch (severity) {
      case 'critical':
        action = 'suppress';
        reputationImpact = 9;
        break;
      case 'high':
        action = 'suppress';
        reputationImpact = 7;
        break;
      case 'medium':
        action = 'investigate';
        reputationImpact = 5;
        break;
      case 'low':
        action = 'monitor';
        reputationImpact = 2;
        break;
    }

    return {
      feedbackType,
      severity,
      action,
      reputationImpact,
      reason: `Spam complaint: ${feedbackType}`,
    };
  }

  /**
   * Execute the recommended action for a complaint
   */
  private async executeComplaintAction(
    trackingEvent: EmailTrackingEvent,
    analysis: ComplaintAnalysis
  ): Promise<void> {
    switch (analysis.action) {
      case 'suppress':
        await this.addToSuppressionList({
          practiceId: trackingEvent.practiceId,
          email: trackingEvent.recipientEmail,
          suppressionType: 'complaint',
          suppressionReason: analysis.reason,
          canBeResubscribed: false, // Complaints should not be resubscribed automatically
        });

        // Also update email preferences to unsubscribe from all types
        await this.unsubscribeFromAllEmails(
          trackingEvent.practiceId,
          trackingEvent.recipientEmail,
          'complaint_suppression'
        );
        break;

      case 'investigate':
        await this.flagForInvestigation(trackingEvent, analysis);
        break;

      case 'monitor':
        await this.addToMonitoringList(trackingEvent, analysis);
        break;
    }
  }

  // =====================
  // Suppression List Management
  // =====================

  /**
   * Add email to suppression list with proper metadata
   */
  async addToSuppressionList(entry: {
    practiceId: string;
    email: string;
    suppressionType: string;
    suppressionReason: string;
    bounceType?: 'hard' | 'soft';
    canBeResubscribed?: boolean;
    expiresAt?: Date;
  }): Promise<void> {
    try {
      const { error } = await supabase.from('email_suppression_list').upsert({
        practice_id: entry.practiceId,
        email: entry.email,
        suppression_type: entry.suppressionType,
        suppression_reason: entry.suppressionReason,
        bounce_type: entry.bounceType,
        can_be_resubscribed: entry.canBeResubscribed || false,
        expires_at: entry.expiresAt?.toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (error) {
        console.error('Failed to add to suppression list:', error);
        throw error;
      }

      // Also update the subscriber status in the tracking service
      await emailTrackingService.addToSuppressionList(
        entry.practiceId,
        entry.email,
        entry.suppressionType as 'bounce' | 'complaint' | 'unsubscribe'
      );

      console.log(
        `Added ${entry.email} to suppression list for practice ${entry.practiceId}: ${entry.suppressionReason}`
      );
    } catch (error) {
      console.error('Error adding to suppression list:', error);
      throw error;
    }
  }

  /**
   * Check if email is suppressed
   */
  async isEmailSuppressed(practiceId: string, email: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('email_suppression_list')
        .select('id, expires_at')
        .eq('practice_id', practiceId)
        .eq('email', email)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking suppression status:', error);
        return false;
      }

      if (!data) return false;

      // Check if suppression has expired
      if (data.expires_at) {
        const expiryDate = new Date(data.expires_at);
        if (expiryDate < new Date()) {
          // Suppression has expired, remove it
          await this.removeFromSuppressionList(practiceId, email);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error checking suppression status:', error);
      return false;
    }
  }

  /**
   * Remove email from suppression list
   */
  async removeFromSuppressionList(
    practiceId: string,
    email: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('email_suppression_list')
        .delete()
        .eq('practice_id', practiceId)
        .eq('email', email);

      if (error) {
        console.error('Failed to remove from suppression list:', error);
        throw error;
      }

      console.log(
        `Removed ${email} from suppression list for practice ${practiceId}`
      );
    } catch (error) {
      console.error('Error removing from suppression list:', error);
      throw error;
    }
  }

  // =====================
  // Deliverability Monitoring
  // =====================

  /**
   * Check bounce rate thresholds and trigger alerts
   */
  async checkBounceThresholds(
    practiceId: string
  ): Promise<DeliverabilityAlert[]> {
    const alerts: DeliverabilityAlert[] = [];

    // Get bounce rates for the last 24 hours
    const bounceStats = await this.getBounceStatistics(practiceId, 24);

    // High bounce rate alert (>5%)
    if (bounceStats.bounceRate > 5) {
      alerts.push({
        type: 'high_bounce_rate',
        practiceId,
        severity: bounceStats.bounceRate > 10 ? 'critical' : 'warning',
        threshold: 5,
        currentValue: bounceStats.bounceRate,
        message: `High bounce rate detected: ${bounceStats.bounceRate.toFixed(2)}%`,
        recommendedActions: [
          'Review email list quality',
          'Check email content for spam triggers',
          'Implement double opt-in',
          'Clean suppression list',
        ],
        timestamp: new Date(),
      });
    }

    // Send alerts if any were generated
    for (const alert of alerts) {
      await this.sendDeliverabilityAlert(alert);
    }

    return alerts;
  }

  /**
   * Check complaint rate thresholds and trigger alerts
   */
  async checkComplaintThresholds(
    practiceId: string
  ): Promise<DeliverabilityAlert[]> {
    const alerts: DeliverabilityAlert[] = [];

    // Get complaint rates for the last 24 hours
    const complaintStats = await this.getComplaintStatistics(practiceId, 24);

    // High complaint rate alert (>0.1%)
    if (complaintStats.complaintRate > 0.1) {
      alerts.push({
        type: 'complaint_spike',
        practiceId,
        severity: complaintStats.complaintRate > 0.5 ? 'critical' : 'warning',
        threshold: 0.1,
        currentValue: complaintStats.complaintRate,
        message: `High complaint rate detected: ${complaintStats.complaintRate.toFixed(3)}%`,
        recommendedActions: [
          'Review email content and sender reputation',
          'Audit email list sources',
          'Implement better unsubscribe mechanisms',
          'Check email frequency and relevance',
        ],
        timestamp: new Date(),
      });
    }

    // Send alerts if any were generated
    for (const alert of alerts) {
      await this.sendDeliverabilityAlert(alert);
    }

    return alerts;
  }

  // =====================
  // Analytics and Reporting
  // =====================

  /**
   * Get bounce statistics for a practice over a time period
   */
  async getBounceStatistics(
    practiceId: string,
    hoursBack: number
  ): Promise<{
    totalSent: number;
    totalBounced: number;
    hardBounces: number;
    softBounces: number;
    bounceRate: number;
  }> {
    const startTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

    const { data, error } = await supabase
      .from('email_tracking_events')
      .select('event_type, bounce_type')
      .eq('practice_id', practiceId)
      .gte('event_timestamp', startTime.toISOString());

    if (error) {
      console.error('Error fetching bounce statistics:', error);
      return {
        totalSent: 0,
        totalBounced: 0,
        hardBounces: 0,
        softBounces: 0,
        bounceRate: 0,
      };
    }

    const totalSent = data.filter(event => event.event_type === 'sent').length;
    const bounces = data.filter(event => event.event_type === 'bounced');
    const totalBounced = bounces.length;
    const hardBounces = bounces.filter(
      event => event.bounce_type === 'hard'
    ).length;
    const softBounces = bounces.filter(
      event => event.bounce_type === 'soft'
    ).length;
    const bounceRate = totalSent > 0 ? (totalBounced / totalSent) * 100 : 0;

    return {
      totalSent,
      totalBounced,
      hardBounces,
      softBounces,
      bounceRate,
    };
  }

  /**
   * Get complaint statistics for a practice over a time period
   */
  async getComplaintStatistics(
    practiceId: string,
    hoursBack: number
  ): Promise<{
    totalSent: number;
    totalComplaints: number;
    complaintRate: number;
    complaintsByType: Record<string, number>;
  }> {
    const startTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

    const { data, error } = await supabase
      .from('email_tracking_events')
      .select('event_type, complaint_feedback_type')
      .eq('practice_id', practiceId)
      .gte('event_timestamp', startTime.toISOString());

    if (error) {
      console.error('Error fetching complaint statistics:', error);
      return {
        totalSent: 0,
        totalComplaints: 0,
        complaintRate: 0,
        complaintsByType: {},
      };
    }

    const totalSent = data.filter(event => event.event_type === 'sent').length;
    const complaints = data.filter(event => event.event_type === 'complained');
    const totalComplaints = complaints.length;
    const complaintRate =
      totalSent > 0 ? (totalComplaints / totalSent) * 100 : 0;

    const complaintsByType: Record<string, number> = {};
    complaints.forEach(complaint => {
      const type = complaint.complaint_feedback_type || 'unknown';
      complaintsByType[type] = (complaintsByType[type] || 0) + 1;
    });

    return {
      totalSent,
      totalComplaints,
      complaintRate,
      complaintsByType,
    };
  }

  // =====================
  // Helper Methods
  // =====================

  private getBounceCategory(bounceReason: string): string {
    if (
      /user unknown|mailbox not found|invalid recipient/i.test(bounceReason)
    ) {
      return 'invalid_recipient';
    }
    if (/quota|full|storage/i.test(bounceReason)) {
      return 'mailbox_full';
    }
    if (/domain|dns/i.test(bounceReason)) {
      return 'domain_issue';
    }
    if (/spam|blocked|blacklist/i.test(bounceReason)) {
      return 'reputation_issue';
    }
    return 'other';
  }

  private calculateRetryDelay(bounceReason: string): number {
    // Calculate retry delay based on bounce reason
    if (/quota|full/i.test(bounceReason)) return 7200; // 2 hours for full mailboxes
    if (/greylist/i.test(bounceReason)) return 900; // 15 minutes for greylisting
    if (/temporary/i.test(bounceReason)) return 3600; // 1 hour for general temp failures
    return 3600; // Default 1 hour
  }

  private calculateExpiryDate(): Date {
    // Soft bounces expire after 30 days
    return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }

  private async scheduleRetry(
    trackingEvent: EmailTrackingEvent,
    retryAfter: number
  ): Promise<void> {
    // Implementation would depend on your scheduling system
    console.log(
      `Scheduling retry for ${trackingEvent.recipientEmail} in ${retryAfter} seconds`
    );
    // This would integrate with the email scheduler from subtask 10.3
  }

  private async flagForManualReview(
    trackingEvent: EmailTrackingEvent,
    analysis: BounceAnalysis
  ): Promise<void> {
    // Flag bounce for manual review
    console.log(
      `Flagging bounce for manual review: ${trackingEvent.recipientEmail} - ${analysis.reason}`
    );
    // Implementation would create a task/ticket for admin review
  }

  private async flagForInvestigation(
    trackingEvent: EmailTrackingEvent,
    analysis: ComplaintAnalysis
  ): Promise<void> {
    // Flag complaint for investigation
    console.log(
      `Flagging complaint for investigation: ${trackingEvent.recipientEmail} - ${analysis.reason}`
    );
    // Implementation would create investigation task
  }

  private async addToMonitoringList(
    trackingEvent: EmailTrackingEvent,
    analysis: ComplaintAnalysis
  ): Promise<void> {
    // Add to monitoring list for future complaint tracking
    console.log(
      `Adding to monitoring list: ${trackingEvent.recipientEmail} - ${analysis.reason}`
    );
  }

  private async unsubscribeFromAllEmails(
    practiceId: string,
    email: string,
    reason: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('email_preferences')
        .update({
          is_subscribed: false,
          consent_status: 'complained',
          unsubscribe_date: new Date().toISOString(),
          unsubscribe_reason: reason,
        })
        .eq('practice_id', practiceId)
        .eq('email', email);

      if (error) {
        console.error('Failed to unsubscribe from all emails:', error);
      }
    } catch (error) {
      console.error('Error unsubscribing from all emails:', error);
    }
  }

  private async logBounceProcessing(
    trackingEvent: EmailTrackingEvent,
    analysis: BounceAnalysis
  ): Promise<void> {
    // Log bounce processing for audit and debugging
    console.log(
      `Bounce processed: ${trackingEvent.recipientEmail} - ${analysis.classification} - ${analysis.action}`
    );
  }

  private async logComplaintProcessing(
    trackingEvent: EmailTrackingEvent,
    analysis: ComplaintAnalysis
  ): Promise<void> {
    // Log complaint processing for audit and debugging
    console.log(
      `Complaint processed: ${trackingEvent.recipientEmail} - ${analysis.severity} - ${analysis.action}`
    );
  }

  private async sendDeliverabilityAlert(
    alert: DeliverabilityAlert
  ): Promise<void> {
    // Send deliverability alert to practice administrators
    console.log(`DELIVERABILITY ALERT: ${alert.type} - ${alert.message}`);

    // Implementation would:
    // 1. Send email to practice admins
    // 2. Create in-app notification
    // 3. Log to monitoring system
    // 4. Potentially send to Slack/Discord
  }
}

// Export singleton instance
export const emailBounceHandler = EmailBounceHandler.getInstance();
