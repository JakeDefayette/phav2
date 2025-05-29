import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { ReportsService } from '@/features/reports/services/reports';
import { AssessmentsService } from '@/features/assessment/services';
import { ServiceError } from '@/shared/services/base';
import type { Database } from '@/shared/types/database';
import type { TransformedChartData } from '@/shared/components/molecules/Charts/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    const { id: reportId } = await params;
    const url = new URL(request.url);
    const includeCharts = url.searchParams.get('charts') === 'true';

    const reportsService = new ReportsService();
    const assessmentsService = new AssessmentsService();

    // Get the report
    const report = await reportsService.findById(reportId);
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // For authenticated users, verify they own this report via assessment/child ownership
    if (user) {
      const assessment = await assessmentsService.findByIdWithResponses(
        report.assessment_id
      );
      if (assessment?.children && assessment.children.parent_id !== user.id) {
        return NextResponse.json(
          { error: 'Unauthorized access to report' },
          { status: 403 }
        );
      }
    }

    // Try to get the generated report with full content
    let generatedReport;
    try {
      generatedReport = await reportsService.generateReport(
        report.assessment_id,
        'standard',
        report.practice_id || undefined
      );
    } catch (error) {
      console.error('Error regenerating report:', error);
      // Fall back to basic report data if generation fails
      generatedReport = {
        id: report.id,
        assessment_id: report.assessment_id,
        practice_id: report.practice_id,
        report_type: 'standard',
        content: null,
        generated_at: report.created_at,
        created_at: report.created_at,
        updated_at: report.updated_at,
      };
    }

    // Include charts if requested
    let charts: TransformedChartData[] | null = null;
    if (includeCharts && generatedReport.content) {
      try {
        charts = await reportsService.getChartsForAssessment(
          report.assessment_id
        );
      } catch (error) {
        console.warn('Failed to load charts:', error);
        charts = [];
      }
    }

    const responseData = {
      success: true,
      data: {
        id: generatedReport.id,
        assessmentId: generatedReport.assessment_id,
        practiceId: generatedReport.practice_id,
        reportType: generatedReport.report_type,
        content: generatedReport.content,
        generatedAt: generatedReport.generated_at,
        createdAt: generatedReport.created_at,
        updatedAt: generatedReport.updated_at,
        ...(charts && { charts }),
      },
    };

    return NextResponse.json(responseData, { status: 200 });
  } catch (error) {
    console.error('Report retrieval error:', error);

    if (error instanceof ServiceError) {
      const statusCode = error.code === 'NOT_FOUND' ? 404 : 500;
      return NextResponse.json(
        { error: error.message },
        { status: statusCode }
      );
    }

    return NextResponse.json(
      { error: 'Failed to retrieve report' },
      { status: 500 }
    );
  }
}
