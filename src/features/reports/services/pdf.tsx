import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFDownloadLink,
  pdf,
  Image,
} from '@react-pdf/renderer';
import type { Assessment, Practice, Child } from '@/shared/types';
import type { Report, ReportWithShares } from './reports';
import type { BrandingData } from '@/types/branding';
import { formatDate } from '@/utils/dateUtils';
import { calculateAge } from '@/utils/ageUtils';
import { getPostureRecommendations } from '@/utils/postureUtils';
import { getPostureAnalysis } from '@/utils/postureAnalysis';
import { ChartImageData } from '@/hooks';

// PDF Styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottom: '2 solid #e5e7eb',
    paddingBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 10,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 10,
    borderBottom: '1 solid #d1d5db',
    paddingBottom: 5,
  },
  text: {
    fontSize: 12,
    color: '#374151',
    lineHeight: 1.5,
    marginBottom: 8,
  },
  boldText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 5,
  },
  scoreContainer: {
    backgroundColor: '#f3f4f6',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#059669',
    textAlign: 'center',
  },
  categoryContainer: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f9fafb',
    borderRadius: 5,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  responseItem: {
    marginBottom: 6,
    paddingLeft: 10,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 10,
    color: '#9ca3af',
    borderTop: '1 solid #e5e7eb',
    paddingTop: 10,
  },
  chartSection: {
    marginBottom: 25,
  },
  chartContainer: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#ffffff',
    borderRadius: 5,
    border: '1 solid #e5e7eb',
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 10,
    textAlign: 'center',
  },
  chartImage: {
    width: '100%',
    maxHeight: 300,
    objectFit: 'contain',
  },
  chartsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  chartGridItem: {
    width: '48%',
    marginBottom: 15,
  },
});

// PDF Document Component
interface PDFReportProps {
  report: Report | ReportWithShares;
  practiceInfo?: {
    name: string;
    logo?: string;
    address?: string;
    phone?: string;
    email?: string;
  };
  chartImages?: ChartImageData[];
}

