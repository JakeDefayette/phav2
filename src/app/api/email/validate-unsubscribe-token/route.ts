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

    // For validation, we need to check if the token exists and get the email
    // This is a safe operation that doesn't modify data
    const { data: preferences, error } = await supabase
      .from('email_preferences')
      .select('email, practice_id, consent_status')
      .eq('unsubscribe_token', token)
      .neq('consent_status', 'unsubscribed')
      .single();

    if (error || !preferences) {
      return NextResponse.json(
        { error: 'Invalid or expired unsubscribe token' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      email: preferences.email,
      practiceId: preferences.practice_id,
    });

  } catch (error) {
    console.error('Error validating unsubscribe token:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 