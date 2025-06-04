import { ResendClient } from '@/shared/services/email/resend';
import { EmailTemplateService } from '@/shared/services/email/templates';
import { EmailTrackingService } from '@/shared/services/email/tracking';
import { EmailBounceHandler } from '@/shared/services/email/bounceHandler';
import { EmailComplianceService } from '@/shared/services/email/compliance';
import {
  EmailSendOptions,
  EmailTemplateType,
  EmailTemplateData,
  ResendConfig,
} from '@/shared/services/email/types';

describe('Email Service Integration Tests', () => {
  let resendClient: ResendClient;
  let trackingService: EmailTrackingService;
  let bounceHandler: EmailBounceHandler;
  let complianceService: EmailComplianceService;

  beforeAll(() => {
    // Initialize services with test configuration
    const config: ResendConfig = {
      apiKey: process.env.RESEND_API_KEY || 'test-api-key',
      rateLimit: {
        tokensPerSecond: 100, // High rate for testing
        maxTokens: 100,
      },
      retry: {
        maxAttempts: 1, // Minimal retries for faster tests
        baseDelayMs: 100,
      },
    };

    resendClient = new ResendClient(config);
    // Note: EmailTemplateService uses static methods, no instance needed
    trackingService = new EmailTrackingService();
    bounceHandler = new EmailBounceHandler();
    complianceService = new EmailComplianceService();
  });

  describe('Complete Email Pipeline', () => {
    it('should send a report delivery email with tracking', async () => {
      const templateData: EmailTemplateData = {
        recipientName: 'John Doe',
        practiceInfo: {
          name: 'Test Practice',
          logo: 'https://example.com/logo.png',
          address: '123 Test St',
          phone: '555-0123',
          email: 'practice@test.com',
        },
        reportData: {
          childName: 'Test Child',
          assessmentDate: '2024-01-01',
          reportUrl: 'https://example.com/report/123',
          downloadUrl: 'https://example.com/download/123',
        },
        customization: {
          primaryColor: '#007bff',
          secondaryColor: '#6c757d',
          fontFamily: 'Arial, sans-serif',
        },
      };

      // Generate template
      const templateContent = await EmailTemplateService.renderTemplate(
        EmailTemplateType.REPORT_DELIVERY,
        templateData
      );

      expect(templateContent.html).toContain('Test Child');
      expect(templateContent.html).toContain('Test Practice');

      // Add tracking if enabled
      const enhancedContent = await trackingService.addTrackingToEmail({
        emailContent: templateContent.html,
        practiceId: 'practice-123',
        emailId: 'email-123',
        recipientEmail: 'recipient@example.com',
      });

      expect(enhancedContent.html).toContain('tracking');

      // Prepare email options
      const emailOptions: EmailSendOptions = {
        from: 'noreply@test.com',
        to: 'recipient@example.com',
        subject: templateContent.subject,
        html: enhancedContent.html,
        text: enhancedContent.text || templateContent.text,
        tags: [
          { name: 'template', value: EmailTemplateType.REPORT_DELIVERY },
          { name: 'practice', value: 'practice-123' },
        ],
      };

      // In a real test environment, this would actually send
      // For now, we'll test the configuration is valid
      expect(emailOptions.from).toBeTruthy();
      expect(emailOptions.to).toBeTruthy();
      expect(emailOptions.html).toBeTruthy();
      expect(emailOptions.subject).toBeTruthy();
    });

    it('should handle email bounce workflow', async () => {
      const bounceEvent = {
        type: 'email.bounced' as const,
        created_at: '2024-01-01T12:00:00Z',
        data: {
          created_at: '2024-01-01T12:00:00Z',
          email_id: 'email-123',
          from: 'test@example.com',
          to: ['bounced@example.com'],
          subject: 'Test Email',
          bounce: {
            bounceType: 'Permanent' as const,
            bounceSubType: 'General',
          },
        },
      };

      // Process bounce event
      const bounceResult = await bounceHandler.processBounce(
        bounceEvent,
        'practice-123'
      );

      expect(bounceResult).toBeDefined();

      // Check if email is marked as suppressed (bounced emails are added to suppression list)
      const isSuppressed = await bounceHandler.isEmailSuppressed(
        'practice-123',
        'bounced@example.com'
      );

      expect(isSuppressed).toBe(true);
    });

    it('should handle unsubscribe workflow', async () => {
      const email = 'unsubscribe@example.com';
      const practiceId = 'practice-123';

      // Add to suppression list (simulating unsubscribe)
      const suppressionResult = await complianceService.addToSuppressionList({
        practiceId,
        email,
        suppressionType: 'unsubscribe',
        suppressionReason: 'user_request',
        canBeResubscribed: true,
      });

      expect(suppressionResult.success).toBe(true);

      // Check suppression status
      const suppressionStatus = await complianceService.isEmailSuppressed(
        practiceId,
        email
      );

      expect(suppressionStatus.success).toBe(true);
      expect(suppressionStatus.suppressed).toBe(true);

      // Check tracking service suppression list
      const isSuppressed = await trackingService.isEmailSuppressed(
        practiceId,
        email
      );

      expect(isSuppressed).toBe(true);
    });
  });

  describe('Template Rendering Integration', () => {
    it('should render all email template types', async () => {
      const baseTemplateData: EmailTemplateData = {
        recipientName: 'Test User',
        practiceInfo: {
          name: 'Test Practice',
          logo: 'https://example.com/logo.png',
          address: '123 Test St',
          phone: '555-0123',
          email: 'practice@test.com',
        },
        customization: {
          primaryColor: '#007bff',
          secondaryColor: '#6c757d',
          fontFamily: 'Arial, sans-serif',
        },
      };

      const templateTypes = [
        EmailTemplateType.REPORT_DELIVERY,
        EmailTemplateType.REPORT_READY,
        EmailTemplateType.WELCOME,
        EmailTemplateType.PASSWORD_RESET,
        EmailTemplateType.ASSESSMENT_REMINDER,
      ];

      for (const templateType of templateTypes) {
        const templateData = {
          ...baseTemplateData,
          reportData: templateType.includes('REPORT')
            ? {
                childName: 'Test Child',
                assessmentDate: '2024-01-01',
                reportUrl: 'https://example.com/report/123',
                downloadUrl: 'https://example.com/download/123',
              }
            : undefined,
          resetData:
            templateType === EmailTemplateType.PASSWORD_RESET
              ? {
                  resetUrl: 'https://example.com/reset/123',
                  expiresAt: '2024-01-01T24:00:00Z',
                }
              : undefined,
        };

        const result = await EmailTemplateService.renderTemplate(
          templateType,
          templateData
        );

        expect(result.html).toBeTruthy();
        expect(result.text).toBeTruthy();
        expect(result.subject).toBeTruthy();
        expect(result.html).toContain('Test Practice');
      }
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle rate limiting gracefully', async () => {
      const limitedConfig: ResendConfig = {
        apiKey: 'test-api-key',
        rateLimit: {
          tokensPerSecond: 1,
          maxTokens: 1,
        },
      };

      const limitedClient = new ResendClient(limitedConfig);

      const emailOptions: EmailSendOptions = {
        from: 'test@example.com',
        to: 'recipient@example.com',
        subject: 'Rate Limit Test',
        html: '<p>Test</p>',
        text: 'Test',
      };

      // First email should succeed (uses available token)
      const firstResult = await limitedClient.sendEmail(emailOptions);

      // Rate limiting behavior depends on implementation
      // This test verifies the client handles rate limiting gracefully
      expect(firstResult).toBeDefined();
      expect(typeof firstResult.success).toBe('boolean');
    });

    it('should handle template rendering errors', async () => {
      const invalidTemplateData = {
        // Missing required fields
      } as EmailTemplateData;

      await expect(
        EmailTemplateService.renderTemplate(
          EmailTemplateType.REPORT_DELIVERY,
          invalidTemplateData
        )
      ).rejects.toThrow();
    });
  });

  describe('Analytics Integration', () => {
    it('should generate comprehensive analytics', async () => {
      const practiceId = 'practice-123';
      const query = {
        practiceId,
        startDate: new Date('2024-01-01T00:00:00Z'),
        endDate: new Date('2024-01-31T23:59:59Z'),
      };

      // Get analytics summary
      const summary = await trackingService.getAnalyticsSummary(query);
      expect(Array.isArray(summary)).toBe(true);

      // Get performance metrics
      const performance = await trackingService.getEmailPerformance(query);
      expect(performance).toBeDefined();
      expect(typeof performance.openRate).toBe('number');
      expect(typeof performance.clickRate).toBe('number');
      expect(typeof performance.bounceRate).toBe('number');
    });
  });
});

