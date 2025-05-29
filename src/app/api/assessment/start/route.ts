import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { AssessmentsService } from '@/features/assessment/services';
import { ChildrenService } from '@/features/dashboard/services/children';
import { ServiceError } from '@/shared/services/base';
import type { Database } from '@/shared/types/database';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    const body = await request.json();
    const { childId, practiceId, childData } = body;

    // Validate required data
    if (!childId && !childData) {
      return NextResponse.json(
        { error: 'Either childId or childData is required' },
        { status: 400 }
      );
    }

    const assessmentsService = new AssessmentsService();
    const childrenService = new ChildrenService();

    let finalChildId = childId;

    // If childData is provided, create a new child record
    if (childData && !childId) {
      // For anonymous users, we still need a parent_id to create a child
      // We can either create a temporary user profile or handle this differently
      if (!user) {
        return NextResponse.json(
          { error: 'Authentication required to create child record' },
          { status: 401 }
        );
      }

      const newChild = await childrenService.create({
        parent_id: user.id,
        first_name: childData.firstName,
        last_name: childData.lastName,
        date_of_birth: childData.dateOfBirth,
        gender: childData.gender,
      });

      finalChildId = newChild.id;
    }

    // Verify the child exists
    if (finalChildId) {
      const child = await childrenService.findById(finalChildId);
      if (!child) {
        return NextResponse.json({ error: 'Child not found' }, { status: 404 });
      }

      // For authenticated users, verify they own this child
      if (user && child.parent_id !== user.id) {
        return NextResponse.json(
          { error: 'Unauthorized access to child record' },
          { status: 403 }
        );
      }
    }

    // Start the assessment
    const assessment = await assessmentsService.startAssessment(
      finalChildId!,
      practiceId
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          assessmentId: assessment.id,
          childId: finalChildId,
          status: assessment.status,
          startedAt: assessment.started_at,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Assessment start error:', error);

    if (error instanceof ServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.code === 'NOT_FOUND' ? 404 : 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to start assessment' },
      { status: 500 }
    );
  }
}
