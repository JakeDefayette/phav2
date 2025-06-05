import { Database } from '@/shared/types/database';
import { createClient } from '@supabase/supabase-js';
import { EmailService } from '@/shared/services/email';
import { EmailTrackingService } from '@/shared/services/email/tracking';
import { EmailComplianceService } from '@/shared/services/email/compliance';

type EmailCampaign = Database['public']['Tables']['email_campaigns']['Row'];
type EmailCampaignInsert =
  Database['public']['Tables']['email_campaigns']['Insert'];
type EmailCampaignUpdate =
  Database['public']['Tables']['email_campaigns']['Update'];
type EmailSend = Database['public']['Tables']['email_sends']['Row'];
type EmailSubscriber = Database['public']['Tables']['email_subscribers']['Row'];

export interface CampaignFilters {
  status?: 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled';
  dateRange?: {
    start: string;
    end: string;
  };
  templateType?: string;
}

export interface CampaignAnalytics {
  campaignId: string;
  sendCount: number;
  deliveredCount: number;
  openCount: number;
  clickCount: number;
  bounceCount: number;
  unsubscribeCount: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  unsubscribeRate: number;
  revenueGenerated?: number;
  avgTimeToOpen?: number;
  deviceBreakdown: {
    mobile: number;
    desktop: number;
    tablet: number;
  };
  geographicBreakdown: Record<string, number>;
}

export interface ABTestConfig {
  enabled: boolean;
  variants: {
    name: string;
    subject: string;
    content: string;
    percentage: number;
  }[];
  winningCriteria: 'open_rate' | 'click_rate' | 'conversion_rate';
  testDuration: number; // hours
  autoSelectWinner: boolean;
}

export interface DripCampaignConfig {
  enabled: boolean;
  steps: {
    id: string;
    name: string;
    delayDays: number;
    subject: string;
    content: string;
    conditions?: {
      openedPrevious?: boolean;
      clickedPrevious?: boolean;
      minimumEngagement?: number;
    };
  }[];
  triggerEvent: 'subscribe' | 'assessment_complete' | 'manual';
  stopConditions?: {
    unsubscribe: boolean;
    purchase: boolean;
    manualStop: boolean;
  };
}

export interface CampaignScheduleOptions {
  sendAt?: string;
  timezone?: string;
  recurring?: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    endDate?: string;
    daysOfWeek?: number[];
  };
}

export interface CampaignPerformanceMetrics {
  campaignId: string;
  period: 'hour' | 'day' | 'week' | 'month';
  metrics: {
    timestamp: string;
    sends: number;
    opens: number;
    clicks: number;
    conversions: number;
  }[];
}

export class CampaignManager {
  private supabase: ReturnType<typeof createClient<Database>>;
  private emailService: EmailService;
  private trackingService: EmailTrackingService;
  private complianceService: EmailComplianceService;

  constructor(
    supabase: ReturnType<typeof createClient<Database>>,
    emailService: EmailService,
    trackingService: EmailTrackingService,
    complianceService: EmailComplianceService
  ) {
    this.supabase = supabase;
    this.emailService = emailService;
    this.trackingService = trackingService;
    this.complianceService = complianceService;
  }

