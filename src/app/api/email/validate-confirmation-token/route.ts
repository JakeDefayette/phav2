import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/shared/services/supabase';

// Narrowed subset of columns we read from the `email_preferences` table for better type-safety
type DoubleOptInPreference = {
  email: string;
  practice_id: string;
  consent_status: string;
  double_opt_in_expires_at: string | null;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // Check if the token exists and is valid for double opt-in
    const { data: preference, error } = await supabase
      .from('email_preferences')
      .select(
        'email, practice_id, consent_status, double_opt_in_expires_at'
      )
      .eq('double_opt_in_token', token)
      .eq('consent_status', 'double_opt_in_pending')
      .single();

    const typedPreference = preference as unknown as DoubleOptInPreference | null;

    if (error || !typedPreference) {
      return NextResponse.json(
        { error: 'Invalid or expired confirmation token' },
        { status: 404 }
      );
    }

    // Check if token is expired
    if (
      typedPreference.double_opt_in_expires_at &&
      new Date() > new Date(typedPreference.double_opt_in_expires_at)
    ) {
      return NextResponse.json(
        { error: 'Confirmation token has expired' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      email: typedPreference.email,
      practiceId: typedPreference.practice_id,
    });
  } catch (error) {
    console.error('Error validating confirmation token:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