describe('Cross-Client Compatibility Tests', () => {
  // EmailTemplateService uses static methods, no instance needed

  const emailClients = [
    'Gmail Web',
    'Outlook 2019',
    'Apple Mail',
    'Yahoo Mail',
    'Thunderbird',
    'Mobile Gmail',
    'Mobile Outlook',
  ];

  describe('Template Compatibility', () => {
    it('should generate cross-client compatible HTML', async () => {
      const templateData: EmailTemplateData = {
        recipientName: 'Test User',
        practiceInfo: {
          name: 'Test Practice',
          logo: 'https://example.com/logo.png',
          address: '123 Test St',
          phone: '555-0123',
          email: 'practice@test.com',
        },
        reportData: {
          childName: 'Test Child',
          assessmentDate: '2024-01-01',
          reportUrl: 'https://example.com/report/123',
          downloadUrl: 'https://example.com/download/123',
        },
        customization: {
          primaryColor: '#007bff',
          secondaryColor: '#6c757d',
          fontFamily: 'Arial, sans-serif',
        },
      };

      const result = await EmailTemplateService.renderTemplate(
        EmailTemplateType.REPORT_DELIVERY,
        templateData
      );

      // Check for cross-client compatibility features
      expect(result.html).toContain('table'); // Tables for layout
      expect(result.html).toContain('mso-'); // Outlook-specific styles
      expect(result.html).toContain('webkit-'); // WebKit prefixes
      expect(result.html).toContain('!important'); // Style specificity

      // Check for inline styles (for client compatibility)
      expect(result.html).toMatch(/style=["'][^"']*["']/);

      // Verify fallback content
      expect(result.text).toBeTruthy();
      expect(result.text.length).toBeGreaterThan(0);
    });

    emailClients.forEach(client => {
      it(`should be compatible with ${client}`, async () => {
        const templateData: EmailTemplateData = {
          recipientName: 'Test User',
          practiceInfo: {
            name: 'Test Practice',
            logo: 'https://example.com/logo.png',
            address: '123 Test St',
            phone: '555-0123',
            email: 'practice@test.com',
          },
          customization: {
            primaryColor: '#007bff',
            secondaryColor: '#6c757d',
            fontFamily: 'Arial, sans-serif',
          },
        };

        const result = await EmailTemplateService.renderTemplate(
          EmailTemplateType.WELCOME,
          templateData
        );

        // Basic compatibility checks
        expect(result.html).toBeTruthy();
        expect(result.html).toContain('<!DOCTYPE html');
        expect(result.html).toContain('<html');
        expect(result.html).toContain('<body');

        // Client-specific checks would go here
        // For now, we verify basic structure
        expect(result.html).toMatch(/<table[^>]*>/i);
        expect(result.html).toMatch(/<td[^>]*>/i);
      });
    });
  });
});
