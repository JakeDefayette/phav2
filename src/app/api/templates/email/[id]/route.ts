import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// GET /api/templates/email/[id] - Get a specific email template
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createRouteHandlerClient<any>({ cookies });

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's practice_id from profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('practice_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.practice_id) {
      return NextResponse.json(
        { error: 'User practice not found' },
        { status: 404 }
      );
    }

    const resolvedParams = await params;
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('id', resolvedParams.id)
      .eq('practice_id', profile.practice_id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Template not found' },
          { status: 404 }
        );
      }
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch template' },
        { status: 500 }
      );
    }

    return NextResponse.json({ template: data });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/templates/email/[id] - Update a specific email template
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const {
      name,
      template_type,
      subject,
      html_content,
      text_content,
      variables,
    } = body;

    // Validation
    if (!name || !template_type || !subject || !html_content) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: name, template_type, subject, html_content',
        },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient<any>({ cookies });

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's practice_id from profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('practice_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.practice_id) {
      return NextResponse.json(
        { error: 'User practice not found' },
        { status: 404 }
      );
    }

    const resolvedParams = await params;
    // First check if template exists and belongs to practice
    const { data: existingTemplate, error: fetchError } = await supabase
      .from('email_templates')
      .select('id')
      .eq('id', resolvedParams.id)
      .eq('practice_id', profile.practice_id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Template not found' },
          { status: 404 }
        );
      }
      console.error('Database error:', fetchError);
      return NextResponse.json(
        { error: 'Failed to verify template' },
        { status: 500 }
      );
    }

    // Update the template
    const { data, error } = await supabase
      .from('email_templates')
      .update({
        name,
        template_type,
        subject,
        html_content,
        text_content,
        variables: variables || [],
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      })
      .eq('id', resolvedParams.id)
      .eq('practice_id', profile.practice_id)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to update template' },
        { status: 500 }
      );
    }

    return NextResponse.json({ template: data });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/templates/email/[id] - Delete a specific email template
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createRouteHandlerClient<any>({ cookies });

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's practice_id from profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('practice_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.practice_id) {
      return NextResponse.json(
        { error: 'User practice not found' },
        { status: 404 }
      );
    }

    const resolvedParams = await params;
    // First check if template exists and belongs to practice
    const { data: existingTemplate, error: fetchError } = await supabase
      .from('email_templates')
      .select('id')
      .eq('id', resolvedParams.id)
      .eq('practice_id', profile.practice_id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Template not found' },
          { status: 404 }
        );
      }
      console.error('Database error:', fetchError);
      return NextResponse.json(
        { error: 'Failed to verify template' },
        { status: 500 }
      );
    }

    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from('email_templates')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      })
      .eq('id', resolvedParams.id)
      .eq('practice_id', profile.practice_id);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to delete template' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
