import { NextRequest, NextResponse } from 'next/server';
import { emailTrackingService } from '@/shared/services/email/tracking';
import { emailBounceHandler } from '@/shared/services/email/bounceHandler';
import { ResendWebhookEvent } from '@/shared/services/email/types';

const WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET;

/**
 * POST /api/webhooks/resend
 *
 * Webhook endpoint to receive email events from Resend.
 * Handles: delivered, bounced, complained, opened, clicked events
 */
export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret is configured
    if (!WEBHOOK_SECRET) {
      console.error('RESEND_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { error: 'Webhook not properly configured' },
        { status: 500 }
      );
    }

    // Get raw body and signature
    const body = await request.text();
    const signature = request.headers.get('resend-signature');

    if (!signature) {
      console.error('Missing webhook signature');
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    // Verify webhook signature
    const isValidSignature = emailTrackingService.verifyWebhookSignature({
      signature,
      body,
      secret: WEBHOOK_SECRET,
    });

    if (!isValidSignature) {
      console.error('Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Parse webhook event
    let event: ResendWebhookEvent;
    try {
      event = JSON.parse(body);
    } catch (error) {
      console.error('Failed to parse webhook body:', error);
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    // Extract practice ID from email data
    // This could come from tags, email content, or domain mapping
    const practiceId = await extractPracticeId(event);
    if (!practiceId) {
      console.warn(
        'Could not determine practice ID for webhook event:',
        event.data.email_id
      );
      return NextResponse.json(
        { error: 'Practice not found' },
        { status: 400 }
      );
    }

    // Process the webhook event
    const trackingEvent = await emailTrackingService.processWebhookEvent(
      event,
      practiceId
    );

    if (trackingEvent) {
      console.log(
        `Successfully processed ${event.type} event for ${event.data.email_id}`
      );

      // Process bounces and complaints with enhanced handling
      await processAdvancedEvents(event, trackingEvent);

      // Send real-time notifications for critical events
      await handleCriticalEvents(event, trackingEvent);
    }

    return NextResponse.json({
      success: true,
      eventId: trackingEvent?.id,
      eventType: event.type,
    });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Extract practice ID from webhook event data
 * This implementation looks for practice ID in email tags
 */
async function extractPracticeId(
  event: ResendWebhookEvent
): Promise<string | null> {
  // Method 1: Look for practice_id in email tags
  if (event.data.tags) {
    const practiceIdTag = event.data.tags.find(
      tag => tag.name === 'practice_id'
    );
    if (practiceIdTag) {
      return practiceIdTag.value;
    }
  }

  // Method 2: Extract from recipient domain or email mapping
  // This would require a practice -> domain mapping table
  const recipientEmail = Array.isArray(event.data.to)
    ? event.data.to[0]
    : event.data.to;
  const domain = recipientEmail.split('@')[1];

  // TODO: Add domain mapping lookup here
  // Example: const practice = await getPracticeByDomain(domain);

  // Method 3: Fallback - use a default practice for development
  // In production, this should be removed or throw an error
  if (process.env.NODE_ENV === 'development') {
    console.warn('Using default practice ID for development');
    return process.env.DEFAULT_PRACTICE_ID || null;
  }

  return null;
}

/**
 * Process bounces and complaints with advanced handling
 */
async function processAdvancedEvents(
  event: ResendWebhookEvent,
  trackingEvent: EmailTrackingEvent
): Promise<void> {
  try {
    if (event.type === 'email.bounced') {
      // Use advanced bounce processing
      const bounceAnalysis = await emailBounceHandler.processBounce(
        event,
        trackingEvent
      );
      console.log(
        `Bounce analysis: ${bounceAnalysis.classification} - ${bounceAnalysis.action} - ${bounceAnalysis.reason}`
      );
    }

    if (event.type === 'email.complained') {
      // Use advanced complaint processing
      const complaintAnalysis = await emailBounceHandler.processComplaint(
        event,
        trackingEvent
      );
      console.log(
        `Complaint analysis: ${complaintAnalysis.severity} - ${complaintAnalysis.action} - ${complaintAnalysis.reason}`
      );
    }
  } catch (error) {
    console.error('Failed to process advanced event handling:', error);
    // Don't throw - webhook should still succeed even if advanced processing fails
  }
}

/**
 * Handle critical events that require immediate notification
 */
async function handleCriticalEvents(
  event: ResendWebhookEvent,
  trackingEvent: EmailTrackingEvent
): Promise<void> {
  try {
    // Handle bounces and complaints with notifications
    if (event.type === 'email.bounced' || event.type === 'email.complained') {
      // Send alert to practice administrators
      console.log(
        `Critical email event: ${event.type} for ${trackingEvent.recipientEmail}`
      );

      // TODO: Implement real-time notifications
      // - Send Slack/Discord notification
      // - Email practice admin
      // - Create in-app notification
      // - Log to monitoring system

      // Example notification structure:
      const notification = {
        type:
          event.type === 'email.bounced' ? 'EMAIL_BOUNCE' : 'EMAIL_COMPLAINT',
        practiceId: trackingEvent.practiceId,
        recipientEmail: trackingEvent.recipientEmail,
        emailId: trackingEvent.emailId,
        reason:
          trackingEvent.bounceReason || trackingEvent.complaintFeedbackType,
        timestamp: trackingEvent.eventTimestamp,
      };

      // Send notification (implement based on requirements)
      await sendCriticalEmailNotification(notification);
    }
  } catch (error) {
    console.error('Failed to handle critical event notification:', error);
    // Don't throw - webhook should still succeed even if notifications fail
  }
}

/**
 * Send critical email event notifications
 */
async function sendCriticalEmailNotification(notification: {
  type: 'EMAIL_BOUNCE' | 'EMAIL_COMPLAINT';
  practiceId: string;
  recipientEmail: string;
  emailId?: string;
  reason?: string;
  timestamp: Date;
}): Promise<void> {
  try {
    // Implementation would depend on notification requirements:

    // 1. In-app notification
    // await createInAppNotification(notification);

    // 2. Email to practice admin
    // await sendAdminEmail(notification);

    // 3. Slack/Discord webhook
    // await sendSlackNotification(notification);

    // 4. Log to monitoring service
    // await logToMonitoring(notification);

    console.log('Critical email notification sent:', notification);
  } catch (error) {
    console.error('Failed to send critical email notification:', error);
  }
}

// Enable CORS for webhook endpoint if needed
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': 'Content-Type, resend-signature',
    },
  });
}

// Type import for better intellisense
type EmailTrackingEvent =
  import('@/shared/services/email/types').EmailTrackingEvent;
