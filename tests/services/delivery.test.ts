// Mock UUID first
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-1234'),
}));

// Mock Vercel Blob
jest.mock('@vercel/blob', () => ({
  put: jest.fn().mockResolvedValue({
    url: 'https://mock-blob-url.com/test.pdf',
    downloadUrl: 'https://mock-blob-url.com/test.pdf',
  }),
}));

// Create a comprehensive chainable mock that can handle both success and error scenarios
const createChainableMock = () => {
  const chainable = {
    from: jest.fn(),
    select: jest.fn(),
    update: jest.fn(),
    insert: jest.fn(),
    eq: jest.fn(),
    single: jest.fn(),
    // Add a method to reset to success state
    resetToSuccess: function () {
      this.from.mockReturnValue(this);
      this.select.mockReturnValue(this);
      this.update.mockReturnValue(this);
      this.insert.mockReturnValue(this);
      this.eq.mockReturnValue(this);
      this.single.mockResolvedValue({
        data: {
          id: 'report-123',
          child_name: 'Test Child',
          assessment_date: '2024-01-15',
          user_id: 'user-123',
        },
        error: null,
      });
    },
    // Add a method to set up error scenarios
    setupError: function (error: Error) {
      this.from.mockReturnValue(this);
      this.select.mockReturnValue(this);
      this.update.mockReturnValue(this);
      this.insert.mockReturnValue(this);
      // The last eq in the chain should throw the error
      this.eq.mockImplementation(() => {
        throw error;
      });
    },
  };

  // Initialize with success state
  chainable.resetToSuccess();
  return chainable;
};

// Mock the Supabase server module
const mockSupabaseClient = createChainableMock();
jest.mock('@/lib/supabase-server', () => ({
  supabaseServer: mockSupabaseClient,
}));

// Mock Email service
jest.mock('@/services/email', () => ({
  EmailService: jest.fn().mockImplementation(() => ({
    sendReportDeliveryEmail: jest.fn().mockResolvedValue({ success: true }),
    sendReportReadyNotification: jest.fn().mockResolvedValue({ success: true }),
  })),
}));

// Mock PDF service
jest.mock('@/services/pdf', () => ({
  PDFService: jest.fn().mockImplementation(() => ({
    generateReportPDF: jest
      .fn()
      .mockResolvedValue(Buffer.from('mock-pdf-content')),
  })),
}));

// Now import the service after all mocks are set up
import { DeliveryService } from '@/features/reports/services';

describe('DeliveryService', () => {
  let deliveryService: DeliveryService;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Reset to success state
    mockSupabaseClient.resetToSuccess();

    // Create fresh service instance
    deliveryService = new DeliveryService();
  });

  describe('deliverReport', () => {
    const mockOptions = {
      reportId: 'report-123',
      userId: 'user-123',
      deliveryMethods: [
        { type: 'email' as const, enabled: true },
        { type: 'download' as const, enabled: true },
      ],
      recipientEmail: 'test@example.com',
      expirationHours: 24,
      notifyUser: true,
    };

    it('should successfully deliver a report via email', async () => {
      const result = await deliveryService.deliverReport(mockOptions);

      expect(result.success).toBe(true);
      expect(result.deliveryId).toBe('mock-uuid-1234');
      expect(result.shareToken).toBe('mock-uuid-1234');
      expect(result.emailSent).toBe(true);
      expect(result.downloadUrl).toContain('/reports/download/');
    });

    it('should handle cloud storage delivery', async () => {
      const optionsWithCloudStorage = {
        ...mockOptions,
        deliveryMethods: [{ type: 'cloud_storage' as const, enabled: true }],
      };

      const result = await deliveryService.deliverReport(
        optionsWithCloudStorage
      );

      expect(result.success).toBe(true);
      expect(result.cloudStorageUrl).toBe('https://mock-blob-url.com/test.pdf');
    });

    it('should handle delivery errors gracefully', async () => {
      // Set up error scenario
      mockSupabaseClient.setupError(new Error('Database error'));

      const result = await deliveryService.deliverReport(mockOptions);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Database error');
    });

    it('should skip disabled delivery methods', async () => {
      const optionsWithDisabledMethods = {
        ...mockOptions,
        deliveryMethods: [
          { type: 'email' as const, enabled: false },
          { type: 'download' as const, enabled: true },
        ],
      };

      const result = await deliveryService.deliverReport(
        optionsWithDisabledMethods
      );

      expect(result.success).toBe(true);
      expect(result.emailSent).toBeUndefined(); // Email should not be sent
      expect(result.downloadUrl).toBeDefined(); // Download should still work
    });
  });

  describe('getDeliveryStatus', () => {
    it('should return delivery status', async () => {
      const mockDeliveryData = {
        delivery_id: 'delivery-123',
        success: true,
        reports: { child_name: 'Test Child' },
        email_sends: { status: 'sent' },
      };

      mockSupabaseClient.single.mockResolvedValue({
        data: mockDeliveryData,
        error: null,
      });

      const result = await deliveryService.getDeliveryStatus('delivery-123');

      expect(result).toEqual(mockDeliveryData);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('report_shares');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith(
        'delivery_id',
        'delivery-123'
      );
    });

    it('should handle delivery status errors', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { message: 'Delivery not found' },
      });

      await expect(
        deliveryService.getDeliveryStatus('invalid-id')
      ).rejects.toThrow('Failed to get delivery status: Delivery not found');
    });
  });

  describe('revokeAccess', () => {
    it('should revoke access to a shared report', async () => {
      await expect(
        deliveryService.revokeAccess('report-123', 'user-123')
      ).resolves.not.toThrow();

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('reports');
      expect(mockSupabaseClient.update).toHaveBeenCalledWith({
        share_token: null,
        share_expires_at: null,
        is_public: false,
      });
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', 'report-123');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('user_id', 'user-123');
    });

    it('should handle revoke access errors', async () => {
      // Set up error scenario for revoke access
      mockSupabaseClient.setupError(new Error('Access denied'));

      await expect(
        deliveryService.revokeAccess('report-123', 'user-123')
      ).rejects.toThrow('Access denied');
    });
  });
});
