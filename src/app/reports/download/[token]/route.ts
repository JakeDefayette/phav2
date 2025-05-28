import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { PDFService } from '@/services/pdf';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const supabase = supabaseServer;
    const pdfService = PDFService.getInstance();

    // Validate share token and get report details with proper joins
    const { data: shareData, error: shareError } = await supabase
      .from('report_shares')
      .select(
        `
        id,
        report_id,
        share_token,
        expires_at,
        reports!inner (
          id,
          assessment_id,
          practice_id,
          report_type,
          content,
          generated_at,
          created_at,
          updated_at,
          assessments!inner (
            id,
            child_id,
            started_at,
            completed_at,
            children!inner (
              id,
              first_name,
              last_name,
              date_of_birth
            )
          )
        )
      `
      )
      .eq('share_token', token)
      .single();

    if (shareError || !shareData) {
      return NextResponse.json(
        { error: 'Invalid or expired download link' },
        { status: 404 }
      );
    }

    // Check if token has expired
    if (shareData.expires_at) {
      const expirationDate = new Date(shareData.expires_at);
      if (expirationDate < new Date()) {
        return NextResponse.json(
          { error: 'Download link has expired' },
          { status: 410 }
        );
      }
    }

    // Extract report data and format it properly - handle nested structure
    const reportData = shareData.reports as any;
    const assessment = reportData.assessments as any;
    const child = assessment.children as any;

    // Create a properly typed report object
    const formattedReportData = {
      id: reportData.id,
      assessment_id: reportData.assessment_id,
      practice_id: reportData.practice_id,
      report_type: reportData.report_type,
      content: reportData.content,
      generated_at: reportData.generated_at,
      created_at: reportData.created_at,
      updated_at: reportData.updated_at,
      // Additional data for PDF generation
      child_name: `${child.first_name} ${child.last_name || ''}`.trim(),
      assessment_date: assessment.started_at,
    };

    // Log access attempt
    await logDownloadAccess(supabase, reportData.id, token, request);

    // Generate PDF using the correct method
    const pdfBuffer = await pdfService.generatePDFBuffer(formattedReportData);

    // Create filename
    const filename =
      `pediatric-assessment-${formattedReportData.child_name}-${new Date(formattedReportData.assessment_date).toISOString().split('T')[0]}.pdf`.replace(
        /[^a-zA-Z0-9.-]/g,
        '_'
      );

    // Return PDF with appropriate headers
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: 'Failed to download report' },
      { status: 500 }
    );
  }
}

/**
 * Log download access for security and analytics
 */
async function logDownloadAccess(
  supabase: any,
  reportId: string,
  token: string,
  request: NextRequest
): Promise<void> {
  try {
    const userAgent = request.headers.get('user-agent') || '';
    const ipAddress =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';

    await supabase.from('report_access_logs').insert({
      report_id: reportId,
      access_type: 'download',
      share_token: token,
      ip_address: ipAddress,
      user_agent: userAgent,
      accessed_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to log download access:', error);
  }
}
