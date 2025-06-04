import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/shared/types/database';

// GET /api/templates/email - List all email templates for the practice
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });

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

    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('practice_id', profile.practice_id)
      .eq('is_active', true)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch templates' },
        { status: 500 }
      );
    }

    return NextResponse.json({ templates: data });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/templates/email - Create a new email template
export async function POST(request: NextRequest) {
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

    const supabase = createRouteHandlerClient<Database>({ cookies });

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

    const { data, error } = await supabase
      .from('email_templates')
      .insert([
        {
          practice_id: profile.practice_id,
          name,
          template_type,
          subject,
          html_content,
          text_content,
          variables: variables || [],
          is_active: true,
          updated_by: user.id,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to create template' },
        { status: 500 }
      );
    }

    return NextResponse.json({ template: data }, { status: 201 });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
