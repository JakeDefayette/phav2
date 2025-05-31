import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/shared/services/supabase-server';
import { PDFService } from '@/features/reports/services/pdf';
import { GeneratedReport } from '@/features/reports/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const supabase = supabaseServer;
    const pdfService = PDFService.getInstance();

    console.log(`🔍 Looking up share token: ${token.substring(0, 8)}...`);
    
    // Validate share token and get report details with proper joins
    const { data: shareData, error: shareError } = await supabase
      .from('report_shares')
      .select(
        `
        id,
        report_id,
        share_token,
        reports!inner (
          id,
          assessment_id,
          practice_id,
          created_at,
          updated_at,
          assessments!inner (
            id,
            child_id,
            brain_o_meter_score,
            completed_at,
            created_at,
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

    console.log('🔍 Share token lookup result:', {
      found: !!shareData,
      error: shareError?.message,
      errorCode: shareError?.code,
      tokenLength: token.length
    });

    if (shareError || !shareData) {
      return NextResponse.json(
        { error: 'Invalid or expired download link' },
        { status: 404 }
      );
    }

    // Note: No expiration check since report_shares table doesn't have expires_at field
    // Token access is controlled by the existence of the record
    console.log('✅ Share token found, proceeding to generate PDF...');

    // Extract report data and format it properly - handle nested structure
    const reportData = shareData.reports as any;
    const assessment = reportData.assessments as any;
    const child = assessment.children as any;

    // Calculate child's age from date of birth
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

    // Create a properly typed GeneratedReport object
    const generatedReport: GeneratedReport = {
      id: reportData.id,
      assessment_id: reportData.assessment_id,
      practice_id: reportData.practice_id,
      report_type: 'standard', // Default type, could be stored in content if needed
      content: {
        child: {
          name: `${child.first_name} ${child.last_name || ''}`.trim(),
          age: calculateAge(child.date_of_birth),
        },
        assessment: {
          id: assessment.id,
          brain_o_meter_score: assessment.brain_o_meter_score,
          completed_at: assessment.completed_at,
        },
        // Add any additional content fields that might be needed for PDF generation
        summary: {
          key_findings: [],
          overview: `Health assessment completed for ${
            child.first_name
          } ${child.last_name || ''}`.trim(),
        },
        recommendations: [],
        categories: {},
      },
      generated_at: new Date().toISOString(), // Use current time since this field doesn't exist in DB
      created_at: reportData.created_at,
      updated_at: reportData.updated_at,
    };

    // Log access attempt
    await logDownloadAccess(supabase, reportData.id, token, request);

    // Generate PDF using the correct method
    const pdfBuffer = await pdfService.generatePDFBuffer(generatedReport);

    // Create filename - use assessment.created_at since started_at doesn't exist
    const filename =
      `pediatric-assessment-${generatedReport.content.child.name}-${new Date(assessment.created_at).toISOString().split('T')[0]}.pdf`.replace(
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
