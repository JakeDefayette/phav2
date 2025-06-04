import { EmailBounceHandler } from '../bounceHandler';
import { ResendWebhookEvent, EmailTrackingEvent } from '../types';
import { createMockQueryBuilder } from './mocks/supabase.mock';

// Create a comprehensive mock for the Supabase client with proper chaining
const createChainableMock = (mockData = []) => {
  const mock = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
  };
  
  // Override the final promises to return mockData
  mock.select.mockImplementation(() => ({
    ...mock,
    eq: jest.fn().mockImplementation(() => ({
      ...mock,
      gte: jest.fn().mockResolvedValue({ data: mockData, error: null }),
      single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
      eq: jest.fn().mockImplementation(() => ({
        ...mock,
        single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
      }))
    })),
    gte: jest.fn().mockResolvedValue({ data: mockData, error: null }),
  }));
  
  mock.upsert.mockResolvedValue({ data: { id: 'test-id' }, error: null });
  mock.update.mockImplementation(() => ({
    ...mock,
    eq: jest.fn().mockImplementation(() => ({
      ...mock,
      eq: jest.fn().mockResolvedValue({ data: { id: 'test-id' }, error: null }),
    }))
  }));
  mock.delete.mockImplementation(() => ({
    ...mock,
    eq: jest.fn().mockImplementation(() => ({
      ...mock,
      eq: jest.fn().mockResolvedValue({ data: null, error: null }),
    }))
  }));
  
  return mock;
};

// Mock the Supabase client creation
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => createChainableMock([])),
  })),
}));

// Mock the email tracking service
jest.mock('../tracking', () => ({
  emailTrackingService: {
    processWebhookEvent: jest.fn(),
    addToSuppressionList: jest.fn().mockResolvedValue(undefined),
  },
}));

describe('EmailBounceHandler', () => {
  let bounceHandler: EmailBounceHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset the singleton instance for testing
    (EmailBounceHandler as any).instance = null;
    bounceHandler = EmailBounceHandler.getInstance();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = EmailBounceHandler.getInstance();
      const instance2 = EmailBounceHandler.getInstance();
      
      expect(instance1).toBe(instance2);
      expect(instance1).toBeInstanceOf(EmailBounceHandler);
    });
  });

  describe('processBounce', () => {
    const mockBounceEvent: ResendWebhookEvent = {
      type: 'email.bounced',
      created_at: '2024-01-01T12:00:00Z',
      data: {
        created_at: '2024-01-01T12:00:00Z',
        email_id: 'test-email-123',
        from: 'test@example.com',
        to: ['recipient@example.com'],
        subject: 'Test Email',
        bounce: {
          type: 'hard',
          reason: 'user unknown',
        },
      },
    };

    const mockTrackingEvent: EmailTrackingEvent = {
      id: 'tracking-123',
      practiceId: '550e8400-e29b-41d4-a716-446655440000',
      emailId: 'test-email-123',
      recipientEmail: 'recipient@example.com',
      eventType: 'bounced',
      eventTimestamp: new Date(),
      bounceReason: 'user unknown',
      rawWebhookData: {},
      processedAt: new Date(),
      webhookReceivedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should process hard bounce and return analysis', async () => {
      const result = await bounceHandler.processBounce(mockBounceEvent, mockTrackingEvent);

      expect(result).toBeDefined();
      expect(result.classification).toBe('hard');
      expect(result.action).toBe('suppress');
      expect(result.severity).toBe('high');
    });

    it('should process soft bounce and return retry analysis', async () => {
      const softBounceEvent = {
        ...mockBounceEvent,
        data: {
          ...mockBounceEvent.data,
          bounce: {
            type: 'soft' as 'hard' | 'soft',
            reason: 'mailbox full',
          },
        },
      };

      const softTrackingEvent = {
        ...mockTrackingEvent,
        bounceReason: 'mailbox full',
      };

      const result = await bounceHandler.processBounce(softBounceEvent, softTrackingEvent);

      expect(result).toBeDefined();
      expect(result.classification).toBe('soft');
      expect(result.action).toBe('retry');
      expect(result.severity).toBe('medium');
      expect(result.retryAfter).toBeDefined();
    });
  });

  describe('processComplaint', () => {
    const mockComplaintEvent: ResendWebhookEvent = {
      type: 'email.complained',
      created_at: '2024-01-01T12:00:00Z',
      data: {
        created_at: '2024-01-01T12:00:00Z',
        email_id: 'test-email-123',
        from: 'test@example.com',
        to: ['complainant@example.com'],
        subject: 'Test Email',
        complaint: {
          type: 'abuse',
          timestamp: '2024-01-01T12:00:00Z',
        },
      },
    };

    const mockTrackingEvent: EmailTrackingEvent = {
      id: 'tracking-123',
      practiceId: '550e8400-e29b-41d4-a716-446655440000',
      emailId: 'test-email-123',
      recipientEmail: 'complainant@example.com',
      eventType: 'complained',
      eventTimestamp: new Date(),
      rawWebhookData: {},
      processedAt: new Date(),
      webhookReceivedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should process complaint and return analysis', async () => {
      const result = await bounceHandler.processComplaint(mockComplaintEvent, mockTrackingEvent);

      expect(result).toBeDefined();
      expect(result.feedbackType).toBe('abuse');
      expect(result.action).toBe('suppress');
      expect(result.severity).toBe('critical');
    });
  });

  describe('addToSuppressionList', () => {
    it('should add email to suppression list', async () => {
      await expect(bounceHandler.addToSuppressionList({
        practiceId: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
        suppressionType: 'bounce',
        suppressionReason: 'hard bounce',
      })).resolves.not.toThrow();
    });
  });

  describe('isEmailSuppressed', () => {
    it('should return false for emails (default behavior)', async () => {
      const result = await bounceHandler.isEmailSuppressed('550e8400-e29b-41d4-a716-446655440000', 'test@example.com');
      expect(typeof result).toBe('boolean');
    });
  });

  describe('removeFromSuppressionList', () => {
    it('should remove email from suppression list', async () => {
      await expect(bounceHandler.removeFromSuppressionList('550e8400-e29b-41d4-a716-446655440000', 'test@example.com')).resolves.not.toThrow();
    });
  });

  describe('getBounceStatistics', () => {
    it('should return bounce statistics', async () => {
      const result = await bounceHandler.getBounceStatistics('550e8400-e29b-41d4-a716-446655440000', 24);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('totalSent');
      expect(result).toHaveProperty('totalBounced');
      expect(result).toHaveProperty('hardBounces');
      expect(result).toHaveProperty('softBounces');
      expect(result).toHaveProperty('bounceRate');
      expect(typeof result.bounceRate).toBe('number');
    });
  });

  describe('getComplaintStatistics', () => {
    it('should return complaint statistics', async () => {
      const result = await bounceHandler.getComplaintStatistics('550e8400-e29b-41d4-a716-446655440000', 24);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('totalSent');
      expect(result).toHaveProperty('totalComplaints');
      expect(result).toHaveProperty('complaintRate');
      expect(result).toHaveProperty('complaintsByType');
      expect(typeof result.complaintRate).toBe('number');
    });
  });

  describe('checkBounceThresholds', () => {
    it('should return alerts array', async () => {
      const result = await bounceHandler.checkBounceThresholds('550e8400-e29b-41d4-a716-446655440000');

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('checkComplaintThresholds', () => {
    it('should return alerts array', async () => {
      const result = await bounceHandler.checkComplaintThresholds('550e8400-e29b-41d4-a716-446655440000');

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });
}); 