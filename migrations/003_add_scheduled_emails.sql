-- Migration: Add scheduled emails table for email scheduling mechanism
-- Purpose: Support delayed emails, recurring campaigns, and retry logic with multi-tenant isolation

-- ============================================================================
-- STEP 1: CREATE SCHEDULED EMAILS TABLE
-- ============================================================================

-- Scheduled emails table for individual email operations
CREATE TABLE IF NOT EXISTS scheduled_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id uuid NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  
  -- Email content and metadata
  template_type email_template_type_enum NOT NULL,
  recipient_email varchar(255) NOT NULL,
  subject varchar(500) NOT NULL,
  template_data jsonb NOT NULL DEFAULT '{}', -- Data for template rendering
  
  -- Scheduling information
  scheduled_at timestamptz NOT NULL,
  retry_count integer NOT NULL DEFAULT 0,
  max_retries integer NOT NULL DEFAULT 3,
  next_retry_at timestamptz,
  
  -- Status tracking
  status varchar(50) NOT NULL DEFAULT 'pending', -- pending, processing, sent, failed, cancelled
  priority varchar(20) NOT NULL DEFAULT 'medium', -- high, medium, low
  
  -- Campaign association (optional)
  campaign_id uuid REFERENCES email_campaigns(id) ON DELETE SET NULL,
  
  -- Processing metadata
  processing_attempts integer NOT NULL DEFAULT 0,
  last_attempted_at timestamptz,
  sent_at timestamptz,
  failed_at timestamptz,
  error_message text,
  
  -- Recurring email support
  is_recurring boolean NOT NULL DEFAULT false,
  recurrence_rule varchar(255), -- cron expression for recurring emails
  parent_scheduled_email_id uuid REFERENCES scheduled_emails(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- STEP 2: CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Core indexes for scheduling and processing
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_practice_id ON scheduled_emails(practice_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_status ON scheduled_emails(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_scheduled_at ON scheduled_emails(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_priority ON scheduled_emails(priority);

-- Processing and retry indexes
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_next_retry ON scheduled_emails(next_retry_at) WHERE next_retry_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_processing ON scheduled_emails(status, scheduled_at) WHERE status IN ('pending', 'processing');

-- Campaign and recurring email indexes
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_campaign_id ON scheduled_emails(campaign_id) WHERE campaign_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_recurring ON scheduled_emails(is_recurring, recurrence_rule) WHERE is_recurring = true;
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_parent ON scheduled_emails(parent_scheduled_email_id) WHERE parent_scheduled_email_id IS NOT NULL;

-- Composite index for queue processing
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_queue_processing ON scheduled_emails(
  practice_id, status, priority, scheduled_at
) WHERE status = 'pending';

-- ============================================================================
-- STEP 3: ADD CHECK CONSTRAINTS
-- ============================================================================

-- Ensure valid status values
ALTER TABLE scheduled_emails 
ADD CONSTRAINT check_scheduled_email_status 
CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'cancelled'));

-- Ensure valid priority values
ALTER TABLE scheduled_emails 
ADD CONSTRAINT check_scheduled_email_priority 
CHECK (priority IN ('high', 'medium', 'low'));

-- Ensure retry count doesn't exceed max retries
ALTER TABLE scheduled_emails 
ADD CONSTRAINT check_retry_count 
CHECK (retry_count <= max_retries);

-- Ensure recurrence rule is present for recurring emails
ALTER TABLE scheduled_emails 
ADD CONSTRAINT check_recurring_rule 
CHECK (
  (is_recurring = false) OR 
  (is_recurring = true AND recurrence_rule IS NOT NULL)
);

-- ============================================================================
-- STEP 4: CREATE EMAIL SCHEDULE QUEUE VIEW
-- ============================================================================

-- View for active email queue processing
CREATE OR REPLACE VIEW email_queue AS
SELECT 
  se.id,
  se.practice_id,
  se.template_type,
  se.recipient_email,
  se.subject,
  se.template_data,
  se.scheduled_at,
  se.retry_count,
  se.max_retries,
  se.next_retry_at,
  se.status,
  se.priority,
  se.campaign_id,
  se.processing_attempts,
  se.last_attempted_at,
  se.error_message,
  se.is_recurring,
  se.recurrence_rule,
  se.created_at,
  
  -- Calculated fields
  CASE 
    WHEN se.priority = 'high' THEN 1
    WHEN se.priority = 'medium' THEN 2
    ELSE 3
  END as priority_order,
  
  CASE 
    WHEN se.status = 'pending' AND se.scheduled_at <= now() THEN true
    WHEN se.status = 'failed' AND se.next_retry_at IS NOT NULL AND se.next_retry_at <= now() THEN true
    ELSE false
  END as ready_for_processing
  
FROM scheduled_emails se
WHERE se.status IN ('pending', 'failed')
  AND (
    (se.status = 'pending' AND se.scheduled_at <= now()) OR
    (se.status = 'failed' AND se.next_retry_at IS NOT NULL AND se.next_retry_at <= now())
  )
ORDER BY priority_order, scheduled_at;

-- ============================================================================
-- STEP 5: ADD TABLE COMMENTS
-- ============================================================================

COMMENT ON TABLE scheduled_emails IS 'Individual scheduled email operations with retry logic and multi-tenant isolation';
COMMENT ON COLUMN scheduled_emails.template_data IS 'JSON data passed to email template for rendering';
COMMENT ON COLUMN scheduled_emails.recurrence_rule IS 'Cron expression for recurring emails (e.g., "0 9 * * 1" for weekly Monday 9am)';
COMMENT ON COLUMN scheduled_emails.processing_attempts IS 'Total number of processing attempts including retries';
COMMENT ON VIEW email_queue IS 'Active email queue view for processing pending and retry-ready emails';

-- ============================================================================
-- STEP 6: CREATE TRIGGER FOR UPDATED_AT
-- ============================================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_scheduled_emails_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update the updated_at column
DROP TRIGGER IF EXISTS trigger_update_scheduled_emails_updated_at ON scheduled_emails;
CREATE TRIGGER trigger_update_scheduled_emails_updated_at
  BEFORE UPDATE ON scheduled_emails
  FOR EACH ROW
  EXECUTE FUNCTION update_scheduled_emails_updated_at(); 