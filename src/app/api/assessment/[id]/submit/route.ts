import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { DatabaseTransactionService } from '@/shared/services/database/transaction';
import { ServiceError } from '@/shared/services/base';
import type { Database } from '@/shared/types/database';

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

    const transactionService = new DatabaseTransactionService();

    // Validate assessment authorization (if user is authenticated)
    if (user) {
      await transactionService.validateAssessmentForSubmission(
        assessmentId,
        user.id
      );
    }

    // Submit assessment atomically using the transaction service
    const result = await transactionService.submitAssessmentAtomic({
      assessmentId,
      responses,
      brainOMeterScore,
      practiceId,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          assessmentId: result.assessmentId,
          reportId: result.reportId,
          status: result.status,
          brainOMeterScore: result.brainOMeterScore,
          completedAt: result.completedAt,
          reportGeneratedAt: result.reportGeneratedAt,
          responsesCount: result.responsesCount,
        },
      },
      { status: 200 }
    );
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