  /**
   * Create a new email campaign
   */
  async createCampaign(
    practiceId: string,
    data: {
      name: string;
      subject: string;
      content: string;
      templateId?: string;
      templateType?: string;
      abTestConfig?: ABTestConfig;
      dripConfig?: DripCampaignConfig;
      scheduleOptions?: CampaignScheduleOptions;
    }
  ): Promise<EmailCampaign> {
    // Validate compliance requirements
    await this.complianceService.validateCampaign({
      practiceId,
      content: data.content,
      subject: data.subject,
    });

    const campaignData: EmailCampaignInsert = {
      practice_id: practiceId,
      name: data.name,
      subject: data.subject,
      content: data.content,
      template_id: data.templateId,
      template_type: data.templateType,
      scheduled_at: data.scheduleOptions?.sendAt,
      is_active: true,
    };

    const { data: campaign, error } = await this.supabase
      .from('email_campaigns')
      .insert(campaignData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create campaign: ${error.message}`);
    }

    // Store additional configuration in metadata if needed
    if (data.abTestConfig || data.dripConfig) {
      await this.storeCampaignMetadata(campaign.id, {
        abTestConfig: data.abTestConfig,
        dripConfig: data.dripConfig,
        scheduleOptions: data.scheduleOptions,
      });
    }

    return campaign;
  }

  /**
   * Get campaigns with filtering and pagination
   */
  async getCampaigns(
    practiceId: string,
    filters?: CampaignFilters,
    options?: {
      page?: number;
      limit?: number;
      sortBy?: 'created_at' | 'name' | 'sent_at' | 'open_rate';
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<{
    campaigns: EmailCampaign[];
    total: number;
    hasMore: boolean;
  }> {
    let query = this.supabase
      .from('email_campaigns')
      .select('*', { count: 'exact' })
      .eq('practice_id', practiceId);

    // Apply filters
    if (filters?.status) {
      // For now, we'll implement basic status logic based on dates and flags
      if (filters.status === 'sent') {
        query = query.not('sent_at', 'is', null);
      } else if (filters.status === 'scheduled') {
        query = query
          .is('sent_at', null)
          .not('scheduled_at', 'is', null)
          .gt('scheduled_at', new Date().toISOString());
      } else if (filters.status === 'draft') {
        query = query.is('sent_at', null).is('scheduled_at', null);
      }
    }

    if (filters?.dateRange) {
      query = query
        .gte('created_at', filters.dateRange.start)
        .lte('created_at', filters.dateRange.end);
    }

    if (filters?.templateType) {
      query = query.eq('template_type', filters.templateType);
    }

    // Apply sorting
    const sortBy = options?.sortBy || 'created_at';
    const sortOrder = options?.sortOrder || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: campaigns, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch campaigns: ${error.message}`);
    }

