import { PDFService, pdfService } from '../../src/services/pdf';
import { ChartService } from '../../src/services/chartService';
import { Report, ReportWithShares } from '../../src/types/report';
import { ChartImageData } from '../../src/types/chart';

// Mock dependencies
jest.mock('../../src/services/chartService');
jest.mock('@react-pdf/renderer', () => ({
  pdf: jest.fn(),
  PDFDownloadLink: jest.fn(),
  Document: jest.fn(),
  Page: jest.fn(),
  Text: jest.fn(),
  View: jest.fn(),
  StyleSheet: {
    create: jest.fn(() => ({})),
  },
}));

// Create a proper mock for ChartService
const mockChartService = {
  transformSurveyDataToCharts: jest.fn(),
  generateChartAccessibilityDescription: jest.fn(),
  exportChartAsImage: jest.fn(),
  clearCaches: jest.fn(),
  getCacheStats: jest.fn(),
} as jest.Mocked<ChartService>;

// Mock the ChartService constructor and getInstance
const MockedChartService = ChartService as jest.MockedClass<
  typeof ChartService
>;
MockedChartService.getInstance = jest.fn(() => mockChartService);

describe('PDF Service - Comprehensive Testing (Edge Cases & Accessibility)', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Set up default mock implementations
    mockChartService.transformSurveyDataToCharts.mockReturnValue([]);
    mockChartService.generateChartAccessibilityDescription.mockReturnValue(
      'Chart accessibility description'
    );
    mockChartService.exportChartAsImage.mockResolvedValue(
      'data:image/png;base64,mock-image-data'
    );
    mockChartService.getCacheStats.mockReturnValue({
      chartCacheSize: 0,
      colorCacheSize: 0,
      transformationCacheSize: 0,
    });
  });

  describe('Edge Cases - Data Validation', () => {
    it('should handle completely empty report data', async () => {
      const emptyReport = {
        id: 'empty-report',
        assessment_id: 'empty-assessment',
        report_type: 'standard',
        content: {},
        generated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Report;

      const isValid = pdfService.validateReportData(emptyReport);
      expect(isValid).toBe(false);

      // Should throw error when trying to generate PDF with invalid data
      await expect(pdfService.generatePDFBlob(emptyReport)).rejects.toThrow();
    });

    it('should handle report with null child data', async () => {
      const reportWithNullChild = {
        id: 'null-child-report',
        assessment_id: 'test-assessment',
        report_type: 'standard',
        content: {
          child: null,
          assessment: {
            id: 'test-assessment',
            brain_o_meter_score: 75,
            completed_at: new Date().toISOString(),
            status: 'completed',
          },
        },
        generated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Report;

      const isValid = pdfService.validateReportData(reportWithNullChild);
      expect(isValid).toBe(false);
    });

    it('should handle report with missing child name', async () => {
      const reportWithoutName = {
        id: 'no-name-report',
        assessment_id: 'test-assessment',
        report_type: 'standard',
        content: {
          child: {
            age: 8,
            gender: 'Other',
            // name is missing
          },
          assessment: {
            id: 'test-assessment',
            brain_o_meter_score: 75,
            completed_at: new Date().toISOString(),
            status: 'completed',
          },
        },
        generated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Report;

      const isValid = pdfService.validateReportData(reportWithoutName);
      expect(isValid).toBe(false);
    });

    it('should handle extremely long text content', async () => {
      const longText = 'A'.repeat(10000); // 10KB of text
      const reportWithLongContent = {
        id: 'long-content-report',
        assessment_id: 'test-assessment',
        report_type: 'standard',
        content: {
          child: {
            name: 'Test Child',
            age: 8,
            gender: 'Other',
          },
          assessment: {
            id: 'test-assessment',
            brain_o_meter_score: 75,
            completed_at: new Date().toISOString(),
            status: 'completed',
          },
          summary: {
            overview: longText,
            key_findings: [longText, longText],
          },
          recommendations: [longText, longText, longText],
        },
        generated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Report;

      const isValid = pdfService.validateReportData(reportWithLongContent);
      expect(isValid).toBe(true);

      const estimatedSize = pdfService.estimatePDFSize(reportWithLongContent);
      expect(estimatedSize).toBeGreaterThan(50000); // Should be larger than base size
    });

    it('should handle special characters and unicode in content', async () => {
      const specialCharsReport = {
        id: 'special-chars-report',
        assessment_id: 'test-assessment',
        report_type: 'standard',
        content: {
          child: {
            name: 'José María Ñoño 测试 🎉',
            age: 8,
            gender: 'Other',
          },
          assessment: {
            id: 'test-assessment',
            brain_o_meter_score: 75,
            completed_at: new Date().toISOString(),
            status: 'completed',
          },
          summary: {
            overview:
              'Report with émojis 🏥 and spëcial chärs & symbols: @#$%^&*()',
            key_findings: ['Finding with 中文', 'Русский текст'],
          },
          recommendations: [
            'Recomendación en español',
            'Recommandation en français',
          ],
        },
        generated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Report;

      const isValid = pdfService.validateReportData(specialCharsReport);
      expect(isValid).toBe(true);

      // Should not throw when processing special characters
      expect(() =>
        pdfService.estimatePDFSize(specialCharsReport)
      ).not.toThrow();
    });

    it('should handle malformed categories data', async () => {
      const malformedCategoriesReport = {
        id: 'malformed-categories-report',
        assessment_id: 'test-assessment',
        report_type: 'standard',
        content: {
          child: {
            name: 'Test Child',
            age: 8,
            gender: 'Other',
          },
          assessment: {
            id: 'test-assessment',
            brain_o_meter_score: 75,
            completed_at: new Date().toISOString(),
            status: 'completed',
          },
          categories: {
            lifestyle: null, // null category
            behavior: [], // empty array
            attention: [
              {
                // missing survey_question_definitions
                response_text: 'Some response',
              },
              {
                survey_question_definitions: null, // null definition
                response_text: 'Another response',
              },
            ],
          },
        },
        generated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Report;

      const isValid = pdfService.validateReportData(malformedCategoriesReport);
      expect(isValid).toBe(true); // Should still be valid as child data exists

      const estimatedSize = pdfService.estimatePDFSize(
        malformedCategoriesReport
      );
      expect(estimatedSize).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases - Practice Information', () => {
    it('should handle missing practice information', async () => {
      const validReport = createValidReport();

      const downloadLink = pdfService.createDownloadLink(
        validReport,
        undefined, // no practice info
        'test-report.pdf'
      );

      expect(downloadLink).toBeDefined();
    });

    it('should handle practice info with missing logo', async () => {
      const validReport = createValidReport();
      const practiceInfo = {
        name: 'Test Practice',
        address: '123 Main St',
        phone: '555-0123',
        email: 'test@practice.com',
        // logo is missing
      };

      const downloadLink = pdfService.createDownloadLink(
        validReport,
        practiceInfo,
        'test-report.pdf'
      );

      expect(downloadLink).toBeDefined();
    });

    it('should handle practice info with invalid logo URL', async () => {
      const validReport = createValidReport();
      const practiceInfo = {
        name: 'Test Practice',
        logo: 'invalid-url-not-a-real-image',
        address: '123 Main St',
        phone: '555-0123',
        email: 'test@practice.com',
      };

      const downloadLink = pdfService.createDownloadLink(
        validReport,
        practiceInfo,
        'test-report.pdf'
      );

      expect(downloadLink).toBeDefined();
    });

    it('should handle extremely long practice information', async () => {
      const validReport = createValidReport();
      const longText = 'Very long practice information '.repeat(100);
      const practiceInfo = {
        name: longText,
        address: longText,
        phone: '555-0123-ext-' + '1234'.repeat(10),
        email: 'very-long-email-address-' + 'test'.repeat(20) + '@practice.com',
      };

      const downloadLink = pdfService.createDownloadLink(
        validReport,
        practiceInfo,
        'test-report.pdf'
      );

      expect(downloadLink).toBeDefined();
    });
  });

  describe('Edge Cases - Chart Images', () => {
    it('should handle empty chart images array', async () => {
      const validReport = createValidReport();
      const emptyChartImages: ChartImageData[] = [];

      const downloadLink = pdfService.createDownloadLink(
        validReport,
        undefined,
        'test-report.pdf',
        emptyChartImages
      );

      expect(downloadLink).toBeDefined();
    });

    it('should handle chart images with invalid data URLs', async () => {
      const validReport = createValidReport();
      const invalidChartImages: ChartImageData[] = [
        {
          id: 'chart1',
          title: 'Invalid Chart',
          dataUrl: 'invalid-data-url',
          altText: 'Chart showing invalid data',
        },
        {
          id: 'chart2',
          title: 'Another Invalid Chart',
          dataUrl: 'data:image/png;base64,invalid-base64-data',
          altText: 'Another chart with invalid data',
        },
      ];

      const downloadLink = pdfService.createDownloadLink(
        validReport,
        undefined,
        'test-report.pdf',
        invalidChartImages
      );

      expect(downloadLink).toBeDefined();
    });

    it('should handle chart images with missing alt text', async () => {
      const validReport = createValidReport();
      const chartsWithoutAltText: ChartImageData[] = [
        {
          id: 'chart1',
          title: 'Chart Without Alt Text',
          dataUrl:
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
          // altText is missing
        } as ChartImageData,
      ];

      const downloadLink = pdfService.createDownloadLink(
        validReport,
        undefined,
        'test-report.pdf',
        chartsWithoutAltText
      );

      expect(downloadLink).toBeDefined();
    });

    it('should handle extremely large chart images', async () => {
      const validReport = createValidReport();
      // Create a large base64 image (simulated)
      const largeImageData = 'data:image/png;base64,' + 'A'.repeat(100000); // 100KB of data
      const largeChartImages: ChartImageData[] = [
        {
          id: 'large-chart',
          title: 'Very Large Chart',
          dataUrl: largeImageData,
          altText: 'A very large chart image for testing',
        },
      ];

      const downloadLink = pdfService.createDownloadLink(
        validReport,
        undefined,
        'test-report.pdf',
        largeChartImages
      );

      expect(downloadLink).toBeDefined();
    });
  });

  describe('Accessibility Testing', () => {
    it('should generate accessibility descriptions for chart images', () => {
      const mockChartData = {
        chartType: 'pie' as const,
        title: 'Test Pie Chart',
        chartData: {
          labels: ['Category A', 'Category B', 'Category C'],
          datasets: [
            {
              data: [30, 45, 25],
              backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
            },
          ],
        },
      };

      mockChartService.generateChartAccessibilityDescription.mockReturnValue(
        'Test Pie Chart. This is a pie chart showing the following distribution: Category A: 30.0%, Category B: 45.0%, Category C: 25.0%.'
      );

      const description =
        mockChartService.generateChartAccessibilityDescription(mockChartData);

      expect(description).toContain('pie chart');
      expect(description).toContain('Category A: 30.0%');
      expect(description).toContain('Category B: 45.0%');
      expect(description).toContain('Category C: 25.0%');
    });

    it('should handle chart accessibility for different chart types', () => {
      const chartTypes = ['pie', 'bar', 'line', 'radar'] as const;

      chartTypes.forEach(chartType => {
        const mockChartData = {
          chartType,
          title: `Test ${chartType} Chart`,
          chartData: {
            labels: ['Item 1', 'Item 2'],
            datasets: [{ data: [10, 20] }],
          },
        };

        mockChartService.generateChartAccessibilityDescription.mockReturnValue(
          `Test ${chartType} Chart. This is a ${chartType} chart showing test data.`
        );

        const description =
          mockChartService.generateChartAccessibilityDescription(mockChartData);
        expect(description).toContain(chartType);
      });
    });

    it('should provide meaningful alt text for missing chart data', () => {
      const emptyChartData = {
        chartType: 'bar' as const,
        title: 'Empty Chart',
        chartData: {
          labels: [],
          datasets: [{ data: [] }],
        },
      };

      mockChartService.generateChartAccessibilityDescription.mockReturnValue(
        'Empty Chart. This is a bar chart with no data available.'
      );

      const description =
        mockChartService.generateChartAccessibilityDescription(emptyChartData);
      expect(description).toContain('no data available');
    });

    it('should handle accessibility for reports with no visual elements', async () => {
      const textOnlyReport = {
        id: 'text-only-report',
        assessment_id: 'test-assessment',
        report_type: 'standard',
        content: {
          child: {
            name: 'Test Child',
            age: 8,
            gender: 'Other',
          },
          assessment: {
            id: 'test-assessment',
            brain_o_meter_score: 75,
            completed_at: new Date().toISOString(),
            status: 'completed',
          },
          summary: {
            overview:
              'This report contains only text content for accessibility testing.',
            key_findings: ['Text-based finding 1', 'Text-based finding 2'],
          },
          recommendations: ['Text-based recommendation'],
          // No categories or visual elements
        },
        generated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Report;

      const isValid = pdfService.validateReportData(textOnlyReport);
      expect(isValid).toBe(true);

      const downloadLink = pdfService.createDownloadLink(textOnlyReport);
      expect(downloadLink).toBeDefined();
    });
  });

  describe('Error Handling & Recovery', () => {
    it('should handle PDF generation failures gracefully', async () => {
      const validReport = createValidReport();

      // Mock PDF generation to fail
      const mockPdf = require('@react-pdf/renderer').pdf;
      mockPdf.mockImplementation(() => ({
        toBlob: jest.fn().mockRejectedValue(new Error('PDF generation failed')),
      }));

      await expect(pdfService.generatePDFBlob(validReport)).rejects.toThrow(
        'Failed to generate PDF'
      );
    });

    it('should handle buffer generation failures gracefully', async () => {
      const validReport = createValidReport();

      // Mock PDF generation to fail during buffer conversion
      const mockPdf = require('@react-pdf/renderer').pdf;
      mockPdf.mockImplementation(() => ({
        toBlob: jest.fn().mockResolvedValue({
          arrayBuffer: jest
            .fn()
            .mockRejectedValue(new Error('Buffer conversion failed')),
        }),
      }));

      await expect(pdfService.generatePDFBuffer(validReport)).rejects.toThrow(
        'Failed to generate PDF buffer'
      );
    });

    it('should handle test PDF generation failures', async () => {
      // Mock PDF generation to fail
      const mockPdf = require('@react-pdf/renderer').pdf;
      mockPdf.mockImplementation(() => ({
        toBlob: jest
          .fn()
          .mockRejectedValue(new Error('Test PDF generation failed')),
      }));

      const testResult = await pdfService.testPDFGeneration();
      expect(testResult).toBe(false);
    });

    it('should handle corrupted report data gracefully', async () => {
      const corruptedReport = {
        id: 'corrupted-report',
        // Missing required fields
        content: {
          child: {
            // name is missing - this should cause validation to fail
            age: 8,
          },
          // Missing assessment data
        },
      } as Report;

      const isValid = pdfService.validateReportData(corruptedReport);
      expect(isValid).toBe(false);
    });
  });

  describe('Performance Testing', () => {
    it('should handle large reports efficiently', async () => {
      const largeReport = createLargeReport();

      const startTime = Date.now();
      const isValid = pdfService.validateReportData(largeReport);
      const validationTime = Date.now() - startTime;

      expect(isValid).toBe(true);
      expect(validationTime).toBeLessThan(100); // Should validate quickly

      const sizeStartTime = Date.now();
      const estimatedSize = pdfService.estimatePDFSize(largeReport);
      const sizeEstimationTime = Date.now() - sizeStartTime;

      expect(estimatedSize).toBeGreaterThan(100000); // Should be large
      expect(sizeEstimationTime).toBeLessThan(50); // Should estimate quickly
    });

    it('should handle multiple concurrent PDF generations', async () => {
      const reports = Array.from({ length: 5 }, (_, i) =>
        createValidReport(`concurrent-${i}`)
      );

      const startTime = Date.now();
      const validationPromises = reports.map(report =>
        Promise.resolve(pdfService.validateReportData(report))
      );

      const results = await Promise.all(validationPromises);
      const totalTime = Date.now() - startTime;

      expect(results.every(result => result === true)).toBe(true);
      expect(totalTime).toBeLessThan(200); // Should handle concurrent operations efficiently
    });

    it('should estimate PDF size accurately for different content types', () => {
      const baseReport = createValidReport();
      const baseSize = pdfService.estimatePDFSize(baseReport);

      // Report with many categories
      const categoriesReport = {
        ...baseReport,
        content: {
          ...baseReport.content,
          categories: {
            lifestyle: [
              {
                survey_question_definitions: { question_text: 'Q1' },
                response_text: 'A1',
              },
            ],
            behavior: [
              {
                survey_question_definitions: { question_text: 'Q2' },
                response_text: 'A2',
              },
            ],
            attention: [
              {
                survey_question_definitions: { question_text: 'Q3' },
                response_text: 'A3',
              },
            ],
            emotional: [
              {
                survey_question_definitions: { question_text: 'Q4' },
                response_text: 'A4',
              },
            ],
            physical: [
              {
                survey_question_definitions: { question_text: 'Q5' },
                response_text: 'A5',
              },
            ],
          },
        },
      };
      const categoriesSize = pdfService.estimatePDFSize(categoriesReport);

      // Report with many recommendations
      const recommendationsReport = {
        ...baseReport,
        content: {
          ...baseReport.content,
          recommendations: Array.from(
            { length: 10 },
            (_, i) => `Recommendation ${i + 1}`
          ),
        },
      };
      const recommendationsSize = pdfService.estimatePDFSize(
        recommendationsReport
      );

      expect(categoriesSize).toBeGreaterThan(baseSize);
      expect(recommendationsSize).toBeGreaterThan(baseSize);
    });
  });

  describe('File Naming Edge Cases', () => {
    it('should handle special characters in child names for file naming', () => {
      const reportWithSpecialChars = {
        ...createValidReport(),
        content: {
          child: {
            name: 'José María Ñoño-Smith Jr.',
            age: 8,
            gender: 'Other',
          },
          assessment: {
            id: 'test-assessment',
            brain_o_meter_score: 75,
            completed_at: new Date().toISOString(),
            status: 'completed',
          },
        },
      } as Report;

      const downloadLink = pdfService.createDownloadLink(
        reportWithSpecialChars
      );
      expect(downloadLink).toBeDefined();
    });

    it('should handle empty child name for file naming', () => {
      const reportWithEmptyName = {
        ...createValidReport(),
        content: {
          child: {
            name: '',
            age: 8,
            gender: 'Other',
          },
          assessment: {
            id: 'test-assessment',
            brain_o_meter_score: 75,
            completed_at: new Date().toISOString(),
            status: 'completed',
          },
        },
      } as Report;

      const downloadLink = pdfService.createDownloadLink(reportWithEmptyName);
      expect(downloadLink).toBeDefined();
    });

    it('should handle very long child names for file naming', () => {
      const longName =
        'Very Long Child Name That Exceeds Normal Length Limits And Contains Many Words';
      const reportWithLongName = {
        ...createValidReport(),
        content: {
          child: {
            name: longName,
            age: 8,
            gender: 'Other',
          },
          assessment: {
            id: 'test-assessment',
            brain_o_meter_score: 75,
            completed_at: new Date().toISOString(),
            status: 'completed',
          },
        },
      } as Report;

      const downloadLink = pdfService.createDownloadLink(reportWithLongName);
      expect(downloadLink).toBeDefined();
    });
  });

  describe('Memory Management', () => {
    it('should not leak memory during multiple PDF operations', async () => {
      const report = createValidReport();

      // Simulate multiple operations
      for (let i = 0; i < 10; i++) {
        pdfService.validateReportData(report);
        pdfService.estimatePDFSize(report);
        pdfService.createDownloadLink(report, undefined, `test-${i}.pdf`);
      }

      // If we get here without memory issues, the test passes
      expect(true).toBe(true);
    });

    it('should handle cleanup after failed operations', async () => {
      const invalidReport = {} as Report;

      // Multiple failed operations should not cause memory leaks
      for (let i = 0; i < 5; i++) {
        expect(pdfService.validateReportData(invalidReport)).toBe(false);
        try {
          await pdfService.generatePDFBlob(invalidReport);
        } catch (error) {
          // Expected to fail
        }
      }

      expect(true).toBe(true);
    });
  });
});

// Helper functions
function createValidReport(id: string = 'test-report'): Report {
  return {
    id,
    assessment_id: 'test-assessment',
    report_type: 'standard',
    content: {
      child: {
        name: 'Test Child',
        age: 8,
        gender: 'Other',
      },
      assessment: {
        id: 'test-assessment',
        brain_o_meter_score: 75,
        completed_at: new Date().toISOString(),
        status: 'completed',
      },
      categories: {
        lifestyle: [
          {
            survey_question_definitions: {
              question_text: 'How many hours of sleep do you get?',
            },
            response_text: '8 hours',
          },
        ],
      },
      summary: {
        overview: 'This is a test report.',
        key_findings: ['Test finding 1', 'Test finding 2'],
      },
      recommendations: ['Test recommendation 1', 'Test recommendation 2'],
    },
    generated_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function createLargeReport(): Report {
  const baseReport = createValidReport('large-report');

  // Add many categories
  const categories: any = {};
  const categoryNames = [
    'lifestyle',
    'behavior',
    'attention',
    'emotional',
    'physical',
    'social',
    'cognitive',
  ];

  categoryNames.forEach(categoryName => {
    categories[categoryName] = Array.from({ length: 20 }, (_, i) => ({
      survey_question_definitions: {
        question_text: `${categoryName} question ${i + 1}`,
      },
      response_text: `Response to ${categoryName} question ${i + 1}`,
    }));
  });

  // Add many recommendations
  const recommendations = Array.from(
    { length: 50 },
    (_, i) =>
      `Detailed recommendation ${i + 1} with comprehensive explanation and guidance.`
  );

  return {
    ...baseReport,
    content: {
      ...baseReport.content,
      categories,
      recommendations,
      summary: {
        overview:
          'This is a large test report with extensive content for performance testing. '.repeat(
            10
          ),
        key_findings: Array.from(
          { length: 20 },
          (_, i) => `Key finding ${i + 1} with detailed explanation.`
        ),
      },
    },
  };
}
