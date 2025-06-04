import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/shared/types/database';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/templates/email/[id]/versions - Get all versions of a template
export async function GET(request: NextRequest, { params }: RouteParams) {
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

    // First verify the template belongs to the user's practice
    const { data: template, error: templateError } = await supabase
      .from('email_templates')
      .select('id')
      .eq('id', params.id)
      .eq('practice_id', profile.practice_id)
      .single();

    if (templateError || !template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Get all versions for this template
    const { data: versions, error: versionsError } = await supabase
      .from('email_template_versions')
      .select(
        `
        id,
        version_number,
        name,
        template_type,
        subject,
        change_description,
        is_published,
        created_at,
        created_by,
        user_profiles:created_by (
          first_name,
          last_name
        )
      `
      )
      .eq('template_id', params.id)
      .order('version_number', { ascending: false });

    if (versionsError) {
      console.error('Database error:', versionsError);
      return NextResponse.json(
        { error: 'Failed to fetch template versions' },
        { status: 500 }
      );
    }

    return NextResponse.json({ versions });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/templates/email/[id]/versions - Create a new version (save as draft)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json();
    const {
      name,
      template_type,
      subject,
      html_content,
      text_content,
      variables,
      change_description,
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

    // First verify the template belongs to the user's practice
    const { data: template, error: templateError } = await supabase
      .from('email_templates')
      .select('id')
      .eq('id', params.id)
      .eq('practice_id', profile.practice_id)
      .single();

    if (templateError || !template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Get next version number
    const { data: maxVersion } = await supabase
      .from('email_template_versions')
      .select('version_number')
      .eq('template_id', params.id)
      .order('version_number', { ascending: false })
      .limit(1)
      .single();

    const nextVersion = (maxVersion?.version_number || 0) + 1;

    // Create new version
    const { data: version, error: versionError } = await supabase
      .from('email_template_versions')
      .insert({
        template_id: params.id,
        version_number: nextVersion,
        name,
        template_type,
        subject,
        html_content,
        text_content,
        variables: variables || [],
        change_description,
        is_published: false, // Start as draft
        created_by: user.id,
      })
      .select()
      .single();

    if (versionError) {
      console.error('Database error:', versionError);
      return NextResponse.json(
        { error: 'Failed to create template version' },
        { status: 500 }
      );
    }

    return NextResponse.json({ version }, { status: 201 });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