    return {
      campaigns: campaigns || [],
      total: count || 0,
      hasMore: (count || 0) > offset + limit,
    };
  }

  /**
   * Get detailed analytics for a campaign
   */
  async getCampaignAnalytics(campaignId: string): Promise<CampaignAnalytics> {
    // Get basic campaign stats
    const { data: campaign, error: campaignError } = await this.supabase
      .from('email_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      throw new Error(`Campaign not found: ${campaignError?.message}`);
    }

    // Get detailed send data
    const { data: sends, error: sendsError } = await this.supabase
      .from('email_sends')
      .select('*')
      .eq('campaign_id', campaignId);

    if (sendsError) {
      throw new Error(`Failed to fetch send data: ${sendsError.message}`);
    }

    const sendCount = sends?.length || 0;
    const deliveredCount =
      sends?.filter(s => s.status === 'delivered').length || 0;
    const openCount = sends?.filter(s => s.opened_at).length || 0;
    const clickCount = sends?.filter(s => s.clicked_at).length || 0;
    const bounceCount = sends?.filter(s => s.bounced_at).length || 0;
    const unsubscribeCount = sends?.filter(s => s.unsubscribed_at).length || 0;

    // Calculate rates
    const openRate =
      deliveredCount > 0 ? (openCount / deliveredCount) * 100 : 0;
    const clickRate = openCount > 0 ? (clickCount / openCount) * 100 : 0;
    const bounceRate = sendCount > 0 ? (bounceCount / sendCount) * 100 : 0;
    const unsubscribeRate =
      deliveredCount > 0 ? (unsubscribeCount / deliveredCount) * 100 : 0;

    // Get additional tracking data for device and geographic breakdown
    const trackingData =
      await this.trackingService.getCampaignTrackingData(campaignId);

    return {
      campaignId,
      sendCount,
      deliveredCount,
      openCount,
      clickCount,
      bounceCount,
      unsubscribeCount,
      openRate,
      clickRate,
      bounceRate,
      unsubscribeRate,
      deviceBreakdown: trackingData.deviceBreakdown || {
        mobile: 0,
        desktop: 0,
        tablet: 0,
      },
      geographicBreakdown: trackingData.geographicBreakdown || {},
    };
  }

  /**
   * Send campaign to subscribers
   */
  async sendCampaign(
    campaignId: string,
    options?: {
      testMode?: boolean;
      testRecipients?: string[];
      segmentId?: string;
      abTestVariant?: string;
    }
  ): Promise<{
    success: boolean;
    sendCount: number;
    errors: string[];
  }> {
    const { data: campaign, error: campaignError } = await this.supabase
      .from('email_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      throw new Error(`Campaign not found: ${campaignError?.message}`);
    }

    // Validate sending permissions
    await this.complianceService.validateSendingPermissions(
      campaign.practice_id
    );

    let recipients: EmailSubscriber[];

    if (options?.testMode && options?.testRecipients) {
      // Test mode with specific recipients
      const { data: testSubscribers } = await this.supabase
        .from('email_subscribers')
        .select('*')
        .eq('practice_id', campaign.practice_id)
        .in('email', options.testRecipients)
        .eq('status', 'active');

      recipients = testSubscribers || [];
    } else {
      // Get all active subscribers for the practice
      const { data: subscribers } = await this.supabase
        .from('email_subscribers')
        .select('*')
        .eq('practice_id', campaign.practice_id)
        .eq('status', 'active');

      recipients = subscribers || [];
    }

    const errors: string[] = [];
    let successCount = 0;

    // Send emails in batches to avoid overwhelming the email service
    const batchSize = 50;
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);

      const batchPromises = batch.map(async subscriber => {
        try {
          await this.emailService.sendReportDeliveryEmail({
            to: subscriber.email,
            childName: 'Campaign Recipient',
            assessmentDate: new Date().toISOString(),
            downloadUrl: '',
            practiceId: campaign.practice_id,
          });

          // Record the send
          await this.supabase.from('email_sends').insert({
            campaign_id: campaignId,
            subscriber_id: subscriber.id,
            practice_id: campaign.practice_id,
            status: 'sent',
            sent_at: new Date().toISOString(),
          });

          successCount++;
        } catch (error) {
          errors.push(`Failed to send to ${subscriber.email}: ${error}`);
        }
      });

      await Promise.allSettled(batchPromises);

      // Small delay between batches
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Update campaign with send statistics
    await this.supabase
      .from('email_campaigns')
      .update({
        sent_at: new Date().toISOString(),
        send_count: successCount,
        recipient_count: recipients.length,
        last_sent_at: new Date().toISOString(),
      })
      .eq('id', campaignId);

    return {
      success: errors.length === 0,
      sendCount: successCount,
      errors,
    };
  }

  /**
   * Schedule a campaign for future sending
   */
  async scheduleCampaign(
    campaignId: string,
    scheduleOptions: CampaignScheduleOptions
  ): Promise<void> {
    await this.supabase
      .from('email_campaigns')
      .update({
        scheduled_at: scheduleOptions.sendAt,
        frequency: scheduleOptions.recurring?.frequency,
      })
      .eq('id', campaignId);

    // Store additional scheduling metadata
    if (scheduleOptions.recurring || scheduleOptions.timezone) {
      await this.storeCampaignMetadata(campaignId, { scheduleOptions });
    }
  }

  /**
   * Cancel a scheduled campaign
   */
  async cancelCampaign(campaignId: string): Promise<void> {
    await this.supabase
      .from('email_campaigns')
      .update({
        is_active: false,
        scheduled_at: null,
      })
      .eq('id', campaignId);
  }

  /**
   * Create A/B test variants for a campaign
   */
  async createABTest(
    campaignId: string,
    config: ABTestConfig
  ): Promise<{
    testId: string;
    variants: Array<{ id: string; name: string; percentage: number }>;
  }> {
    // Store A/B test configuration
    const testId = `ab_${campaignId}_${Date.now()}`;

    await this.storeCampaignMetadata(campaignId, {
      abTestConfig: {
        ...config,
        testId,
        status: 'running',
        startedAt: new Date().toISOString(),
      },
    });

    const variants = config.variants.map((variant, index) => ({
      id: `${testId}_variant_${index}`,
      name: variant.name,
      percentage: variant.percentage,
    }));

    return { testId, variants };
  }

  /**
   * Get A/B test results
   */
  async getABTestResults(campaignId: string): Promise<{
    testId: string;
    status: 'running' | 'completed' | 'cancelled';
    variants: Array<{
      id: string;
      name: string;
      sends: number;
      opens: number;
      clicks: number;
      conversions: number;
      openRate: number;
      clickRate: number;
      conversionRate: number;
    }>;
    winner?: string;
  }> {
    const metadata = await this.getCampaignMetadata(campaignId);
    const abConfig = metadata.abTestConfig;

    if (!abConfig) {
      throw new Error('No A/B test found for this campaign');
    }

    // Get results for each variant
    const variantResults = await Promise.all(
      abConfig.variants.map(async (variant: any, index: number) => {
        const variantId = `${abConfig.testId}_variant_${index}`;

        // Get sends for this variant (would need additional tracking)
        const analytics = await this.getCampaignAnalytics(campaignId);

        // For now, simulate variant data - in a real implementation,
        // you'd track which emails were sent as part of which variant
        const variantShare = variant.percentage / 100;

        return {
          id: variantId,
          name: variant.name,
          sends: Math.round(analytics.sendCount * variantShare),
          opens: Math.round(analytics.openCount * variantShare),
          clicks: Math.round(analytics.clickCount * variantShare),
          conversions: 0, // Would need conversion tracking
          openRate: analytics.openRate,
          clickRate: analytics.clickRate,
          conversionRate: 0,
        };
      })
    );

    // Determine winner based on criteria
    let winner: string | undefined;
    if (abConfig.status === 'completed' || abConfig.autoSelectWinner) {
      switch (abConfig.winningCriteria) {
        case 'open_rate':
          winner = variantResults.reduce((prev, current) =>
            prev.openRate > current.openRate ? prev : current
          ).id;
          break;
        case 'click_rate':
          winner = variantResults.reduce((prev, current) =>
            prev.clickRate > current.clickRate ? prev : current
          ).id;
          break;
        case 'conversion_rate':
          winner = variantResults.reduce((prev, current) =>
            prev.conversionRate > current.conversionRate ? prev : current
          ).id;
          break;
      }
    }

    return {
      testId: abConfig.testId,
      status: abConfig.status || 'running',
      variants: variantResults,
      winner,
    };
  }

  /**
   * Create a drip campaign sequence
   */
  async createDripCampaign(
    practiceId: string,
    config: DripCampaignConfig & {
      name: string;
      description?: string;
    }
  ): Promise<{
    campaignId: string;
    stepIds: string[];
  }> {
    // Create the main campaign
    const campaign = await this.createCampaign(practiceId, {
      name: config.name,
      subject: `Drip Campaign: ${config.name}`,
      content: 'Drip campaign container',
      templateType: 'drip_sequence',
      dripConfig: config,
    });

    // Create individual campaigns for each step
    const stepIds = await Promise.all(
      config.steps.map(async (step, index) => {
        const stepCampaign = await this.createCampaign(practiceId, {
          name: `${config.name} - Step ${index + 1}: ${step.name}`,
          subject: step.subject,
          content: step.content,
          templateType: 'drip_step',
        });
        return stepCampaign.id;
      })
    );

    // Store drip configuration
    await this.storeCampaignMetadata(campaign.id, {
      dripConfig: {
        ...config,
        stepCampaignIds: stepIds,
        status: 'active',
      },
    });

    return {
      campaignId: campaign.id,
      stepIds,
    };
  }

  /**
   * Get performance metrics over time
   */
  async getCampaignPerformanceMetrics(
    campaignId: string,
    period: 'hour' | 'day' | 'week' | 'month' = 'day',
    _dateRange?: { start: string; end: string }
  ): Promise<CampaignPerformanceMetrics> {
    // This would typically aggregate data from analytics_events or similar table
    // For now, return a basic structure
    return {
      campaignId,
      period,
      metrics: [], // Would be populated with real time-series data
    };
  }

  /**
   * Get campaign recommendations based on performance
   */
  async getCampaignRecommendations(practiceId: string): Promise<
    Array<{
      type: 'subject_line' | 'send_time' | 'content' | 'frequency';
      title: string;
      description: string;
      impact: 'high' | 'medium' | 'low';
      data: any;
    }>
  > {
    const recommendations = [];

    // Analyze recent campaigns for patterns
    const { campaigns } = await this.getCampaigns(practiceId, {
      dateRange: {
        start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString(),
      },
    });

    // Subject line recommendations
    const avgOpenRate =
      campaigns.reduce((sum, c) => sum + (c.open_rate || 0), 0) /
      campaigns.length;
    if (avgOpenRate < 20) {
      recommendations.push({
        type: 'subject_line' as const,
        title: 'Improve Subject Lines',
        description:
          'Your average open rate is below industry standards. Consider A/B testing different subject line approaches.',
        impact: 'high' as const,
        data: { currentOpenRate: avgOpenRate, targetOpenRate: 25 },
      });
    }

    // Send time recommendations
    recommendations.push({
      type: 'send_time' as const,
      title: 'Optimize Send Times',
      description:
        'Test sending emails at different times to find when your audience is most engaged.',
      impact: 'medium' as const,
      data: { suggestedTimes: ['10:00 AM', '2:00 PM', '7:00 PM'] },
    });

    return recommendations;
  }

  /**
   * Store campaign metadata (A/B tests, drip configs, etc.)
   */
  private async storeCampaignMetadata(
    campaignId: string,
    metadata: any
  ): Promise<void> {
    // This would typically store in a separate metadata table or JSON column
    // For now, we'll use a simple approach with the existing structure

    // You might want to create a campaign_metadata table for this purpose
    console.log('Storing campaign metadata:', { campaignId, metadata });
  }

  /**
   * Retrieve campaign metadata
   */
  private async getCampaignMetadata(_campaignId: string): Promise<any> {
    // Retrieve stored metadata
    // For now, return empty object
    return {};
  }

  /**
   * Process scheduled campaigns (to be called by a cron job)
   */
  async processScheduledCampaigns(): Promise<void> {
    const now = new Date().toISOString();

    const { data: scheduledCampaigns, error } = await this.supabase
      .from('email_campaigns')
      .select('*')
      .lte('scheduled_at', now)
      .is('sent_at', null)
      .eq('is_active', true);

    if (error) {
      console.error('Failed to fetch scheduled campaigns:', error);
      return;
    }

    for (const campaign of scheduledCampaigns || []) {
      try {
        await this.sendCampaign(campaign.id);
        console.log(`Successfully sent scheduled campaign: ${campaign.id}`);
      } catch (error) {
        console.error(
          `Failed to send scheduled campaign ${campaign.id}:`,
          error
        );
      }
    }
  }

  /**
   * Process drip campaign steps
   */
  async processDripCampaigns(): Promise<void> {
    // This would identify subscribers who should receive the next step
    // in their drip sequence and send the appropriate emails
    console.log('Processing drip campaigns...');
  }
}

export default CampaignManager;
