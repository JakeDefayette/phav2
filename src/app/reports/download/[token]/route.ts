import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { PDFService } from '@/services/pdf';

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;
    const supabase = supabaseServer;
    const pdfService = new PDFService();

    // Validate share token and get report details
    const { data: report, error } = await supabase
      .from('reports')
      .select(
        `
        id,
        child_name,
        assessment_date,
        user_id,
        share_token,
        share_expires_at,
        is_public
      `
      )
      .eq('share_token', token)
      .eq('is_public', true)
      .single();

    if (error || !report) {
      return NextResponse.json(
        { error: 'Invalid or expired download link' },
        { status: 404 }
      );
    }

    // Check if token has expired
    if (report.share_expires_at) {
      const expirationDate = new Date(report.share_expires_at);
      if (expirationDate < new Date()) {
        return NextResponse.json(
          { error: 'Download link has expired' },
          { status: 410 }
        );
      }
    }

    // Log access attempt
    await logDownloadAccess(supabase, report.id, token, request);

    // Generate PDF
    const pdfBuffer = await pdfService.generateReportPDF(report.id);

    // Create filename
    const filename =
      `pediatric-assessment-${report.child_name}-${report.assessment_date}.pdf`.replace(
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
