/**
 * Lazy-loaded PDF Service
 * Dynamically imports PDF dependencies only when needed
 */

import type { GeneratedReport } from '../types';
import type { ChartImageData } from '@/shared/hooks';

export interface LazyPDFService {
  generatePDFBlob(
    report: GeneratedReport,
    practiceInfo?: {
      name: string;
      logo?: string;
      address?: string;
      phone?: string;
      email?: string;
    },
    chartImages?: ChartImageData[]
  ): Promise<Blob>;

  generatePDFBuffer(
    report: GeneratedReport,
    practiceInfo?: {
      name: string;
      logo?: string;
      address?: string;
      phone?: string;
      email?: string;
    },
    chartImages?: ChartImageData[]
  ): Promise<Buffer>;

  createDownloadLink(
    report: GeneratedReport,
    practiceInfo?: {
      name: string;
      logo?: string;
      address?: string;
      phone?: string;
      email?: string;
    },
    fileName?: string,
    chartImages?: ChartImageData[]
  ): React.ReactElement;

  validateReportData(report: GeneratedReport): boolean;
  estimatePDFSize(report: GeneratedReport): number;
  testPDFGeneration(): Promise<boolean>;
}

/**
 * Lazy PDF Service Implementation
 * Only loads PDF generation code when actually needed
 */
class LazyPDFServiceImpl implements LazyPDFService {
  private pdfServicePromise: Promise<typeof import('./pdf')> | null = null;

  private async getPDFService() {
    if (!this.pdfServicePromise) {
      this.pdfServicePromise = import('./pdf');
    }
    const pdfModule = await this.pdfServicePromise;
    return pdfModule.PDFService.getInstance();
  }

  async generatePDFBlob(
    report: GeneratedReport,
    practiceInfo?: {
      name: string;
      logo?: string;
      address?: string;
      phone?: string;
      email?: string;
    },
    chartImages?: ChartImageData[]
  ): Promise<Blob> {
    const service = await this.getPDFService();
    return service.generatePDFBlob(report, practiceInfo, chartImages);
  }

  async generatePDFBuffer(
    report: GeneratedReport,
    practiceInfo?: {
      name: string;
      logo?: string;
      address?: string;
      phone?: string;
      email?: string;
    },
    chartImages?: ChartImageData[]
  ): Promise<Buffer> {
    const service = await this.getPDFService();
    return service.generatePDFBuffer(report, practiceInfo, chartImages);
  }

  createDownloadLink(
    report: GeneratedReport,
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
    // For download link, we return a lazy-loaded component
    const LazyDownloadLink = React.lazy(async () => {
      const pdfModule = await import('./pdf');
      const service = pdfModule.PDFService.getInstance();
      const downloadLink = service.createDownloadLink(
        report,
        practiceInfo,
        fileName,
        chartImages
      );

      // Return a component that renders the download link
      return {
        default: () => downloadLink,
      };
    });

    return React.createElement(
      React.Suspense,
      {
        fallback: React.createElement('span', null, 'Loading PDF generator...'),
      },
      React.createElement(LazyDownloadLink)
    );
  }

  async validateReportData(report: GeneratedReport): Promise<boolean> {
    const service = await this.getPDFService();
    return service.validateReportData(report);
  }

  async estimatePDFSize(report: GeneratedReport): Promise<number> {
    const service = await this.getPDFService();
    return service.estimatePDFSize(report);
  }

  async testPDFGeneration(): Promise<boolean> {
    const service = await this.getPDFService();
    return service.testPDFGeneration();
  }
}

// Export singleton instance
export const lazyPDFService = new LazyPDFServiceImpl();

/**
 * Hook for using PDF service with loading state
 */
export function usePDFService() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const generatePDF = React.useCallback(
    async (
      report: GeneratedReport,
      practiceInfo?: {
        name: string;
        logo?: string;
        address?: string;
        phone?: string;
        email?: string;
      },
      chartImages?: ChartImageData[]
    ) => {
      setIsLoading(true);
      setError(null);

      try {
        const blob = await lazyPDFService.generatePDFBlob(
          report,
          practiceInfo,
          chartImages
        );
        return blob;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to generate PDF';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    generatePDF,
    isLoading,
    error,
    service: lazyPDFService,
  };
}

// Fix the missing React import
import React from 'react';
