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

// Re-export types for external use
export type {
  EmailAttachment,
  ReportDeliveryEmailOptions,
  ReportReadyNotificationOptions,
  EmailResult,
  EmailTemplateType,
  EmailLogEntry,
};

// Import email scheduler types
import type {
  ScheduleEmailOptions,
  RecurringEmailOptions,
  ScheduledEmailRecord,
} from '@/features/dashboard/services/emailScheduler';

/**
 * @class EmailService
 * @description Provides comprehensive email functionalities including sending, scheduling, tracking, and analytics.
 * This service integrates with Resend for email delivery, Supabase for logging, and internal
 * services for template rendering and tracking.
 *
 * @requires ResendClient - For actual email dispatch.
 * @requires EmailTemplateService - For rendering email content.
 * @requires emailTrackingService - For adding tracking pixels and links.
 * @requires SupabaseClient - For logging email events and managing suppression lists.
 *
 * @throws {EmailConfigurationError} If the email service (e.g., Resend) is not properly configured.
 * @throws {EmailAuthenticationError} For authentication issues with the email provider.
 * @throws {EmailRateLimitError} If an email sending attempt is rate-limited.
 * @throws {EmailValidationError} For invalid input parameters to service methods.
 * @throws {EmailDeliveryError} For general failures during email delivery.
 */
export class EmailService {
  private supabase = supabaseClient;
  private fromEmail = config.email.from;

