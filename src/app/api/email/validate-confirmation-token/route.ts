import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/shared/services/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // Check if the token exists and is valid for double opt-in
    const { data: preference, error } = await supabase
      .from('email_preferences')
      .select('email, practice_id, consent_status, double_opt_in_expires_at')
      .eq('double_opt_in_token', token)
      .eq('consent_status', 'double_opt_in_pending')
      .single();

    if (error || !preference) {
      return NextResponse.json(
        { error: 'Invalid or expired confirmation token' },
        { status: 404 }
      );
    }

    // Check if token is expired
    if (preference.double_opt_in_expires_at && 
        new Date() > new Date(preference.double_opt_in_expires_at)) {
      return NextResponse.json(
        { error: 'Confirmation token has expired' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      email: preference.email,
      practiceId: preference.practice_id,
    });

  } catch (error) {
    console.error('Error validating confirmation token:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 