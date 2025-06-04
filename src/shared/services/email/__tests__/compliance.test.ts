// Mock Supabase first before any imports
const createChainableMock = (): any => {
  const mock = {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    eq: jest.fn(),
    neq: jest.fn(),
    or: jest.fn(),
    single: jest.fn(),
    maybeSingle: jest.fn(),
    returns: jest.fn(),
    order: jest.fn(),
    limit: jest.fn(),
  };

  // Make each method return itself (chainable) by default
  Object.keys(mock).forEach(key => {
    if (!['single', 'maybeSingle', 'returns'].includes(key)) {
      mock[key].mockReturnValue(mock);
    }
  });

  // Terminal methods return promises
  mock.single.mockResolvedValue({ data: null, error: null });
  mock.maybeSingle.mockResolvedValue({ data: null, error: null });
  mock.returns.mockResolvedValue({ data: null, error: null });

  return mock;
};

const mockSupabaseChain = createChainableMock();
const mockSupabase = {
  from: jest.fn(),
};

jest.mock('@/shared/services/supabase', () => ({
  supabase: mockSupabase,
}));

import { EmailComplianceService } from '../compliance';
import { EmailPreferenceType, EmailConsentStatus, ConsentAction } from '../types';

// Setup chaining behavior
const setupMockChaining = () => {
  // Always return a fresh chainable mock from .from()
  mockSupabase.from.mockImplementation(() => createChainableMock());
};

