-- Email Tracking Events Migration
-- Comprehensive tracking for email opens, clicks, deliveries, bounces, and complaints
-- Designed to capture Resend webhook events and enable detailed analytics

-- Create enum for tracking event types
CREATE TYPE email_event_type_enum AS ENUM (
  'sent',
  'delivered', 
  'opened',
  'clicked',
  'bounced',
  'complained',
  'unsubscribed'
);

-- Create enum for bounce types
CREATE TYPE bounce_type_enum AS ENUM (
  'hard',
  'soft'
);

-- Main email tracking events table
CREATE TABLE email_tracking_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  
  -- Email identification
  email_id VARCHAR(255), -- Resend message ID
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE SET NULL,
  scheduled_email_id UUID REFERENCES scheduled_emails(id) ON DELETE SET NULL,
  
  -- Event details
  event_type email_event_type_enum NOT NULL,
  event_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Recipient information
  recipient_email VARCHAR(320) NOT NULL, -- RFC 5321 max email length
  
  -- Event-specific data
  click_url TEXT, -- For click events
  bounce_type bounce_type_enum, -- For bounce events
  bounce_reason TEXT, -- Detailed bounce reason
  complaint_feedback_type VARCHAR(100), -- For complaint events
  
  -- Tracking metadata
  user_agent TEXT,
  ip_address INET,
  device_type VARCHAR(50),
  client_name VARCHAR(100), -- Email client (Gmail, Outlook, etc.)
  client_os VARCHAR(100),
  
  -- Geographic data
  country VARCHAR(100),
  region VARCHAR(100),
  city VARCHAR(100),
  
  -- Raw webhook data for debugging
  raw_webhook_data JSONB DEFAULT '{}',
  
  -- Processing metadata
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  webhook_received_at TIMESTAMPTZ DEFAULT NOW(),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_email_tracking_events_practice_id ON email_tracking_events(practice_id);
CREATE INDEX idx_email_tracking_events_email_id ON email_tracking_events(email_id);
CREATE INDEX idx_email_tracking_events_campaign_id ON email_tracking_events(campaign_id);
CREATE INDEX idx_email_tracking_events_scheduled_email_id ON email_tracking_events(scheduled_email_id);
CREATE INDEX idx_email_tracking_events_event_type ON email_tracking_events(event_type);
CREATE INDEX idx_email_tracking_events_recipient ON email_tracking_events(recipient_email);
CREATE INDEX idx_email_tracking_events_timestamp ON email_tracking_events(event_timestamp);
CREATE INDEX idx_email_tracking_events_created_at ON email_tracking_events(created_at);

-- Composite indexes for common queries
CREATE INDEX idx_email_tracking_events_practice_campaign ON email_tracking_events(practice_id, campaign_id, event_type);
CREATE INDEX idx_email_tracking_events_practice_timestamp ON email_tracking_events(practice_id, event_timestamp DESC);

-- Create table for email tracking URLs (for click tracking)
CREATE TABLE email_tracking_urls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  
  -- URL details
  original_url TEXT NOT NULL,
  tracking_token VARCHAR(255) UNIQUE NOT NULL,
  
  -- Associated email
  email_id VARCHAR(255), -- Resend message ID
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE SET NULL,
  scheduled_email_id UUID REFERENCES scheduled_emails(id) ON DELETE SET NULL,
  recipient_email VARCHAR(320) NOT NULL,
  
  -- Tracking metadata
  click_count INTEGER DEFAULT 0,
  first_clicked_at TIMESTAMPTZ,
  last_clicked_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for tracking URLs
CREATE INDEX idx_email_tracking_urls_practice_id ON email_tracking_urls(practice_id);
CREATE INDEX idx_email_tracking_urls_token ON email_tracking_urls(tracking_token);
CREATE INDEX idx_email_tracking_urls_email_id ON email_tracking_urls(email_id);
CREATE INDEX idx_email_tracking_urls_campaign_id ON email_tracking_urls(campaign_id);

-- Create table for email tracking pixels (for open tracking)
CREATE TABLE email_tracking_pixels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  
  -- Pixel details
  tracking_token VARCHAR(255) UNIQUE NOT NULL,
  
  -- Associated email
  email_id VARCHAR(255), -- Resend message ID
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE SET NULL,
  scheduled_email_id UUID REFERENCES scheduled_emails(id) ON DELETE SET NULL,
  recipient_email VARCHAR(320) NOT NULL,
  
  -- Tracking metadata
  open_count INTEGER DEFAULT 0,
  first_opened_at TIMESTAMPTZ,
  last_opened_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for tracking pixels
CREATE INDEX idx_email_tracking_pixels_practice_id ON email_tracking_pixels(practice_id);
CREATE INDEX idx_email_tracking_pixels_token ON email_tracking_pixels(tracking_token);
CREATE INDEX idx_email_tracking_pixels_email_id ON email_tracking_pixels(email_id);
CREATE INDEX idx_email_tracking_pixels_campaign_id ON email_tracking_pixels(campaign_id);

