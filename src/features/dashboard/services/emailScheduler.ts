import { supabase } from '@/shared/services/supabase';
import { RealtimeScheduler } from '@/shared/services/realtime-scheduler';
import { EmailService } from '@/shared/services/email';
import { EmailTemplateType } from '@/shared/services/email/types';

// Types for scheduled email operations
export interface ScheduleEmailOptions {
  practiceId: string;
  templateType: EmailTemplateType;
  recipientEmail: string;
  subject: string;
  templateData: Record<string, any>;
  scheduledAt: Date;
  priority?: 'high' | 'medium' | 'low';
  maxRetries?: number;
  campaignId?: string;
}

export interface RecurringEmailOptions
  extends Omit<ScheduleEmailOptions, 'scheduledAt'> {
  recurrenceRule: string; // cron expression
  startDate?: Date;
  endDate?: Date;
}

export interface ScheduledEmailRecord {
  id: string;
  practiceId: string;
  templateType: EmailTemplateType;
  recipientEmail: string;
  subject: string;
  templateData: Record<string, any>;
  scheduledAt: Date;
  retryCount: number;
  maxRetries: number;
  nextRetryAt?: Date;
  status: 'pending' | 'processing' | 'sent' | 'failed' | 'cancelled';
  priority: 'high' | 'medium' | 'low';
  campaignId?: string;
  processingAttempts: number;
  lastAttemptedAt?: Date;
  sentAt?: Date;
  failedAt?: Date;
  errorMessage?: string;
  isRecurring: boolean;
  recurrenceRule?: string;
  parentScheduledEmailId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailQueueItem {
  id: string;
  practiceId: string;
  templateType: EmailTemplateType;
  recipientEmail: string;
  subject: string;
  templateData: Record<string, any>;
  scheduledAt: Date;
  retryCount: number;
  maxRetries: number;
  nextRetryAt?: Date;
  status: string;
  priority: string;
  campaignId?: string;
  processingAttempts: number;
  lastAttemptedAt?: Date;
  errorMessage?: string;
  isRecurring: boolean;
  recurrenceRule?: string;
  createdAt: Date;
  priorityOrder: number;
  readyForProcessing: boolean;
}

export class EmailScheduler {
  private static instance: EmailScheduler;
  private scheduler: RealtimeScheduler;
  private emailService: EmailService;
  private processingInterval?: NodeJS.Timeout;
  private recurringJobsInterval?: NodeJS.Timeout;
  private isProcessing = false;

  private constructor() {
    this.scheduler = RealtimeScheduler.getInstance({
      defaultRateLimit: {
        name: 'email_scheduling',
        maxRequests: 50, // 50 emails per minute
        windowMs: 60000,
        priority: 'medium',
        resource: 'email',
      },
      adaptiveThrottling: true,
      loadBalancing: true,
      maxBackpressure: 500,
      circuitBreakerThreshold: 0.3, // 30% error rate trips circuit breaker
    });

    this.emailService = new EmailService();
    this.startProcessing();
    this.startRecurringJobs();
  }

  static getInstance(): EmailScheduler {
    if (!EmailScheduler.instance) {
      EmailScheduler.instance = new EmailScheduler();
    }
    return EmailScheduler.instance;
  }

