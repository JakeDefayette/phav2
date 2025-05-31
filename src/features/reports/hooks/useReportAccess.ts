'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/shared/hooks';
import type { GeneratedReport } from '../types';
import type { TransformedChartData } from '@/shared/components/molecules/Charts/types';

export interface ReportAccessState {
  report: GeneratedReport | null;
  charts: TransformedChartData[] | null;
  loading: boolean;
  error: string | null;
  isDownloading: boolean;
}

export interface ReportAccessActions {
  downloadReport: () => Promise<void>;
  refetch: () => Promise<void>;
  setDownloading: (downloading: boolean) => void;
}

export interface UseReportAccessReturn
  extends ReportAccessState,
    ReportAccessActions {}

/**
 * Custom hook for secure report access
 * Handles authentication, authorization, and report data fetching
 */
export function useReportAccess(reportId: string): UseReportAccessReturn {
  const { user, loading: authLoading } = useAuth();
  const [report, setReport] = useState<GeneratedReport | null>(null);
  const [charts, setCharts] = useState<TransformedChartData[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Fetch report data
  const fetchReport = useCallback(async () => {
    if (authLoading) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/reports/${reportId}?charts=true`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
      });

      if (!response.ok) {
        let errorMessage = 'Failed to load report';

        switch (response.status) {
          case 401:
            errorMessage = 'You need to be logged in to view this report';
            break;
          case 403:
            errorMessage = 'You are not authorized to view this report';
            break;
          case 404:
            errorMessage = 'Report not found';
            break;
          case 500:
            errorMessage = 'Server error while loading report';
            break;
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to load report');
      }

      // Transform API response to match GeneratedReport interface
      const transformedReport: GeneratedReport = {
        id: data.data.id,
        assessment_id: data.data.assessmentId,
        practice_id: data.data.practiceId,
        report_type: data.data.reportType || 'standard',
        content: data.data.content || {},
        generated_at: data.data.generatedAt,
        created_at: data.data.createdAt,
        updated_at: data.data.updatedAt,
      };

      setReport(transformedReport);

      if (data.data.charts) {
        setCharts(data.data.charts);
      }
    } catch (err) {
      console.error('Error fetching report:', err);
      setError(err instanceof Error ? err.message : 'Failed to load report');
      setReport(null);
      setCharts(null);
    } finally {
      setLoading(false);
    }
  }, [reportId, authLoading]);

  // Download report PDF
  const downloadReport = useCallback(async () => {
    try {
      setIsDownloading(true);
      setError(null);

      const response = await fetch(`/api/reports/${reportId}/download`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        let errorMessage = 'Failed to download report';

        switch (response.status) {
          case 401:
            errorMessage = 'Authentication required to download report';
            break;
          case 403:
            errorMessage = 'You are not authorized to download this report';
            break;
          case 404:
            errorMessage = 'Report not found for download';
            break;
        }

        throw new Error(errorMessage);
      }

      // Get filename from response headers if available
      const contentDisposition = response.headers.get('content-disposition');
      let filename = `pediatric-health-assessment-${reportId}.pdf`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading report:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to download report. Please try again.'
      );
    } finally {
      setIsDownloading(false);
    }
  }, [reportId]);

  // Effect to fetch report data
  useEffect(() => {
    if (reportId) {
      fetchReport();
    }
  }, [reportId, authLoading, fetchReport]);

  return {
    // State
    report,
    charts,
    loading,
    error,
    isDownloading,
    // Actions
    downloadReport,
    refetch: fetchReport,
    setDownloading: setIsDownloading,
  };
}
