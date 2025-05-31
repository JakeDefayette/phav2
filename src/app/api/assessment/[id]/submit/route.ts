import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabaseServer } from '@/shared/services/supabase-server';
import { ServiceError } from '@/shared/services/base';
import type { Database } from '@/shared/types/database';
import type { GeneratedReportContent } from '@/features/reports/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    const { id: assessmentId } = await params;
    const body = await request.json();
    const { responses, brainOMeterScore, practiceId } = body;

    // Validate required data
    if (!responses || !Array.isArray(responses)) {
      return NextResponse.json(
        { error: 'Survey responses are required' },
        { status: 400 }
      );
    }

    if (typeof brainOMeterScore !== 'number') {
      return NextResponse.json(
        { error: 'Brain-O-Meter score is required' },
        { status: 400 }
      );
    }

    console.log('🔄 Starting assessment submission for:', assessmentId);

    // Step 1: Verify assessment exists and is in correct state using server client
    console.log('📋 Validating assessment...');
    const { data: assessment, error: assessmentFindError } = await supabaseServer
      .from('assessments')
      .select('id, status, brain_o_meter_score, completed_at, child_id')
      .eq('id', assessmentId)
      .single();

    if (assessmentFindError || !assessment) {
      console.error('❌ Assessment not found:', assessmentFindError);
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }

    if (assessment.status === 'completed') {
      console.error('❌ Assessment already completed');
      return NextResponse.json(
        { error: 'Assessment already completed' },
        { status: 409 }
      );
    }

    // Note: For now, we'll skip user authorization since assessments can be anonymous
    // In the future, we could check if the user owns the child associated with this assessment

    // Step 2: Insert survey responses using server client
    console.log('💾 Saving survey responses...');
    const responseData = responses.map(response => ({
      assessment_id: assessmentId,
      question_id: response.question_id,
      response_value: response.response_value,
    }));

    const { data: insertedResponses, error: responsesError } = await supabaseServer
      .from('survey_responses')
      .insert(responseData)
      .select();

    if (responsesError) {
      console.error('❌ Failed to insert survey responses:', responsesError);
      return NextResponse.json(
        { error: `Failed to save survey responses: ${responsesError.message}` },
        { status: 500 }
      );
    }

    console.log(`✅ Inserted ${insertedResponses?.length || 0} survey responses`);

    // Step 3: Complete assessment with brain-o-meter score using server client
    console.log('🏁 Completing assessment...');
    const completedAt = new Date().toISOString();
    const { data: updatedAssessment, error: assessmentError } = await supabaseServer
      .from('assessments')
      .update({
        status: 'completed',
        brain_o_meter_score: brainOMeterScore,
        completed_at: completedAt,
      })
      .eq('id', assessmentId)
      .select()
      .single();

    if (assessmentError) {
      console.error('❌ Failed to complete assessment:', assessmentError);
      
      // Rollback: Delete inserted responses
      console.log('🔄 Rolling back survey responses...');
      if (insertedResponses && insertedResponses.length > 0) {
        const insertedResponseIds = insertedResponses.map(r => r.id);
        await supabaseServer
          .from('survey_responses')
          .delete()
          .in('id', insertedResponseIds);
      }

      return NextResponse.json(
        { error: `Failed to complete assessment: ${assessmentError.message}` },
        { status: 500 }
      );
    }

    console.log(`✅ Assessment completed with score: ${brainOMeterScore}`);

    // Step 4: Generate report using server client
    console.log('📊 Generating report...');

    // Helper function to calculate age (if not already available in this scope)
    const calculateAge = (dob: string | null): number => {
      if (!dob) return 0;
      return Math.floor(
        (new Date().getTime() - new Date(dob).getTime()) /
          (1000 * 60 * 60 * 24 * 365.25)
      );
    };

    // Fetch child data associated with the assessment for report content
    const { data: childDataForReport, error: childDataError } = await supabaseServer
      .from('children')
      .select('first_name, last_name, date_of_birth, gender')
      .eq('id', assessment.child_id) // assessment.child_id from validation step
      .single();

    if (childDataError) {
      console.error('❌ Failed to fetch child data for report content:', childDataError);
      // Handle error appropriately, maybe return 500 or attempt rollback
      // For now, we'll log and continue with potentially missing child info in content
    }

    // Construct initial report content
    const initialReportContent: GeneratedReportContent = {
      child: {
        name:
          childDataForReport?.first_name
            ? `${childDataForReport.first_name} ${childDataForReport.last_name || ''}`.trim()
            : 'Unknown Child',
        age: calculateAge(childDataForReport?.date_of_birth || null),
        gender: childDataForReport?.gender || undefined,
      },
      assessment: {
        id: assessmentId,
        brain_o_meter_score: brainOMeterScore,
        completed_at: completedAt,
        status: 'completed',
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        assessmentId: assessmentId,
        // reportId will be set once the report is created
      },
      // Initialize other fields as empty or with default values
      categories: {},
      overallStatistics: { brainOMeterScore },
      visualData: {},
      insights: [],
      charts: [],
      recommendations: [
        {
          title: 'Regular Health Monitoring',
          description: 'Continue regular health monitoring to track your child\'s progress.',
          priority: 'medium' as const,
        },
        {
          title: 'Healthy Lifestyle Habits',
          description: 'Maintain healthy lifestyle habits including proper nutrition and exercise.',
          priority: 'medium' as const,
        },
        {
          title: 'Healthcare Provider Follow-up',
          description: 'Follow up with healthcare provider as recommended for continued care.',
          priority: 'low' as const,
        },
      ],
      detailed_analysis: {},
      rawResponses: responses.map((r: any) => ({ // Assuming responses is an array of { question_id, response_value }
        question_id: r.question_id,
        response_value: r.response_value,
      })),
      key_insights: [],
      categoryScores: {},
      dataQuality: {},
      summary: {
        overview: `Initial report for assessment ${assessmentId}. Further processing pending.`,
        key_findings: [],
      },
    };

    // Create a basic report record using only fields that exist in the reports table
    console.log('🔍 Attempting to create report with data:', {
      assessment_id: assessmentId,
      practice_id: practiceId || null,
      contentType: typeof initialReportContent,
      contentKeys: Object.keys(initialReportContent),
    });
    
    // Try to create report - first attempt with content column
    let reportInsertData: any = {
      assessment_id: assessmentId,
      practice_id: practiceId || null,
    };
    
    // Try with content first
    let { data: report, error: reportError } = await supabaseServer
      .from('reports')
      .insert({
        ...reportInsertData,
        content: initialReportContent,
      })
      .select()
      .single();
    
    // If content column doesn't exist, try without it
    if (reportError && reportError.message?.includes('content')) {
      console.log('🔄 Content column not found, trying without it...');
      const { data: reportFallback, error: reportFallbackError } = await supabaseServer
        .from('reports')
        .insert(reportInsertData)
        .select()
        .single();
        
      if (reportFallbackError) {
        console.error('❌ Fallback report creation also failed:', reportFallbackError);
        // Continue with original error handling
      } else {
        console.log('✅ Report created without content column');
        // Update the variables for the rest of the function
        report = reportFallback;
        reportError = null;
      }
    }
    
    if (reportError) {
      console.error('🚨 Detailed report creation error:', {
        message: reportError.message,
        details: reportError.details,
        hint: reportError.hint,
        code: reportError.code,
      });
    }

    if (reportError) {
      console.error('❌ Failed to generate report:', reportError);
      
      // Rollback: Restore assessment status and delete responses
      console.log('🔄 Rolling back assessment and responses...');
      
      // Restore assessment
      await supabaseServer
        .from('assessments')
        .update({
          status: assessment.status,
          brain_o_meter_score: assessment.brain_o_meter_score,
          completed_at: assessment.completed_at,
        })
        .eq('id', assessmentId);

      // Delete responses
      if (insertedResponses && insertedResponses.length > 0) {
        const insertedResponseIds = insertedResponses.map(r => r.id);
        await supabaseServer
          .from('survey_responses')
          .delete()
          .in('id', insertedResponseIds);
      }

      return NextResponse.json(
        { error: `Failed to generate report: ${reportError.message}` },
        { status: 500 }
      );
    }

    console.log(`✅ Report generated with ID: ${report.id}`);

    // Step 5: Create a share token for anonymous access
    console.log('🔗 Creating share token for anonymous access...');
    
    // Generate a secure random token
    const crypto = require('crypto');
    const shareToken = crypto.randomBytes(32).toString('hex');
    
    // Set expiration to 30 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    
    // First, let's get the parent email from the responses to satisfy the check_recipient constraint
    const parentEmailResponse = responses.find(r => 
      r.question_id === '550e8400-e29b-41d4-a716-446655440033' // Email Address
    );
    const parentEmail = parentEmailResponse?.response_text || 'anonymous@example.com';

    const { data: shareData, error: shareError } = await supabaseServer
      .from('report_shares')
      .insert({
        report_id: report.id,
        shared_by_user_id: null, // Anonymous submission
        recipient_email: parentEmail, // Required by check_recipient constraint
        share_method: 'direct_link',
        share_token: shareToken,
        // Remove expires_at since it's not in the schema
      })
      .select()
      .single();

    if (shareError) {
      console.error('❌ Failed to create share token:', {
        error: shareError,
        message: shareError.message,
        details: shareError.details,
        code: shareError.code,
        parentEmail,
        shareToken: shareToken.substring(0, 8) + '...' // Log partial token for debugging
      });
      // Continue without share token - user can still access via authenticated route if they log in
    } else {
      console.log(`✅ Share token created: ${shareToken.substring(0, 8)}...`);
    }

    // Return successful result
    const result = {
      success: true,
      data: {
        assessmentId: updatedAssessment.id,
        reportId: report.id,
        shareToken: shareData?.share_token, // Include share token for anonymous access
        status: updatedAssessment.status,
        brainOMeterScore: updatedAssessment.brain_o_meter_score,
        completedAt: updatedAssessment.completed_at,
        reportGeneratedAt: report.created_at,
        responsesCount: insertedResponses?.length || 0,
      },
    };

    console.log('🎉 Assessment submission completed successfully');
    return NextResponse.json(result, { status: 200 });

  } catch (error) {
    console.error('Assessment submit error:', error);

    if (error instanceof ServiceError) {
      const statusCode =
        error.code === 'ASSESSMENT_NOT_FOUND'
          ? 404
          : error.code === 'ASSESSMENT_ALREADY_COMPLETED'
            ? 409
            : error.code === 'ASSESSMENT_UNAUTHORIZED'
              ? 403
              : error.code === 'VALIDATION_ERROR'
                ? 400
                : 500;
      return NextResponse.json(
        { error: error.message },
        { status: statusCode }
      );
    }

    return NextResponse.json(
      { error: 'Failed to submit assessment' },
      { status: 500 }
    );
  }
}
