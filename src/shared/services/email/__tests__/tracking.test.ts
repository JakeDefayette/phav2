import crypto from 'crypto';
import { EmailTrackingService } from '../tracking';
import { ResendWebhookEvent, EmailTrackingConfig } from '../types';
import { createMockQueryBuilder } from './mocks/supabase.mock';

// Mock Supabase service with inline mock creation
jest.mock('@/shared/services/supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getUser: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
    },
    storage: {
      from: jest.fn(),
    },
  },
}));

// Import the mocked module after mocking
const { supabase: mockSupabaseClient } = require('@/shared/services/supabase');

// Mock environment variables
const originalEnv = process.env;
beforeEach(() => {
  process.env = {
    ...originalEnv,
    NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
    NEXT_PUBLIC_APP_URL: 'https://test-app.com',
  };

  // Reset mocks
  jest.clearAllMocks();
  
  // Set up default mock behavior
  mockSupabaseClient.from.mockReturnValue(createMockQueryBuilder());
});

afterEach(() => {
  process.env = originalEnv;
});

describe('EmailTrackingService', () => {
  let trackingService: EmailTrackingService;

  beforeEach(() => {
    trackingService = new EmailTrackingService();
  });

  describe('constructor', () => {
    it('should create instance with default configuration', () => {
      const service = new EmailTrackingService();
      expect(service).toBeInstanceOf(EmailTrackingService);
    });

    it('should create instance with custom configuration', () => {
      const customConfig: EmailTrackingConfig = {
        enableOpenTracking: false,
        enableClickTracking: true,
        trackingDomain: 'https://custom-domain.com',
        suppressionListEnabled: false,
        bounceHandlingEnabled: false,
        complaintHandlingEnabled: false,
      };

      const service = new EmailTrackingService(customConfig);
      expect(service).toBeInstanceOf(EmailTrackingService);
    });
  });

  describe('verifyWebhookSignature', () => {
    it('should verify valid webhook signature', () => {
      const secret = 'test-secret';
      const body = 'test-body';
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(body)
        .digest('hex');

      const result = trackingService.verifyWebhookSignature({
        signature: `sha256=${expectedSignature}`,
        body,
        secret,
      });

      expect(result).toBe(true);
    });

    it('should reject invalid webhook signature', () => {
      const result = trackingService.verifyWebhookSignature({
        signature: 'sha256=invalid-signature',
        body: 'test-body',
        secret: 'test-secret',
      });

      expect(result).toBe(false);
    });

    it('should handle signature verification errors gracefully', () => {
      // Mock crypto to throw an error
      const originalTimingSafeEqual = crypto.timingSafeEqual;
      crypto.timingSafeEqual = jest.fn().mockImplementation(() => {
        throw new Error('Crypto error');
      });

      const result = trackingService.verifyWebhookSignature({
        signature: 'sha256=test',
        body: 'test-body',
        secret: 'test-secret',
      });

      expect(result).toBe(false);

      // Restore original function
      crypto.timingSafeEqual = originalTimingSafeEqual;
    });
  });

  describe('processWebhookEvent', () => {
    const mockWebhookEvent: ResendWebhookEvent = {
      type: 'email.delivered',
      created_at: '2024-01-01T12:00:00Z',
      data: {
        created_at: '2024-01-01T12:00:00Z',
        email_id: 'email-123',
        from: 'test@example.com',
        to: ['recipient@example.com'],
        subject: 'Test Email',
      },
    };

    it('should process webhook event successfully', async () => {
      const mockBuilder = createMockQueryBuilder({ id: 'tracking-123' }, null);
      mockSupabaseClient.from.mockReturnValue(mockBuilder);

      const result = await trackingService.processWebhookEvent(
        mockWebhookEvent,
        '550e8400-e29b-41d4-a716-446655440000'
      );

      expect(result).toBeDefined();
      expect(result?.id).toBe('tracking-123');
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('email_tracking_events');
    });

    it('should handle unsupported event types', async () => {
      const unsupportedEvent = {
        ...mockWebhookEvent,
        type: 'email.unsupported' as any,
      };

      const result = await trackingService.processWebhookEvent(
        unsupportedEvent,
        '550e8400-e29b-41d4-a716-446655440000'
      );

      expect(result).toBeNull();
    });

    it('should handle database insertion errors', async () => {
      const mockBuilder = createMockQueryBuilder(null, { message: 'Database error' });
      mockSupabaseClient.from.mockReturnValue(mockBuilder);

      try {
        await trackingService.processWebhookEvent(
          mockWebhookEvent,
          '550e8400-e29b-41d4-a716-446655440000'
        );
        fail('Expected function to throw an error');
      } catch (error: any) {
        expect(error.message).toBe('Database error');
      }
    });

    it('should handle webhook events with click data', async () => {
      const clickEvent = {
        ...mockWebhookEvent,
        type: 'email.clicked' as any,
        data: {
          ...mockWebhookEvent.data,
          click: {
            link: 'https://example.com',
            timestamp: '2024-01-01T12:01:00Z',
            ipAddress: '192.168.1.1',
            userAgent: 'Mozilla/5.0',
          },
        },
      };

      const mockBuilder = createMockQueryBuilder({ id: 'tracking-123' }, null);
      mockSupabaseClient.from.mockReturnValue(mockBuilder);

      const result = await trackingService.processWebhookEvent(
        clickEvent,
        '550e8400-e29b-41d4-a716-446655440000'
      );

      expect(result).toBeDefined();
      expect(result?.id).toBe('tracking-123');
    });

    it('should handle webhook events with bounce data', async () => {
      const bounceEvent = {
        ...mockWebhookEvent,
        type: 'email.bounced' as any,
        data: {
          ...mockWebhookEvent.data,
          bounce: {
            type: 'hard' as const,
            reason: 'user unknown',
          },
        },
      };

      const mockBuilder = createMockQueryBuilder({ id: 'tracking-123' }, null);
      mockSupabaseClient.from.mockReturnValue(mockBuilder);

      const result = await trackingService.processWebhookEvent(
        bounceEvent,
        '550e8400-e29b-41d4-a716-446655440000'
      );

      expect(result).toBeDefined();
      expect(result?.id).toBe('tracking-123');
    });
  });

  describe('generateTrackingUrl', () => {
    it('should generate tracking URL successfully', async () => {
      const mockBuilder = createMockQueryBuilder({ trackingToken: 'track-123' }, null);
      mockSupabaseClient.from.mockReturnValue(mockBuilder);

      const result = await trackingService.generateTrackingUrl({
        practiceId: '550e8400-e29b-41d4-a716-446655440000',
        recipientEmail: 'user@example.com',
        originalUrl: 'https://example.com',
        campaignId: 'campaign-123',
      });

      expect(result).toBeDefined();
      expect(result.trackingToken).toBe('track-123');
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('email_tracking_urls');
    });

    it('should handle tracking URL generation errors', async () => {
      const mockBuilder = createMockQueryBuilder(null, { message: 'Generation error' });
      mockSupabaseClient.from.mockReturnValue(mockBuilder);

      try {
        await trackingService.generateTrackingUrl({
          practiceId: '550e8400-e29b-41d4-a716-446655440000',
          recipientEmail: 'user@example.com',
          originalUrl: 'https://example.com',
        });
        fail('Expected function to throw an error');
      } catch (error: any) {
        expect(error.message).toBe('Generation error');
      }
    });
  });

  describe('getTrackingUrl', () => {
    it('should retrieve tracking URL by token', async () => {
      const mockData = {
        originalUrl: 'https://example.com',
        recipientEmail: 'user@example.com',
        practiceId: '550e8400-e29b-41d4-a716-446655440000',
      };
      const mockBuilder = createMockQueryBuilder(mockData, null);
      mockSupabaseClient.from.mockReturnValue(mockBuilder);

      const result = await trackingService.getTrackingUrl('track-123');

      expect(result).toEqual(mockData);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('email_tracking_urls');
    });

    it('should return null for non-existent token', async () => {
      const mockBuilder = createMockQueryBuilder(null, { code: 'PGRST116' });
      mockSupabaseClient.from.mockReturnValue(mockBuilder);

      const result = await trackingService.getTrackingUrl('invalid-token');

      expect(result).toBeNull();
    });

    it('should throw error for database errors', async () => {
      const mockBuilder = createMockQueryBuilder(null, { message: 'Database error' });
      mockSupabaseClient.from.mockReturnValue(mockBuilder);

      try {
        await trackingService.getTrackingUrl('track-123');
        fail('Expected function to throw an error');
      } catch (error: any) {
        expect(error.message).toBe('Database error');
      }
    });
  });

  describe('processClickTracking', () => {
    it('should process click tracking successfully', async () => {
      const mockUrlData = {
        originalUrl: 'https://example.com',
        practiceId: '550e8400-e29b-41d4-a716-446655440000',
        recipientEmail: 'user@example.com',
      };
      
      // Mock the getTrackingUrl call first
      const mockBuilderGet = createMockQueryBuilder(mockUrlData, null);
      const mockBuilderInsert = createMockQueryBuilder(null, null);
      
      mockSupabaseClient.from
        .mockReturnValueOnce(mockBuilderGet) // For getTrackingUrl
        .mockReturnValueOnce(mockBuilderInsert); // For recordTrackingEvent

      const result = await trackingService.processClickTracking('track-123');

      expect(result).toBe('https://example.com');
    });

    it('should return null for invalid tracking token', async () => {
      const mockBuilder = createMockQueryBuilder(null, { code: 'PGRST116' });
      mockSupabaseClient.from.mockReturnValue(mockBuilder);

      const result = await trackingService.processClickTracking('invalid-token');

      expect(result).toBeNull();
    });
  });

  describe('generateTrackingPixel', () => {
    it('should generate tracking pixel successfully', async () => {
      const mockBuilder = createMockQueryBuilder({ trackingToken: 'pixel-123' }, null);
      mockSupabaseClient.from.mockReturnValue(mockBuilder);

      const result = await trackingService.generateTrackingPixel({
        practiceId: '550e8400-e29b-41d4-a716-446655440000',
        recipientEmail: 'user@example.com',
        campaignId: 'campaign-123',
      });

      expect(result).toBeDefined();
      expect(result.trackingToken).toBe('pixel-123');
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('email_tracking_pixels');
    });

    it('should handle tracking pixel generation errors', async () => {
      const mockBuilder = createMockQueryBuilder(null, { message: 'Pixel error' });
      mockSupabaseClient.from.mockReturnValue(mockBuilder);

      try {
        await trackingService.generateTrackingPixel({
          practiceId: '550e8400-e29b-41d4-a716-446655440000',
          recipientEmail: 'user@example.com',
        });
        fail('Expected function to throw an error');
      } catch (error: any) {
        expect(error.message).toBe('Pixel error');
      }
    });
  });

  describe('getTrackingPixel', () => {
    it('should retrieve tracking pixel by token', async () => {
      const mockData = {
        trackingToken: 'pixel-123',
        practiceId: '550e8400-e29b-41d4-a716-446655440000',
        recipientEmail: 'user@example.com',
      };
      const mockBuilder = createMockQueryBuilder(mockData, null);
      mockSupabaseClient.from.mockReturnValue(mockBuilder);

      const result = await trackingService.getTrackingPixel('pixel-123');

      expect(result).toEqual(mockData);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('email_tracking_pixels');
    });

    it('should return null for non-existent token', async () => {
      const mockBuilder = createMockQueryBuilder(null, { code: 'PGRST116' });
      mockSupabaseClient.from.mockReturnValue(mockBuilder);

      const result = await trackingService.getTrackingPixel('invalid-token');

      expect(result).toBeNull();
    });
  });

  describe('processOpenTracking', () => {
    it('should process open tracking successfully', async () => {
      const mockPixelData = {
        practiceId: '550e8400-e29b-41d4-a716-446655440000',
        recipientEmail: 'user@example.com',
      };
      
      // Mock the getTrackingPixel call first
      const mockBuilderGet = createMockQueryBuilder(mockPixelData, null);
      const mockBuilderInsert = createMockQueryBuilder(null, null);
      
      mockSupabaseClient.from
        .mockReturnValueOnce(mockBuilderGet) // For getTrackingPixel
        .mockReturnValueOnce(mockBuilderInsert); // For recordTrackingEvent

      const result = await trackingService.processOpenTracking('pixel-123');

      expect(result).toBe(true);
    });

    it('should return false for invalid tracking token', async () => {
      const mockBuilder = createMockQueryBuilder(null, { code: 'PGRST116' });
      mockSupabaseClient.from.mockReturnValue(mockBuilder);

      const result = await trackingService.processOpenTracking('invalid-token');

      expect(result).toBe(false);
    });
  });

  describe('URL generation', () => {
    it('should generate tracking pixel URL', () => {
      const url = trackingService.getTrackingPixelUrl('pixel-123');
      expect(url).toContain('pixel-123');
      expect(url).toContain('/api/track/pixel/');
    });

    it('should generate tracking click URL', () => {
      const url = trackingService.getTrackingClickUrl('click-123');
      expect(url).toContain('click-123');
      expect(url).toContain('/api/track/click/');
    });
  });

  describe('analytics', () => {
    it('should get analytics summary', async () => {
      const mockData = [
        { practiceId: '550e8400-e29b-41d4-a716-446655440000', sentCount: 100, deliveredCount: 90, openedCount: 50 },
      ];
      const mockBuilder = createMockQueryBuilder(mockData, null);
      mockSupabaseClient.from.mockReturnValue(mockBuilder);

      const result = await trackingService.getAnalyticsSummary({
        practiceId: '550e8400-e29b-41d4-a716-446655440000',
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('email_analytics_summary');
    });

    it('should get tracking events', async () => {
      const mockData = [
        { 
          eventType: 'delivered', 
          eventTimestamp: '2024-01-01T12:00:00Z',
          recipientEmail: 'user@example.com'
        },
      ];
      const mockBuilder = createMockQueryBuilder(mockData, null);
      mockSupabaseClient.from.mockReturnValue(mockBuilder);

      const result = await trackingService.getTrackingEvents({
        practiceId: '550e8400-e29b-41d4-a716-446655440000',
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('email_tracking_events');
    });

    it('should get email performance metrics', async () => {
      const mockData = [
        { 
          eventType: 'delivered', 
          eventTimestamp: '2024-01-01T12:00:00Z',
          recipientEmail: 'user@example.com'
        },
        { 
          eventType: 'opened', 
          eventTimestamp: '2024-01-01T12:05:00Z',
          recipientEmail: 'user@example.com'
        },
      ];
      const mockBuilder = createMockQueryBuilder(mockData, null);
      mockSupabaseClient.from.mockReturnValue(mockBuilder);

      const result = await trackingService.getEmailPerformance(
        '550e8400-e29b-41d4-a716-446655440000'
      );

      expect(result).toBeDefined();
      expect(typeof result.totalSent).toBe('number');
      expect(typeof result.totalDelivered).toBe('number');
      expect(typeof result.totalOpened).toBe('number');
      expect(typeof result.openRate).toBe('number');
    });
  });

  describe('email content tracking injection', () => {
    it('should add tracking to email content', async () => {
      const mockPixelBuilder = createMockQueryBuilder({ trackingToken: 'pixel-token' }, null);
      const mockUrlBuilder = createMockQueryBuilder({ trackingToken: 'url-token' }, null);
      
      mockSupabaseClient.from
        .mockReturnValueOnce(mockUrlBuilder) // For generateTrackingUrl
        .mockReturnValueOnce(mockPixelBuilder); // For generateTrackingPixel

      const htmlContent = '<html><body><a href="https://example.com">Link</a></body></html>';
      const result = await trackingService.addTrackingToEmail({
        htmlContent,
        practiceId: '550e8400-e29b-41d4-a716-446655440000',
        recipientEmail: 'user@example.com',
        campaignId: 'campaign-123',
      });

      expect(result.html).toContain('test-app.com');
      expect(result.trackingPixel).toBeDefined();
      expect(Array.isArray(result.trackingUrls)).toBe(true);
    });
  });

  describe('suppression list', () => {
    it('should add email to suppression list', async () => {
      const mockBuilder = createMockQueryBuilder({ id: 'suppression-123' }, null);
      mockSupabaseClient.from.mockReturnValue(mockBuilder);

      await trackingService.addToSuppressionList(
        '550e8400-e29b-41d4-a716-446655440000',
        'user@example.com',
        'bounce'
      );

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('email_subscribers');
    });

    it('should check if email is suppressed', async () => {
      const mockBuilder = createMockQueryBuilder({ status: 'bounced' }, null);
      mockSupabaseClient.from.mockReturnValue(mockBuilder);

      const result = await trackingService.isEmailSuppressed('550e8400-e29b-41d4-a716-446655440000', 'user@example.com');

      expect(result).toBe(true);
    });

    it('should return false for non-suppressed email', async () => {
      const mockBuilder = createMockQueryBuilder(null, null);
      mockSupabaseClient.from.mockReturnValue(mockBuilder);

      const result = await trackingService.isEmailSuppressed('550e8400-e29b-41d4-a716-446655440000', 'clean@example.com');

      expect(result).toBe(false);
    });

    it('should return false for email with active status', async () => {
      const mockBuilder = createMockQueryBuilder({ status: 'subscribed' }, null);
      mockSupabaseClient.from.mockReturnValue(mockBuilder);

      const result = await trackingService.isEmailSuppressed('550e8400-e29b-41d4-a716-446655440000', 'active@example.com');

      expect(result).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle Supabase connection errors', async () => {
      const mockBuilder = createMockQueryBuilder(null, { message: 'Connection failed' });
      mockSupabaseClient.from.mockReturnValue(mockBuilder);

      try {
        await trackingService.processWebhookEvent(
          {
            type: 'email.delivered',
            created_at: '2024-01-01T12:00:00Z',
            data: {
              created_at: '2024-01-01T12:00:00Z',
              email_id: 'email-123',
              from: 'test@example.com',
              to: ['recipient@example.com'],
              subject: 'Test Email',
            },
          },
          '550e8400-e29b-41d4-a716-446655440000'
        );
        fail('Expected function to throw an error');
      } catch (error: any) {
        expect(error.message).toBe('Connection failed');
      }
    });
  });

  describe('getCampaignTrackingData', () => {
    it('should return default analytics structure', async () => {
      const result = await trackingService.getCampaignTrackingData('campaign-123');

      expect(result).toBeDefined();
      expect(result.deviceBreakdown).toBeDefined();
      expect(result.geographicBreakdown).toBeDefined();
      expect(typeof result.deviceBreakdown.mobile).toBe('number');
      expect(typeof result.deviceBreakdown.desktop).toBe('number');
      expect(typeof result.deviceBreakdown.tablet).toBe('number');
    });
  });
});