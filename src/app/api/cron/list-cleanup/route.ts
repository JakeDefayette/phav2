import { NextRequest, NextResponse } from 'next/server';
import { emailBounceHandler } from '@/shared/services/email/bounceHandler';
import { createClient } from '@supabase/supabase-js';

const supabase = (() => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL is required for list cleanup cron'
    );
  }

  if (!serviceKey) {
    console.warn(
      'SUPABASE_SERVICE_ROLE_KEY not available for list cleanup cron, falling back to anon key'
    );
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!anonKey) {
      throw new Error(
        'Either SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY is required for list cleanup cron'
      );
    }
    return createClient(url, anonKey);
  }

  return createClient(url, serviceKey);
})();

const CRON_SECRET = process.env.CRON_SECRET;

/**
 * POST /api/cron/list-cleanup
 *
 * Automated email list cleanup and maintenance job.
 * Runs regular maintenance tasks for email deliverability:
 * - Clean expired suppressions
 * - Check deliverability thresholds
 * - Generate health reports
 * - Cleanup old tracking data
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret for security
    if (!CRON_SECRET) {
      console.error('CRON_SECRET not configured');
      return NextResponse.json(
        { error: 'Cron job not properly configured' },
        { status: 500 }
      );
    }

    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      console.error('Invalid cron authorization');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting email list cleanup job...');

    const results = {
      expiredSuppressions: 0,
      deliverabilityAlerts: 0,
      practices: 0,
      errors: [] as string[],
    };

    // Get all active practices
    const { data: practices, error: practicesError } = await supabase
      .from('practices')
      .select('id, name')
      .eq('status', 'active');

    if (practicesError) {
      console.error('Failed to fetch practices:', practicesError);
      return NextResponse.json(
        { error: 'Failed to fetch practices' },
        { status: 500 }
      );
    }

    results.practices = practices?.length || 0;

    // Process each practice
    for (const practice of practices || []) {
      try {
        console.log(
          `Processing cleanup for practice: ${practice.name} (${practice.id})`
        );

        // 1. Clean expired suppressions
        const expiredCount = await cleanExpiredSuppressions(practice.id);
        results.expiredSuppressions += expiredCount;

        // 2. Check deliverability thresholds
        const alerts = await checkDeliverabilityThresholds(practice.id);
        results.deliverabilityAlerts += alerts.length;

        // 3. Cleanup old tracking data (optional - keep last 90 days)
        await cleanupOldTrackingData(practice.id, 90);

        console.log(
          `Completed cleanup for practice ${practice.id}: ${expiredCount} suppressions cleaned, ${alerts.length} alerts`
        );
      } catch (error) {
        const errorMsg = `Failed to process practice ${practice.id}: ${error}`;
        console.error(errorMsg);
        results.errors.push(errorMsg);
      }
    }

    // 4. Global maintenance tasks
    await performGlobalMaintenance();

    const summary = {
      success: true,
      timestamp: new Date().toISOString(),
      results,
      message: `Cleanup completed: ${results.expiredSuppressions} suppressions cleaned, ${results.deliverabilityAlerts} alerts generated for ${results.practices} practices`,
    };

    console.log('Email list cleanup job completed:', summary);

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Email list cleanup job failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'List cleanup job failed',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * Clean expired suppressions for a practice
 */
async function cleanExpiredSuppressions(practiceId: string): Promise<number> {
  try {
    const now = new Date().toISOString();

    // Find expired suppressions
    const { data: expiredSuppressions, error: selectError } = await supabase
      .from('email_suppression_list')
      .select('id, email, suppression_type')
      .eq('practice_id', practiceId)
      .not('expires_at', 'is', null)
      .lt('expires_at', now);

    if (selectError) {
      console.error('Failed to fetch expired suppressions:', selectError);
      return 0;
    }

    if (!expiredSuppressions || expiredSuppressions.length === 0) {
      return 0;
    }

    // Remove expired suppressions
    const { error: deleteError } = await supabase
      .from('email_suppression_list')
      .delete()
      .eq('practice_id', practiceId)
      .not('expires_at', 'is', null)
      .lt('expires_at', now);

    if (deleteError) {
      console.error('Failed to delete expired suppressions:', deleteError);
      return 0;
    }

    console.log(
      `Cleaned ${expiredSuppressions.length} expired suppressions for practice ${practiceId}`
    );
    return expiredSuppressions.length;
  } catch (error) {
    console.error('Error cleaning expired suppressions:', error);
    return 0;
  }
}

/**
 * Check deliverability thresholds and generate alerts
 */
async function checkDeliverabilityThresholds(
  practiceId: string
): Promise<any[]> {
  try {
    const alerts = [];

    // Check bounce rate thresholds (last 24 hours)
    const bounceAlerts =
      await emailBounceHandler.checkBounceThresholds(practiceId);
    alerts.push(...bounceAlerts);

    // Check complaint rate thresholds (last 24 hours)
    const complaintAlerts =
      await emailBounceHandler.checkComplaintThresholds(practiceId);
    alerts.push(...complaintAlerts);

    return alerts;
  } catch (error) {
    console.error('Error checking deliverability thresholds:', error);
    return [];
  }
}

/**
 * Cleanup old tracking data to maintain database performance
 */
async function cleanupOldTrackingData(
  practiceId: string,
  daysToKeep: number
): Promise<void> {
  try {
    const cutoffDate = new Date(
      Date.now() - daysToKeep * 24 * 60 * 60 * 1000
    ).toISOString();

    // Delete old tracking events (keep only last N days)
    const { error: eventsError } = await supabase
      .from('email_tracking_events')
      .delete()
      .eq('practice_id', practiceId)
      .lt('created_at', cutoffDate);

    if (eventsError) {
      console.error('Failed to cleanup old tracking events:', eventsError);
    }

    // Delete old tracking URLs that haven't been clicked
    const { error: urlsError } = await supabase
      .from('email_tracking_urls')
      .delete()
      .eq('practice_id', practiceId)
      .eq('click_count', 0)
      .lt('created_at', cutoffDate);

    if (urlsError) {
      console.error('Failed to cleanup old tracking URLs:', urlsError);
    }

    // Delete old tracking pixels that haven't been opened
    const { error: pixelsError } = await supabase
      .from('email_tracking_pixels')
      .delete()
      .eq('practice_id', practiceId)
      .eq('open_count', 0)
      .lt('created_at', cutoffDate);

    if (pixelsError) {
      console.error('Failed to cleanup old tracking pixels:', pixelsError);
    }
  } catch (error) {
    console.error('Error cleaning up old tracking data:', error);
  }
}

/**
 * Perform global maintenance tasks
 */
async function performGlobalMaintenance(): Promise<void> {
  try {
    // Refresh materialized views for better performance
    await supabase.rpc('refresh_email_analytics_summary');

    // Vacuum and analyze email tables (if needed)
    // This would typically be done at the database level

    console.log('Global maintenance tasks completed');
  } catch (error) {
    console.error('Error performing global maintenance:', error);
  }
}

/**
 * GET /api/cron/list-cleanup
 *
 * Health check endpoint to verify cron job is accessible
 */
export async function GET() {
  return NextResponse.json({
    service: 'Email List Cleanup',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    description: 'Automated email list cleanup and maintenance job',
  });
}
