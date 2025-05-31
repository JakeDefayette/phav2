import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabaseServer } from '@/shared/services/supabase-server';
import { PDFService } from '@/features/reports/services/pdf';
import { ServiceError } from '@/shared/services/base';
import type { Database } from '@/shared/types/database';
import type { GeneratedReport, GeneratedReportContent } from '@/features/reports/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Use both clients for different purposes
    const supabaseClient = createRouteHandlerClient<Database>({ cookies });
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    const { id: reportId } = await params;
    const url = new URL(request.url);
    const filename =
      url.searchParams.get('filename') ||
      'pediatric-health-assessment-report.pdf';

    console.log('🔄 Starting report download for ID:', reportId);

    // Use server client for database operations to avoid API key issues
    // Get the report using server client
    const { data: report, error: reportError } = await supabaseServer
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (reportError || !report) {
      console.error('❌ Report not found:', reportError);
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    console.log('✅ Report found:', report.id);

    // For authenticated users, verify they own this report via assessment/child ownership
    if (user) {
      console.log('🔐 Checking user authorization...');
      const { data: assessment, error: assessmentError } = await supabaseServer
        .from('assessments')
        .select(`
          id,
          child_id,
          children!inner (
            id,
            parent_id
          )
        `)
        .eq('id', report.assessment_id)
        .single();

      if (assessmentError || !assessment) {
        console.error('❌ Assessment not found for authorization check:', assessmentError);
        return NextResponse.json(
          { error: 'Assessment not found' },
          { status: 404 }
        );
      }

      // Type assertion since we know the structure from our query
      const child = assessment.children as any;
      if (child.parent_id !== user.id) {
        console.error('❌ User not authorized for this report');
        return NextResponse.json(
          { error: 'Unauthorized access to report' },
          { status: 403 }
        );
      }

      console.log('✅ User authorized');
    } else {
      console.log('ℹ️ Anonymous access - skipping authorization check');
    }

    // Generate the full report content using server-side database operations
    console.log('📊 Generating report content using server-side operations...');
    
    // Get assessment data
    const { data: assessmentData, error: assessmentDataError } = await supabaseServer
      .from('assessments')
      .select(`
        *,
        children (
          id,
          first_name,
          last_name,
          date_of_birth,
          gender
        )
      `)
      .eq('id', report.assessment_id)
      .single();

    if (assessmentDataError || !assessmentData) {
      console.error('❌ Assessment data not found:', assessmentDataError);
      return NextResponse.json(
        { error: 'Assessment data not found' },
        { status: 404 }
      );
    }

    // Get survey responses
    const { data: surveyResponses, error: responsesError } = await supabaseServer
      .from('survey_responses')
      .select('*')
      .eq('assessment_id', report.assessment_id)
      .order('question_id');

    if (responsesError) {
      console.error('❌ Error fetching survey responses:', responsesError);
      return NextResponse.json(
        { error: 'Error fetching survey responses' },
        { status: 500 }
      );
    }

    console.log('✅ Assessment data and responses retrieved');

    // Helper function to calculate age
    const calculateAge = (dob: string | null): number => {
      if (!dob) return 0;
      return Math.floor(
        (new Date().getTime() - new Date(dob).getTime()) /
          (1000 * 60 * 60 * 24 * 365.25)
      );
    };

    // Create a report content structure matching GeneratedReportContent
    const reportContent: GeneratedReportContent = {
      child: {
        name:
          assessmentData.children && (assessmentData.children as any).first_name
            ? `${(assessmentData.children as any).first_name} ${(assessmentData.children as any).last_name || ''}`.trim()
            : 'Unknown Child',
        age: calculateAge(assessmentData.children ? (assessmentData.children as any).date_of_birth : null),
        gender: assessmentData.children ? (assessmentData.children as any).gender : undefined,
      },
      assessment: {
        id: assessmentData.id,
        brain_o_meter_score: assessmentData.brain_o_meter_score || undefined,
        completed_at: assessmentData.completed_at || undefined,
        status: assessmentData.status || undefined,
      },
      // metadata, categories, overallStatistics, visualData, insights, charts, recommendations, detailed_analysis, rawResponses, key_insights, categoryScores, dataQuality, summary
      // These fields will be populated based on further processing or can be set to default/empty values if not immediately available.
      // For now, let's add some basic placeholders or leave them undefined if optional
      metadata: {
        reportId: report.id,
        assessmentId: report.assessment_id,
        generatedAt: new Date().toISOString(),
        // Add other relevant metadata here
      },
      categories: {
        // Example: This would be populated by processing surveyResponses
        // "emotional_wellbeing": { score: 75, summary: "Good" },
      },
      overallStatistics: {
        // Example:
        // brainOMeterScore: assessmentData.brain_o_meter_score,
        // categoryScores: { "emotional_wellbeing": 75 }
      },
      visualData: {
        // Example:
        // charts: [ { type: 'bar', title: 'Scores by Category', data: { ... } }]
      },
      insights: [
        // Example: "Shows strength in emotional wellbeing."
      ],
      charts: [], // Placeholder for actual chart data if generated
      recommendations: [
        'Continue regular health monitoring.',
        'Maintain healthy lifestyle habits.',
        'Follow up with healthcare provider as recommended.',
      ],
      detailed_analysis: {
        // Example: Populated with deeper analysis of responses
      },
      rawResponses: surveyResponses?.map(response => ({
        question_id: response.question_id,
        response_value: response.response_value,
        // Add other response details if available in surveyResponses
      })) || [],
      key_insights: [
         // Top insights, could be derived from 'insights'
      ],
      categoryScores: {
         // Scores per category, potentially from 'overallStatistics'
      },
      dataQuality: {
        // Assessment of data quality, e.g., completion rate
      },
      summary: {
        overview: `Report for assessment ID: ${assessmentData.id}.`,
        key_findings: [
          // Key findings, could be derived from 'insights'
        ],
      },
    };

    // Create the full generated report structure
    const generatedReport: GeneratedReport = {
      id: report.id,
      assessment_id: report.assessment_id,
      practice_id: report.practice_id || undefined,
      report_type: 'standard',
      content: reportContent,
      generated_at: new Date().toISOString(),
      created_at: report.created_at || undefined,
      updated_at: report.updated_at || undefined,
    };

    console.log('✅ Report content structure created');

    // Generate PDF
    console.log('📄 Generating PDF...');
    const pdfService = PDFService.getInstance();
    
    // Validate report data before PDF generation
    if (!pdfService.validateReportData(generatedReport)) {
      console.error('❌ Invalid report data for PDF generation');
      return NextResponse.json(
        { error: 'Invalid report data for PDF generation' },
        { status: 400 }
      );
    }

    const pdfBuffer = await pdfService.generatePDFBuffer(generatedReport);
    console.log('✅ PDF generated successfully, size:', pdfBuffer.length, 'bytes');

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
      { error: `Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
