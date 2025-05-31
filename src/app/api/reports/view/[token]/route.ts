import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/shared/services/supabase-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const supabase = supabaseServer;

    console.log(
      `🔍 [API] Fetching report data for token: ${token?.substring(0, 8)}...`
    );

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
              date_of_birth,
              gender
            )
          )
        )
      `
      )
      .eq('share_token', token)
      .single();

    console.log('🔍 [API] Share token lookup result:', {
      found: !!shareData,
      error: shareError?.message,
      errorCode: shareError?.code,
    });

    if (shareError || !shareData) {
      console.error('❌ [API] Share token not found:', shareError);
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid or expired report link',
        },
        { status: 404 }
      );
    }

    console.log('✅ [API] Share token found, processing report data...');

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

    // Format the report data for web display
    const formattedReportData = {
      id: reportData.id,
      assessmentId: reportData.assessment_id,
      practiceId: reportData.practice_id,
      content: {
        child: {
          name: `${child.first_name} ${child.last_name || ''}`.trim(),
          age: calculateAge(child.date_of_birth),
          gender: child.gender,
        },
        assessment: {
          id: assessment.id,
          brain_o_meter_score: assessment.brain_o_meter_score,
          completed_at: assessment.completed_at,
          status: 'completed',
        },
        summary: {
          overview:
            `Health assessment completed for ${child.first_name} ${child.last_name || ''}`.trim(),
          key_findings: [
            'Assessment completed successfully',
            `Brain-O-Meter score: ${assessment.brain_o_meter_score}/100`,
          ],
        },
        recommendations: [
          {
            title: 'Regular Health Monitoring',
            description:
              "Continue regular health monitoring to track your child's progress over time.",
            priority: 'medium' as const,
          },
          {
            title: 'Healthy Lifestyle Habits',
            description:
              'Maintain healthy lifestyle habits including proper nutrition, regular exercise, and adequate sleep.',
            priority: 'medium' as const,
          },
          {
            title: 'Healthcare Provider Follow-up',
            description:
              'Follow up with your healthcare provider as recommended for continued care and any concerns.',
            priority: 'low' as const,
          },
        ],
      },
      generatedAt: new Date().toISOString(),
      createdAt: reportData.created_at,
      updatedAt: reportData.updated_at,
    };

    console.log('✅ [API] Report data formatted successfully');

    // Log the access for analytics
    try {
      const userAgent = request.headers.get('user-agent') || '';
      const ipAddress =
        request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        'unknown';

      await supabase.from('report_access_logs').insert({
        report_id: reportData.id,
        access_type: 'view',
        share_token: token,
        ip_address: ipAddress,
        user_agent: userAgent,
        accessed_at: new Date().toISOString(),
      });

      console.log('📊 [API] Access logged for analytics');
    } catch (logError) {
      console.error('⚠️ [API] Failed to log access (non-critical):', logError);
    }

    const responseData = {
      success: true,
      data: formattedReportData,
    };

    return NextResponse.json(responseData, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
      },
    });
  } catch (error) {
    console.error('❌ [API] Report view error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to load report data',
      },
      { status: 500 }
    );
  }
}
