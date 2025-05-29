import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { ReportsService } from '@/features/reports/services/reports';
import { PDFService } from '@/features/reports/services/pdf';
import { AssessmentsService } from '@/features/assessment/services';
import { ServiceError } from '@/shared/services/base';
import type { Database } from '@/shared/types/database';

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
    const filename =
      url.searchParams.get('filename') ||
      'pediatric-health-assessment-report.pdf';

    const reportsService = new ReportsService();
    const pdfService = PDFService.getInstance();
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

    // Generate the full report with content
    const generatedReport = await reportsService.generateReport(
      report.assessment_id,
      'standard',
      report.practice_id || undefined
    );

    if (!generatedReport.content) {
      return NextResponse.json(
        { error: 'Report content not available' },
        { status: 404 }
      );
    }

    // Validate report data before PDF generation
    if (!pdfService.validateReportData(generatedReport)) {
      return NextResponse.json(
        { error: 'Invalid report data for PDF generation' },
        { status: 400 }
      );
    }

    // Generate PDF
    const pdfBuffer = await pdfService.generatePDFBuffer(generatedReport);

    // Create a safe filename
    const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const finalFilename = safeFilename.endsWith('.pdf')
      ? safeFilename
      : `${safeFilename}.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${finalFilename}"`,
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  } catch (error) {
    console.error('PDF download error:', error);

    if (error instanceof ServiceError) {
      const statusCode = error.code === 'NOT_FOUND' ? 404 : 500;
      return NextResponse.json(
        { error: error.message },
        { status: statusCode }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