  /**
   * Sends a report delivery email, typically including a PDF attachment and a download link for an assessment report.
   *
   * This method handles template rendering, optional PDF attachment, email tracking integration,
   * sending via Resend, and logging the send attempt.
   *
   * @async
   * @param {ReportDeliveryEmailOptions & { practiceId?: string }} options - The options for sending the report delivery email.
   * @param {string} options.to - The recipient's email address.
   * @param {string} options.childName - The name of the child for whom the report is.
   * @param {string} options.assessmentDate - The date of the assessment.
   * @param {string} options.downloadUrl - The URL from which the full report can be downloaded.
   * @param {EmailAttachment} [options.pdfAttachment] - Optional PDF attachment of the report summary.
   *   Includes `filename`, `content` (Buffer or base64 string), and optional `contentType`.
   * @param {string} [options.practiceId] - Optional ID of the practice to associate with email tracking and logging.
   * @returns {Promise<EmailResult>} A promise that resolves with the result of the email sending operation.
   *   `EmailResult.success` is true if the email was accepted by the provider, `false` otherwise.
   *   `EmailResult.messageId` contains the provider's message ID on success.
   *   `EmailResult.error` contains an error message on failure.
   *   `EmailResult.rateLimited` indicates if the failure was due to rate limiting.
   * @throws {EmailConfigurationError} If Resend is not configured.
   * @throws {EmailRateLimitError} If the sending attempt is rate-limited by Resend.
   * @throws {EmailDeliveryError} If Resend fails to send the email for other reasons.
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
          { name: 'template', value: EmailTemplateType.REPORT_DELIVERY },
          { name: 'child', value: options.childName },
          ...(options.practiceId
            ? [{ name: 'practice_id', value: options.practiceId }]
            : []),
        ],
      });

      // Log email send attempt
      await this.logEmailSend({
        templateType: EmailTemplateType.REPORT_DELIVERY,
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
   * Sends a notification email to a user informing them that their assessment report is ready for viewing/download.
   *
   * This method handles template rendering, email tracking integration (if practiceId is provided),
   * sending via Resend, and logging the send attempt.
   *
   * @async
   * @param {ReportReadyNotificationOptions & { practiceId?: string }} options - The options for sending the report ready notification.
   * @param {string} options.to - The recipient's email address.
   * @param {string} options.firstName - The first name of the recipient (e.g., parent or practitioner).
   * @param {string} options.reportId - The ID of the report that is ready.
   * @param {string} options.downloadUrl - The URL from which the report can be accessed/downloaded.
   * @param {string} [options.expiresAt] - Optional expiration date/time for the download link.
   * @param {string} [options.practiceId] - Optional ID of the practice for email tracking and logging.
   * @returns {Promise<EmailResult>} A promise that resolves with the result of the email sending operation.
   *   Similar to `sendReportDeliveryEmail`, includes `success`, `messageId`, `error`, and `rateLimited` fields.
   * @throws {EmailConfigurationError} If Resend is not configured.
   * @throws {EmailRateLimitError} If the sending attempt is rate-limited by Resend.
   * @throws {EmailDeliveryError} If Resend fails to send the email for other reasons.
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
        templateType: EmailTemplateType.REPORT_READY,
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
   * Schedules an email for future delivery using the EmailScheduler service.
   *
   * @async
   * @param {ScheduleEmailOptions} options - Options for scheduling the email, including recipient, subject, content, and scheduled time.
   * @returns {Promise<{ success: boolean; scheduledEmailId?: string; error?: string }>} A promise resolving to an object indicating success,
   * the ID of the scheduled email if successful, or an error message.
   * @see {@link EmailScheduler.scheduleEmail} for more details on options and behavior.
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
   * Schedules a recurring email using the EmailScheduler service.
   *
   * @async
   * @param {RecurringEmailOptions} options - Options for the recurring email, including recipient, subject, content, and recurrence pattern (e.g., cron string).
   * @returns {Promise<{ success: boolean; scheduledEmailId?: string; error?: string }>} A promise resolving to an object indicating success,
   *  the ID of the scheduled recurring email if successful, or an error message.
   * @see {@link EmailScheduler.scheduleRecurringEmail} for more details on options and behavior.
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
   * Cancels a previously scheduled email.
   *
   * @async
   * @param {string} scheduledEmailId - The ID of the scheduled email to cancel.
   * @param {string} practiceId - The ID of the practice associated with the scheduled email (for authorization/scoping).
   * @returns {Promise<{ success: boolean; error?: string }>} A promise resolving to an object indicating success or an error message.
   * @see {@link EmailScheduler.cancelScheduledEmail} for more details.
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
   * Retrieves a list of scheduled emails for a given practice, with optional filtering.
   *
   * @async
   * @param {string} practiceId - The ID of the practice whose scheduled emails are to be retrieved.
   * @param {object} [options={}] - Optional parameters for filtering and pagination.
   * @param {string} [options.status] - Filter emails by status (e.g., 'pending', 'sent', 'failed').
   * @param {number} [options.limit] - Maximum number of scheduled emails to return.
   * @param {number} [options.offset] - Number of scheduled emails to skip (for pagination).
   * @returns {Promise<{ data: ScheduledEmailRecord[]; error?: string }>} A promise resolving to an object containing an array of scheduled email records or an error message.
   * @see {@link EmailScheduler.getScheduledEmails} for more details.
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
   * Schedules a report delivery email for a specific time.
   * This method combines the functionality of preparing a report delivery email (similar to `sendReportDeliveryEmail`)
   * with the scheduling capabilities of `scheduleEmail`.
   *
   * @async
   * @param {ReportDeliveryEmailOptions & { practiceId: string; scheduledAt: Date; priority?: 'high' | 'medium' | 'low' }} options - Options for the report delivery email and scheduling.
   * @param {string} options.to - Recipient's email address.
   * @param {string} options.childName - Child's name for the report.
   * @param {string} options.assessmentDate - Date of the assessment.
   * @param {string} options.downloadUrl - Report download URL.
   * @param {EmailAttachment} [options.pdfAttachment] - Optional PDF attachment.
   * @param {string} options.practiceId - ID of the practice.
   * @param {Date} options.scheduledAt - The date and time when the email should be sent.
   * @param {'high' | 'medium' | 'low'} [options.priority='medium'] - Priority of the scheduled email.
   * @returns {Promise<{ success: boolean; scheduledEmailId?: string; error?: string }>} Result of the scheduling operation, including scheduled email ID on success.
   * @throws {EmailConfigurationError} If Resend is not configured.
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
        templateType: EmailTemplateType.REPORT_DELIVERY,
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
   * Schedules a "report ready" notification email for a specific time.
   * This combines preparing a report ready notification (similar to `sendReportReadyNotification`)
   * with the scheduling capabilities of `scheduleEmail`.
   *
   * @async
   * @param {ReportReadyNotificationOptions & { practiceId: string; scheduledAt: Date; priority?: 'high' | 'medium' | 'low' }} options - Options for the notification and scheduling.
   * @param {string} options.to - Recipient's email address.
   * @param {string} options.firstName - Recipient's first name.
   * @param {string} options.reportId - ID of the ready report.
   * @param {string} options.downloadUrl - Report download/access URL.
   * @param {string} [options.expiresAt] - Optional expiration for the download link.
   * @param {string} options.practiceId - ID of the practice.
   * @param {Date} options.scheduledAt - The date and time when the email should be sent.
   * @param {'high' | 'medium' | 'low'} [options.priority='medium'] - Priority of the scheduled email.
   * @returns {Promise<{ success: boolean; scheduledEmailId?: string; error?: string }>} Result of the scheduling operation, including scheduled email ID on success.
   * @throws {EmailConfigurationError} If Resend is not configured.
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
        templateType: EmailTemplateType.REPORT_READY,
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
   * Tracks an email open event, typically called from a webhook handler when the email provider (Resend)
   * notifies of an email open.
   *
   * This method updates the status of the corresponding email record in the database.
   *
   * @async
   * @param {string} messageId - The unique message ID of the email that was opened, provided by the email sending service.
   * @returns {Promise<void>} A promise that resolves when the open event has been logged.
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
   * Tracks an email click event, typically called from a webhook handler when the email provider (Resend)
   * notifies of a click on a tracked link within an email.
   *
   * This method updates the status of the corresponding email record in the database and logs the clicked URL.
   *
   * @async
   * @param {string} messageId - The unique message ID of the email containing the clicked link, provided by the email sending service.
   * @param {string} clickedUrl - The URL that was clicked by the recipient.
   * @returns {Promise<void>} A promise that resolves when the click event has been logged.
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
   * Retrieves email analytics data for a given practice, allowing filtering by campaign, date range, and event types.
   *
   * This method delegates to `emailTrackingService.getAnalyticsSummary` to fetch the data.
   *
   * @async
   * @param {string} practiceId - The ID of the practice for which to retrieve analytics.
   * @param {object} [options={}] - Optional parameters for filtering the analytics data.
   * @param {string} [options.campaignId] - Filter analytics by a specific campaign ID.
   * @param {Date} [options.startDate] - The start date for the analytics period.
   * @param {Date} [options.endDate] - The end date for the analytics period.
   * @param {Array<'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'complained' | 'unsubscribed'>} [options.eventTypes] - Specific event types to include in the analytics.
   * @returns {Promise<{ success: boolean; data?: any; error?: string }>} A promise resolving to an object containing the analytics data
   *   (structure depends on `emailTrackingService.getAnalyticsSummary`) or an error message.
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
   * Retrieves a list of detailed email tracking events for a practice.
   *
   * Allows filtering by campaign, date range, and specific event types (e.g., 'opened', 'clicked').
   * This method delegates to `emailTrackingService.getTrackingEvents`.
   *
   * @async
   * @param {string} practiceId - The ID of the practice for which to retrieve tracking events.
   * @param {object} [options={}] - Optional parameters for filtering the tracking events.
   * @param {string} [options.campaignId] - Filter events by a specific campaign ID.
   * @param {Date} [options.startDate] - The start date for the event period.
   * @param {Date} [options.endDate] - The end date for the event period.
   * @param {Array<'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'complained' | 'unsubscribed'>} [options.eventTypes] - Specific event types to include.
   * @returns {Promise<{ success: boolean; data?: any[]; error?: string }>} A promise resolving to an object containing an array of tracking event objects
   *   (structure depends on `emailTrackingService.getTrackingEvents`) or an error message.
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
   * Checks if a given email address is on the suppression list for a specific practice.
   *
   * An email address might be suppressed due to bounces, complaints, or manual unsubscribes.
   * This method delegates to `emailTrackingService.isEmailSuppressed`.
   *
   * @async
   * @param {string} practiceId - The ID of the practice to check the suppression list against.
   * @param {string} email - The email address to check.
   * @returns {Promise<{
   *   success: boolean;
   *   suppressed?: boolean; // True if the email is suppressed, false otherwise.
   *   error?: string;
   * }>} A promise resolving to an object indicating whether the email is suppressed or an error message.
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
   * Manually adds an email address to the suppression list for a specific practice.
   *
   * This is useful for handling unsubscribe requests or processing bounce/complaint notifications
   * that might not be automatically captured by webhooks.
   * This method delegates to `emailTrackingService.addToSuppressionList`.
   *
   * @async
   * @param {string} practiceId - The ID of the practice to add the email to its suppression list.
   * @param {string} email - The email address to suppress.
   * @param {'bounce' | 'complaint' | 'unsubscribe'} reason - The reason for suppressing the email.
   * @returns {Promise<{ success: boolean; error?: string }>} A promise resolving to an object indicating success or an error message.
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
   * Checks if the email service, specifically the Resend client, is properly configured.
   *
   * @returns {boolean} True if the Resend client is configured, false otherwise.
   */
  isConfigured(): boolean {
    return !!resendClient && resendClient.isConfigured();
  }

