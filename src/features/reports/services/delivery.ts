import { supabaseServer } from '@/shared/services/supabase-server';
import { PDFService } from './pdf';
import { EmailService } from '@/shared/services/email';
import { v4 as uuidv4 } from 'uuid';
import { put } from '@vercel/blob';
import { ReportsService } from './reports';
import { config } from '@/shared/config';
import type {
  DeliveryOptions,
  DeliveryMethod,
  DeliveryResult,
  Report,
  GeneratedReport,
} from '../types';

export class DeliveryService {
  private supabase = supabaseServer;
  private pdfService = PDFService.getInstance();
  private emailService = new EmailService();
  private reportsService = new ReportsService();

  /**
   * Main delivery method that coordinates multiple delivery channels
   */
  async deliverReport(options: DeliveryOptions): Promise<DeliveryResult> {
    try {
      // Generate unique delivery ID
      const deliveryId = uuidv4();

      // Get the report from database
      const report = await this.reportsService.findById(options.reportId);

      if (!report) {
        throw new Error(`Report not found: ${options.reportId}`);
      }

      // Convert database Report to GeneratedReport format for PDF generation
      const generatedReport = await this.convertToGeneratedReport(report);

      // Generate PDF buffer
      const pdfBuffer =
        await this.pdfService.generatePDFBuffer(generatedReport);

      // Create share token for secure access
      const shareToken = await this.createShareToken(
        options.reportId,
        options.userId,
        options.expirationHours
      );

      const result: DeliveryResult = {
        success: false,
        deliveryId,
        shareToken,
      };

      // Process each delivery method
      for (const method of options.deliveryMethods) {
        if (!method.enabled) continue;

        switch (method.type) {
          case 'email':
            if (options.recipientEmail) {
              const emailResult = await this.deliverViaEmail(
                pdfBuffer,
                options.recipientEmail,
                options.reportId,
                shareToken,
                deliveryId
              );
              result.emailSent = emailResult.success;
            }
            break;

          case 'cloud_storage':
            const cloudResult = await this.deliverViaCloudStorage(
              pdfBuffer,
              options.reportId,
              deliveryId,
              options.expirationHours
            );
            result.cloudStorageUrl = cloudResult.url;
            break;

          case 'download':
            const downloadResult = await this.createSecureDownloadLink(
              options.reportId,
              shareToken,
              options.expirationHours
            );
            result.downloadUrl = downloadResult.url;
            result.expiresAt = downloadResult.expiresAt;
            break;

          case 'sms':
            if (options.recipientPhone) {
              // SMS delivery implementation would go here
              // For now, we'll skip this as it requires additional SMS service setup
            }
            break;
        }
      }

      // Log delivery attempt
      await this.logDeliveryAttempt(deliveryId, options, result);

      // Send user notification if requested
      if (options.notifyUser) {
        await this.notifyUserReportReady(
          options.userId,
          options.reportId,
          result
        );
      }

      result.success = true;
      return result;
    } catch (error) {
      console.error('Delivery failed:', error);
      return {
        success: false,
        deliveryId: uuidv4(),
        error:
          error instanceof Error ? error.message : 'Unknown delivery error',
      };
    }
  }

  /**
   * Create a secure share token for report access
   */
  private async createShareToken(
    reportId: string,
    userId: string,
    expirationHours: number = 72
  ): Promise<string> {
    const shareToken = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expirationHours);

