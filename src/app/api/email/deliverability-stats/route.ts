import { NextRequest, NextResponse } from 'next/server';
import { emailBounceHandler } from '@/shared/services/email/bounceHandler';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/email/deliverability-stats
 *
 * Get comprehensive email deliverability statistics for a practice
 * Query parameters:
 * - practiceId: string (required)
 * - hoursBack: number (optional, default: 24)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const practiceId = searchParams.get('practiceId');
    const hoursBack = parseInt(searchParams.get('hoursBack') || '24');

    if (!practiceId) {
      return NextResponse.json(
        { error: 'practiceId parameter is required' },
        { status: 400 }
      );
    }

    // Get bounce and complaint statistics
    const [bounceStats, complaintStats, suppressionCount] = await Promise.all([
      emailBounceHandler.getBounceStatistics(practiceId, hoursBack),
      emailBounceHandler.getComplaintStatistics(practiceId, hoursBack),
      getSuppressionCount(practiceId),
    ]);

    // Calculate delivery rate
    const deliveryRate =
      bounceStats.totalSent > 0
        ? ((bounceStats.totalSent - bounceStats.totalBounced) /
            bounceStats.totalSent) *
          100
        : 100;

    // Get recent alerts (last 24 hours)
    const [bounceAlerts, complaintAlerts] = await Promise.all([
      emailBounceHandler.checkBounceThresholds(practiceId),
      emailBounceHandler.checkComplaintThresholds(practiceId),
    ]);

    const allAlerts = [...bounceAlerts, ...complaintAlerts];

    const stats = {
      bounceRate: bounceStats.bounceRate,
      complaintRate: complaintStats.complaintRate,
      deliveryRate,
      suppressedEmails: suppressionCount,
      totalSent: bounceStats.totalSent,
      totalBounced: bounceStats.totalBounced,
      totalComplaints: complaintStats.totalComplaints,
      hardBounces: bounceStats.hardBounces,
      softBounces: bounceStats.softBounces,
      alerts: allAlerts.map(alert => ({
        type: alert.type,
        severity: alert.severity,
        message: alert.message,
        threshold: alert.threshold,
        currentValue: alert.currentValue,
        timestamp: alert.timestamp.toISOString(),
      })),
      complaintsByType: complaintStats.complaintsByType,
      timestamp: new Date().toISOString(),
      hoursBack,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Failed to fetch deliverability stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deliverability statistics' },
      { status: 500 }
    );
  }
}

/**
 * Get count of emails on suppression list for practice
 */
async function getSuppressionCount(practiceId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('email_suppression_list')
      .select('*', { count: 'exact', head: true })
      .eq('practice_id', practiceId);

    if (error) {
      console.error('Failed to get suppression count:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Error getting suppression count:', error);
    return 0;
  }
}
