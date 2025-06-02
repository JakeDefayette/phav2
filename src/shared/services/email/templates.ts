import React from 'react';
import { render } from '@react-email/render';
import {
  ReportDeliveryTemplate,
  ReportReadyTemplate,
  ReportDeliveryTemplateProps,
  ReportReadyTemplateProps,
} from './templates';
import { EmailTemplateType, EmailTemplateData } from './types';

// Template registry interface
export interface EmailTemplate {
  component: React.ComponentType<any>;
  defaultSubject: string;
  fallbackHtml: string;
  fallbackText: string;
}

// Template registry
const templateRegistry: Record<EmailTemplateType, EmailTemplate> = {
  report_delivery: {
    component: ReportDeliveryTemplate,
    defaultSubject: 'Pediatric Health Assessment Report',
    fallbackHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2563eb;">Pediatric Health Assessment Report</h1>
        <p>Your report is ready for download.</p>
        <p>If you're seeing this message, there was an issue rendering the email template.</p>
      </div>
    `,
    fallbackText: 'Your Pediatric Health Assessment Report is ready for download.',
  },
  report_ready: {
    component: ReportReadyTemplate,
    defaultSubject: 'Your Report is Ready',
    fallbackHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #059669;">Your Report is Ready!</h1>
        <p>Your Pediatric Health Assessment Report has been completed and is ready for download.</p>
        <p>If you're seeing this message, there was an issue rendering the email template.</p>
      </div>
    `,
    fallbackText: 'Your Pediatric Health Assessment Report is ready for download.',
  },
  welcome: {
    component: ReportDeliveryTemplate, // Placeholder - would need dedicated template
    defaultSubject: 'Welcome to Pediatric Health Assessment',
    fallbackHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1>Welcome!</h1>
        <p>Thank you for joining our Pediatric Health Assessment platform.</p>
      </div>
    `,
    fallbackText: 'Welcome to Pediatric Health Assessment platform.',
  },
  password_reset: {
    component: ReportDeliveryTemplate, // Placeholder - would need dedicated template
    defaultSubject: 'Password Reset Request',
    fallbackHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1>Password Reset</h1>
        <p>You requested a password reset. Please follow the instructions to reset your password.</p>
      </div>
    `,
    fallbackText: 'Password reset instructions.',
  },
  account_verification: {
    component: ReportDeliveryTemplate, // Placeholder - would need dedicated template
    defaultSubject: 'Verify Your Account',
    fallbackHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1>Verify Your Account</h1>
        <p>Please verify your account to complete registration.</p>
      </div>
    `,
    fallbackText: 'Please verify your account.',
  },
  assessment_reminder: {
    component: ReportDeliveryTemplate, // Placeholder - would need dedicated template
    defaultSubject: 'Assessment Reminder',
    fallbackHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1>Assessment Reminder</h1>
        <p>This is a reminder about your upcoming assessment.</p>
      </div>
    `,
    fallbackText: 'Assessment reminder.',
  },
  system_notification: {
    component: ReportDeliveryTemplate, // Placeholder - would need dedicated template
    defaultSubject: 'System Notification',
    fallbackHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1>System Notification</h1>
        <p>You have received a system notification.</p>
      </div>
    `,
    fallbackText: 'System notification.',
  },
};

// Template rendering service
export class EmailTemplateService {
  /**
   * Render a template to HTML and text
   */
  static async renderTemplate(
    templateType: EmailTemplateType,
    data: EmailTemplateData
  ): Promise<{ html: string; text: string; subject: string }> {
    try {
      const template = templateRegistry[templateType];
      
      if (!template) {
        throw new Error(`Template not found: ${templateType}`);
      }

      // Create the React element with the provided data
      const element = React.createElement(template.component, data);

      // Render to HTML and text
      const html = await render(element);
      const text = await render(element, { plainText: true });

      return {
        html,
        text,
        subject: template.defaultSubject,
      };

    } catch (error) {
      console.error(`Error rendering template ${templateType}:`, error);
      
      // Return fallback content
      const template = templateRegistry[templateType];
      return {
        html: template?.fallbackHtml || 'Email content unavailable',
        text: template?.fallbackText || 'Email content unavailable',
        subject: template?.defaultSubject || 'Email Notification',
      };
    }
  }

  /**
   * Render report delivery email
   */
  static async renderReportDelivery(
    props: ReportDeliveryTemplateProps
  ): Promise<{ html: string; text: string; subject: string }> {
    return this.renderTemplate('report_delivery', props);
  }

  /**
   * Render report ready notification
   */
  static async renderReportReady(
    props: ReportReadyTemplateProps
  ): Promise<{ html: string; text: string; subject: string }> {
    return this.renderTemplate('report_ready', props);
  }

  /**
   * Get available template types
   */
  static getAvailableTemplates(): EmailTemplateType[] {
    return Object.keys(templateRegistry) as EmailTemplateType[];
  }

  /**
   * Check if a template exists
   */
  static hasTemplate(templateType: EmailTemplateType): boolean {
    return templateType in templateRegistry;
  }

  /**
   * Get template metadata
   */
  static getTemplateInfo(templateType: EmailTemplateType) {
    const template = templateRegistry[templateType];
    if (!template) {
      return null;
    }

    return {
      type: templateType,
      defaultSubject: template.defaultSubject,
      hasComponent: !!template.component,
      hasFallback: !!(template.fallbackHtml && template.fallbackText),
    };
  }

  /**
   * Register a new template (for extensibility)
   */
  static registerTemplate(
    templateType: EmailTemplateType,
    template: EmailTemplate
  ): void {
    templateRegistry[templateType] = template;
  }

  /**
   * Test template rendering with sample data
   */
  static async testTemplate(
    templateType: EmailTemplateType
  ): Promise<{ html: string; text: string; subject: string }> {
    const sampleData = this.getSampleData(templateType);
    return this.renderTemplate(templateType, sampleData);
  }

  /**
   * Get sample data for testing templates
   */
  private static getSampleData(templateType: EmailTemplateType): EmailTemplateData {
    switch (templateType) {
      case 'report_delivery':
        return {
          childName: 'Sample Child',
          assessmentDate: new Date().toLocaleDateString(),
          downloadUrl: 'https://example.com/download/sample-report',
          hasAttachment: true,
          practiceInfo: {
            name: 'Sample Practice',
            address: '123 Main St, City, State 12345',
            phone: '(555) 123-4567',
            website: 'https://example.com',
          },
        };

      case 'report_ready':
        return {
          firstName: 'Sample User',
          reportId: 'SAMPLE-123',
          downloadUrl: 'https://example.com/download/sample-report',
          expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000), // 72 hours
          practiceInfo: {
            name: 'Sample Practice',
            address: '123 Main St, City, State 12345',
            phone: '(555) 123-4567',
            website: 'https://example.com',
          },
        };

      default:
        return {
          name: 'Sample User',
          email: 'user@example.com',
        };
    }
  }
}

export default EmailTemplateService; 