    const { error } = await this.supabase
      .from('reports')
      .update({
        share_token: shareToken,
        share_expires_at: expiresAt.toISOString(),
        is_public: true,
      })
      .eq('id', reportId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to create share token: ${error.message}`);
    }

    return shareToken;
  }

  /**
   * Deliver report via email with PDF attachment and/or download link
   * NOTE: Currently uses placeholder email service - will be replaced with Resend in later task
   */
  private async deliverViaEmail(
    pdfBuffer: Buffer,
    recipientEmail: string,
    reportId: string,
    shareToken: string,
    deliveryId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(
        `📧 Delivering report ${reportId} via email to ${recipientEmail}`
      );

      // Get report details for email content
      const { data: report } = await this.supabase
        .from('reports')
        .select('child_name, assessment_date, user_id')
        .eq('id', reportId)
        .single();

      if (!report) {
        throw new Error('Report not found');
      }

      // Create secure download link for email
      const downloadUrl = `${config.app.base_url}/reports/download/${shareToken}`;

      // Send email with PDF attachment and download link
      const emailResult = await this.emailService.sendReportDeliveryEmail({
        to: recipientEmail,
        childName: report.child_name,
        assessmentDate: report.assessment_date,
        downloadUrl,
        pdfAttachment: {
          filename: `pediatric-assessment-${report.child_name}-${report.assessment_date}.pdf`,
          content: pdfBuffer,
        },
      });

      // Log email delivery
      await this.logEmailDelivery(
        deliveryId,
        recipientEmail,
        emailResult.success
      );

      return { success: emailResult.success };
    } catch (error) {
      console.error('Email delivery failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Email delivery failed',
      };
    }
  }

  /**
   * Store PDF in cloud storage and return secure URL
   */
  private async deliverViaCloudStorage(
    pdfBuffer: Buffer,
    reportId: string,
    deliveryId: string,
    expirationHours: number = 72
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      // Upload to Vercel Blob storage
      const filename = `reports/${reportId}/${deliveryId}.pdf`;
      const blob = await put(filename, pdfBuffer, {
        access: 'public',
        contentType: 'application/pdf',
      });

      // Store cloud storage reference
      await this.supabase.from('report_deliveries').insert({
        delivery_id: deliveryId,
        report_id: reportId,
        storage_url: blob.url,
        storage_provider: 'vercel_blob',
        expires_at: new Date(
          Date.now() + expirationHours * 60 * 60 * 1000
        ).toISOString(),
      });

      return { success: true, url: blob.url };
    } catch (error) {
      console.error('Cloud storage delivery failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Cloud storage failed',
      };
    }
  }

  /**
   * Create secure download link with expiration
   */
  private async createSecureDownloadLink(
    reportId: string,
    shareToken: string,
    expirationHours: number = 72
  ): Promise<{ url: string; expiresAt: Date }> {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expirationHours);

    const downloadUrl = `${config.app.base_url}/reports/download/${shareToken}`;

    return {
      url: downloadUrl,
      expiresAt,
    };
  }

  /**
   * Log delivery attempt for tracking and analytics
   */
  private async logDeliveryAttempt(
    deliveryId: string,
    options: DeliveryOptions,
    result: DeliveryResult
  ): Promise<void> {
    try {
      await this.supabase.from('report_shares').insert({
        report_id: options.reportId,
        share_method: options.deliveryMethods.map(m => m.type).join(','),
        recipient_email: options.recipientEmail,
        recipient_phone: options.recipientPhone,
        shared_by: options.userId,
        delivery_id: deliveryId,
        success: result.success,
        error_message: result.error,
      });
    } catch (error) {
      console.error('Failed to log delivery attempt:', error);
    }
  }

  /**
   * Log email delivery for tracking
   */
  private async logEmailDelivery(
    deliveryId: string,
    recipientEmail: string,
    success: boolean
  ): Promise<void> {
    try {
      await this.supabase.from('email_sends').insert({
        template_type: 'report_delivery',
        recipient_email: recipientEmail,
        status: success ? 'sent' : 'failed',
        delivery_id: deliveryId,
        sent_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to log email delivery:', error);
    }
  }

  /**
   * Notify user that their report is ready
   */
  private async notifyUserReportReady(
    userId: string,
    reportId: string,
    deliveryResult: DeliveryResult
  ): Promise<void> {
    try {
      // Get user email
      const { data: user } = await this.supabase
        .from('users')
        .select('email, first_name')
        .eq('id', userId)
        .single();

      if (!user?.email) return;

      // Send notification email
      await this.emailService.sendReportReadyNotification({
        to: user.email,
        firstName: user.first_name,
        reportId,
        downloadUrl: deliveryResult.downloadUrl,
        expiresAt: deliveryResult.expiresAt,
      });
    } catch (error) {
      console.error('Failed to send user notification:', error);
    }
  }

  /**
   * Get delivery status and tracking information
   */
  async getDeliveryStatus(deliveryId: string): Promise<any> {
    const { data, error } = await this.supabase
      .from('report_shares')
      .select(
        `
        *,
        reports(child_name, assessment_date),
        email_sends(status, opened_at, clicked_at)
      `
      )
      .eq('delivery_id', deliveryId)
      .single();

    if (error) {
      throw new Error(`Failed to get delivery status: ${error.message}`);
    }

    return data;
  }

  /**
   * Revoke access to a shared report
   */
  async revokeAccess(reportId: string, userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('reports')
      .update({
        share_token: null,
        share_expires_at: null,
        is_public: false,
      })
      .eq('id', reportId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to revoke access: ${error.message}`);
    }
  }

  /**
   * Convert database Report to GeneratedReport format for PDF generation
   */
  private async convertToGeneratedReport(
    report: Report
  ): Promise<GeneratedReport> {
    try {
      // Get assessment and child data for the report
      const { data: assessmentData, error: assessmentError } =
        await this.supabase
          .from('assessments')
          .select(
            `
          id,
          child_id,
          brain_o_meter_score,
          started_at,
          completed_at,
          status,
          children (
            id,
            first_name,
            last_name,
            date_of_birth,
            gender
          )
        `
          )
          .eq('id', report.assessment_id)
          .single();

      if (assessmentError || !assessmentData) {
        throw new Error(`Assessment not found for report ${report.id}`);
      }

      const child = assessmentData.children as any;

      // Calculate child's age
      const calculateAge = (dateOfBirth: string): number => {
        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (
          monthDiff < 0 ||
          (monthDiff === 0 && today.getDate() < birthDate.getDate())
        ) {
          age--;
        }
        return age;
      };

      // Create a properly structured GeneratedReport
      const generatedReport: GeneratedReport = {
        id: report.id,
        assessment_id: report.assessment_id,
        practice_id: report.practice_id || undefined,
        report_type: 'standard', // Default type since this field doesn't exist in the DB
        content: {
          child: {
            name: `${child.first_name} ${child.last_name || ''}`.trim(),
            age: calculateAge(child.date_of_birth),
            gender: child.gender,
          },
          assessment: {
            id: assessmentData.id,
            brain_o_meter_score: assessmentData.brain_o_meter_score,
            completed_at: assessmentData.completed_at,
            status: assessmentData.status,
          },
          // Content is generated dynamically, not stored in database
        },
        generated_at: new Date().toISOString(), // Use current time since this field doesn't exist in DB
        created_at: report.created_at || undefined,
        updated_at: report.updated_at || undefined,
      };

      return generatedReport;
    } catch (error) {
      console.error('Error converting report to GeneratedReport:', error);
      throw new Error(
        `Failed to convert report ${report.id} for PDF generation`
      );
    }
  }
}