  /**
   * Schedule a single email for delayed delivery
   */
  async scheduleEmail(
    options: ScheduleEmailOptions
  ): Promise<{ success: boolean; scheduledEmailId?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('scheduled_emails')
        .insert({
          practice_id: options.practiceId,
          template_type: options.templateType,
          recipient_email: options.recipientEmail,
          subject: options.subject,
          template_data: options.templateData,
          scheduled_at: options.scheduledAt.toISOString(),
          priority: options.priority || 'medium',
          max_retries: options.maxRetries || 3,
          campaign_id: options.campaignId || null,
          is_recurring: false,
        })
        .select('id')
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, scheduledEmailId: data?.id as string };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown scheduling error';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Schedule recurring emails based on cron expression
   */
  async scheduleRecurringEmail(
    options: RecurringEmailOptions
  ): Promise<{ success: boolean; scheduledEmailId?: string; error?: string }> {
    try {
      // Validate cron expression
      if (!this.validateCronExpression(options.recurrenceRule)) {
        return { success: false, error: 'Invalid cron expression' };
      }

      const startDate = options.startDate || new Date();

      const { data, error } = await supabase
        .from('scheduled_emails')
        .insert({
          practice_id: options.practiceId,
          template_type: options.templateType,
          recipient_email: options.recipientEmail,
          subject: options.subject,
          template_data: options.templateData,
          scheduled_at: startDate.toISOString(),
          priority: options.priority || 'medium',
          max_retries: options.maxRetries || 3,
          campaign_id: options.campaignId || null,
          is_recurring: true,
          recurrence_rule: options.recurrenceRule,
        })
        .select('id')
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, scheduledEmailId: data?.id as string };
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
      const { error } = await supabase
        .from('scheduled_emails')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', scheduledEmailId)
        .eq('practice_id', practiceId) // Ensure multi-tenant isolation
        .eq('status', 'pending'); // Only cancel pending emails

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
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
      let query = supabase
        .from('scheduled_emails')
        .select('*')
        .eq('practice_id', practiceId)
        .order('scheduled_at', { ascending: true });

      if (options.status) {
        query = query.eq('status', options.status);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(
          options.offset,
          options.offset + (options.limit || 50) - 1
        );
      }

      const { data, error } = await query;

      if (error) {
        return { data: [], error: error.message };
      }

      const scheduledEmails: ScheduledEmailRecord[] = data.map(
        (record: any) => ({
          id: record.id,
          practiceId: record.practice_id,
          templateType: record.template_type,
          recipientEmail: record.recipient_email,
          subject: record.subject,
          templateData: record.template_data,
          scheduledAt: new Date(record.scheduled_at),
          retryCount: record.retry_count,
          maxRetries: record.max_retries,
          nextRetryAt: record.next_retry_at
            ? new Date(record.next_retry_at)
            : undefined,
          status: record.status,
          priority: record.priority,
          campaignId: record.campaign_id,
          processingAttempts: record.processing_attempts,
          lastAttemptedAt: record.last_attempted_at
            ? new Date(record.last_attempted_at)
            : undefined,
          sentAt: record.sent_at ? new Date(record.sent_at) : undefined,
          failedAt: record.failed_at ? new Date(record.failed_at) : undefined,
          errorMessage: record.error_message,
          isRecurring: record.is_recurring,
          recurrenceRule: record.recurrence_rule,
          parentScheduledEmailId: record.parent_scheduled_email_id,
          createdAt: new Date(record.created_at),
          updatedAt: new Date(record.updated_at),
        })
      );

      return { data: scheduledEmails };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown query error';
      return { data: [], error: errorMessage };
    }
  }