  /**
   * Retrieves the current rate limit status from the Resend client.
   *
   * This can be used to understand current sending capacity and when rate limits might reset.
   * If the Resend client is not configured, it returns a default status indicating it's not configured and limited.
   *
   * @returns {{ tokensAvailable: number; nextRefillTime: Date; isLimited: boolean; configured: boolean; }} An object containing:
   *  - `tokensAvailable`: The number of sending tokens currently available.
   *  - `nextRefillTime`: The Date when the rate limit tokens are expected to be refilled.
   *  - `isLimited`: Boolean indicating if the service is currently rate-limited.
   *  - `configured`: Boolean indicating if the Resend client is configured.
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
   * Tests the connection to the email sending provider (Resend).
   *
   * This can be used to diagnose configuration or network issues.
   * If the Resend client is not configured, it returns an error.
   *
   * @async
   * @returns {Promise<{ success: boolean; error?: string }>} A promise resolving to an object indicating connection success or an error message.
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
   * Sends a test email to the specified recipient to verify the email service configuration and connectivity.
   *
   * This method uses a simple, predefined HTML content for the test email.
   * It logs the send attempt similarly to other email sending methods.
   *
   * @async
   * @param {string} to - The email address to send the test email to.
   * @param {string} [subject='Test Email from Pediatric Health Assessment'] - Optional subject for the test email.
   * @returns {Promise<EmailResult>} A promise that resolves with the result of the email sending operation,
   *   including `success`, `messageId`, `error`, and `rateLimited` fields.
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
      });

      return {
        success: result.success,
        messageId: result.messageId,
        error: result.error,
        rateLimited: result.rateLimited,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown test email error';
      return {
        success: false,
        error: errorMessage,
      };
    }
  }
}

// Create and export email service instance
const emailService = new EmailService();

export { emailService };
