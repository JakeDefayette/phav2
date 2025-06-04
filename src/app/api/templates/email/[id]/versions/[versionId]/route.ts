import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/shared/types/database';

interface RouteParams {
  params: {
    id: string;
    versionId: string;
  };
}

// GET /api/templates/email/[id]/versions/[versionId] - Get a specific version
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

    // Get the specific version
    const { data: version, error: versionError } = await supabase
      .from('email_template_versions')
      .select(
        `
        *,
        user_profiles:created_by (
          first_name,
          last_name
        )
      `
      )
      .eq('id', params.versionId)
      .eq('template_id', params.id)
      .single();

    if (versionError || !version) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }

    return NextResponse.json({ version });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/templates/email/[id]/versions/[versionId]/publish - Publish a version (make it current)
export async function PUT(request: NextRequest, { params }: RouteParams) {
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

    // Get the version to publish
    const { data: version, error: versionError } = await supabase
      .from('email_template_versions')
      .select('*')
      .eq('id', params.versionId)
      .eq('template_id', params.id)
      .single();

    if (versionError || !version) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }

    // Start transaction - update main template with version content
    const { error: updateError } = await supabase
      .from('email_templates')
      .update({
        name: version.name,
        template_type: version.template_type,
        subject: version.subject,
        html_content: version.html_content,
        text_content: version.text_content,
        variables: version.variables,
        current_version: version.version_number,
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      })
      .eq('id', params.id);

    if (updateError) {
      console.error('Failed to update main template:', updateError);
      return NextResponse.json(
        { error: 'Failed to publish version' },
        { status: 500 }
      );
    }

    // Mark this version as published and others as not published
    await supabase
      .from('email_template_versions')
      .update({ is_published: false })
      .eq('template_id', params.id);

    const { error: publishError } = await supabase
      .from('email_template_versions')
      .update({ is_published: true })
      .eq('id', params.versionId);

    if (publishError) {
      console.error('Failed to mark version as published:', publishError);
      return NextResponse.json(
        { error: 'Failed to publish version' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Version published successfully',
      version: version.version_number,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/templates/email/[id]/versions/[versionId] - Delete a version (only drafts)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    // Get the version to delete
    const { data: version, error: versionError } = await supabase
      .from('email_template_versions')
      .select('is_published, version_number')
      .eq('id', params.versionId)
      .eq('template_id', params.id)
      .single();

    if (versionError || !version) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }

    // Don't allow deletion of published versions
    if (version.is_published) {
      return NextResponse.json(
        {
          error:
            'Cannot delete published version. Create a new version or revert to a previous one.',
        },
        { status: 400 }
      );
    }

    // Delete the version
    const { error: deleteError } = await supabase
      .from('email_template_versions')
      .delete()
      .eq('id', params.versionId);

    if (deleteError) {
      console.error('Failed to delete version:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete version' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Version deleted successfully' });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
