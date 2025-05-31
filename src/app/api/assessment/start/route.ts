import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { ChildrenService } from '@/features/dashboard/services/children';
import { ServiceError } from '@/shared/services/base';
import type { Database } from '@/shared/types/database';
import { supabaseServer } from '@/shared/services/supabase-server';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    const body = await request.json();
    const { childId, practiceId, childData, parentData } = body;

    // Validate required data
    if (!childId && !childData) {
      return NextResponse.json(
        { error: 'Either childId or childData is required' },
        { status: 400 }
      );
    }

    // const assessmentsService = new AssessmentsService();

    let finalChildId = childId;
    let createdAnonymousUser = false;

    // If childData is provided, handle anonymous user creation
    if (childData && !childId) {
      let parentUserId = user?.id;

      // For anonymous users, create a temporary user profile
      if (!user && parentData) {
        try {
          // Check if a user profile already exists with this email
          const { data: existingProfile } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('email', parentData.email)
            .single();

          if (existingProfile) {
            parentUserId = existingProfile.id;
          } else {
            // Create anonymous auth user first, which will auto-create the profile
            console.log('Creating anonymous auth user for:', parentData.email);
            
            const { data: authUser, error: authError } = await supabaseServer.auth.admin.createUser({
              email: parentData.email,
              password: randomUUID(), // Random password for anonymous user
              email_confirm: true, // Skip email confirmation for anonymous users
              user_metadata: {
                first_name: parentData.firstName,
                last_name: parentData.lastName,
                role: 'parent',
                is_anonymous: true,
              }
            });

            if (authError) {
              console.error('Failed to create anonymous auth user:', authError);
              return NextResponse.json(
                {
                  error: `Failed to create user account for anonymous assessment: ${authError.message}`,
                },
                { status: 500 }
              );
            }

            console.log('Anonymous auth user created:', authUser.user.id);

            // Update the auto-created profile with additional information
            const { data: updatedProfile, error: updateError } = await supabaseServer
              .from('user_profiles')
              .update({
                first_name: parentData.firstName,
                last_name: parentData.lastName,
                phone: parentData.phone,
                role: 'parent',
                updatedAt: new Date().toISOString(),
              })
              .eq('id', authUser.user.id)
              .select()
              .single();

            if (updateError) {
              console.error('Failed to update anonymous user profile:', updateError);
              
              // Clean up the auth user if profile update fails
              await supabaseServer.auth.admin.deleteUser(authUser.user.id);
              
              return NextResponse.json(
                {
                  error: `Failed to update user profile for anonymous assessment: ${updateError.message}`,
                },
                { status: 500 }
              );
            }

            parentUserId = authUser.user.id;
            createdAnonymousUser = true;
            console.log('Anonymous user profile updated successfully:', updatedProfile.id);
          }
        } catch (error) {
          console.error('Error handling anonymous user:', error);
          return NextResponse.json(
            { error: `Failed to process anonymous user: ${error.message}` },
            { status: 500 }
          );
        }
      }

      // Create child record if we have a parent user ID
      if (parentUserId) {
        try {
          console.log('Creating child record for parent:', parentUserId);
          
          // Create child record directly using server client with correct column names
          const { data: newChild, error: childError } = await supabaseServer
            .from('children')
            .insert({
              id: randomUUID(),
              parent_id: parentUserId,
              first_name: childData.firstName,
              last_name: childData.lastName,
              date_of_birth: childData.dateOfBirth,
              gender: childData.gender,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .select()
            .single();

          if (childError) {
            console.error('Failed to create child record:', childError);

            // If we created an anonymous user but failed to create child, clean up
            if (createdAnonymousUser && parentUserId) {
              await supabaseServer.auth.admin.deleteUser(parentUserId);
              console.log('Cleaned up anonymous user after child creation failure');
            }

            return NextResponse.json(
              { error: `Failed to create child record: ${childError.message}` },
              { status: 500 }
            );
          }

          finalChildId = newChild.id;
          console.log('Child record created successfully:', newChild.id);
        } catch (error) {
          console.error('Failed to create child record:', error);

          // If we created an anonymous user but failed to create child, clean up
          if (createdAnonymousUser && parentUserId) {
            await supabaseServer.auth.admin.deleteUser(parentUserId);
            console.log('Cleaned up anonymous user after child creation failure');
          }

          return NextResponse.json(
            { error: `Failed to create child record: ${error.message}` },
            { status: 500 }
          );
        }
      } else {
        return NextResponse.json(
          { error: 'Unable to determine parent for child record' },
          { status: 400 }
        );
      }
    }

    // Verify the child exists using server client to avoid API key issues
    if (finalChildId) {
      const { data: child, error: childFindError } = await supabaseServer
        .from('children')
        .select('*')
        .eq('id', finalChildId)
        .single();

      if (childFindError || !child) {
        return NextResponse.json({ error: 'Child not found' }, { status: 404 });
      }

      // For authenticated users, verify they own this child (skip for anonymous)
      if (user && child.parent_id !== user.id) {
        return NextResponse.json(
          { error: 'Unauthorized access to child record' },
          { status: 403 }
        );
      }
    }

    // Start the assessment
    console.log('Starting assessment for child:', finalChildId);
    
    // Get parent email - either from parentData (anonymous) or from authenticated user
    let parentEmail = parentData?.email;
    if (!parentEmail && user?.email) {
      parentEmail = user.email;
    }
    
    if (!parentEmail) {
      return NextResponse.json(
        { error: 'Parent email is required for assessment creation' },
        { status: 400 }
      );
    }
    
    // Create assessment directly using supabaseServer to avoid client-side permission issues
    const assessmentData: any = {
      child_id: finalChildId!,
      parent_email: parentEmail,
      status: 'draft' as const,
      created_at: new Date().toISOString(),
    };
    
    // Add practice_id - use provided one or default to first available practice
    if (practiceId) {
      assessmentData.practice_id = practiceId;
    } else {
      // Use a default practice ID since it's required
      assessmentData.practice_id = '1b123d24-6001-468f-a94d-9d259fcd7ace';
    }

    const { data: assessment, error: assessmentError } = await supabaseServer
      .from('assessments')
      .insert(assessmentData)
      .select('*')
      .single();

    if (assessmentError) {
      console.error('Failed to create assessment:', assessmentError);
      return NextResponse.json(
        { error: `Failed to create assessment: ${assessmentError.message}` },
        { status: 500 }
      );
    }

    console.log('Assessment started successfully:', assessment.id);

    return NextResponse.json(
      {
        success: true,
        data: {
          assessmentId: assessment.id,
          childId: finalChildId,
          status: assessment.status,
          startedAt: assessment.created_at,
          isAnonymous: createdAnonymousUser,
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
      { error: `Failed to start assessment: ${error.message}` },
      { status: 500 }
    );
  }
}
