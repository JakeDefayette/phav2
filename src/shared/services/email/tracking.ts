import { supabase } from '@/shared/services/supabase';
import { createHash, randomBytes, createHmac, timingSafeEqual } from 'crypto';
import {
  EmailTrackingEvent,
  EmailTrackingUrl,
  EmailTrackingPixel,
  EmailAnalyticsSummary,
  ResendWebhookEvent,
  WebhookVerificationOptions,
  EmailTrackingConfig,
  EmailAnalyticsQuery,
} from './types';

export class EmailTrackingService {
  private readonly defaultConfig: EmailTrackingConfig = {
    enableOpenTracking: true,
    enableClickTracking: true,
    trackingDomain:
      process.env.NEXT_PUBLIC_APP_URL ||
      'https://app.pediatricholisticassessment.com',
    suppressionListEnabled: true,
    bounceHandlingEnabled: true,
    complaintHandlingEnabled: true,
  };

  private config: EmailTrackingConfig;

  constructor(config: Partial<EmailTrackingConfig> = {}) {
    this.config = { ...this.defaultConfig, ...config };
  }

  // =====================
  // Webhook Processing
  // =====================

  /**
   * Verify webhook signature from Resend
   */
  verifyWebhookSignature({
    signature,
    body,
    secret,
  }: WebhookVerificationOptions): boolean {
    try {
      const expectedSignature = createHmac('sha256', secret)
        .update(body)
        .digest('hex');

      const providedSignature = signature.replace('sha256=', '');

      return timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(providedSignature, 'hex')
      );
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return false;
    }
  }

  /**
   * Process incoming webhook event from Resend
   */
  async processWebhookEvent(
    event: ResendWebhookEvent,
    practiceId: string
  ): Promise<EmailTrackingEvent | null> {
    try {
      const eventType = this.mapResendEventType(event.type);
      if (!eventType) {
        console.warn(`Unsupported event type: ${event.type}`);
        return null;
      }

      // Extract recipient email
      const recipientEmail = Array.isArray(event.data.to)
        ? event.data.to[0]
        : event.data.to;

      // Parse geographic and device data from webhook
      const trackingData = this.extractTrackingData(event);

      const trackingEvent: Omit<
        EmailTrackingEvent,
        'id' | 'createdAt' | 'updatedAt'
      > = {
        practiceId,
        emailId: event.data.email_id,
        eventType,
        eventTimestamp: new Date(event.created_at),
        recipientEmail,
        clickUrl: event.data.click?.link,
        bounceType: event.data.bounce?.type,
        bounceReason: event.data.bounce?.reason,
        complaintFeedbackType: event.data.complaint?.type,
        userAgent: trackingData.userAgent,
        ipAddress: trackingData.ipAddress,
        deviceType: trackingData.deviceType,
        clientName: trackingData.clientName,
        clientOs: trackingData.clientOs,
        country: trackingData.country,
        region: trackingData.region,
        city: trackingData.city,
        rawWebhookData: event,
        processedAt: new Date(),
        webhookReceivedAt: new Date(),
        campaignId: await this.findCampaignId(event.data.email_id),
        scheduledEmailId: await this.findScheduledEmailId(event.data.email_id),
      };

      const { data, error } = await supabase
        .from('email_tracking_events')
        .insert(trackingEvent)
        .select()
        .single();

      if (error) {
        console.error('Failed to insert tracking event:', error);
        throw error;
      }

      // Handle specific event types
      await this.handleSpecificEventType(
        event,
        data as unknown as EmailTrackingEvent
      );

      return data as unknown as EmailTrackingEvent;
    } catch (error) {
      console.error('Failed to process webhook event:', error);
      throw error;
    }
  }

  // =====================
  // Tracking URL Management
  // =====================

  /**
   * Generate tracking URL for click tracking
   */
  async generateTrackingUrl(options: {
    practiceId: string;
    originalUrl: string;
    emailId?: string;
    campaignId?: string;
    scheduledEmailId?: string;
    recipientEmail: string;
  }): Promise<EmailTrackingUrl> {
    const trackingToken = this.generateTrackingToken();

    const trackingUrl: Omit<
      EmailTrackingUrl,
      'id' | 'createdAt' | 'updatedAt'
    > = {
      practiceId: options.practiceId,
      originalUrl: options.originalUrl,
      trackingToken,
      emailId: options.emailId,
      campaignId: options.campaignId,
      scheduledEmailId: options.scheduledEmailId,
      recipientEmail: options.recipientEmail,
      clickCount: 0,
    };

    const { data, error } = await supabase
      .from('email_tracking_urls')
      .insert(trackingUrl)
      .select()
      .single();

    if (error) {
      console.error('Failed to create tracking URL:', error);
      throw error;
    }

    return data as unknown as EmailTrackingUrl;
  }

  /**
   * Get tracking URL by token
   */
  async getTrackingUrl(
    trackingToken: string
  ): Promise<EmailTrackingUrl | null> {
    const { data, error } = await supabase
      .from('email_tracking_urls')
      .select('*')
      .eq('tracking_token', trackingToken)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Failed to get tracking URL:', error);
      throw error;
    }

    return data as unknown as EmailTrackingUrl | null;
  }

  /**
   * Process click tracking and redirect
   */
  async processClickTracking(
    trackingToken: string,
    userAgent?: string,
    ipAddress?: string
  ): Promise<string | null> {
    const trackingUrl = await this.getTrackingUrl(trackingToken);
    if (!trackingUrl) {
      console.warn(`Tracking URL not found for token: ${trackingToken}`);
      return null;
    }

    // Record the click event
    await this.recordTrackingEvent({
      practiceId: trackingUrl.practiceId,
      emailId: trackingUrl.emailId,
      campaignId: trackingUrl.campaignId,
      scheduledEmailId: trackingUrl.scheduledEmailId,
      eventType: 'clicked',
      eventTimestamp: new Date(),
      recipientEmail: trackingUrl.recipientEmail,
      clickUrl: trackingUrl.originalUrl,
      userAgent,
      ipAddress,
      rawWebhookData: { tracking_token: trackingToken },
    });

    return trackingUrl.originalUrl;
  }

  // =====================
  // Tracking Pixel Management
  // =====================

  /**
   * Generate tracking pixel for open tracking
   */
  async generateTrackingPixel(options: {
    practiceId: string;
    emailId?: string;
    campaignId?: string;
    scheduledEmailId?: string;
    recipientEmail: string;
  }): Promise<EmailTrackingPixel> {
    const trackingToken = this.generateTrackingToken();

    const trackingPixel: Omit<
      EmailTrackingPixel,
      'id' | 'createdAt' | 'updatedAt'
    > = {
      practiceId: options.practiceId,
      trackingToken,
      emailId: options.emailId,
      campaignId: options.campaignId,
      scheduledEmailId: options.scheduledEmailId,
      recipientEmail: options.recipientEmail,
      openCount: 0,
    };

    const { data, error } = await supabase
      .from('email_tracking_pixels')
      .insert(trackingPixel)
      .select()
      .single();

    if (error) {
      console.error('Failed to create tracking pixel:', error);
      throw error;
    }

    return data as unknown as EmailTrackingPixel;
  }

  /**
   * Get tracking pixel by token
   */
  async getTrackingPixel(
    trackingToken: string
  ): Promise<EmailTrackingPixel | null> {
    const { data, error } = await supabase
      .from('email_tracking_pixels')
      .select('*')
      .eq('tracking_token', trackingToken)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Failed to get tracking pixel:', error);
      throw error;
    }

    return data as unknown as EmailTrackingPixel | null;
  }

  /**
   * Process open tracking
   */
  async processOpenTracking(
    trackingToken: string,
    userAgent?: string,
    ipAddress?: string
  ): Promise<boolean> {
    const trackingPixel = await this.getTrackingPixel(trackingToken);
    if (!trackingPixel) {
      console.warn(`Tracking pixel not found for token: ${trackingToken}`);
      return false;
    }

    // Record the open event
    await this.recordTrackingEvent({
      practiceId: trackingPixel.practiceId,
      emailId: trackingPixel.emailId,
      campaignId: trackingPixel.campaignId,
      scheduledEmailId: trackingPixel.scheduledEmailId,
      eventType: 'opened',
      eventTimestamp: new Date(),
      recipientEmail: trackingPixel.recipientEmail,
      userAgent,
      ipAddress,
      rawWebhookData: { tracking_token: trackingToken },
    });

    return true;
  }

  /**
   * Generate tracking pixel URL
   */
  getTrackingPixelUrl(trackingToken: string): string {
    return `${this.config.trackingDomain}/api/track/pixel/${trackingToken}`;
  }

  /**
   * Generate tracking click URL
   */
  getTrackingClickUrl(trackingToken: string): string {
    return `${this.config.trackingDomain}/api/track/click/${trackingToken}`;
  }

  // =====================
  // Analytics & Reporting
  // =====================

  /**
   * Get email analytics summary
   */
  async getAnalyticsSummary(
    query: EmailAnalyticsQuery
  ): Promise<EmailAnalyticsSummary[]> {
    let queryBuilder = supabase
      .from('email_analytics_summary')
      .select('*')
      .eq('practice_id', query.practiceId);

    if (query.campaignId) {
      queryBuilder = queryBuilder.eq('campaign_id', query.campaignId);
    }

    if (query.startDate) {
      queryBuilder = queryBuilder.gte(
        'event_date',
        query.startDate.toISOString()
      );
    }

    if (query.endDate) {
      queryBuilder = queryBuilder.lte(
        'event_date',
        query.endDate.toISOString()
      );
    }

    const { data, error } = await queryBuilder.order('event_date', {
      ascending: false,
    });

    if (error) {
      console.error('Failed to get analytics summary:', error);
      throw error;
    }

    return (data || []) as unknown as EmailAnalyticsSummary[];
  }

  /**
   * Get detailed tracking events
   */
  async getTrackingEvents(
    query: EmailAnalyticsQuery
  ): Promise<EmailTrackingEvent[]> {
    let queryBuilder = supabase
      .from('email_tracking_events')
      .select('*')
      .eq('practice_id', query.practiceId);

    if (query.campaignId) {
      queryBuilder = queryBuilder.eq('campaign_id', query.campaignId);
    }

    if (query.eventTypes?.length) {
      queryBuilder = queryBuilder.in('event_type', query.eventTypes);
    }

    if (query.startDate) {
      queryBuilder = queryBuilder.gte(
        'event_timestamp',
        query.startDate.toISOString()
      );
    }

    if (query.endDate) {
      queryBuilder = queryBuilder.lte(
        'event_timestamp',
        query.endDate.toISOString()
      );
    }

    const { data, error } = await queryBuilder
      .order('event_timestamp', { ascending: false })
      .limit(query.includeDetails ? 100 : 500);

    if (error) {
      console.error('Failed to get tracking events:', error);
      throw error;
    }

    return (data || []) as unknown as EmailTrackingEvent[];
  }

  /**
   * Get email performance metrics
   */
  async getEmailPerformance(
    practiceId: string,
    campaignId?: string
  ): Promise<{
    totalSent: number;
    totalDelivered: number;
    totalOpened: number;
    totalClicked: number;
    totalBounced: number;
    totalComplaints: number;
    openRate: number;
    clickRate: number;
    deliveryRate: number;
    bounceRate: number;
  }> {
    const events = await this.getTrackingEvents({
      practiceId,
      campaignId,
    });

    const metrics = {
      totalSent: events.filter(e => e.eventType === 'sent').length,
      totalDelivered: events.filter(e => e.eventType === 'delivered').length,
      totalOpened: events.filter(e => e.eventType === 'opened').length,
      totalClicked: events.filter(e => e.eventType === 'clicked').length,
      totalBounced: events.filter(e => e.eventType === 'bounced').length,
      totalComplaints: events.filter(e => e.eventType === 'complained').length,
      openRate: 0,
      clickRate: 0,
      deliveryRate: 0,
      bounceRate: 0,
    };

    if (metrics.totalDelivered > 0) {
      metrics.openRate = (metrics.totalOpened / metrics.totalDelivered) * 100;
    }

    if (metrics.totalOpened > 0) {
      metrics.clickRate = (metrics.totalClicked / metrics.totalOpened) * 100;
    }

    if (metrics.totalSent > 0) {
      metrics.deliveryRate = (metrics.totalDelivered / metrics.totalSent) * 100;
      metrics.bounceRate = (metrics.totalBounced / metrics.totalSent) * 100;
    }

    return metrics;
  }

  // =====================
  // Email Content Processing
  // =====================

  /**
   * Add tracking to email HTML content
   */
  async addTrackingToEmail(options: {
    practiceId: string;
    htmlContent: string;
    emailId?: string;
    campaignId?: string;
    scheduledEmailId?: string;
    recipientEmail: string;
  }): Promise<{
    html: string;
    trackingPixel: EmailTrackingPixel;
    trackingUrls: EmailTrackingUrl[];
  }> {
    let { htmlContent } = options;
    const trackingUrls: EmailTrackingUrl[] = [];

    // Add click tracking to all links
    if (this.config.enableClickTracking) {
      const linkRegex = /<a[^>]*href="([^"]*)"[^>]*>/gi;
      let match;

      while ((match = linkRegex.exec(htmlContent)) !== null) {
        const originalUrl = match[1];

        // Skip tracking pixels and already tracked URLs
        if (
          originalUrl.includes('/api/track/') ||
          originalUrl.includes('data:')
        ) {
          continue;
        }

        const trackingUrl = await this.generateTrackingUrl({
          practiceId: options.practiceId,
          originalUrl,
          emailId: options.emailId,
          campaignId: options.campaignId,
          scheduledEmailId: options.scheduledEmailId,
          recipientEmail: options.recipientEmail,
        });

        const trackingClickUrl = this.getTrackingClickUrl(
          trackingUrl.trackingToken
        );
        htmlContent = htmlContent.replace(originalUrl, trackingClickUrl);
        trackingUrls.push(trackingUrl);
      }
    }

    // Add open tracking pixel
    let trackingPixel: EmailTrackingPixel | null = null;
    if (this.config.enableOpenTracking) {
      trackingPixel = await this.generateTrackingPixel({
        practiceId: options.practiceId,
        emailId: options.emailId,
        campaignId: options.campaignId,
        scheduledEmailId: options.scheduledEmailId,
        recipientEmail: options.recipientEmail,
      });

      const pixelUrl = this.getTrackingPixelUrl(trackingPixel.trackingToken);
      const trackingPixelHtml = `<img src="${pixelUrl}" width="1" height="1" border="0" style="display:none;" alt="" />`;

      // Insert pixel before closing body tag or at the end
      if (htmlContent.includes('</body>')) {
        htmlContent = htmlContent.replace(
          '</body>',
          `${trackingPixelHtml}</body>`
        );
      } else {
        htmlContent += trackingPixelHtml;
      }
    }

    return {
      html: htmlContent,
      trackingPixel: trackingPixel!,
      trackingUrls,
    };
  }

  // =====================
  // Suppression List Management
  // =====================

  /**
   * Add email to suppression list
   */
  async addToSuppressionList(
    practiceId: string,
    email: string,
    reason: 'bounce' | 'complaint' | 'unsubscribe'
  ): Promise<void> {
    if (!this.config.suppressionListEnabled) return;

    // Update subscriber status
    await supabase
      .from('email_subscribers')
      .update({
        status: reason === 'bounce' ? 'bounced' : 'unsubscribed',
        unsubscribed_at: new Date().toISOString(),
      })
      .eq('practice_id', practiceId)
      .eq('email', email);
  }

  /**
   * Check if email is suppressed
   */
  async isEmailSuppressed(practiceId: string, email: string): Promise<boolean> {
    if (!this.config.suppressionListEnabled) return false;

    const { data } = await supabase
      .from('email_subscribers')
      .select('status')
      .eq('practice_id', practiceId)
      .eq('email', email)
      .single();

    return data?.status === 'bounced' || data?.status === 'unsubscribed';
  }

  /**
   * Get campaign tracking data for analytics
   */
  async getCampaignTrackingData(campaignId: string): Promise<{
    deviceBreakdown: {
      mobile: number;
      desktop: number;
      tablet: number;
    };
    geographicBreakdown: Record<string, number>;
  }> {
    // For now, return default values
    // In a full implementation, this would query analytics_events or similar table
    // to get device and geographic data from user agents and IP addresses
    return {
      deviceBreakdown: {
        mobile: 0,
        desktop: 0,
        tablet: 0,
      },
      geographicBreakdown: {},
    };
  }

  // =====================
  // Private Helper Methods
  // =====================

  private mapResendEventType(
    resendType: string
  ): EmailTrackingEvent['eventType'] | null {
    const typeMap: Record<string, EmailTrackingEvent['eventType']> = {
      'email.sent': 'sent',
      'email.delivered': 'delivered',
      'email.opened': 'opened',
      'email.clicked': 'clicked',
      'email.bounced': 'bounced',
      'email.complained': 'complained',
    };

    return typeMap[resendType] || null;
  }

  private extractTrackingData(event: ResendWebhookEvent): {
    userAgent?: string;
    ipAddress?: string;
    deviceType?: string;
    clientName?: string;
    clientOs?: string;
    country?: string;
    region?: string;
    city?: string;
  } {
    const clickData = event.data.click;
    const openData = event.data.open;

    return {
      userAgent: clickData?.userAgent || openData?.userAgent,
      ipAddress: clickData?.ipAddress || openData?.ipAddress,
      // Additional tracking data can be extracted here
      // deviceType, clientName, etc. would come from parsing userAgent
    };
  }

  private generateTrackingToken(): string {
    return randomBytes(32).toString('hex');
  }

  private async findCampaignId(emailId: string): Promise<string | undefined> {
    // This would typically look up the campaign ID from the email_sends table
    // or from tags in the Resend message
    return undefined;
  }

  private async findScheduledEmailId(
    emailId: string
  ): Promise<string | undefined> {
    // This would typically look up the scheduled email ID from the scheduled_emails table
    return undefined;
  }

  private async recordTrackingEvent(
    eventData: Omit<
      EmailTrackingEvent,
      'id' | 'createdAt' | 'updatedAt' | 'processedAt' | 'webhookReceivedAt'
    >
  ): Promise<void> {
    await supabase.from('email_tracking_events').insert({
      ...eventData,
      processedAt: new Date(),
      webhookReceivedAt: new Date(),
    });
  }

  private async handleSpecificEventType(
    event: ResendWebhookEvent,
    trackingEvent: EmailTrackingEvent
  ): Promise<void> {
    switch (event.type) {
      case 'email.bounced':
        if (this.config.bounceHandlingEnabled) {
          await this.addToSuppressionList(
            trackingEvent.practiceId,
            trackingEvent.recipientEmail,
            'bounce'
          );
        }
        break;

      case 'email.complained':
        if (this.config.complaintHandlingEnabled) {
          await this.addToSuppressionList(
            trackingEvent.practiceId,
            trackingEvent.recipientEmail,
            'complaint'
          );
        }
        break;
    }
  }
}

// Export singleton instance
export const emailTrackingService = new EmailTrackingService();
