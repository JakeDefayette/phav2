import { supabase as supabaseClient } from '@/shared/services/supabase';
import { config } from '@/shared/config';
import { resendClient } from './email/resend';
import { EmailTemplateService } from './email/templates';
import { emailTrackingService } from './email/tracking';
import {
  EmailAttachment,
  ReportDeliveryEmailOptions,
  ReportReadyNotificationOptions,
  EmailResult,
  EmailTemplateType,
  EmailLogEntry,
  EmailConfigurationError,
  EmailRateLimitError,
  EmailAuthenticationError,
  EmailValidationError,
  EmailDeliveryError,
} from './email/types';

// Import email scheduler types
import type {
  ScheduleEmailOptions,
  RecurringEmailOptions,
  ScheduledEmailRecord,
} from '@/features/dashboard/services/emailScheduler';

export class EmailService {
  private supabase = supabaseClient;
  private fromEmail = config.email.from;

  /**
   * Send report delivery email with PDF attachment and download link
   */
  async sendReportDeliveryEmail(
    options: ReportDeliveryEmailOptions & { practiceId?: string }
  ): Promise<EmailResult> {
    try {
      // Check if Resend is configured
      if (!resendClient) {
        throw new EmailConfigurationError('Resend API not configured');
      }

      // Render email template using React Email
      const templateData = {
        childName: options.childName,
        assessmentDate: options.assessmentDate,
        downloadUrl: options.downloadUrl,
        hasAttachment: !!options.pdfAttachment,
        practiceInfo: {
          name: config.practice?.name,
          logo: config.practice?.logo,
          address: config.practice?.address,
          phone: config.practice?.phone,
          website: config.practice?.website,
        },
      };

      const {
        html: htmlContent,
        text: textContent,
        subject,
      } = await EmailTemplateService.renderReportDelivery(templateData);

      // Add tracking to email content if practice ID is available
      let finalHtmlContent = htmlContent;
      if (options.practiceId) {
        try {
          const trackingResult = await emailTrackingService.addTrackingToEmail({
            practiceId: options.practiceId,
            htmlContent,
            recipientEmail: options.to,
          });
          finalHtmlContent = trackingResult.html;
        } catch (trackingError) {
          console.warn('Failed to add email tracking:', trackingError);
          // Continue with original HTML if tracking fails
        }
      }

      // Send email via Resend
      const result = await resendClient.sendEmail({
        from: this.fromEmail,
        to: options.to,
        subject,
        html: finalHtmlContent,
        text: textContent,
        attachments: options.pdfAttachment
          ? [
              {
                filename: options.pdfAttachment.filename,
                content: options.pdfAttachment.content,
                contentType:
                  options.pdfAttachment.contentType || 'application/pdf',
              },
            ]
          : undefined,
        tags: [
          { name: 'template', value: 'report_delivery' },
          { name: 'child', value: options.childName },
          ...(options.practiceId
            ? [{ name: 'practice_id', value: options.practiceId }]
            : []),
        ],
      });

      // Log email send attempt
      await this.logEmailSend({
        templateType: 'report_delivery',
        recipientEmail: options.to,
        messageId: result.messageId,
        status: result.success ? 'sent' : 'failed',
        error: result.error,
      });

      if (!result.success) {
        if (result.rateLimited) {
          throw new EmailRateLimitError(result.error);
        }
        throw new EmailDeliveryError(result.error || 'Failed to send email');
      }

      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error) {
      // Handle specific error types
      if (
        error instanceof EmailConfigurationError ||
        error instanceof EmailRateLimitError ||
        error instanceof EmailAuthenticationError ||
        error instanceof EmailValidationError ||
        error instanceof EmailDeliveryError
      ) {
        return {
          success: false,
          error: error.message,
          rateLimited: error instanceof EmailRateLimitError,
        };
      }

      // Unknown error
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown email error';
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Send notification to user that their report is ready
   */
  async sendReportReadyNotification(
    options: ReportReadyNotificationOptions & { practiceId?: string }
  ): Promise<EmailResult> {
    try {
      // Check if Resend is configured
      if (!resendClient) {
        throw new EmailConfigurationError('Resend API not configured');
      }

      // Prepare template data
      const templateData = {
        firstName: options.firstName,
        reportId: options.reportId,
        downloadUrl: options.downloadUrl,
        expiresAt: options.expiresAt,
        practiceInfo: {
          name: config.practice?.name,
          logo: config.practice?.logo,
          address: config.practice?.address,
          phone: config.practice?.phone,
          website: config.practice?.website,
        },
      };

      const {
        html: htmlContent,
        text: textContent,
        subject,
      } = await EmailTemplateService.renderReportReady(templateData);

      // Add tracking to email content if practice ID is available
      let finalHtmlContent = htmlContent;
      if (options.practiceId) {
        try {
          const trackingResult = await emailTrackingService.addTrackingToEmail({
            practiceId: options.practiceId,
            htmlContent,
            recipientEmail: options.to,
          });
          finalHtmlContent = trackingResult.html;
        } catch (trackingError) {
          console.warn('Failed to add email tracking:', trackingError);
          // Continue with original HTML if tracking fails
        }
      }

      // Send email via Resend
      const result = await resendClient.sendEmail({
        from: this.fromEmail,
        to: options.to,
        subject,
        html: finalHtmlContent,
        text: textContent,
        tags: [
          { name: 'template', value: 'report_ready' },
          { name: 'report_id', value: options.reportId },
          ...(options.practiceId
            ? [{ name: 'practice_id', value: options.practiceId }]
            : []),
        ],
      });

      // Log email send attempt
      await this.logEmailSend({
        templateType: 'report_ready',
        recipientEmail: options.to,
        messageId: result.messageId,
        status: result.success ? 'sent' : 'failed',
        error: result.error,
      });

      if (!result.success) {
        if (result.rateLimited) {
          throw new EmailRateLimitError(result.error);
        }
        throw new EmailDeliveryError(
          result.error || 'Failed to send notification'
        );
      }

      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error) {
      // Handle specific error types
      if (
        error instanceof EmailConfigurationError ||
        error instanceof EmailRateLimitError ||
        error instanceof EmailAuthenticationError ||
        error instanceof EmailValidationError ||
        error instanceof EmailDeliveryError
      ) {
        return {
          success: false,
          error: error.message,
          rateLimited: error instanceof EmailRateLimitError,
        };
      }

      // Unknown error
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown notification error';
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Schedule a delayed email delivery
   */
  async scheduleEmail(
    options: ScheduleEmailOptions
  ): Promise<{ success: boolean; scheduledEmailId?: string; error?: string }> {
    try {
      // Import emailScheduler dynamically to avoid circular dependencies
      const { emailScheduler } = await import(
        '@/features/dashboard/services/emailScheduler'
      );

      return await emailScheduler.scheduleEmail(options);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown scheduling error';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Schedule recurring emails
   */
  async scheduleRecurringEmail(
    options: RecurringEmailOptions
  ): Promise<{ success: boolean; scheduledEmailId?: string; error?: string }> {
    try {
      // Import emailScheduler dynamically to avoid circular dependencies
      const { emailScheduler } = await import(
        '@/features/dashboard/services/emailScheduler'
      );

      return await emailScheduler.scheduleRecurringEmail(options);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Unknown recurring scheduling error';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Cancel a scheduled email
   */
  async cancelScheduledEmail(
    scheduledEmailId: string,
    practiceId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Import emailScheduler dynamically to avoid circular dependencies
      const { emailScheduler } = await import(
        '@/features/dashboard/services/emailScheduler'
      );

      return await emailScheduler.cancelScheduledEmail(
        scheduledEmailId,
        practiceId
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown cancellation error';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Get scheduled emails for a practice
   */
  async getScheduledEmails(
    practiceId: string,
    options: {
      status?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ data: ScheduledEmailRecord[]; error?: string }> {
    try {
      // Import emailScheduler dynamically to avoid circular dependencies
      const { emailScheduler } = await import(
        '@/features/dashboard/services/emailScheduler'
      );

      return await emailScheduler.getScheduledEmails(practiceId, options);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown query error';
      return { data: [], error: errorMessage };
    }
  }

  /**
   * Schedule report delivery email for later
   */
  async scheduleReportDeliveryEmail(
    options: ReportDeliveryEmailOptions & {
      practiceId: string;
      scheduledAt: Date;
      priority?: 'high' | 'medium' | 'low';
    }
  ): Promise<{ success: boolean; scheduledEmailId?: string; error?: string }> {
    try {
      const templateData = {
        childName: options.childName,
        assessmentDate: options.assessmentDate,
        downloadUrl: options.downloadUrl,
        pdfAttachment: options.pdfAttachment,
      };

      return await this.scheduleEmail({
        practiceId: options.practiceId,
        templateType: 'report_delivery',
        recipientEmail: options.to,
        subject: `Assessment Report for ${options.childName}`,
        templateData,
        scheduledAt: options.scheduledAt,
        priority: options.priority || 'medium',
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Unknown report delivery scheduling error';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Schedule report ready notification for later
   */
  async scheduleReportReadyNotification(
    options: ReportReadyNotificationOptions & {
      practiceId: string;
      scheduledAt: Date;
      priority?: 'high' | 'medium' | 'low';
    }
  ): Promise<{ success: boolean; scheduledEmailId?: string; error?: string }> {
    try {
      const templateData = {
        firstName: options.firstName,
        reportId: options.reportId,
        downloadUrl: options.downloadUrl,
        expiresAt: options.expiresAt,
      };

      return await this.scheduleEmail({
        practiceId: options.practiceId,
        templateType: 'report_share',
        recipientEmail: options.to,
        subject: `Your Assessment Report is Ready, ${options.firstName}`,
        templateData,
        scheduledAt: options.scheduledAt,
        priority: options.priority || 'medium',
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Unknown notification scheduling error';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Log email send for tracking and analytics
   */
  private async logEmailSend(options: {
    templateType: EmailTemplateType;
    recipientEmail: string;
    messageId?: string;
    status:
      | 'pending'
      | 'sent'
      | 'delivered'
      | 'bounced'
      | 'complained'
      | 'failed';
    error?: string;
  }): Promise<void> {
    try {
      await this.supabase.from('email_sends').insert({
        template_type: options.templateType,
        recipient_email: options.recipientEmail,
        message_id: options.messageId,
        status: options.status,
        sent_at: new Date().toISOString(),
      });
    } catch (error) {
      // Failed to log email send
    }
  }

  /**
   * Track email opens (webhook handler)
   */
  async trackEmailOpen(messageId: string): Promise<void> {
    try {
      await this.supabase
        .from('email_sends')
        .update({
          status: 'opened',
          opened_at: new Date().toISOString(),
        })
        .eq('message_id', messageId);
    } catch (error) {
      // Failed to track email open
    }
  }

  /**
   * Track email clicks (webhook handler)
   */
  async trackEmailClick(messageId: string, clickedUrl: string): Promise<void> {
    try {
      await this.supabase
        .from('email_sends')
        .update({
          status: 'clicked',
          clicked_at: new Date().toISOString(),
          clicked_url: clickedUrl,
        })
        .eq('message_id', messageId);
    } catch (error) {
      // Failed to track email click
    }
  }

  /**
   * Get email analytics for a practice
   */
  async getEmailAnalytics(
    practiceId: string,
    options: {
      campaignId?: string;
      startDate?: Date;
      endDate?: Date;
      eventTypes?: (
        | 'sent'
        | 'delivered'
        | 'opened'
        | 'clicked'
        | 'bounced'
        | 'complained'
        | 'unsubscribed'
      )[];
    } = {}
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const analytics = await emailTrackingService.getAnalyticsSummary({
        practiceId,
        ...options,
      });

      return {
        success: true,
        data: analytics,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown analytics error';
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Get detailed email performance metrics
   */
  async getEmailPerformance(
    practiceId: string,
    campaignId?: string
  ): Promise<{
    success: boolean;
    data?: {
      totalSent: number;
      totalDelivered: number;
      totalOpened: number;
      totalClicked: number;
      totalBounced: number;
      totalComplaints: number;
      openRate: number;
      clickRate: number;
      deliveryRate: number;
      bounceRate: number;
    };
    error?: string;
  }> {
    try {
      const performance = await emailTrackingService.getEmailPerformance(
        practiceId,
        campaignId
      );

      return {
        success: true,
        data: performance,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown performance error';
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Get detailed tracking events
   */
  async getTrackingEvents(
    practiceId: string,
    options: {
      campaignId?: string;
      startDate?: Date;
      endDate?: Date;
      eventTypes?: (
        | 'sent'
        | 'delivered'
        | 'opened'
        | 'clicked'
        | 'bounced'
        | 'complained'
        | 'unsubscribed'
      )[];
    } = {}
  ): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const events = await emailTrackingService.getTrackingEvents({
        practiceId,
        ...options,
      });

      return {
        success: true,
        data: events,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown tracking error';
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Check if an email address is suppressed (bounced/unsubscribed)
   */
  async isEmailSuppressed(
    practiceId: string,
    email: string
  ): Promise<{
    success: boolean;
    suppressed?: boolean;
    error?: string;
  }> {
    try {
      const suppressed = await emailTrackingService.isEmailSuppressed(
        practiceId,
        email
      );

      return {
        success: true,
        suppressed,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Unknown suppression check error';
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Manually add an email to the suppression list
   */
  async suppressEmail(
    practiceId: string,
    email: string,
    reason: 'bounce' | 'complaint' | 'unsubscribe'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await emailTrackingService.addToSuppressionList(
        practiceId,
        email,
        reason
      );

      return {
        success: true,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown suppression error';
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Check if email service is properly configured
   */
  isConfigured(): boolean {
    return !!resendClient && resendClient.isConfigured();
  }

  /**
   * Get current rate limit status
   */
  getRateLimitStatus() {
    if (!resendClient) {
      return {
        tokensAvailable: 0,
        nextRefillTime: new Date(),
        isLimited: true,
        configured: false,
      };
    }

    const status = resendClient.getRateLimitStatus();
    return {
      ...status,
      configured: true,
    };
  }

  /**
   * Test email service connectivity
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    if (!resendClient) {
      return {
        success: false,
        error: 'Resend client not configured',
      };
    }

    return await resendClient.testConnection();
  }

  /**
   * Send a test email to verify configuration
   */
  async sendTestEmail(
    to: string,
    subject: string = 'Test Email from Pediatric Health Assessment'
  ): Promise<EmailResult> {
    if (!resendClient) {
      return {
        success: false,
        error: 'Email service not configured',
      };
    }

    try {
      const result = await resendClient.sendEmail({
        from: this.fromEmail,
        to,
        subject,
        html: `
          <h2>Test Email</h2>
          <p>This is a test email from the Pediatric Health Assessment platform.</p>
          <p>If you received this email, the email service is working correctly.</p>
          <p>Sent at: ${new Date().toISOString()}</p>
        `,
        text: `
Test Email

This is a test email from the Pediatric Health Assessment platform.
If you received this email, the email service is working correctly.

Sent at: ${new Date().toISOString()}
        `,
        tags: [
          { name: 'template', value: 'system_notification' },
          { name: 'type', value: 'test' },
        ],
      });

      // Log test email
      await this.logEmailSend({
        templateType: 'system_notification',
        recipientEmail: to,
        messageId: result.messageId,
        status: result.success ? 'sent' : 'failed',
        error: result.error,
      });

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: errorMessage,
      };
    }
  }
}

// Export singleton instance
export const emailService = new EmailService();