-- Create materialized view for email analytics
CREATE MATERIALIZED VIEW email_analytics_summary AS
SELECT 
  practice_id,
  campaign_id,
  DATE_TRUNC('day', event_timestamp) as event_date,
  COUNT(*) FILTER (WHERE event_type = 'sent') as sent_count,
  COUNT(*) FILTER (WHERE event_type = 'delivered') as delivered_count,
  COUNT(*) FILTER (WHERE event_type = 'opened') as opened_count,
  COUNT(*) FILTER (WHERE event_type = 'clicked') as clicked_count,
  COUNT(*) FILTER (WHERE event_type = 'bounced') as bounced_count,
  COUNT(*) FILTER (WHERE event_type = 'complained') as complained_count,
  COUNT(*) FILTER (WHERE event_type = 'unsubscribed') as unsubscribed_count,
  
  -- Calculate rates
  CASE 
    WHEN COUNT(*) FILTER (WHERE event_type = 'delivered') > 0 
    THEN ROUND((COUNT(*) FILTER (WHERE event_type = 'opened')::DECIMAL / COUNT(*) FILTER (WHERE event_type = 'delivered')) * 100, 2)
    ELSE 0 
  END as open_rate,
  
  CASE 
    WHEN COUNT(*) FILTER (WHERE event_type = 'opened') > 0 
    THEN ROUND((COUNT(*) FILTER (WHERE event_type = 'clicked')::DECIMAL / COUNT(*) FILTER (WHERE event_type = 'opened')) * 100, 2)
    ELSE 0 
  END as click_through_rate,
  
  CASE 
    WHEN COUNT(*) FILTER (WHERE event_type = 'sent') > 0 
    THEN ROUND((COUNT(*) FILTER (WHERE event_type = 'delivered')::DECIMAL / COUNT(*) FILTER (WHERE event_type = 'sent')) * 100, 2)
    ELSE 0 
  END as delivery_rate
  
FROM email_tracking_events
GROUP BY practice_id, campaign_id, DATE_TRUNC('day', event_timestamp);

-- Create unique index on the materialized view
CREATE UNIQUE INDEX idx_email_analytics_summary_unique 
  ON email_analytics_summary(practice_id, campaign_id, event_date);

-- Create function to refresh analytics summary
CREATE OR REPLACE FUNCTION refresh_email_analytics_summary()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY email_analytics_summary;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-refresh analytics on new events
CREATE TRIGGER trigger_refresh_email_analytics
  AFTER INSERT OR UPDATE OR DELETE ON email_tracking_events
  FOR EACH STATEMENT
  EXECUTE FUNCTION refresh_email_analytics_summary();

-- Create function to update tracking pixel counts
CREATE OR REPLACE FUNCTION update_tracking_pixel_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE email_tracking_pixels 
  SET 
    open_count = open_count + 1,
    last_opened_at = NEW.event_timestamp,
    first_opened_at = COALESCE(first_opened_at, NEW.event_timestamp),
    updated_at = NOW()
  WHERE tracking_token = NEW.raw_webhook_data->>'tracking_token'
    AND NEW.event_type = 'opened';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update pixel counts
CREATE TRIGGER trigger_update_tracking_pixel_count
  AFTER INSERT ON email_tracking_events
  FOR EACH ROW
  WHEN (NEW.event_type = 'opened' AND NEW.raw_webhook_data ? 'tracking_token')
  EXECUTE FUNCTION update_tracking_pixel_count();

-- Create function to update tracking URL counts
CREATE OR REPLACE FUNCTION update_tracking_url_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE email_tracking_urls 
  SET 
    click_count = click_count + 1,
    last_clicked_at = NEW.event_timestamp,
    first_clicked_at = COALESCE(first_clicked_at, NEW.event_timestamp),
    updated_at = NOW()
  WHERE tracking_token = NEW.raw_webhook_data->>'tracking_token'
    AND NEW.event_type = 'clicked';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update URL counts
CREATE TRIGGER trigger_update_tracking_url_count
  AFTER INSERT ON email_tracking_events
  FOR EACH ROW
  WHEN (NEW.event_type = 'clicked' AND NEW.raw_webhook_data ? 'tracking_token')
  EXECUTE FUNCTION update_tracking_url_count();

-- Add RLS policies for security
ALTER TABLE email_tracking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_tracking_urls ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_tracking_pixels ENABLE ROW LEVEL SECURITY;

-- RLS policy for email tracking events
CREATE POLICY "Users can access their practice email tracking events"
  ON email_tracking_events
  FOR ALL
  USING (
    practice_id IN (
      SELECT id FROM practices 
      WHERE owner_id = auth.uid()
      OR id IN (
        SELECT practice_id FROM user_profiles 
        WHERE id = auth.uid()
      )
    )
  );

-- RLS policy for tracking URLs
CREATE POLICY "Users can access their practice tracking URLs"
  ON email_tracking_urls
  FOR ALL
  USING (
    practice_id IN (
      SELECT id FROM practices 
      WHERE owner_id = auth.uid()
      OR id IN (
        SELECT practice_id FROM user_profiles 
        WHERE id = auth.uid()
      )
    )
  );

-- RLS policy for tracking pixels
CREATE POLICY "Users can access their practice tracking pixels"
  ON email_tracking_pixels
  FOR ALL
  USING (
    practice_id IN (
      SELECT id FROM practices 
      WHERE owner_id = auth.uid()
      OR id IN (
        SELECT practice_id FROM user_profiles 
        WHERE id = auth.uid()
      )
    )
  );

-- Add comments for documentation
COMMENT ON TABLE email_tracking_events IS 'Stores detailed email tracking events from Resend webhooks for analytics and monitoring';
COMMENT ON TABLE email_tracking_urls IS 'Manages click tracking URLs with unique tokens for link analytics';
COMMENT ON TABLE email_tracking_pixels IS 'Manages open tracking pixels with unique tokens for email open analytics';
COMMENT ON MATERIALIZED VIEW email_analytics_summary IS 'Pre-computed email analytics summary for fast dashboard queries';

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON email_tracking_events TO authenticated;
GRANT SELECT, INSERT, UPDATE ON email_tracking_urls TO authenticated;
GRANT SELECT, INSERT, UPDATE ON email_tracking_pixels TO authenticated;
GRANT SELECT ON email_analytics_summary TO authenticated; 