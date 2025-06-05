'use client';

/**
 * Reports Query Hooks
 *
 * React Query hooks for managing report data fetching and caching
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QueryKeys } from '@/shared/config/queryClient';
import { ReportsService, PDFService, DeliveryService } from '../services';
import { withErrorHandling } from '@/shared/utils/errorHandler';
import type {
  DeliveryOptions,
  Report,
  ReportUpdate,
  GeneratedReport,
} from '../types';
import type { ReportsAPI } from '@/shared/types/api';
import { supabase } from '@/shared/services/supabase';

/**
 * Hook to fetch all reports with optional filtering
 */
export function useReports(filters: Record<string, any> = {}) {
  return useQuery({
    queryKey: QueryKeys.reports.list(filters),
    queryFn: () =>
      withErrorHandling('fetchReports', async () => {
        const service = new ReportsService();
        return await service.findAll(filters);
      }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch reports for a specific user
 */
export function useUserReports(userId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: QueryKeys.reports.list({ userId }),
    queryFn: () =>
      withErrorHandling('fetchUserReports', async () => {
        const service = new ReportsService();
        return await service.findByUserId(userId);
      }),
    enabled: enabled && !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch reports for a specific child
 */
export function useChildReports(childId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: QueryKeys.reports.list({ childId }),
    queryFn: () =>
      withErrorHandling('fetchChildReports', async () => {
        const service = new ReportsService();
        return await service.findByChildId(childId);
      }),
    enabled: enabled && !!childId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch a single report by ID
 */
export function useReport(id: string, enabled: boolean = true) {
  return useQuery({
    queryKey: QueryKeys.reports.detail(id),
    queryFn: () =>
      withErrorHandling('fetchReport', async () => {
        const service = new ReportsService();
        const report = await service.findById(id);
        if (!report) {
          throw new Error(`Report with ID ${id} not found`);
        }
        return report;
      }),
    enabled: enabled && !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes for individual reports
  });
}

/**
 * Hook to generate PDF for a report
 */
export function useReportPDF(reportId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: QueryKeys.reports.pdf(reportId),
    queryFn: () =>
      withErrorHandling('generateReportPDF', async () => {
        const pdfService = PDFService.getInstance();
        const reportsService = new ReportsService();

        // Get the report data
        const report = await reportsService.findById(reportId);
        if (!report) {
          throw new Error(`Report with ID ${reportId} not found`);
        }

        // Convert database Report to GeneratedReport format
        const generatedReport = await convertToGeneratedReport(report);

        // Generate PDF buffer
        return await pdfService.generatePDFBuffer(generatedReport);
      }),
    enabled: enabled && !!reportId,
    staleTime: 30 * 60 * 1000, // 30 minutes for PDFs (expensive to generate)
    gcTime: 60 * 60 * 1000, // Keep in cache for 1 hour
  });
}

/**
 * Helper function to convert database Report to GeneratedReport format
 */
async function convertToGeneratedReport(
  report: Report
): Promise<GeneratedReport> {
  try {
    // Get assessment and child data for the report
    const { data: assessmentData, error: assessmentError } = await supabase
      .from('assessments')
      .select(
        `
        id,
        child_id,
        brain_o_meter_score,
        started_at,
        completed_at,
        status,
        children (
          id,
          first_name,
          last_name,
          date_of_birth,
          gender
        )
      `
      )
      .eq('id', report.assessment_id)
      .single();

    if (assessmentError || !assessmentData) {
      throw new Error(`Assessment not found for report ${report.id}`);
    }

    const child = assessmentData.children as any;

    // Calculate child's age
    const calculateAge = (dateOfBirth: string): number => {
      const today = new Date();
      const birthDate = new Date(dateOfBirth);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        age--;
      }
      return age;
    };

    // Create a properly structured GeneratedReport
    const generatedReport: GeneratedReport = {
      id: report.id,
      assessment_id: report.assessment_id,
      practice_id: report.practice_id || undefined,
      report_type: 'standard', // Default type since this field doesn't exist in the DB
      content: {
        child: {
          name: `${child.first_name} ${child.last_name || ''}`.trim(),
          age: calculateAge(child.date_of_birth),
          gender: child.gender,
        },
        assessment: {
          id: assessmentData.id as string,
          brain_o_meter_score: assessmentData.brain_o_meter_score as number,
          completed_at: assessmentData.completed_at as string,
          status: assessmentData.status as string,
        },
        // Content is generated dynamically, not stored in database
      },
      generated_at: new Date().toISOString(), // Use current time since this field doesn't exist in DB
      created_at: report.created_at || undefined,
      updated_at: report.updated_at || undefined,
    };

    return generatedReport;
  } catch (error) {
    console.error('Error converting report to GeneratedReport:', error);
    throw new Error(`Failed to convert report ${report.id} for PDF generation`);
  }
}

/**
 * Hook to create a new report
 */
export function useCreateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      assessment_id: string;
      report_type?: 'standard' | 'detailed' | 'summary';
      practice_id?: string;
    }) =>
      withErrorHandling('createReport', async () => {
        const service = new ReportsService();
        return await service.generateReport(
          data.assessment_id,
          data.report_type || 'standard',
          data.practice_id
        );
      }),
    onSuccess: newReport => {
      // Invalidate and refetch reports list
      queryClient.invalidateQueries({ queryKey: QueryKeys.reports.lists() });

      // Add the new report to the cache
      queryClient.setQueryData(
        QueryKeys.reports.detail(newReport.id),
        newReport
      );
    },
    onError: error => {
      console.error('Failed to create report:', error);
    },
  });
}

