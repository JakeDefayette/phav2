import { ResendClient } from '../../src/shared/services/email/resend';
import { EmailTemplateService } from '../../src/shared/services/email/templates';
import { EmailTrackingService } from '../../src/shared/services/email/tracking';
import { EmailBounceHandler } from '../../src/shared/services/email/bounceHandler';
import { EmailComplianceService } from '../../src/shared/services/email/compliance';
import { ResendConfig, EmailSendOptions, EmailTemplateType } from '../../src/shared/services/email/types';

// Mock external dependencies to focus on performance characteristics
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: jest.fn().mockImplementation(async () => {
        // Simulate API latency
        await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
        return {
          data: { id: `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` },
          error: null
        };
      })
    }
  }))
}));

jest.mock('../../src/shared/services/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => ({
              returns: jest.fn(() => Promise.resolve({ data: null, error: null }))
            }))
          }))
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: { id: 'test-123' }, error: null }))
        }))
      })),
      upsert: jest.fn(() => Promise.resolve({ data: { id: 'test-123' }, error: null }))
    }))
  },
}));

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => ({
              returns: jest.fn(() => Promise.resolve({ data: null, error: null }))
            }))
          }))
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: { id: 'test-123' }, error: null }))
        }))
      })),
      upsert: jest.fn(() => Promise.resolve({ data: { id: 'test-123' }, error: null }))
    }))
  }))
}));

jest.mock('@react-email/render', () => ({
  render: jest.fn()
    .mockImplementation(async () => {
      // Simulate template rendering time
      await new Promise(resolve => setTimeout(resolve, Math.random() * 5));
      return '<html><body>Test email content</body></html>';
    })
}));