describe('EmailComplianceService', () => {
  let complianceService: EmailComplianceService;

  beforeEach(() => {
    jest.clearAllMocks();
    setupMockChaining();
    complianceService = new EmailComplianceService();
  });

  describe('createEmailPreferences', () => {
    const mockOptions = {
      email: 'test@example.com',
      practiceId: '550e8400-e29b-41d4-a716-446655440000',
      preferenceTypes: ['marketing', 'transactional'] as EmailPreferenceType[],
      consentSource: 'web_signup',
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0',
      requireDoubleOptIn: false,
      dataProcessingConsent: true,
      marketingConsent: true,
    };

    it('should create email preferences successfully', async () => {
      // Set up mocks for specific calls in order
      const firstChain = createChainableMock();
      const secondChain = createChainableMock();
      const thirdChain = createChainableMock();

      // Mock practice quota lookup - first call
      firstChain.single.mockResolvedValueOnce({
        data: { requires_double_opt_in: false },
        error: null,
      });

      // Mock preferences insertion - second call
      secondChain.returns.mockResolvedValueOnce({
        data: [
          {
            id: 'pref-1',
            practice_id: '550e8400-e29b-41d4-a716-446655440000',
            email: 'test@example.com',
            preference_type: 'marketing',
            is_subscribed: true,
            consent_status: 'opted_in',
            consent_date: new Date().toISOString(),
            consent_source: 'web_signup',
            consent_ip_address: '127.0.0.1',
            consent_user_agent: 'Mozilla/5.0',
            unsubscribe_token: 'some-token',
            data_processing_consent: true,
            marketing_consent: true,
            can_spam_compliant: true,
            gdpr_compliant: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
        error: null,
      });

      // Mock consent log insertion - third+ calls
      thirdChain.insert.mockResolvedValue({ data: null, error: null });

      // Set up the from method to return the right chain for each call
      mockSupabase.from
        .mockReturnValueOnce(firstChain)  // practice_email_quotas
        .mockReturnValueOnce(secondChain) // email_preferences insert
        .mockReturnValue(thirdChain);     // email_consent_log inserts

      const result = await complianceService.createEmailPreferences(mockOptions);

      expect(result.success).toBe(true);
      expect(result.preferences).toHaveLength(1);
      expect(result.doubleOptInToken).toBeUndefined();
      expect(mockSupabase.from).toHaveBeenCalledWith('practice_email_quotas');
      expect(mockSupabase.from).toHaveBeenCalledWith('email_preferences');
    });

    it('should handle double opt-in requirement', async () => {
      const optionsWithDoubleOptIn = {
        ...mockOptions,
        requireDoubleOptIn: true,
      };

      const firstChain = createChainableMock();
      const secondChain = createChainableMock();
      const thirdChain = createChainableMock();

      // Mock practice quota lookup
      firstChain.single.mockResolvedValueOnce({
        data: { requires_double_opt_in: true },
        error: null,
      });

      // Mock preferences insertion
      secondChain.returns.mockResolvedValueOnce({
        data: [
          {
            id: 'pref-1',
            practice_id: '550e8400-e29b-41d4-a716-446655440000',
            email: 'test@example.com',
            preference_type: 'marketing',
            is_subscribed: false,
            consent_status: 'double_opt_in_pending',
            double_opt_in_token: 'token123',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
        error: null,
      });

      // Mock consent log insertion
      thirdChain.insert.mockResolvedValue({ data: null, error: null });

      mockSupabase.from
        .mockReturnValueOnce(firstChain)
        .mockReturnValueOnce(secondChain)
        .mockReturnValue(thirdChain);

      const result = await complianceService.createEmailPreferences(optionsWithDoubleOptIn);

      expect(result.success).toBe(true);
      expect(result.doubleOptInToken).toBeDefined();
      expect(result.preferences?.[0].consent_status).toBe('double_opt_in_pending');
    });

    it('should handle practice quota lookup error', async () => {
      const firstChain = createChainableMock();
      firstChain.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error', code: 'DB_ERROR' },
      });

      mockSupabase.from.mockReturnValueOnce(firstChain);

      const result = await complianceService.createEmailPreferences(mockOptions);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to get practice quota');
    });
  });

  describe('confirmDoubleOptIn', () => {
    it('should confirm double opt-in successfully', async () => {
      const firstChain = createChainableMock();
      const secondChain = createChainableMock();
      const thirdChain = createChainableMock();

      // Mock token lookup
      firstChain.returns.mockResolvedValueOnce({
        data: [
          {
            id: 'pref-1',
            practice_id: '550e8400-e29b-41d4-a716-446655440000',
            email: 'test@example.com',
            preference_type: 'marketing',
            is_subscribed: false,
            consent_status: 'double_opt_in_pending',
            double_opt_in_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
        error: null,
      });

      // Mock preference update
      secondChain.update.mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      });

      // Mock consent log insertion
      thirdChain.insert.mockResolvedValue({ data: null, error: null });

      mockSupabase.from
        .mockReturnValueOnce(firstChain)  // email_preferences select
        .mockReturnValueOnce(secondChain) // email_preferences update
        .mockReturnValue(thirdChain);     // email_consent_log insert

      const result = await complianceService.confirmDoubleOptIn('valid-token', '127.0.0.1', 'Mozilla/5.0');

      expect(result.success).toBe(true);
      expect(result.email).toBe('test@example.com');
      expect(result.practiceId).toBe('550e8400-e29b-41d4-a716-446655440000');
    });

    it('should handle invalid token', async () => {
      const firstChain = createChainableMock();
      firstChain.returns.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      mockSupabase.from.mockReturnValueOnce(firstChain);

      const result = await complianceService.confirmDoubleOptIn('invalid-token');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid or expired confirmation token');
    });

    it('should handle expired token', async () => {
      const firstChain = createChainableMock();
      firstChain.returns.mockResolvedValueOnce({
        data: [
          {
            id: 'pref-1',
            practice_id: '550e8400-e29b-41d4-a716-446655440000',
            email: 'test@example.com',
            preference_type: 'marketing',
            is_subscribed: false,
            consent_status: 'double_opt_in_pending',
            double_opt_in_expires_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Expired
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
        error: null,
      });

      mockSupabase.from.mockReturnValueOnce(firstChain);

      const result = await complianceService.confirmDoubleOptIn('expired-token');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Confirmation token has expired');
    });
  });

  describe('unsubscribeByToken', () => {
    it('should unsubscribe by token successfully', async () => {
      const firstChain = createChainableMock();
      const secondChain = createChainableMock();
      const thirdChain = createChainableMock();

      // Mock token lookup
      firstChain.returns.mockResolvedValueOnce({
        data: [
          {
            id: 'pref-1',
            practice_id: '550e8400-e29b-41d4-a716-446655440000',
            email: 'test@example.com',
            preference_type: 'marketing',
            is_subscribed: true,
            consent_status: 'opted_in',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
        error: null,
      });

      // Mock preference update
      secondChain.update.mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      });

      // Mock consent log insertion
      thirdChain.insert.mockResolvedValue({ data: null, error: null });

      mockSupabase.from
        .mockReturnValueOnce(firstChain)
        .mockReturnValueOnce(secondChain)
        .mockReturnValue(thirdChain);

      const result = await complianceService.unsubscribeByToken({
        token: 'valid-token',
        reason: 'user_request',
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
      });

      expect(result.success).toBe(true);
      expect(result.email).toBe('test@example.com');
      expect(result.practiceId).toBe('550e8400-e29b-41d4-a716-446655440000');
    });

    it('should handle invalid unsubscribe token', async () => {
      const firstChain = createChainableMock();
      firstChain.returns.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      mockSupabase.from.mockReturnValueOnce(firstChain);

      const result = await complianceService.unsubscribeByToken({
        token: 'invalid-token',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid unsubscribe token');
    });
  });

  describe('updatePreferences', () => {
    it('should update existing preferences successfully', async () => {
      const firstChain = createChainableMock();
      const secondChain = createChainableMock();
      const thirdChain = createChainableMock();

      // Mock finding existing preference (uses .single().returns())
      firstChain.single.mockReturnValue({
        returns: jest.fn().mockResolvedValue({
          data: {
            id: 'pref-1',
            practice_id: '550e8400-e29b-41d4-a716-446655440000',
            email: 'test@example.com',
            preference_type: 'marketing',
            is_subscribed: true,
            consent_status: 'opted_in',
            marketing_consent: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          error: null,
        }),
      });

      // Mock preference update (uses .single().returns())
      secondChain.single.mockReturnValue({
        returns: jest.fn().mockResolvedValue({
          data: {
            id: 'pref-1',
            practice_id: '550e8400-e29b-41d4-a716-446655440000',
            email: 'test@example.com',
            preference_type: 'marketing',
            is_subscribed: false,
            consent_status: 'opted_out',
            marketing_consent: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          error: null,
        }),
      });

      // Mock consent log insertion
      thirdChain.insert.mockResolvedValue({ data: null, error: null });

      mockSupabase.from
        .mockReturnValueOnce(firstChain)  // find existing preference
        .mockReturnValueOnce(secondChain) // update preference
        .mockReturnValue(thirdChain);     // log consent action

      const result = await complianceService.updatePreferences({
        email: 'test@example.com',
        practiceId: '550e8400-e29b-41d4-a716-446655440000',
        preferences: {
          marketing: false,
        },
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
      });

      expect(result.success).toBe(true);
      expect(result.updatedPreferences).toHaveLength(1);
    });

    it('should create new preferences when they do not exist', async () => {
      const firstChain = createChainableMock();
      const secondChain = createChainableMock();

      // Mock preference not found (uses .single().returns())
      firstChain.single.mockReturnValue({
        returns: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' }, // Not found error
        }),
      });

      // Mock creating new preference (uses .single().returns())
      secondChain.single.mockReturnValue({
        returns: jest.fn().mockResolvedValue({
          data: {
            id: 'pref-new',
            practice_id: '550e8400-e29b-41d4-a716-446655440000',
            email: 'test@example.com',
            preference_type: 'marketing',
            is_subscribed: true,
            consent_status: 'opted_in',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          error: null,
        }),
      });

      mockSupabase.from
        .mockReturnValueOnce(firstChain)  // find preference (not found)
        .mockReturnValue(secondChain);   // create preference

      const result = await complianceService.updatePreferences({
        email: 'test@example.com',
        practiceId: '550e8400-e29b-41d4-a716-446655440000',
        preferences: {
          marketing: true,
        },
      });

      expect(result.success).toBe(true);
      expect(result.updatedPreferences).toHaveLength(1);
    });
  });

  describe('isEmailSuppressed', () => {
    it('should check if email is suppressed', async () => {
      const firstChain = createChainableMock();
      // Mock the complex chain: .select().eq().eq().or().single().returns()
      firstChain.single.mockReturnValue({
        returns: jest.fn().mockResolvedValue({
          data: {
            id: 'supp-1',
            practice_id: '550e8400-e29b-41d4-a716-446655440000',
            email: 'test@example.com',
            suppression_type: 'bounce',
            suppressed_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          error: null,
        }),
      });

      mockSupabase.from.mockReturnValueOnce(firstChain);

      const result = await complianceService.isEmailSuppressed('550e8400-e29b-41d4-a716-446655440000', 'test@example.com');

      expect(result.success).toBe(true);
      expect(result.suppressed).toBe(true);
      expect(result.suppressionInfo).toBeDefined();
    });

    it('should return false for non-suppressed email', async () => {
      const firstChain = createChainableMock();
      firstChain.single.mockReturnValue({
        returns: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' }, // Not found
        }),
      });

      mockSupabase.from.mockReturnValueOnce(firstChain);

      const result = await complianceService.isEmailSuppressed('550e8400-e29b-41d4-a716-446655440000', 'test@example.com');

      expect(result.success).toBe(true);
      expect(result.suppressed).toBe(false);
    });
  });

  describe('addToSuppressionList', () => {
    it('should add email to suppression list', async () => {
      const firstChain = createChainableMock();
      firstChain.single.mockReturnValue({
        returns: jest.fn().mockResolvedValue({
          data: {
            id: 'supp-1',
            practice_id: '550e8400-e29b-41d4-a716-446655440000',
            email: 'test@example.com',
            suppression_type: 'bounce',
            suppression_reason: 'Hard bounce',
            suppressed_at: new Date().toISOString(),
            can_be_resubscribed: false,
            manual_review_required: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          error: null,
        }),
      });

      mockSupabase.from.mockReturnValueOnce(firstChain);

      const result = await complianceService.addToSuppressionList({
        practiceId: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
        suppressionType: 'bounce',
        suppressionReason: 'Hard bounce',
        canBeResubscribed: false,
      });

      expect(result.success).toBe(true);
      expect(result.suppressionEntry).toBeDefined();
      expect(mockSupabase.from).toHaveBeenCalledWith('email_suppressions');
    });
  });

  describe('getEmailPreferences', () => {
    it('should get email preferences successfully', async () => {
      const firstChain = createChainableMock();
      firstChain.returns.mockResolvedValueOnce({
        data: [
          {
            id: 'pref-1',
            practice_id: '550e8400-e29b-41d4-a716-446655440000',
            email: 'test@example.com',
            preference_type: 'marketing',
            is_subscribed: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: 'pref-2',
            practice_id: '550e8400-e29b-41d4-a716-446655440000',
            email: 'test@example.com',
            preference_type: 'transactional',
            is_subscribed: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
        error: null,
      });

      mockSupabase.from.mockReturnValueOnce(firstChain);

      const result = await complianceService.getEmailPreferences('550e8400-e29b-41d4-a716-446655440000', 'test@example.com');

      expect(result.success).toBe(true);
      expect(result.preferences).toHaveLength(2);
      expect(mockSupabase.from).toHaveBeenCalledWith('email_preferences');
    });
  });

  describe('getPracticeQuota', () => {
    it('should get practice quota successfully', async () => {
      const firstChain = createChainableMock();
      // Mock the .single().returns() pattern used in getPracticeQuota
      firstChain.single.mockReturnValue({
        returns: jest.fn().mockResolvedValue({
          data: {
            id: 'quota-1',
            practice_id: '550e8400-e29b-41d4-a716-446655440000',
            daily_email_limit: 1000,
            monthly_email_limit: 30000,
            daily_emails_sent: 50,
            monthly_emails_sent: 1500,
            last_daily_reset: new Date().toISOString(),
            last_monthly_reset: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          error: null,
        }),
      });

      mockSupabase.from.mockReturnValueOnce(firstChain);

      const result = await complianceService.getPracticeQuota('550e8400-e29b-41d4-a716-446655440000');

      expect(result.success).toBe(true);
      expect(result.quota).toBeDefined();
      expect(result.quota?.daily_email_limit).toBe(1000);
    });

    it('should create default quota when none exists', async () => {
      const firstChain = createChainableMock();
      const secondChain = createChainableMock();

      // Mock quota not found (uses .single().returns())
      firstChain.single.mockReturnValue({
        returns: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        }),
      });

      // Mock creating default quota (uses .single().returns())
      secondChain.single.mockReturnValue({
        returns: jest.fn().mockResolvedValue({
          data: {
            id: 'quota-new',
            practice_id: '550e8400-e29b-41d4-a716-446655440000',
            daily_email_limit: 1000,
            monthly_email_limit: 30000,
            daily_emails_sent: 0,
            monthly_emails_sent: 0,
            last_daily_reset: new Date().toISOString(),
            last_monthly_reset: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          error: null,
        }),
      });

      mockSupabase.from
        .mockReturnValueOnce(firstChain)  // quota lookup (not found)
        .mockReturnValueOnce(secondChain); // create default quota

      const result = await complianceService.getPracticeQuota('550e8400-e29b-41d4-a716-446655440000');

      expect(result.success).toBe(true);
      expect(result.quota).toBeDefined();
    });
  });

  describe('canSendEmail', () => {
    it('should allow sending when within limits', async () => {
      const firstChain = createChainableMock();
      // Mock the .single().returns() pattern used in getPracticeQuota
      firstChain.single.mockReturnValue({
        returns: jest.fn().mockResolvedValue({
          data: {
            id: 'quota-1',
            practice_id: '550e8400-e29b-41d4-a716-446655440000',
            daily_email_limit: 1000,
            monthly_email_limit: 30000,
            daily_emails_sent: 50,
            monthly_emails_sent: 1500,
            last_daily_reset: new Date().toISOString(),
            last_monthly_reset: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          error: null,
        }),
      });

      mockSupabase.from.mockReturnValueOnce(firstChain);

      const result = await complianceService.canSendEmail('550e8400-e29b-41d4-a716-446655440000', 10);

      expect(result.canSend).toBe(true);
      expect(result.quota).toBeDefined();
    });

    it('should deny sending when over daily limit', async () => {
      const firstChain = createChainableMock();
      // Mock the .single().returns() pattern used in getPracticeQuota
      firstChain.single.mockReturnValue({
        returns: jest.fn().mockResolvedValue({
          data: {
            id: 'quota-1',
            practice_id: '550e8400-e29b-41d4-a716-446655440000',
            daily_email_limit: 1000,
            monthly_email_limit: 30000,
            daily_emails_sent: 995,
            monthly_emails_sent: 1500,
            last_daily_reset: new Date().toISOString(),
            last_monthly_reset: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          error: null,
        }),
      });

      mockSupabase.from.mockReturnValueOnce(firstChain);

      const result = await complianceService.canSendEmail('550e8400-e29b-41d4-a716-446655440000', 10);

      expect(result.canSend).toBe(false);
      expect(result.reason).toContain('Daily email limit exceeded');
    });
  });

  describe('incrementEmailUsage', () => {
    it('should increment email usage successfully', async () => {
      const firstChain = createChainableMock();
      const secondChain = createChainableMock();

      // Mock getting current quota (uses .single().returns())
      firstChain.single.mockReturnValue({
        returns: jest.fn().mockResolvedValue({
          data: {
            id: 'quota-1',
            practice_id: '550e8400-e29b-41d4-a716-446655440000',
            daily_email_limit: 1000,
            monthly_email_limit: 30000,
            daily_emails_sent: 50,
            monthly_emails_sent: 1500,
            last_daily_reset: new Date().toISOString(),
            last_monthly_reset: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          error: null,
        }),
      });

      // Mock updating quota (uses .single().returns())
      secondChain.single.mockReturnValue({
        returns: jest.fn().mockResolvedValue({
          data: {
            id: 'quota-1',
            practice_id: '550e8400-e29b-41d4-a716-446655440000',
            daily_email_limit: 1000,
            monthly_email_limit: 30000,
            daily_emails_sent: 60,
            monthly_emails_sent: 1510,
            last_daily_reset: new Date().toISOString(),
            last_monthly_reset: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          error: null,
        }),
      });

      mockSupabase.from
        .mockReturnValueOnce(firstChain)  // get current quota
        .mockReturnValueOnce(secondChain); // update quota

      const result = await complianceService.incrementEmailUsage('550e8400-e29b-41d4-a716-446655440000', 10);

      expect(result.success).toBe(true);
      expect(result.quota).toBeDefined();
    });
  });

  describe('validateCampaign', () => {
    it('should validate compliant campaign', async () => {
      const result = await complianceService.validateCampaign({
        practiceId: '550e8400-e29b-41d4-a716-446655440000',
        content: 'This is a test email with unsubscribe link',
        subject: 'Test Subject',
        templateType: 'marketing',
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing unsubscribe link', async () => {
      const result = await complianceService.validateCampaign({
        practiceId: '550e8400-e29b-41d4-a716-446655440000',
        content: 'This is a test email without opt-out link',
        subject: 'Test Subject',
        templateType: 'marketing',
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Marketing emails must include an unsubscribe link');
    });

    it('should detect spam trigger words', async () => {
      const result = await complianceService.validateCampaign({
        practiceId: '550e8400-e29b-41d4-a716-446655440000',
        content: 'FREE MONEY!!! unsubscribe here',
        subject: 'URGENT!!!',
        templateType: 'marketing',
      });

      expect(result.valid).toBe(true); // Still valid but with warnings
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes('spam trigger words'))).toBe(true);
    });
  });

  describe('validateSendingPermissions', () => {
    it('should validate sending permissions when within limits', async () => {
      const firstChain = createChainableMock();
      const secondChain = createChainableMock();
      
      // Mock the .single().returns() pattern used in getPracticeQuota (called twice)
      const quotaData = {
        id: 'quota-1',
        practice_id: '550e8400-e29b-41d4-a716-446655440000',
        daily_email_limit: 1000,
        monthly_email_limit: 30000,
        daily_emails_sent: 50,
        monthly_emails_sent: 1500,
        last_daily_reset: new Date().toISOString(),
        last_monthly_reset: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      firstChain.single.mockReturnValue({
        returns: jest.fn().mockResolvedValue({
          data: quotaData,
          error: null,
        }),
      });
      
      secondChain.single.mockReturnValue({
        returns: jest.fn().mockResolvedValue({
          data: quotaData,
          error: null,
        }),
      });

      mockSupabase.from
        .mockReturnValueOnce(firstChain)  // First getPracticeQuota call
        .mockReturnValueOnce(secondChain); // Second getPracticeQuota call from canSendEmail

      const result = await complianceService.validateSendingPermissions('550e8400-e29b-41d4-a716-446655440000');

      expect(result.canSend).toBe(true);
      expect(result.quota).toBeDefined();
    });
  });

  describe('getComplianceReport', () => {
    it('should generate compliance report', async () => {
      const firstChain = createChainableMock();
      const secondChain = createChainableMock();
      const thirdChain = createChainableMock();

      // Mock preferences lookup
      firstChain.returns.mockResolvedValueOnce({
        data: [
          {
            id: 'pref-1',
            practice_id: '550e8400-e29b-41d4-a716-446655440000',
            email: 'test@example.com',
            is_subscribed: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
        error: null,
      });

      // Mock quota lookup (uses .single().returns())
      secondChain.single.mockReturnValue({
        returns: jest.fn().mockResolvedValue({
          data: {
            id: 'quota-1',
            practice_id: '550e8400-e29b-41d4-a716-446655440000',
            daily_email_limit: 1000,
            monthly_email_limit: 30000,
            daily_emails_sent: 50,
            monthly_emails_sent: 1500,
            last_daily_reset: new Date().toISOString(),
            last_monthly_reset: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          error: null,
        }),
      });

      // Mock consent log lookup - complex chaining
      thirdChain.select.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: [{ id: 'log-1' }],
              error: null,
            }),
          }),
        }),
      });

      mockSupabase.from
        .mockReturnValueOnce(firstChain)  // email_preferences lookup
        .mockReturnValueOnce(secondChain) // practice_email_quotas lookup
        .mockReturnValueOnce(thirdChain); // email_consent_log lookup

      const result = await complianceService.getComplianceReport('550e8400-e29b-41d4-a716-446655440000');

      expect(result.success).toBe(true);
      expect(result.report).toBeDefined();
      expect(result.report.practice_id).toBe('550e8400-e29b-41d4-a716-446655440000');
    });
  });

  describe('exportUserData', () => {
    it('should export user data successfully', async () => {
      const firstChain = createChainableMock();
      const secondChain = createChainableMock();
      const thirdChain = createChainableMock();

      // Mock preferences lookup
      firstChain.returns.mockResolvedValueOnce({
        data: [
          {
            id: 'pref-1',
            practice_id: '550e8400-e29b-41d4-a716-446655440000',
            email: 'test@example.com',
            preference_type: 'marketing',
            is_subscribed: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
        error: null,
      });

      // Mock consent log lookup - complex chaining
      secondChain.select.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: [{ id: 'log-1' }],
              error: null,
            }),
          }),
        }),
      });

      // Mock suppression check
      thirdChain.returns.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      mockSupabase.from
        .mockReturnValueOnce(firstChain)  // email_preferences lookup
        .mockReturnValueOnce(secondChain) // email_consent_log lookup
        .mockReturnValueOnce(thirdChain); // email_suppressions lookup

      const result = await complianceService.exportUserData('550e8400-e29b-41d4-a716-446655440000', 'test@example.com');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.email).toBe('test@example.com');
      expect(result.data.preferences).toBeDefined();
    });
  });
});