/**
 * Hook to update an existing report
 */
export function useUpdateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ReportUpdate }) =>
      withErrorHandling('updateReport', async () => {
        const { data: updatedReport, error } = await supabase
          .from('reports')
          .update(data)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          throw new Error(`Failed to update report: ${error.message}`);
        }

        return updatedReport as Report;
      }),
    onSuccess: updatedReport => {
      // Update the specific report in cache
      queryClient.setQueryData(
        QueryKeys.reports.detail(updatedReport.id),
        updatedReport
      );

      // Invalidate related lists
      queryClient.invalidateQueries({ queryKey: QueryKeys.reports.lists() });

      // Invalidate PDF cache as report data changed
      queryClient.invalidateQueries({
        queryKey: QueryKeys.reports.pdf(updatedReport.id),
      });
    },
    onError: error => {
      console.error('Failed to update report:', error);
    },
  });
}

/**
 * Hook to delete a report
 */
export function useDeleteReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      withErrorHandling('deleteReport', async () => {
        const service = new ReportsService();
        await service.delete(id);
        return id;
      }),
    onSuccess: deletedId => {
      // Remove from cache
      queryClient.removeQueries({
        queryKey: QueryKeys.reports.detail(deletedId),
      });
      queryClient.removeQueries({ queryKey: QueryKeys.reports.pdf(deletedId) });

      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: QueryKeys.reports.lists() });
    },
    onError: error => {
      console.error('Failed to delete report:', error);
    },
  });
}

/**
 * Hook to deliver a report via various methods
 */
export function useDeliverReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: ReportsAPI.DeliveryRequest) =>
      withErrorHandling('deliverReport', async () => {
        // Convert snake_case API request to camelCase service options
        const options: DeliveryOptions = {
          reportId: request.report_id,
          userId: request.user_id,
          deliveryMethods: request.delivery_methods,
          recipientEmail: request.recipient_email,
          recipientPhone: request.recipient_phone,
          expirationHours: request.expiration_hours,
          notifyUser: request.notify_user,
        };

        const service = new DeliveryService();
        return await service.deliverReport(options);
      }),
    onSuccess: (result, variables) => {
      // Update the report to reflect delivery status
      queryClient.invalidateQueries({
        queryKey: QueryKeys.reports.detail(variables.report_id),
      });
    },
    onError: error => {
      console.error('Failed to deliver report:', error);
    },
  });
}

/**
 * Hook to generate report from assessment
 */
export function useGenerateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      assessmentId,
      options,
    }: {
      assessmentId: string;
      options?: {
        reportType?: 'standard' | 'detailed' | 'summary';
        practiceId?: string;
      };
    }) =>
      withErrorHandling('generateReport', async () => {
        const service = new ReportsService();
        return await service.generateReport(
          assessmentId,
          options?.reportType || 'standard',
          options?.practiceId
        );
      }),
    onSuccess: newReport => {
      // Add to cache
      queryClient.setQueryData(
        QueryKeys.reports.detail(newReport.id),
        newReport
      );

      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: QueryKeys.reports.lists() });
    },
    onError: error => {
      console.error('Failed to generate report:', error);
    },
  });
}

/**
 * Hook to get report analytics/statistics
 */
export function useReportStats(
  practiceId: string,
  filters: { dateFrom?: string; dateTo?: string } = {}
) {
  return useQuery({
    queryKey: [...QueryKeys.reports.all, 'stats', practiceId, filters],
    queryFn: () =>
      withErrorHandling('fetchReportStats', async () => {
        const service = new ReportsService();
        return await service.getViralMetrics(
          practiceId,
          filters.dateFrom,
          filters.dateTo
        );
      }),
    staleTime: 15 * 60 * 1000, // 15 minutes for stats
  });
}