const PDFReport: React.FC<PDFReportProps> = ({
  report,
  practiceInfo,
  chartImages = [],
}) => {
  const content = report.content;
  const child = content.child;
  const assessment = content.assessment;
  const categories = content.categories || {};
  const summary = content.summary || {};

  return (
    <Document>
      <Page size='A4' style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Health Assessment Report</Text>
          <Text style={styles.subtitle}>
            {child?.name} • Generated on{' '}
            {new Date(report.generated_at).toLocaleDateString()}
          </Text>
          {practiceInfo && (
            <Text style={styles.subtitle}>{practiceInfo.name}</Text>
          )}
        </View>

        {/* Child Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Patient Information</Text>
          <Text style={styles.text}>
            <Text style={styles.boldText}>Name:</Text> {child?.name}
          </Text>
          <Text style={styles.text}>
            <Text style={styles.boldText}>Age:</Text> {child?.age} years old
          </Text>
          {child?.gender && (
            <Text style={styles.text}>
              <Text style={styles.boldText}>Gender:</Text> {child.gender}
            </Text>
          )}
        </View>

        {/* Brain-O-Meter Score */}
        {assessment?.brain_o_meter_score && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Overall Score</Text>
            <View style={styles.scoreContainer}>
              <Text style={styles.scoreText}>
                Brain-O-Meter Score: {assessment.brain_o_meter_score}/100
              </Text>
            </View>
          </View>
        )}

        {/* Summary */}
        {summary && Object.keys(summary).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Summary</Text>
            {summary.overview && (
              <Text style={styles.text}>{summary.overview}</Text>
            )}
            {summary.key_findings && Array.isArray(summary.key_findings) && (
              <View>
                <Text style={styles.boldText}>Key Findings:</Text>
                {summary.key_findings.map((finding: string, index: number) => (
                  <Text key={index} style={styles.text}>
                    • {finding}
                  </Text>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Categories */}
        {Object.keys(categories).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Assessment Details</Text>
            {Object.entries(categories).map(([categoryName, responses]) => (
              <View key={categoryName} style={styles.categoryContainer}>
                <Text style={styles.categoryTitle}>
                  {categoryName.charAt(0).toUpperCase() + categoryName.slice(1)}
                </Text>
                {Array.isArray(responses) &&
                  responses.slice(0, 3).map((response: any, index: number) => (
                    <View key={index} style={styles.responseItem}>
                      <Text style={styles.text}>
                        {response.survey_question_definitions?.question_text}:{' '}
                        {response.response_text || response.response_value}
                      </Text>
                    </View>
                  ))}
              </View>
            ))}
          </View>
        )}

        {/* Charts Section */}
        {chartImages && chartImages.length > 0 && (
          <View style={styles.chartSection}>
            <Text style={styles.sectionTitle}>Visual Analysis</Text>
            <View style={styles.chartsGrid}>
              {chartImages.map((chart, index) => (
                <View
                  key={index}
                  style={chartImages.length === 1 ? {} : styles.chartGridItem}
                >
                  <View style={styles.chartContainer}>
                    <Text style={styles.chartTitle}>{chart.title}</Text>
                    {/* eslint-disable-next-line jsx-a11y/alt-text */}
                    <Image style={styles.chartImage} src={chart.imageData} />
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Recommendations */}
        {content.recommendations && Array.isArray(content.recommendations) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recommendations</Text>
            {content.recommendations.map(
              (recommendation: string, index: number) => (
                <Text key={index} style={styles.text}>
                  • {recommendation}
                </Text>
              )
            )}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            This report was generated on {new Date().toLocaleDateString()} •
            Report ID: {report.id}
          </Text>
          {practiceInfo?.email && <Text>Contact: {practiceInfo.email}</Text>}
        </View>
      </Page>
    </Document>
  );
};

/**
 * PDF Generation Service
 * Handles PDF creation, styling, and delivery for health assessment reports
 */
export class PDFService {
  private static instance: PDFService;

  public static getInstance(): PDFService {
    if (!PDFService.instance) {
      PDFService.instance = new PDFService();
    }
    return PDFService.instance;
  }

  /**
   * Generate PDF blob from report data
   */
  async generatePDFBlob(
    report: Report | ReportWithShares,
    practiceInfo?: {
      name: string;
      logo?: string;
      address?: string;
      phone?: string;
      email?: string;
    },
    chartImages?: ChartImageData[]
  ): Promise<Blob> {
    try {
      const doc = (
        <PDFReport
          report={report}
          practiceInfo={practiceInfo}
          chartImages={chartImages}
        />
      );
      const blob = await pdf(doc).toBlob();
      return blob;
    } catch (error) {
      throw new Error('Failed to generate PDF');
    }
  }

  /**
   * Generate PDF buffer for server-side operations
   */
  async generatePDFBuffer(
    report: Report | ReportWithShares,
    practiceInfo?: {
      name: string;
      logo?: string;
      address?: string;
      phone?: string;
      email?: string;
    },
    chartImages?: ChartImageData[]
  ): Promise<Buffer> {
    try {
      const doc = (
        <PDFReport
          report={report}
          practiceInfo={practiceInfo}
          chartImages={chartImages}
        />
      );
      const blob = await pdf(doc).toBlob();
      const arrayBuffer = await blob.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      throw new Error('Failed to generate PDF buffer');
    }
  }

  /**
   * Create a download link component for client-side PDF generation
   */
  createDownloadLink(
    report: Report | ReportWithShares,
    practiceInfo?: {
      name: string;
      logo?: string;
      address?: string;
      phone?: string;
      email?: string;
    },
    fileName?: string,
    chartImages?: ChartImageData[]
  ): React.ReactElement {
    const defaultFileName = `health-report-${report.content.child?.name?.replace(/\s+/g, '-') || 'report'}-${new Date().toISOString().split('T')[0]}.pdf`;

    return (
      <PDFDownloadLink
        document={
          <PDFReport
            report={report}
            practiceInfo={practiceInfo}
            chartImages={chartImages}
          />
        }
        fileName={fileName || defaultFileName}
      >
        {({ blob, url, loading, error }) =>
          loading ? 'Generating PDF...' : 'Download PDF Report'
        }
      </PDFDownloadLink>
    );
  }

  /**
   * Validate that a report has the required data for PDF generation
   */
  validateReportData(report: Report | ReportWithShares): boolean {
    if (!report || !report.content) {
      return false;
    }

    const content = report.content;

    // Check for minimum required data
    if (!content.child || !content.child.name) {
      return false;
    }

    return true;
  }

  /**
   * Get estimated PDF file size (in bytes)
   * This is a rough estimation based on content
   */
  estimatePDFSize(report: Report | ReportWithShares): number {
    const content = report.content;
    let estimatedSize = 50000; // Base size ~50KB

    // Add size for categories
    if (content.categories) {
      const categoryCount = Object.keys(content.categories).length;
      estimatedSize += categoryCount * 5000; // ~5KB per category
    }

    // Add size for recommendations
    if (content.recommendations && Array.isArray(content.recommendations)) {
      estimatedSize += content.recommendations.length * 1000; // ~1KB per recommendation
    }

    return estimatedSize;
  }

  /**
   * Test PDF generation with sample data
   */
  async testPDFGeneration(): Promise<boolean> {
    try {
      const sampleReport: Report = {
        id: 'test-report-id',
        assessment_id: 'test-assessment-id',
        practice_id: 'test-practice-id',
        report_type: 'standard',
        content: {
          child: {
            name: 'Test Child',
            age: 8,
            gender: 'Other',
          },
          assessment: {
            id: 'test-assessment-id',
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
            overview: 'This is a test report to validate PDF generation.',
            key_findings: ['Test finding 1', 'Test finding 2'],
          },
          recommendations: ['Test recommendation 1', 'Test recommendation 2'],
        },
        generated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const blob = await this.generatePDFBlob(sampleReport);
      return blob.size > 0;
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export const pdfService = PDFService.getInstance();

// Export types
export type { PDFReportProps };
export { PDFReport };

export interface PDFGenerationOptions {
  format?: 'A4' | 'Letter';
  orientation?: 'portrait' | 'landscape';
  margin?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  includeCharts?: boolean;
  includeRecommendations?: boolean;
  watermark?: string;
  quality?: 'low' | 'medium' | 'high';
}

export interface PDFMetadata {
  title: string;
  author: string;
  subject: string;
  creator: string;
  producer: string;
  creationDate: Date;
  modificationDate: Date;
  keywords?: string[];
}
