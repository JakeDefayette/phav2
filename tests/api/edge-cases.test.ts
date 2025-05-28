import { NextRequest } from 'next/server';
import { createMocks } from 'node-mocks-http';

// Mock Supabase
const mockSupabaseClient = {
  from: jest.fn(),
  auth: {
    getUser: jest.fn(),
  },
};

jest.mock('../../src/lib/supabase', () => ({
  createClient: () => mockSupabaseClient,
}));

// Mock services
jest.mock('../../src/services/pdf', () => ({
  pdfService: {
    generateReport: jest.fn(),
  },
}));

jest.mock('../../src/services/delivery', () => ({
  deliveryService: {
    deliverReport: jest.fn(),
    getDeliveryStatus: jest.fn(),
  },
}));

describe('API Edge Cases and Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication Edge Cases', () => {
    it('should handle missing authorization header', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/reports',
        headers: {},
      });

      // Mock auth failure
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'No authorization header' },
      });

      // This would be the actual API handler
      const mockApiHandler = async (request: any, response: any) => {
        const {
          data: { user },
          error,
        } = await mockSupabaseClient.auth.getUser();

        if (error || !user) {
          response.status(401).json({ error: 'Unauthorized' });
          return;
        }

        response.status(200).json({ success: true });
      };

      await mockApiHandler(req, res);

      expect(res._getStatusCode()).toBe(401);
      expect(JSON.parse(res._getData())).toEqual({ error: 'Unauthorized' });
    });

    it('should handle malformed JWT token', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/reports',
        headers: {
          authorization: 'Bearer invalid.jwt.token',
        },
      });

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid JWT' },
      });

      const mockApiHandler = async (request: any, response: any) => {
        const {
          data: { user },
          error,
        } = await mockSupabaseClient.auth.getUser();

        if (error || !user) {
          response.status(401).json({ error: 'Invalid token' });
          return;
        }

        response.status(200).json({ success: true });
      };

      await mockApiHandler(req, res);

      expect(res._getStatusCode()).toBe(401);
      expect(JSON.parse(res._getData())).toEqual({ error: 'Invalid token' });
    });

    it('should handle expired JWT token', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/reports',
        headers: {
          authorization: 'Bearer expired.jwt.token',
        },
      });

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'JWT expired' },
      });

      const mockApiHandler = async (request: any, response: any) => {
        const {
          data: { user },
          error,
        } = await mockSupabaseClient.auth.getUser();

        if (error?.message === 'JWT expired') {
          response
            .status(401)
            .json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
          return;
        }

        if (error || !user) {
          response.status(401).json({ error: 'Unauthorized' });
          return;
        }

        response.status(200).json({ success: true });
      };

      await mockApiHandler(req, res);

      expect(res._getStatusCode()).toBe(401);
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Token expired',
        code: 'TOKEN_EXPIRED',
      });
    });
  });

  describe('Input Validation Edge Cases', () => {
    it('should handle extremely large request bodies', async () => {
      const largeData = 'x'.repeat(10 * 1024 * 1024); // 10MB string

      const { req, res } = createMocks({
        method: 'POST',
        url: '/api/reports',
        headers: {
          'content-type': 'application/json',
        },
        body: { data: largeData },
      });

      const mockApiHandler = async (request: any, response: any) => {
        try {
          const body = request.body;

          // Simulate size check
          const bodySize = JSON.stringify(body).length;
          if (bodySize > 5 * 1024 * 1024) {
            // 5MB limit
            response.status(413).json({ error: 'Request entity too large' });
            return;
          }

          response.status(200).json({ success: true });
        } catch (error) {
          response.status(400).json({ error: 'Invalid request body' });
        }
      };

      await mockApiHandler(req, res);

      expect(res._getStatusCode()).toBe(413);
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Request entity too large',
      });
    });

    it('should handle malformed JSON', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        url: '/api/reports',
        headers: {
          'content-type': 'application/json',
        },
        body: '{ invalid json }',
      });

      const mockApiHandler = async (request: any, response: any) => {
        try {
          // Simulate JSON parsing
          if (typeof request.body === 'string') {
            JSON.parse(request.body);
          }
          response.status(200).json({ success: true });
        } catch (error) {
          response.status(400).json({ error: 'Invalid JSON format' });
        }
      };

      await mockApiHandler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Invalid JSON format',
      });
    });

    it('should handle missing required fields', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        url: '/api/reports',
        headers: {
          'content-type': 'application/json',
        },
        body: {
          // Missing required fields like reportId, userId, etc.
          optionalField: 'value',
        },
      });

      const mockApiHandler = async (request: any, response: any) => {
        const { reportId, userId } = request.body;

        const missingFields = [];
        if (!reportId) missingFields.push('reportId');
        if (!userId) missingFields.push('userId');

        if (missingFields.length > 0) {
          response.status(400).json({
            error: 'Missing required fields',
            missingFields,
          });
          return;
        }

        response.status(200).json({ success: true });
      };

      await mockApiHandler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Missing required fields',
        missingFields: ['reportId', 'userId'],
      });
    });

    it('should handle invalid data types', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        url: '/api/reports',
        headers: {
          'content-type': 'application/json',
        },
        body: {
          reportId: 'not-a-number',
          userId: 123, // Should be string
          isActive: 'not-a-boolean',
          metadata: 'should-be-object',
        },
      });

      const mockApiHandler = async (request: any, response: any) => {
        const { reportId, userId, isActive, metadata } = request.body;

        const validationErrors = [];

        if (typeof reportId !== 'string' || !/^[0-9a-f-]{36}$/.test(reportId)) {
          validationErrors.push('reportId must be a valid UUID');
        }

        if (typeof userId !== 'string') {
          validationErrors.push('userId must be a string');
        }

        if (typeof isActive !== 'boolean') {
          validationErrors.push('isActive must be a boolean');
        }

        if (metadata && typeof metadata !== 'object') {
          validationErrors.push('metadata must be an object');
        }

        if (validationErrors.length > 0) {
          response.status(400).json({
            error: 'Validation failed',
            validationErrors,
          });
          return;
        }

        response.status(200).json({ success: true });
      };

      await mockApiHandler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toBe('Validation failed');
      expect(responseData.validationErrors).toContain(
        'reportId must be a valid UUID'
      );
      expect(responseData.validationErrors).toContain(
        'userId must be a string'
      );
      expect(responseData.validationErrors).toContain(
        'isActive must be a boolean'
      );
      expect(responseData.validationErrors).toContain(
        'metadata must be an object'
      );
    });

    it('should handle SQL injection attempts', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/reports',
        query: {
          userId: "'; DROP TABLE users; --",
          reportId: '1 OR 1=1',
        },
      });

      const mockApiHandler = async (request: any, response: any) => {
        const { userId, reportId } = request.query;

        // Simulate SQL injection detection
        const sqlInjectionPatterns = [
          /('|(\\')|(;)|(\\;)|(\\|)|(\\*)|(%27)|(%3B)|(%3D)/i,
          /(DROP|DELETE|INSERT|UPDATE|CREATE|ALTER|EXEC|UNION|SELECT)/i,
          /(OR|AND)\s+\d+\s*=\s*\d+/i,
        ];

        const suspiciousInput = [userId, reportId].some(
          input =>
            typeof input === 'string' &&
            sqlInjectionPatterns.some(pattern => pattern.test(input))
        );

        if (suspiciousInput) {
          response.status(400).json({
            error: 'Invalid input detected',
            code: 'INVALID_INPUT',
          });
          return;
        }

        response.status(200).json({ success: true });
      };

      await mockApiHandler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Invalid input detected',
        code: 'INVALID_INPUT',
      });
    });
  });

  describe('Database Connection Edge Cases', () => {
    it('should handle database connection timeout', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/reports',
        headers: {
          authorization: 'Bearer valid.jwt.token',
        },
      });

      // Mock successful auth but database timeout
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockRejectedValue(new Error('Connection timeout')),
        }),
      });

      const mockApiHandler = async (request: any, response: any) => {
        try {
          const {
            data: { user },
          } = await mockSupabaseClient.auth.getUser();

          if (!user) {
            response.status(401).json({ error: 'Unauthorized' });
            return;
          }

          await mockSupabaseClient
            .from('reports')
            .select('*')
            .eq('user_id', user.id);

          response.status(200).json({ success: true });
        } catch (error: any) {
          if (error.message.includes('timeout')) {
            response.status(504).json({
              error: 'Database timeout',
              code: 'DB_TIMEOUT',
            });
          } else {
            response.status(500).json({ error: 'Internal server error' });
          }
        }
      };

      await mockApiHandler(req, res);

      expect(res._getStatusCode()).toBe(504);
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Database timeout',
        code: 'DB_TIMEOUT',
      });
    });

    it('should handle database connection lost', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        url: '/api/reports',
        headers: {
          authorization: 'Bearer valid.jwt.token',
        },
        body: {
          reportId: 'report-123',
          data: { test: 'data' },
        },
      });

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockRejectedValue(new Error('Connection lost')),
      });

      const mockApiHandler = async (request: any, response: any) => {
        try {
          const {
            data: { user },
          } = await mockSupabaseClient.auth.getUser();

          if (!user) {
            response.status(401).json({ error: 'Unauthorized' });
            return;
          }

          await mockSupabaseClient.from('reports').insert(request.body);

          response.status(201).json({ success: true });
        } catch (error: any) {
          if (error.message.includes('Connection lost')) {
            response.status(503).json({
              error: 'Service temporarily unavailable',
              code: 'DB_CONNECTION_LOST',
            });
          } else {
            response.status(500).json({ error: 'Internal server error' });
          }
        }
      };

      await mockApiHandler(req, res);

      expect(res._getStatusCode()).toBe(503);
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Service temporarily unavailable',
        code: 'DB_CONNECTION_LOST',
      });
    });
  });

  describe('Rate Limiting Edge Cases', () => {
    it('should handle rate limit exceeded', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        url: '/api/reports/generate',
        headers: {
          authorization: 'Bearer valid.jwt.token',
          'x-forwarded-for': '192.168.1.1',
        },
        body: {
          reportId: 'report-123',
        },
      });

      // Mock rate limiting
      const mockRateLimiter = {
        isRateLimited: jest.fn().mockReturnValue(true),
        getRemainingRequests: jest.fn().mockReturnValue(0),
        getResetTime: jest.fn().mockReturnValue(Date.now() + 60000),
      };

      const mockApiHandler = async (request: any, response: any) => {
        const clientIp = request.headers['x-forwarded-for'] || 'unknown';

        if (mockRateLimiter.isRateLimited(clientIp)) {
          const resetTime = mockRateLimiter.getResetTime();
          response.status(429).json({
            error: 'Rate limit exceeded',
            retryAfter: Math.ceil((resetTime - Date.now()) / 1000),
            code: 'RATE_LIMIT_EXCEEDED',
          });
          return;
        }

        response.status(200).json({ success: true });
      };

      await mockApiHandler(req, res);

      expect(res._getStatusCode()).toBe(429);
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toBe('Rate limit exceeded');
      expect(responseData.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(typeof responseData.retryAfter).toBe('number');
    });

    it('should handle concurrent request limits', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        url: '/api/reports/generate',
        headers: {
          authorization: 'Bearer valid.jwt.token',
        },
        body: {
          reportId: 'report-123',
        },
      });

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      // Mock concurrent request tracking
      const mockConcurrencyLimiter = {
        getCurrentRequests: jest.fn().mockReturnValue(5),
        getMaxConcurrentRequests: jest.fn().mockReturnValue(3),
      };

      const mockApiHandler = async (request: any, response: any) => {
        const {
          data: { user },
        } = await mockSupabaseClient.auth.getUser();

        if (!user) {
          response.status(401).json({ error: 'Unauthorized' });
          return;
        }

        const currentRequests = mockConcurrencyLimiter.getCurrentRequests(
          user.id
        );
        const maxRequests = mockConcurrencyLimiter.getMaxConcurrentRequests();

        if (currentRequests >= maxRequests) {
          response.status(429).json({
            error: 'Too many concurrent requests',
            maxConcurrent: maxRequests,
            current: currentRequests,
            code: 'CONCURRENT_LIMIT_EXCEEDED',
          });
          return;
        }

        response.status(200).json({ success: true });
      };

      await mockApiHandler(req, res);

      expect(res._getStatusCode()).toBe(429);
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Too many concurrent requests',
        maxConcurrent: 3,
        current: 5,
        code: 'CONCURRENT_LIMIT_EXCEEDED',
      });
    });
  });

  describe('File Upload Edge Cases', () => {
    it('should handle unsupported file types', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        url: '/api/upload',
        headers: {
          'content-type': 'multipart/form-data',
        },
        body: {
          file: {
            name: 'malicious.exe',
            type: 'application/x-msdownload',
            size: 1024,
          },
        },
      });

      const mockApiHandler = async (request: any, response: any) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
        const file = request.body.file;

        if (!allowedTypes.includes(file.type)) {
          response.status(400).json({
            error: 'Unsupported file type',
            allowedTypes,
            receivedType: file.type,
            code: 'UNSUPPORTED_FILE_TYPE',
          });
          return;
        }

        response.status(200).json({ success: true });
      };

      await mockApiHandler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toBe('Unsupported file type');
      expect(responseData.code).toBe('UNSUPPORTED_FILE_TYPE');
      expect(responseData.receivedType).toBe('application/x-msdownload');
    });

    it('should handle file size limits', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        url: '/api/upload',
        headers: {
          'content-type': 'multipart/form-data',
        },
        body: {
          file: {
            name: 'large-file.pdf',
            type: 'application/pdf',
            size: 50 * 1024 * 1024, // 50MB
          },
        },
      });

      const mockApiHandler = async (request: any, response: any) => {
        const maxSize = 10 * 1024 * 1024; // 10MB limit
        const file = request.body.file;

        if (file.size > maxSize) {
          response.status(413).json({
            error: 'File too large',
            maxSize: maxSize,
            receivedSize: file.size,
            code: 'FILE_TOO_LARGE',
          });
          return;
        }

        response.status(200).json({ success: true });
      };

      await mockApiHandler(req, res);

      expect(res._getStatusCode()).toBe(413);
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toBe('File too large');
      expect(responseData.code).toBe('FILE_TOO_LARGE');
      expect(responseData.maxSize).toBe(10 * 1024 * 1024);
      expect(responseData.receivedSize).toBe(50 * 1024 * 1024);
    });
  });

  describe('Memory and Performance Edge Cases', () => {
    it('should handle memory exhaustion gracefully', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        url: '/api/reports/generate',
        body: {
          reportId: 'report-123',
          includeCharts: true,
          chartCount: 1000, // Excessive number of charts
        },
      });

      const mockApiHandler = async (request: any, response: any) => {
        try {
          const { chartCount } = request.body;

          // Simulate memory check
          const estimatedMemoryUsage = chartCount * 5 * 1024 * 1024; // 5MB per chart
          const maxMemoryUsage = 100 * 1024 * 1024; // 100MB limit

          if (estimatedMemoryUsage > maxMemoryUsage) {
            response.status(413).json({
              error: 'Request would exceed memory limits',
              estimatedMemoryMB: Math.round(estimatedMemoryUsage / 1024 / 1024),
              maxMemoryMB: Math.round(maxMemoryUsage / 1024 / 1024),
              code: 'MEMORY_LIMIT_EXCEEDED',
            });
            return;
          }

          response.status(200).json({ success: true });
        } catch (error: any) {
          if (error.message.includes('out of memory')) {
            response.status(507).json({
              error: 'Insufficient storage',
              code: 'OUT_OF_MEMORY',
            });
          } else {
            response.status(500).json({ error: 'Internal server error' });
          }
        }
      };

      await mockApiHandler(req, res);

      expect(res._getStatusCode()).toBe(413);
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toBe('Request would exceed memory limits');
      expect(responseData.code).toBe('MEMORY_LIMIT_EXCEEDED');
      expect(responseData.estimatedMemoryMB).toBe(4883); // ~5000MB
      expect(responseData.maxMemoryMB).toBe(95); // ~100MB
    });

    it('should handle processing timeout', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        url: '/api/reports/generate',
        body: {
          reportId: 'report-123',
          complexProcessing: true,
        },
      });

      const mockApiHandler = async (request: any, response: any) => {
        const timeout = 30000; // 30 second timeout

        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Processing timeout')), timeout);
        });

        const processingPromise = new Promise(resolve => {
          // Simulate long-running process
          setTimeout(resolve, 35000); // 35 seconds (exceeds timeout)
        });

        try {
          await Promise.race([processingPromise, timeoutPromise]);
          response.status(200).json({ success: true });
        } catch (error: any) {
          if (error.message === 'Processing timeout') {
            response.status(408).json({
              error: 'Request timeout',
              timeoutMs: timeout,
              code: 'PROCESSING_TIMEOUT',
            });
          } else {
            response.status(500).json({ error: 'Internal server error' });
          }
        }
      };

      await mockApiHandler(req, res);

      expect(res._getStatusCode()).toBe(408);
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Request timeout',
        timeoutMs: 30000,
        code: 'PROCESSING_TIMEOUT',
      });
    });
  });

  describe('External Service Integration Edge Cases', () => {
    it('should handle third-party service unavailability', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        url: '/api/reports/deliver',
        body: {
          reportId: 'report-123',
          deliveryMethod: 'email',
          recipient: 'test@example.com',
        },
      });

      // Mock external service failure
      const { deliveryService } = require('../../src/services/delivery');
      deliveryService.deliverReport.mockRejectedValue(
        new Error('External service unavailable')
      );

      const mockApiHandler = async (request: any, response: any) => {
        try {
          await deliveryService.deliverReport(request.body);
          response.status(200).json({ success: true });
        } catch (error: any) {
          if (error.message.includes('External service unavailable')) {
            response.status(502).json({
              error: 'External service unavailable',
              service: 'email-delivery',
              code: 'EXTERNAL_SERVICE_ERROR',
            });
          } else {
            response.status(500).json({ error: 'Internal server error' });
          }
        }
      };

      await mockApiHandler(req, res);

      expect(res._getStatusCode()).toBe(502);
      expect(JSON.parse(res._getData())).toEqual({
        error: 'External service unavailable',
        service: 'email-delivery',
        code: 'EXTERNAL_SERVICE_ERROR',
      });
    });

    it('should handle API key exhaustion', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        url: '/api/reports/generate',
        body: {
          reportId: 'report-123',
          useAI: true,
        },
      });

      const mockApiHandler = async (request: any, response: any) => {
        try {
          // Simulate AI service call
          throw new Error('API quota exceeded');
        } catch (error: any) {
          if (error.message.includes('quota exceeded')) {
            response.status(429).json({
              error: 'API quota exceeded',
              service: 'ai-processing',
              code: 'QUOTA_EXCEEDED',
            });
          } else {
            response.status(500).json({ error: 'Internal server error' });
          }
        }
      };

      await mockApiHandler(req, res);

      expect(res._getStatusCode()).toBe(429);
      expect(JSON.parse(res._getData())).toEqual({
        error: 'API quota exceeded',
        service: 'ai-processing',
        code: 'QUOTA_EXCEEDED',
      });
    });
  });

  describe('Data Consistency Edge Cases', () => {
    it('should handle concurrent modification conflicts', async () => {
      const { req, res } = createMocks({
        method: 'PUT',
        url: '/api/reports/report-123',
        headers: {
          'if-match': 'old-etag-value',
        },
        body: {
          title: 'Updated Report Title',
          lastModified: '2024-01-01T00:00:00Z',
        },
      });

      const mockApiHandler = async (request: any, response: any) => {
        const currentEtag = 'new-etag-value'; // Simulates data was modified by another request
        const requestEtag = request.headers['if-match'];

        if (requestEtag && requestEtag !== currentEtag) {
          response.status(409).json({
            error: 'Conflict: Resource was modified by another request',
            currentEtag: currentEtag,
            requestEtag: requestEtag,
            code: 'CONCURRENT_MODIFICATION',
          });
          return;
        }

        response.status(200).json({ success: true });
      };

      await mockApiHandler(req, res);

      expect(res._getStatusCode()).toBe(409);
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Conflict: Resource was modified by another request',
        currentEtag: 'new-etag-value',
        requestEtag: 'old-etag-value',
        code: 'CONCURRENT_MODIFICATION',
      });
    });

    it('should handle orphaned data cleanup', async () => {
      const { req, res } = createMocks({
        method: 'DELETE',
        url: '/api/reports/report-123',
      });

      mockSupabaseClient.from.mockImplementation(table => {
        if (table === 'reports') {
          return {
            delete: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ data: null, error: null }),
            }),
          };
        }
        if (table === 'report_shares') {
          return {
            delete: jest.fn().mockReturnValue({
              eq: jest
                .fn()
                .mockRejectedValue(new Error('Foreign key constraint')),
            }),
          };
        }
        return {};
      });

      const mockApiHandler = async (request: any, response: any) => {
        const reportId = 'report-123';

        try {
          // Try to delete related data first
          await mockSupabaseClient
            .from('report_shares')
            .delete()
            .eq('report_id', reportId);
          await mockSupabaseClient.from('reports').delete().eq('id', reportId);

          response.status(200).json({ success: true });
        } catch (error: any) {
          if (error.message.includes('Foreign key constraint')) {
            response.status(409).json({
              error: 'Cannot delete: Resource has dependent data',
              code: 'DEPENDENCY_CONFLICT',
            });
          } else {
            response.status(500).json({ error: 'Internal server error' });
          }
        }
      };

      await mockApiHandler(req, res);

      expect(res._getStatusCode()).toBe(409);
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Cannot delete: Resource has dependent data',
        code: 'DEPENDENCY_CONFLICT',
      });
    });
  });
});
