import React from 'react';
import { render } from '@react-email/render';
import { EmailTemplateService } from '../templates';
import { EmailTemplateType, EmailTemplateData } from '../types';

// Mock the @react-email/render module
jest.mock('@react-email/render');
const mockRender = jest.mocked(render);

// Mock the template components
jest.mock('../templates/', () => ({
  ReportDeliveryTemplate: ({ childName }: any) =>
    React.createElement('div', {}, `Report for ${childName || 'Child'}`),
  ReportReadyTemplate: ({ firstName }: any) =>
    React.createElement('div', {}, `Report ready for ${firstName || 'User'}`),
}));

describe('EmailTemplateService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset any custom templates before each test
    EmailTemplateService.clearCustomTemplates();
  });

  describe('renderTemplate', () => {
    it('should render template successfully', async () => {
      const mockHtml = '<div>Report for Test Child</div>';
      const mockText = 'Report for Test Child';

      mockRender
        .mockResolvedValueOnce(mockHtml)
        .mockResolvedValueOnce(mockText);

      const result = await EmailTemplateService.renderTemplate(
        EmailTemplateType.REPORT_DELIVERY,
        { childName: 'Test Child' }
      );

      expect(result).toEqual({
        html: mockHtml,
        text: mockText,
        subject: 'Pediatric Health Assessment Report',
      });

      expect(mockRender).toHaveBeenCalledTimes(2);
      expect(mockRender).toHaveBeenNthCalledWith(1, expect.any(Object));
      expect(mockRender).toHaveBeenNthCalledWith(2, expect.any(Object), {
        plainText: true,
      });
    });

    it('should return fallback content when rendering fails', async () => {
      mockRender.mockRejectedValue(new Error('Rendering failed'));

      const result = await EmailTemplateService.renderTemplate(
        EmailTemplateType.REPORT_DELIVERY,
        { childName: 'Test Child' }
      );

      expect(result.html).toContain('Pediatric Health Assessment Report');
      expect(result.text).toBe(
        'Your Pediatric Health Assessment Report is ready for download.'
      );
      expect(result.subject).toBe('Pediatric Health Assessment Report');
    });

    it('should return fallback for non-existent template', async () => {
      const result = await EmailTemplateService.renderTemplate(
        'non_existent' as EmailTemplateType,
        {}
      );

      // Should return fallback since template doesn't exist
      expect(result.html).toBe('Email content unavailable');
      expect(result.text).toBe('Email content unavailable');
      expect(result.subject).toBe('Email Notification');
    });

    it('should handle all template types', async () => {
      const templateTypes: EmailTemplateType[] = [
        EmailTemplateType.REPORT_DELIVERY,
        EmailTemplateType.REPORT_READY,
        EmailTemplateType.WELCOME,
        EmailTemplateType.PASSWORD_RESET,
        EmailTemplateType.ACCOUNT_VERIFICATION,
        EmailTemplateType.ASSESSMENT_REMINDER,
        EmailTemplateType.SYSTEM_NOTIFICATION,
      ];

      mockRender
        .mockResolvedValue('<div>Mock HTML</div>')
        .mockResolvedValue('Mock Text');

      for (const templateType of templateTypes) {
        const result = await EmailTemplateService.renderTemplate(
          templateType,
          {}
        );

        expect(result).toHaveProperty('html');
        expect(result).toHaveProperty('text');
        expect(result).toHaveProperty('subject');
        expect(typeof result.subject).toBe('string');
      }
    });

    it('should render report delivery template with correct data', async () => {
      const mockHtml = '<div>Report for John Doe</div>';
      const mockText = 'Report for John Doe';

      mockRender
        .mockResolvedValueOnce(mockHtml)
        .mockResolvedValueOnce(mockText);

      const templateData: EmailTemplateData = {
        childName: 'John Doe',
        assessmentDate: '2024-01-01',
        downloadUrl: 'https://example.com/download/123',
        practiceInfo: {
          name: 'Test Practice',
          phone: '555-0123',
          email: 'test@practice.com',
          website: 'https://testpractice.com',
        },
      };

      const result = await EmailTemplateService.renderTemplate(
        EmailTemplateType.REPORT_DELIVERY,
        templateData
      );

      expect(result.html).toBe(mockHtml);
      expect(result.text).toBe(mockText);
      expect(result.subject).toBe('Pediatric Health Assessment Report');
    });

    it('should render report ready template with correct data', async () => {
      const mockHtml = '<div>Report ready for Jane</div>';
      const mockText = 'Report ready for Jane';

      mockRender
        .mockResolvedValueOnce(mockHtml)
        .mockResolvedValueOnce(mockText);

      const templateData: EmailTemplateData = {
        firstName: 'Jane',
        reportId: 'report-456',
        downloadUrl: 'https://example.com/download/456',
        expiresAt: new Date('2024-12-31T23:59:59Z'),
      };

      const result = await EmailTemplateService.renderTemplate(
        EmailTemplateType.REPORT_READY,
        templateData
      );

      expect(result.html).toBe(mockHtml);
      expect(result.text).toBe(mockText);
      expect(result.subject).toBe('Your Report is Ready');
    });

    it('should handle missing template data gracefully', async () => {
      const mockHtml = '<div>Report for Child</div>';
      const mockText = 'Report for Child';

      mockRender
        .mockResolvedValueOnce(mockHtml)
        .mockResolvedValueOnce(mockText);

      const result = await EmailTemplateService.renderTemplate(
        EmailTemplateType.REPORT_DELIVERY,
        {}
      );

      expect(result.html).toBe(mockHtml);
      expect(result.text).toBe(mockText);
      expect(result.subject).toBe('Pediatric Health Assessment Report');
    });
  });

  describe('renderReportDelivery', () => {
    it('should render report delivery template', async () => {
      const mockHtml = '<div>Report delivery email</div>';
      const mockText = 'Report delivery email';

      mockRender
        .mockResolvedValueOnce(mockHtml)
        .mockResolvedValueOnce(mockText);

      const props = {
        childName: 'John Doe',
        assessmentDate: '2024-01-01',
        downloadUrl: 'https://example.com/download',
        practiceInfo: {
          name: 'Test Practice',
          address: '123 Main St',
          phone: '555-0123',
          website: 'https://practice.com',
        },
      };

      const result = await EmailTemplateService.renderReportDelivery(props);

      expect(result).toEqual({
        html: mockHtml,
        text: mockText,
        subject: 'Pediatric Health Assessment Report',
      });
    });
  });

  describe('renderReportReady', () => {
    it('should render report ready template', async () => {
      const mockHtml = '<div>Report ready notification</div>';
      const mockText = 'Report ready notification';

      mockRender
        .mockResolvedValueOnce(mockHtml)
        .mockResolvedValueOnce(mockText);

      const props = {
        firstName: 'Jane Doe',
        reportId: 'report-123',
        downloadUrl: 'https://example.com/download',
        expiresAt: new Date('2024-12-31T23:59:59Z'),
        practiceInfo: {
          name: 'Test Practice',
          address: '123 Main St',
          phone: '555-0123',
          website: 'https://practice.com',
        },
      };

      const result = await EmailTemplateService.renderReportReady(props);

      expect(result).toEqual({
        html: mockHtml,
        text: mockText,
        subject: 'Your Report is Ready',
      });
    });
  });

  describe('utility methods', () => {
    it('should get available templates', () => {
      const templates = EmailTemplateService.getAvailableTemplates();
      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);
      expect(templates).toContain(EmailTemplateType.REPORT_DELIVERY);
      expect(templates).toContain(EmailTemplateType.REPORT_READY);
    });

    it('should check if template exists', () => {
      expect(
        EmailTemplateService.hasTemplate(EmailTemplateType.REPORT_DELIVERY)
      ).toBe(true);
      expect(
        EmailTemplateService.hasTemplate(EmailTemplateType.REPORT_READY)
      ).toBe(true);
      expect(
        EmailTemplateService.hasTemplate('non_existent' as EmailTemplateType)
      ).toBe(false);
    });

    it('should get template info', () => {
      const info = EmailTemplateService.getTemplateInfo(
        EmailTemplateType.REPORT_DELIVERY
      );
      expect(info).toBeDefined();
      expect(info?.type).toBe(EmailTemplateType.REPORT_DELIVERY);
      expect(info?.defaultSubject).toBe('Pediatric Health Assessment Report');
      expect(info?.hasComponent).toBe(true);
      expect(info?.hasFallback).toBe(true);
    });

    it('should return null for non-existent template info', () => {
      const info = EmailTemplateService.getTemplateInfo(
        'non_existent' as EmailTemplateType
      );
      expect(info).toBeNull();
    });

    it('should test template with sample data', async () => {
      const mockHtml = '<div>Sample template</div>';
      const mockText = 'Sample template';

      mockRender
        .mockResolvedValueOnce(mockHtml)
        .mockResolvedValueOnce(mockText);

      const result = await EmailTemplateService.testTemplate(
        EmailTemplateType.REPORT_DELIVERY
      );

      expect(result.html).toBe(mockHtml);
      expect(result.text).toBe(mockText);
      expect(result.subject).toBe('Pediatric Health Assessment Report');
    });
  });

  describe('custom templates', () => {
    it('should register and clear custom templates', () => {
      const customTemplate = {
        component: ({ name }: any) =>
          React.createElement('div', {}, `Custom ${name}`),
        defaultSubject: 'Custom Template',
        fallbackHtml: '<div>Custom fallback</div>',
        fallbackText: 'Custom fallback',
      };

      // Register custom template
      EmailTemplateService.registerTemplate(
        'custom_test' as EmailTemplateType,
        customTemplate
      );

      // Check it was registered
      expect(
        EmailTemplateService.hasTemplate('custom_test' as EmailTemplateType)
      ).toBe(true);
      expect(EmailTemplateService.getCustomTemplates()).toContain(
        'custom_test'
      );

      // Clear custom templates
      EmailTemplateService.clearCustomTemplates();

      // Check it was cleared
      expect(
        EmailTemplateService.hasTemplate('custom_test' as EmailTemplateType)
      ).toBe(false);
      expect(EmailTemplateService.getCustomTemplates()).toHaveLength(0);
    });

    it('should preserve built-in templates when clearing custom ones', () => {
      const customTemplate = {
        component: ({ name }: any) =>
          React.createElement('div', {}, `Custom ${name}`),
        defaultSubject: 'Custom Template',
        fallbackHtml: '<div>Custom fallback</div>',
        fallbackText: 'Custom fallback',
      };

      // Register custom template
      EmailTemplateService.registerTemplate(
        'custom_test' as EmailTemplateType,
        customTemplate
      );

      // Clear custom templates
      EmailTemplateService.clearCustomTemplates();

      // Built-in templates should still exist
      expect(
        EmailTemplateService.hasTemplate(EmailTemplateType.REPORT_DELIVERY)
      ).toBe(true);
      expect(
        EmailTemplateService.hasTemplate(EmailTemplateType.REPORT_READY)
      ).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle template rendering errors gracefully', async () => {
      mockRender.mockRejectedValue(new Error('Template render failed'));

      const result = await EmailTemplateService.renderTemplate(
        EmailTemplateType.REPORT_DELIVERY,
        { childName: 'Test Child' }
      );

      expect(result.html).toContain('Pediatric Health Assessment Report');
      expect(result.text).toBeDefined();
      expect(result.subject).toBe('Pediatric Health Assessment Report');
    });

    it('should handle missing template gracefully', async () => {
      const result = await EmailTemplateService.renderTemplate(
        'missing_template' as EmailTemplateType,
        {}
      );

      expect(result.html).toBe('Email content unavailable');
      expect(result.text).toBe('Email content unavailable');
      expect(result.subject).toBe('Email Notification');
    });
  });
});