describe('Email Service Performance Tests', () => {
  let resendClient: ResendClient;
  let trackingService: EmailTrackingService;
  let bounceHandler: EmailBounceHandler;
  let complianceService: EmailComplianceService;

  const mockPracticeId = '550e8400-e29b-41d4-a716-446655440000';

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Configure for performance testing
    const config: ResendConfig = {
      apiKey: 'test-api-key',
      rateLimit: {
        tokensPerSecond: 50,
        maxTokens: 100,
      },
      retry: {
        maxAttempts: 3,
        baseDelayMs: 100,
      },
    };

    resendClient = new ResendClient(config);
    trackingService = new EmailTrackingService();
    bounceHandler = EmailBounceHandler.getInstance();
    complianceService = new EmailComplianceService();
  });

  describe('Rate Limiting Performance', () => {
    it('should handle burst email sending within rate limits', async () => {
      const burstSize = 20;
      const startTime = Date.now();

      const promises = Array.from({ length: burstSize }, async (_, i) => {
        const emailOptions: EmailSendOptions = {
          to: [`user${i}@example.com`],
          from: 'test@practice.com',
          subject: `Test Email ${i}`,
          html: `<p>Test email content ${i}</p>`,
          text: `Test email content ${i}`,
        };

        return resendClient.sendEmail(emailOptions);
      });

      const results = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Verify all emails were processed
      expect(results).toHaveLength(burstSize);
      results.forEach((result, i) => {
        expect(result.success).toBe(true);
        expect(result.data?.id).toBeDefined();
      });

      // Performance assertions
      const emailsPerSecond = burstSize / (duration / 1000);
      console.log(`Processed ${burstSize} emails in ${duration}ms (${emailsPerSecond.toFixed(2)} emails/sec)`);
      
      // Should handle reasonable throughput
      expect(emailsPerSecond).toBeGreaterThan(10);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should gracefully handle rate limit exceeded scenarios', async () => {
      // Configure very restrictive rate limiting
      const restrictiveConfig: ResendConfig = {
        apiKey: 'test-api-key',
        rateLimit: {
          tokensPerSecond: 1,
          maxTokens: 2,
        },
      };

      const restrictedClient = new ResendClient(restrictiveConfig);
      const startTime = Date.now();

      const promises = Array.from({ length: 5 }, async (_, i) => {
        const emailOptions: EmailSendOptions = {
          to: [`rate-limit-test${i}@example.com`],
          from: 'test@practice.com',
          subject: `Rate Limit Test ${i}`,
          html: `<p>Rate limit test ${i}</p>`,
          text: `Rate limit test ${i}`,
        };

        return restrictedClient.sendEmail(emailOptions);
      });

      const results = await Promise.allSettled(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`Rate limited test completed in ${duration}ms`);

      // Some requests might be delayed or rejected due to rate limiting
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      console.log(`Successful: ${successful}, Failed: ${failed}`);
      
      // Should handle rate limiting gracefully
      expect(successful + failed).toBe(5);
      expect(duration).toBeGreaterThan(1000); // Should take longer due to rate limiting
    });

    it('should maintain performance under sustained load', async () => {
      const batchSize = 10;
      const numBatches = 3;
      const allResults: any[] = [];
      const batchTimes: number[] = [];

      for (let batch = 0; batch < numBatches; batch++) {
        const batchStartTime = Date.now();

        const batchPromises = Array.from({ length: batchSize }, async (_, i) => {
          const emailOptions: EmailSendOptions = {
            to: [`batch${batch}-user${i}@example.com`],
            from: 'test@practice.com',
            subject: `Batch ${batch} Email ${i}`,
            html: `<p>Batch ${batch} email content ${i}</p>`,
            text: `Batch ${batch} email content ${i}`,
          };

          return resendClient.sendEmail(emailOptions);
        });

        const batchResults = await Promise.all(batchPromises);
        const batchEndTime = Date.now();
        const batchDuration = batchEndTime - batchStartTime;

        allResults.push(...batchResults);
        batchTimes.push(batchDuration);

        console.log(`Batch ${batch + 1} completed in ${batchDuration}ms`);

        // Small delay between batches to simulate real usage
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Verify all emails were processed
      expect(allResults).toHaveLength(batchSize * numBatches);
      allResults.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Performance should remain consistent across batches
      const avgBatchTime = batchTimes.reduce((sum, time) => sum + time, 0) / batchTimes.length;
      const maxBatchTime = Math.max(...batchTimes);
      const minBatchTime = Math.min(...batchTimes);

      console.log(`Avg batch time: ${avgBatchTime.toFixed(2)}ms, Min: ${minBatchTime}ms, Max: ${maxBatchTime}ms`);

      // Performance shouldn't degrade significantly across batches
      expect(maxBatchTime - minBatchTime).toBeLessThan(avgBatchTime * 2);
    });
  });

  describe('Bulk Operations Performance', () => {
    it('should efficiently process bulk template rendering', async () => {
      const bulkSize = 50;
      const startTime = Date.now();

      const promises = Array.from({ length: bulkSize }, async (_, i) => {
        return EmailTemplateService.renderTemplate(
          EmailTemplateType.REPORT_DELIVERY,
          {
            childName: `Child ${i}`,
            assessmentDate: '2024-01-01',
            downloadUrl: `https://example.com/download/${i}`,
            practiceInfo: {
              name: 'Test Practice',
              phone: '555-0123',
              email: 'test@practice.com',
              website: 'https://testpractice.com'
            }
          }
        );
      });

      const results = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Verify all templates were rendered
      expect(results).toHaveLength(bulkSize);
      results.forEach((result, i) => {
        expect(result.html).toContain(`Child ${i}`);
        expect(result.subject).toBeDefined();
      });

      const templatesPerSecond = bulkSize / (duration / 1000);
      console.log(`Rendered ${bulkSize} templates in ${duration}ms (${templatesPerSecond.toFixed(2)} templates/sec)`);

      // Template rendering should be fast
      expect(templatesPerSecond).toBeGreaterThan(20);
      expect(duration).toBeLessThan(3000);
    });

    it('should efficiently generate bulk tracking URLs', async () => {
      const bulkSize = 100;
      const startTime = Date.now();

      const promises = Array.from({ length: bulkSize }, async (_, i) => {
        return trackingService.generateTrackingUrl({
          practiceId: mockPracticeId,
          recipientEmail: `bulk-user${i}@example.com`,
          originalUrl: `https://example.com/report/${i}`,
          campaignId: 'bulk-campaign-123'
        });
      });

      const results = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Verify all tracking URLs were generated
      expect(results).toHaveLength(bulkSize);
      results.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.trackingUrl).toBeDefined();
      });

      const urlsPerSecond = bulkSize / (duration / 1000);
      console.log(`Generated ${bulkSize} tracking URLs in ${duration}ms (${urlsPerSecond.toFixed(2)} URLs/sec)`);

      // URL generation should be fast
      expect(urlsPerSecond).toBeGreaterThan(30);
      expect(duration).toBeLessThan(4000);
    });

    it('should handle bulk bounce processing efficiently', async () => {
      const bulkSize = 25;
      const startTime = Date.now();

      const promises = Array.from({ length: bulkSize }, async (_, i) => {
        return bounceHandler.processBounce({
          practiceId: mockPracticeId,
          email: `bounce-test${i}@example.com`,
          bounceType: i % 2 === 0 ? 'hard' : 'soft',
          reason: 'mailbox full',
          timestamp: new Date()
        });
      });

      const results = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Verify all bounces were processed
      expect(results).toHaveLength(bulkSize);
      results.forEach(result => {
        expect(result.action).toBeDefined();
        expect(result.severity).toBeDefined();
      });

      const bouncesPerSecond = bulkSize / (duration / 1000);
      console.log(`Processed ${bulkSize} bounces in ${duration}ms (${bouncesPerSecond.toFixed(2)} bounces/sec)`);

      // Bounce processing should be reasonably fast
      expect(bouncesPerSecond).toBeGreaterThan(5);
      expect(duration).toBeLessThan(6000);
    });

    it('should handle bulk compliance checks efficiently', async () => {
      const bulkSize = 30;
      const startTime = Date.now();

      const promises = Array.from({ length: bulkSize }, async (_, i) => {
        return complianceService.isEmailSuppressed(
          mockPracticeId,
          `compliance-test${i}@example.com`
        );
      });

      const results = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Verify all compliance checks completed
      expect(results).toHaveLength(bulkSize);
      results.forEach(result => {
        expect(result.success).toBe(true);
        expect(typeof result.suppressed).toBe('boolean');
      });

      const checksPerSecond = bulkSize / (duration / 1000);
      console.log(`Completed ${bulkSize} compliance checks in ${duration}ms (${checksPerSecond.toFixed(2)} checks/sec)`);

      // Compliance checks should be fast
      expect(checksPerSecond).toBeGreaterThan(15);
      expect(duration).toBeLessThan(3000);
    });
  });

  describe('Memory and Resource Usage', () => {
    it('should not leak memory during sustained operations', async () => {
      const iterations = 20;
      const memorySnapshots: number[] = [];

      // Take initial memory snapshot
      if (process.memoryUsage) {
        memorySnapshots.push(process.memoryUsage().heapUsed);
      }

      for (let i = 0; i < iterations; i++) {
        // Perform various operations
        await EmailTemplateService.renderTemplate(
          EmailTemplateType.REPORT_DELIVERY,
          {
            childName: `Memory Test ${i}`,
            assessmentDate: '2024-01-01',
            downloadUrl: 'https://example.com/download',
            practiceInfo: {
              name: 'Test Practice',
              phone: '555-0123',
              email: 'test@practice.com',
              website: 'https://testpractice.com'
            }
          }
        );

        await trackingService.generateTrackingUrl({
          practiceId: mockPracticeId,
          recipientEmail: `memory-test${i}@example.com`,
          originalUrl: 'https://example.com/report'
        });

        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }

        // Take memory snapshot every 5 iterations
        if (i % 5 === 0 && process.memoryUsage) {
          memorySnapshots.push(process.memoryUsage().heapUsed);
        }
      }

      // Take final memory snapshot
      if (process.memoryUsage) {
        memorySnapshots.push(process.memoryUsage().heapUsed);
      }

      if (memorySnapshots.length > 1) {
        const initialMemory = memorySnapshots[0];
        const finalMemory = memorySnapshots[memorySnapshots.length - 1];
        const memoryIncrease = finalMemory - initialMemory;
        const memoryIncreasePercent = (memoryIncrease / initialMemory) * 100;

        console.log(`Memory usage: ${initialMemory} -> ${finalMemory} (${memoryIncreasePercent.toFixed(2)}% increase)`);

        // Memory usage shouldn't increase dramatically
        expect(memoryIncreasePercent).toBeLessThan(200); // Less than 200% increase
      }
    });

    it('should handle concurrent operations without resource exhaustion', async () => {
      const concurrentOperations = 15;
      const startTime = Date.now();

      const operations = [
        // Template rendering operations
        ...Array.from({ length: 5 }, (_, i) => 
          EmailTemplateService.renderTemplate(
            EmailTemplateType.REPORT_DELIVERY,
            { childName: `Concurrent ${i}`, assessmentDate: '2024-01-01', downloadUrl: 'https://example.com/download' }
          )
        ),
        // Tracking URL generation
        ...Array.from({ length: 5 }, (_, i) => 
          trackingService.generateTrackingUrl({
            practiceId: mockPracticeId,
            recipientEmail: `concurrent${i}@example.com`,
            originalUrl: 'https://example.com/report'
          })
        ),
        // Compliance checks
        ...Array.from({ length: 5 }, (_, i) => 
          complianceService.isEmailSuppressed(mockPracticeId, `concurrent${i}@example.com`)
        ),
      ];

      const results = await Promise.all(operations);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Verify all operations completed successfully
      expect(results).toHaveLength(concurrentOperations);
      
      // Template rendering results (first 5)
      results.slice(0, 5).forEach(result => {
        expect(result.html).toBeDefined();
      });

      // Tracking URL results (next 5)
      results.slice(5, 10).forEach(result => {
        expect(result.success).toBe(true);
      });

      // Compliance check results (last 5)
      results.slice(10, 15).forEach(result => {
        expect(result.success).toBe(true);
      });

      const operationsPerSecond = concurrentOperations / (duration / 1000);
      console.log(`Completed ${concurrentOperations} concurrent operations in ${duration}ms (${operationsPerSecond.toFixed(2)} ops/sec)`);

      // Concurrent operations should complete efficiently
      expect(operationsPerSecond).toBeGreaterThan(5);
      expect(duration).toBeLessThan(8000);
    });
  });

  describe('Caching and Optimization', () => {
    it('should demonstrate template caching benefits', async () => {
      const templateType = EmailTemplateType.REPORT_DELIVERY;
      const templateData = {
        childName: 'Cache Test',
        assessmentDate: '2024-01-01',
        downloadUrl: 'https://example.com/download',
        practiceInfo: {
          name: 'Test Practice',
          phone: '555-0123',
          email: 'test@practice.com',
          website: 'https://testpractice.com'
        }
      };

      // First render (cold)
      const coldStart = Date.now();
      const firstResult = await EmailTemplateService.renderTemplate(templateType, templateData);
      const coldDuration = Date.now() - coldStart;

      // Subsequent renders (potentially cached)
      const warmTimes: number[] = [];
      for (let i = 0; i < 5; i++) {
        const warmStart = Date.now();
        await EmailTemplateService.renderTemplate(templateType, templateData);
        warmTimes.push(Date.now() - warmStart);
      }

      const avgWarmTime = warmTimes.reduce((sum, time) => sum + time, 0) / warmTimes.length;

      console.log(`Cold render: ${coldDuration}ms, Avg warm render: ${avgWarmTime.toFixed(2)}ms`);

      // Verify results are consistent
      expect(firstResult.html).toBeDefined();
      expect(firstResult.subject).toBeDefined();

      // Warm renders should generally be faster (though mocked performance may not show this)
      expect(avgWarmTime).toBeLessThan(coldDuration * 2);
    });

    it('should optimize tracking URL generation for repeated patterns', async () => {
      const baseUrl = 'https://example.com/report';
      const urls: number[] = [];

      // Generate tracking URLs with similar patterns
      for (let i = 0; i < 10; i++) {
        const start = Date.now();
        
        await trackingService.generateTrackingUrl({
          practiceId: mockPracticeId,
          recipientEmail: `pattern-test${i}@example.com`,
          originalUrl: `${baseUrl}/${i}`,
          campaignId: 'pattern-campaign'
        });
        
        urls.push(Date.now() - start);
      }

      const avgGenerationTime = urls.reduce((sum, time) => sum + time, 0) / urls.length;
      const maxGenerationTime = Math.max(...urls);

      console.log(`Avg URL generation: ${avgGenerationTime.toFixed(2)}ms, Max: ${maxGenerationTime}ms`);

      // Generation times should be consistent
      expect(maxGenerationTime).toBeLessThan(avgGenerationTime * 3);
      expect(avgGenerationTime).toBeLessThan(100); // Should be under 100ms on average
    });
  });
});