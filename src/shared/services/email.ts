import { supabase as supabaseClient } from '@/shared/services/supabase';
import { config } from '@/shared/config';

// TODO: Replace with actual Resend implementation in later task
// const resend = new Resend(config.email.resend_api_key);

export interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType?: string;
}

export interface ReportDeliveryEmailOptions {
  to: string;
  childName: string;
  assessmentDate: string;
  downloadUrl: string;
  pdfAttachment?: EmailAttachment;
}

export interface ReportReadyNotificationOptions {
  to: string;
  firstName: string;
  reportId: string;
  downloadUrl?: string;
  expiresAt?: Date;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class EmailService {
  private supabase = supabaseClient;
  private fromEmail = config.email.from;

  /**
   * Send report delivery email with PDF attachment and download link
   * TODO: Replace placeholder with actual Resend implementation
   */
  async sendReportDeliveryEmail(
    options: ReportDeliveryEmailOptions
  ): Promise<EmailResult> {
    try {
      const subject = `Pediatric Health Assessment Report - ${options.childName}`;

      const htmlContent = this.generateReportDeliveryHTML(options);
      const textContent = this.generateReportDeliveryText(options);

      // PLACEHOLDER: Log what would be sent instead of actually sending
      // Would send report delivery email with attachment and download link

      // Generate a mock message ID for tracking
      const mockMessageId = `mock_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

      // Log successful email send (placeholder)
      await this.logEmailSend({
        templateType: 'report_delivery',
        recipientEmail: options.to,
        messageId: mockMessageId,
        status: 'sent',
      });

      return { success: true, messageId: mockMessageId };
    } catch (error) {
      // Email service error occurred
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown email error',
      };
    }
  }

  /**
   * Send notification to user that their report is ready
   * TODO: Replace placeholder with actual Resend implementation
   */
  async sendReportReadyNotification(
    options: ReportReadyNotificationOptions
  ): Promise<EmailResult> {
    try {
      const subject = 'Your Pediatric Health Assessment Report is Ready';

      const htmlContent = this.generateReportReadyHTML(options);
      const textContent = this.generateReportReadyText(options);

      // PLACEHOLDER: Log what would be sent instead of actually sending
      // Would send report ready notification to user

      // Generate a mock message ID for tracking
      const mockMessageId = `mock_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

      // Log successful notification send (placeholder)
      await this.logEmailSend({
        templateType: 'report_ready',
        recipientEmail: options.to,
        messageId: mockMessageId,
        status: 'sent',
      });

      return { success: true, messageId: mockMessageId };
    } catch (error) {
      // Notification service error occurred
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown notification error',
      };
    }
  }

  /**
   * Generate HTML content for report delivery email
   */
  private generateReportDeliveryHTML(
    options: ReportDeliveryEmailOptions
  ): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Pediatric Health Assessment Report</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 14px; color: #64748b; }
            .attachment-note { background: #ecfdf5; border: 1px solid #10b981; padding: 15px; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Pediatric Health Assessment Report</h1>
            </div>
            <div class="content">
              <h2>Report for ${options.childName}</h2>
              <p>Assessment Date: ${new Date(options.assessmentDate).toLocaleDateString()}</p>
              
              ${
                options.pdfAttachment
                  ? `
                <div class="attachment-note">
                  <strong>📎 PDF Report Attached</strong><br>
                  The complete assessment report is attached to this email as a PDF file.
                </div>
              `
                  : ''
              }
              
              <p>You can also access your report online using the secure link below:</p>
              
              <a href="${options.downloadUrl}" class="button">Download Report</a>
              
              <p><strong>Important:</strong> This link will expire in 72 hours for security purposes.</p>
              
              <h3>What's in this report:</h3>
              <ul>
                <li>Comprehensive health assessment results</li>
                <li>Developmental milestone tracking</li>
                <li>Personalized recommendations</li>
                <li>Next steps and follow-up guidance</li>
              </ul>
              
              <p>If you have any questions about this report, please don't hesitate to contact your healthcare provider.</p>
            </div>
            <div class="footer">
              <p>This email was sent from the Pediatric Health Assessment platform. Please do not reply to this email.</p>
              <p>For support, visit our help center or contact your healthcare provider.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Generate plain text content for report delivery email
   */
  private generateReportDeliveryText(
    options: ReportDeliveryEmailOptions
  ): string {
    return `
Pediatric Health Assessment Report

Report for: ${options.childName}
Assessment Date: ${new Date(options.assessmentDate).toLocaleDateString()}

${options.pdfAttachment ? 'The complete assessment report is attached to this email as a PDF file.\n\n' : ''}

You can also access your report online using this secure link:
${options.downloadUrl}

IMPORTANT: This link will expire in 72 hours for security purposes.

What's in this report:
- Comprehensive health assessment results
- Developmental milestone tracking  
- Personalized recommendations
- Next steps and follow-up guidance

If you have any questions about this report, please don't hesitate to contact your healthcare provider.

---
This email was sent from the Pediatric Health Assessment platform.
For support, visit our help center or contact your healthcare provider.
    `.trim();
  }

  /**
   * Generate HTML content for report ready notification
   */
  private generateReportReadyHTML(
    options: ReportReadyNotificationOptions
  ): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Your Report is Ready</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 14px; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Your Report is Ready!</h1>
            </div>
            <div class="content">
              <p>Hi ${options.firstName},</p>
              
              <p>Great news! Your pediatric health assessment report has been generated and is now ready for download.</p>
              
              ${
                options.downloadUrl
                  ? `
                <a href="${options.downloadUrl}" class="button">Download Your Report</a>
                
                ${
                  options.expiresAt
                    ? `
                  <p><strong>Note:</strong> This download link will expire on ${options.expiresAt.toLocaleDateString()} at ${options.expiresAt.toLocaleTimeString()}.</p>
                `
                    : ''
                }
              `
                  : `
                <p>You can access your report by logging into your account on our platform.</p>
              `
              }
              
              <p>Your report includes:</p>
              <ul>
                <li>Complete assessment results</li>
                <li>Developmental insights</li>
                <li>Personalized recommendations</li>
                <li>Next steps for your child's health journey</li>
              </ul>
              
              <p>Thank you for using our pediatric health assessment platform!</p>
            </div>
            <div class="footer">
              <p>This is an automated notification. Please do not reply to this email.</p>
              <p>For support, visit our help center or contact your healthcare provider.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Generate plain text content for report ready notification
   */
  private generateReportReadyText(
    options: ReportReadyNotificationOptions
  ): string {
    return `
Your Report is Ready!

Hi ${options.firstName},

Great news! Your pediatric health assessment report has been generated and is now ready for download.

${
  options.downloadUrl
    ? `
Download your report: ${options.downloadUrl}

${options.expiresAt ? `Note: This download link will expire on ${options.expiresAt.toLocaleDateString()} at ${options.expiresAt.toLocaleTimeString()}.` : ''}
`
    : 'You can access your report by logging into your account on our platform.'
}

Your report includes:
- Complete assessment results
- Developmental insights
- Personalized recommendations
- Next steps for your child's health journey

Thank you for using our pediatric health assessment platform!

---
This is an automated notification. Please do not reply to this email.
For support, visit our help center or contact your healthcare provider.
    `.trim();
  }

  /**
   * Log email send for tracking and analytics
   */
  private async logEmailSend(options: {
    templateType: string;
    recipientEmail: string;
    messageId?: string;
    status: string;
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
}

// Export singleton instance
export const emailService = new EmailService();