  /**
   * Process the email queue - handle pending and retry-ready emails
   */
  private async processEmailQueue(): Promise<void> {
    if (this.isProcessing) {
      return; // Prevent concurrent processing
    }

    this.isProcessing = true;

    try {
      // Get emails ready for processing from the queue view
      const { data: queueItems, error } = await supabase
        .from('email_queue')
        .select('*')
        .eq('ready_for_processing', true)
        .order('priority_order', { ascending: true })
        .order('scheduled_at', { ascending: true })
        .limit(20); // Process up to 20 emails per batch

      if (error) {
        console.error('Error fetching email queue:', error);
        return;
      }

      if (!queueItems || queueItems.length === 0) {
        return; // No emails to process
      }

      // Process each email using the scheduler for rate limiting
      for (const queueItem of queueItems) {
        await this.processEmailWithScheduler(queueItem);
      }
    } catch (error) {
      console.error('Error in email queue processing:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process a single email item with scheduling and rate limiting
   */
  private async processEmailWithScheduler(queueItem: any): Promise<void> {
    try {
      // Mark email as processing
      await this.updateScheduledEmailStatus(queueItem.id, 'processing', {
        processing_attempts: queueItem.processing_attempts + 1,
        last_attempted_at: new Date().toISOString(),
      });

      // Schedule the email processing with rate limiting
      await this.scheduler.schedule(
        async () => {
          return await this.sendScheduledEmail(queueItem);
        },
        {
          priority: queueItem.priority as 'high' | 'medium' | 'low',
          resource: `email_practice_${queueItem.practice_id}`,
          maxRetries: 0, // We handle retries at the application level
          rateLimitRule: 'email_scheduling',
        }
      );
    } catch (error) {
      console.error(`Error processing email ${queueItem.id}:`, error);

      // Handle failure and retry logic
      await this.handleEmailProcessingFailure(queueItem, error);
    }
  }

  /**
   * Send a scheduled email
   */
  private async sendScheduledEmail(queueItem: any): Promise<void> {
    try {
      // Determine the email method based on template type
      let result;

      switch (queueItem.template_type) {
        case 'report_delivery':
          result = await this.emailService.sendReportDeliveryEmail({
            to: queueItem.recipient_email,
            childName: queueItem.template_data.childName,
            assessmentDate: queueItem.template_data.assessmentDate,
            downloadUrl: queueItem.template_data.downloadUrl,
            pdfAttachment: queueItem.template_data.pdfAttachment,
          });
          break;

        case 'report_share':
          result = await this.emailService.sendReportReadyNotification({
            to: queueItem.recipient_email,
            firstName: queueItem.template_data.firstName,
            reportId: queueItem.template_data.reportId,
            downloadUrl: queueItem.template_data.downloadUrl,
            expiresAt: queueItem.template_data.expiresAt,
          });
          break;

        default:
          throw new Error(
            `Unsupported template type: ${queueItem.template_type}`
          );
      }

      if (result.success) {
        // Mark as sent
        await this.updateScheduledEmailStatus(queueItem.id, 'sent', {
          sent_at: new Date().toISOString(),
        });

        // Handle recurring emails
        if (queueItem.is_recurring && queueItem.recurrence_rule) {
          await this.scheduleNextRecurrence(queueItem);
        }
      } else {
        throw new Error(result.error || 'Email sending failed');
      }
    } catch (error) {
      throw error; // Re-throw to be handled by the calling function
    }
  }

  /**
   * Handle email processing failure with retry logic
   */
  private async handleEmailProcessingFailure(
    queueItem: any,
    error: any
  ): Promise<void> {
    const newRetryCount = queueItem.retry_count + 1;
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown processing error';

    if (newRetryCount <= queueItem.max_retries) {
      // Calculate next retry time with exponential backoff
      const backoffMinutes = Math.pow(2, newRetryCount); // 2, 4, 8 minutes
      const nextRetryAt = new Date(Date.now() + backoffMinutes * 60 * 1000);

      await this.updateScheduledEmailStatus(queueItem.id, 'failed', {
        retry_count: newRetryCount,
        next_retry_at: nextRetryAt.toISOString(),
        error_message: errorMessage,
      });
    } else {
      // Max retries reached - mark as permanently failed
      await this.updateScheduledEmailStatus(queueItem.id, 'failed', {
        retry_count: newRetryCount,
        failed_at: new Date().toISOString(),
        error_message: `Max retries exceeded: ${errorMessage}`,
      });
    }
  }

  /**
   * Update the status of a scheduled email
   */
  private async updateScheduledEmailStatus(
    id: string,
    status: string,
    additionalFields: Record<string, any> = {}
  ): Promise<void> {
    await supabase
      .from('scheduled_emails')
      .update({
        status,
        ...additionalFields,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
  }

  /**
   * Schedule the next occurrence of a recurring email
   */
  private async scheduleNextRecurrence(queueItem: any): Promise<void> {
    try {
      // Calculate next occurrence based on cron rule
      const cronExpression = queueItem.recurrence_rule;
      const nextScheduleTime = this.getNextCronOccurrence(cronExpression);

      if (nextScheduleTime) {
        await supabase.from('scheduled_emails').insert({
          practice_id: queueItem.practice_id,
          template_type: queueItem.template_type,
          recipient_email: queueItem.recipient_email,
          subject: queueItem.subject,
          template_data: queueItem.template_data,
          scheduled_at: nextScheduleTime.toISOString(),
          priority: queueItem.priority,
          max_retries: queueItem.max_retries,
          campaign_id: queueItem.campaign_id,
          is_recurring: true,
          recurrence_rule: queueItem.recurrence_rule,
          parent_scheduled_email_id: queueItem.id,
        });
      }
    } catch (error) {
      console.error('Error scheduling next recurrence:', error);
    }
  }

  /**
   * Validate cron expression format
   */
  private validateCronExpression(cronExpression: string): boolean {
    try {
      const cronParts = cronExpression.trim().split(/\s+/);

      // Must have exactly 5 parts: minute hour day month day_of_week
      if (cronParts.length !== 5) {
        return false;
      }

      const [minute, hour, dayOfMonth, month, dayOfWeek] = cronParts;

      // Validate minute (0-59 or *)
      if (minute !== '*') {
        const min = parseInt(minute);
        if (isNaN(min) || min < 0 || min > 59) {
          return false;
        }
      }

      // Validate hour (0-23 or *)
      if (hour !== '*') {
        const hr = parseInt(hour);
        if (isNaN(hr) || hr < 0 || hr > 23) {
          return false;
        }
      }

      // Validate day of month (1-31 or *)
      if (dayOfMonth !== '*') {
        const day = parseInt(dayOfMonth);
        if (isNaN(day) || day < 1 || day > 31) {
          return false;
        }
      }

      // Validate month (1-12 or *)
      if (month !== '*') {
        const mon = parseInt(month);
        if (isNaN(mon) || mon < 1 || mon > 12) {
          return false;
        }
      }

      // Validate day of week (0-6 or *)
      if (dayOfWeek !== '*') {
        const dow = parseInt(dayOfWeek);
        if (isNaN(dow) || dow < 0 || dow > 6) {
          return false;
        }
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Calculate the next occurrence time based on cron expression
   */
  private getNextCronOccurrence(cronExpression: string): Date | null {
    try {
      // Parse cron expression to get next execution time
      // Cron format: minute hour day month day_of_week
      // Example: "0 9 * * 1" = Every Monday at 9:00 AM

      const cronParts = cronExpression.trim().split(/\s+/);
      if (cronParts.length !== 5) {
        console.error(
          'Invalid cron expression format. Expected 5 parts:',
          cronExpression
        );
        return null;
      }

      const [minute, hour, dayOfMonth, month, dayOfWeek] = cronParts;
      const now = new Date();
      let nextDate = new Date(now);

      // Parse minute
      const targetMinute = minute === '*' ? now.getMinutes() : parseInt(minute);
      if (isNaN(targetMinute) || targetMinute < 0 || targetMinute > 59) {
        console.error('Invalid minute in cron expression:', minute);
        return null;
      }

      // Parse hour
      const targetHour = hour === '*' ? now.getHours() : parseInt(hour);
      if (isNaN(targetHour) || targetHour < 0 || targetHour > 23) {
        console.error('Invalid hour in cron expression:', hour);
        return null;
      }

      // Set initial target time for today
      nextDate.setHours(targetHour, targetMinute, 0, 0);

      // If the time has already passed today, move to next occurrence
      if (nextDate <= now) {
        // Handle different recurrence patterns
        if (dayOfWeek !== '*') {
          // Weekly recurrence
          const targetDay = parseInt(dayOfWeek); // 0 = Sunday, 1 = Monday, etc.
          if (!isNaN(targetDay) && targetDay >= 0 && targetDay <= 6) {
            const currentDay = now.getDay();
            let daysToAdd = targetDay - currentDay;

            if (daysToAdd <= 0 || (daysToAdd === 0 && nextDate <= now)) {
              daysToAdd += 7; // Next week
            }

            nextDate.setDate(now.getDate() + daysToAdd);
            nextDate.setHours(targetHour, targetMinute, 0, 0);
          }
        } else if (dayOfMonth !== '*') {
          // Monthly recurrence
          const targetDate = parseInt(dayOfMonth);
          if (!isNaN(targetDate) && targetDate >= 1 && targetDate <= 31) {
            // Move to next month if target date has passed
            let targetMonth = now.getMonth();
            let targetYear = now.getFullYear();

            if (
              now.getDate() > targetDate ||
              (now.getDate() === targetDate && nextDate <= now)
            ) {
              targetMonth++;
              if (targetMonth > 11) {
                targetMonth = 0;
                targetYear++;
              }
            }

            nextDate = new Date(
              targetYear,
              targetMonth,
              targetDate,
              targetHour,
              targetMinute,
              0,
              0
            );
          }
        } else {
          // Daily recurrence - just add one day
          nextDate.setDate(nextDate.getDate() + 1);
        }
      }

      return nextDate;
    } catch (error) {
      console.error('Error parsing cron expression:', error);
      return null;
    }
  }

  /**
   * Start the queue processing interval
   */
  private startProcessing(): void {
    // Process queue every 30 seconds
    this.processingInterval = setInterval(async () => {
      await this.processEmailQueue();
    }, 30000);
  }

  /**
   * Start recurring jobs monitoring
   */
  private startRecurringJobs(): void {
    // Check for recurring jobs every 5 minutes
    this.recurringJobsInterval = setInterval(
      async () => {
        await this.processRecurringJobs();
      },
      5 * 60 * 1000
    );
  }

  /**
   * Process recurring email jobs that need scheduling
   */
  private async processRecurringJobs(): Promise<void> {
    try {
      // This would check for recurring emails that need their next instance scheduled
      // Implementation depends on the specific recurring logic needed
    } catch (error) {
      console.error('Error processing recurring jobs:', error);
    }
  }

  /**
   * Get scheduler metrics for monitoring
   */
  getMetrics() {
    return this.scheduler.getMetrics();
  }

  /**
   * Get health status
   */
  getHealthStatus() {
    return this.scheduler.getHealthStatus();
  }

  /**
   * Shutdown the scheduler gracefully
   */
  async shutdown(): Promise<void> {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }

    if (this.recurringJobsInterval) {
      clearInterval(this.recurringJobsInterval);
    }

    await this.scheduler.shutdown();
  }
}

// Export singleton instance
export const emailScheduler = EmailScheduler.getInstance();
