-- Email Compliance and GDPR Features Migration
-- Purpose: Add consent tracking, preferences management, and compliance features
-- Multi-tenant isolation with practice_id for all tables

-- ============================================================================
-- STEP 1: CREATE ENUMS FOR COMPLIANCE
-- ============================================================================

-- Email consent status enum
CREATE TYPE email_consent_status_enum AS ENUM (
  'opted_in',
  'opted_out', 
  'pending',
  'double_opt_in_pending',
  'unsubscribed',
  'bounced',
  'complained'
);

-- Email preference types enum
CREATE TYPE email_preference_type_enum AS ENUM (
  'marketing',
  'transactional',
  'reports',
  'notifications',
  'newsletters',
  'reminders',
  'system'
);

-- Consent action types for audit trail
CREATE TYPE consent_action_enum AS ENUM (
  'subscribe',
  'unsubscribe',
  'update_preferences',
  'double_opt_in_confirm',
  'admin_action',
  'system_suppression',
  'bounce_suppression',
  'complaint_suppression'
);

-- ============================================================================
-- STEP 2: EMAIL PREFERENCES TABLE
-- ============================================================================

-- Email preferences for granular consent management per practice
CREATE TABLE email_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  
  -- Subscriber identification
  email VARCHAR(320) NOT NULL, -- RFC 5321 max email length
  subscriber_id UUID REFERENCES email_subscribers(id) ON DELETE SET NULL,
  
  -- Preference details
  preference_type email_preference_type_enum NOT NULL,
  is_subscribed BOOLEAN NOT NULL DEFAULT true,
  consent_status email_consent_status_enum NOT NULL DEFAULT 'pending',
  
  -- Consent metadata
  consent_date TIMESTAMPTZ,
  consent_source VARCHAR(100), -- 'website', 'api', 'import', 'admin'
  consent_ip_address INET,
  consent_user_agent TEXT,
  double_opt_in_token VARCHAR(255),
  double_opt_in_expires_at TIMESTAMPTZ,
  double_opt_in_confirmed_at TIMESTAMPTZ,
  
  -- Unsubscribe metadata
  unsubscribe_token VARCHAR(255),
  unsubscribe_date TIMESTAMPTZ,
  unsubscribe_reason TEXT,
  
  -- GDPR and compliance
  data_processing_consent BOOLEAN DEFAULT false,
  marketing_consent BOOLEAN DEFAULT false,
  can_spam_compliant BOOLEAN DEFAULT true,
  gdpr_compliant BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(practice_id, email, preference_type)
);

-- ============================================================================
-- STEP 3: EMAIL CONSENT LOG TABLE (AUDIT TRAIL)
-- ============================================================================

-- Comprehensive audit log for all consent changes
CREATE TABLE email_consent_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  
  -- Reference to preference record
  preference_id UUID REFERENCES email_preferences(id) ON DELETE SET NULL,
  
  -- Action details
  action consent_action_enum NOT NULL,
  email VARCHAR(320) NOT NULL,
  preference_type email_preference_type_enum,
  
  -- Previous and new values for changes
  previous_status email_consent_status_enum,
  new_status email_consent_status_enum,
  previous_subscribed BOOLEAN,
  new_subscribed BOOLEAN,
  
  -- Action context
  action_source VARCHAR(100), -- 'user_action', 'admin_action', 'webhook', 'system'
  ip_address INET,
  user_agent TEXT,
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL, -- Admin who made change
  
  -- Compliance metadata
  reason TEXT,
  legal_basis VARCHAR(100), -- GDPR legal basis
  retention_period_days INTEGER,
  
  -- Webhook/system data
  webhook_data JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- STEP 4: EMAIL SUPPRESSION LISTS TABLE
-- ============================================================================

-- Practice-specific suppression lists for bounces, complaints, unsubscribes
CREATE TABLE email_suppression_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  
  -- Suppressed email details
  email VARCHAR(320) NOT NULL,
  suppression_type VARCHAR(50) NOT NULL, -- 'bounce', 'complaint', 'unsubscribe', 'manual'
  suppression_reason TEXT,
  
  -- Suppression metadata
  suppressed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  suppressed_by_user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  -- Auto-suppression details
  bounce_type bounce_type_enum,
  original_campaign_id UUID REFERENCES email_campaigns(id) ON DELETE SET NULL,
  original_email_id VARCHAR(255), -- Resend message ID that caused suppression
  
  -- Compliance and management
  can_be_resubscribed BOOLEAN DEFAULT false,
  manual_review_required BOOLEAN DEFAULT false,
  notes TEXT,
  
  -- Automatic removal (for temporary suppressions)
  expires_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure one suppression record per email per practice
  UNIQUE(practice_id, email)
);

-- ============================================================================
-- STEP 5: PRACTICE EMAIL QUOTAS TABLE
-- ============================================================================

-- Practice-level email quotas and rate limiting for multi-tenant isolation
CREATE TABLE practice_email_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  
  -- Quota limits
  daily_email_limit INTEGER DEFAULT 1000,
  monthly_email_limit INTEGER DEFAULT 10000,
  concurrent_campaign_limit INTEGER DEFAULT 5,
  
  -- Current usage (reset daily/monthly)
  daily_emails_sent INTEGER DEFAULT 0,
  monthly_emails_sent INTEGER DEFAULT 0,
  active_campaigns_count INTEGER DEFAULT 0,
  
  -- Rate limiting
  rate_limit_per_minute INTEGER DEFAULT 60,
  rate_limit_burst_capacity INTEGER DEFAULT 100,
  
  -- Compliance settings
  requires_double_opt_in BOOLEAN DEFAULT false,
  auto_suppress_bounces BOOLEAN DEFAULT true,
  auto_suppress_complaints BOOLEAN DEFAULT true,
  data_retention_days INTEGER DEFAULT 2555, -- 7 years default
  
  -- Usage tracking
  last_daily_reset TIMESTAMPTZ DEFAULT NOW(),
  last_monthly_reset TIMESTAMPTZ DEFAULT NOW(),
  quota_exceeded_count INTEGER DEFAULT 0,
  last_quota_exceeded_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- One quota record per practice
  UNIQUE(practice_id)
);

-- ============================================================================
-- STEP 6: CREATE PERFORMANCE INDEXES
-- ============================================================================

-- Email preferences indexes
CREATE INDEX idx_email_preferences_practice_id ON email_preferences(practice_id);
CREATE INDEX idx_email_preferences_email ON email_preferences(email);
CREATE INDEX idx_email_preferences_subscriber_id ON email_preferences(subscriber_id);
CREATE INDEX idx_email_preferences_consent_status ON email_preferences(consent_status);
CREATE INDEX idx_email_preferences_preference_type ON email_preferences(preference_type);
CREATE INDEX idx_email_preferences_unsubscribe_token ON email_preferences(unsubscribe_token);
CREATE INDEX idx_email_preferences_double_opt_in_token ON email_preferences(double_opt_in_token);

-- Composite indexes for common queries
CREATE INDEX idx_email_preferences_practice_email ON email_preferences(practice_id, email);
CREATE INDEX idx_email_preferences_practice_type_status ON email_preferences(practice_id, preference_type, consent_status);

-- Email consent log indexes
CREATE INDEX idx_email_consent_log_practice_id ON email_consent_log(practice_id);
CREATE INDEX idx_email_consent_log_preference_id ON email_consent_log(preference_id);
CREATE INDEX idx_email_consent_log_email ON email_consent_log(email);
CREATE INDEX idx_email_consent_log_action ON email_consent_log(action);
CREATE INDEX idx_email_consent_log_created_at ON email_consent_log(created_at DESC);

-- Composite indexes for audit queries
CREATE INDEX idx_email_consent_log_practice_action ON email_consent_log(practice_id, action, created_at DESC);
CREATE INDEX idx_email_consent_log_email_action ON email_consent_log(email, action, created_at DESC);

-- Email suppression list indexes
CREATE INDEX idx_email_suppression_list_practice_id ON email_suppression_list(practice_id);
CREATE INDEX idx_email_suppression_list_email ON email_suppression_list(email);
CREATE INDEX idx_email_suppression_list_type ON email_suppression_list(suppression_type);
CREATE INDEX idx_email_suppression_list_suppressed_at ON email_suppression_list(suppressed_at);
CREATE INDEX idx_email_suppression_list_expires_at ON email_suppression_list(expires_at);

-- Composite indexes for suppression checks
CREATE INDEX idx_email_suppression_list_practice_email ON email_suppression_list(practice_id, email);

-- Practice email quotas indexes
CREATE INDEX idx_practice_email_quotas_practice_id ON practice_email_quotas(practice_id);

-- ============================================================================
-- STEP 7: CREATE VIEWS FOR COMPLIANCE REPORTING
-- ============================================================================

-- View for compliance status per practice
CREATE VIEW practice_compliance_status AS
SELECT 
  p.id as practice_id,
  p.name as practice_name,
  peq.requires_double_opt_in,
  peq.data_retention_days,
  COUNT(ep.id) as total_preferences,
  COUNT(CASE WHEN ep.consent_status = 'opted_in' THEN 1 END) as opted_in_count,
  COUNT(CASE WHEN ep.consent_status = 'opted_out' THEN 1 END) as opted_out_count,
  COUNT(CASE WHEN ep.consent_status = 'unsubscribed' THEN 1 END) as unsubscribed_count,
  COUNT(esl.id) as suppressed_emails_count,
  COUNT(CASE WHEN ep.gdpr_compliant = false THEN 1 END) as non_gdpr_compliant_count,
  COUNT(CASE WHEN ep.can_spam_compliant = false THEN 1 END) as non_can_spam_compliant_count
FROM practices p
LEFT JOIN practice_email_quotas peq ON p.id = peq.practice_id
LEFT JOIN email_preferences ep ON p.id = ep.practice_id
LEFT JOIN email_suppression_list esl ON p.id = esl.practice_id
GROUP BY p.id, p.name, peq.requires_double_opt_in, peq.data_retention_days;

-- View for recent consent actions
CREATE VIEW recent_consent_actions AS
SELECT 
  ecl.id,
  ecl.practice_id,
  p.name as practice_name,
  ecl.action,
  ecl.email,
  ecl.preference_type,
  ecl.previous_status,
  ecl.new_status,
  ecl.action_source,
  ecl.reason,
  ecl.created_at
FROM email_consent_log ecl
JOIN practices p ON ecl.practice_id = p.id
WHERE ecl.created_at >= NOW() - INTERVAL '30 days'
ORDER BY ecl.created_at DESC;

-- ============================================================================
-- STEP 8: CREATE FUNCTIONS FOR COMPLIANCE AUTOMATION
-- ============================================================================

-- Function to automatically create default preferences for new subscribers
CREATE OR REPLACE FUNCTION create_default_email_preferences()
RETURNS TRIGGER AS $$
BEGIN
  -- Create default preferences for all email types
  INSERT INTO email_preferences (
    practice_id,
    email,
    subscriber_id,
    preference_type,
    is_subscribed,
    consent_status,
    consent_date,
    consent_source,
    data_processing_consent,
    marketing_consent
  ) VALUES 
  (NEW.practice_id, NEW.email, NEW.id, 'transactional', true, 'opted_in', NOW(), 'system', true, false),
  (NEW.practice_id, NEW.email, NEW.id, 'reports', true, 'opted_in', NOW(), 'system', true, false),
  (NEW.practice_id, NEW.email, NEW.id, 'notifications', true, 'opted_in', NOW(), 'system', true, false),
  (NEW.practice_id, NEW.email, NEW.id, 'marketing', NEW.is_active, 
   CASE WHEN NEW.is_active THEN 'opted_in' ELSE 'opted_out' END, 
   NOW(), 'system', true, NEW.is_active);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic preference creation
CREATE TRIGGER trigger_create_default_email_preferences
  AFTER INSERT ON email_subscribers
  FOR EACH ROW
  EXECUTE FUNCTION create_default_email_preferences();

-- Function to log consent changes
CREATE OR REPLACE FUNCTION log_consent_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the consent change to audit trail
  INSERT INTO email_consent_log (
    practice_id,
    preference_id,
    action,
    email,
    preference_type,
    previous_status,
    new_status,
    previous_subscribed,
    new_subscribed,
    action_source,
    reason
  ) VALUES (
    NEW.practice_id,
    NEW.id,
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'subscribe'::consent_action_enum
      WHEN OLD.consent_status != NEW.consent_status THEN 'update_preferences'::consent_action_enum
      WHEN OLD.is_subscribed != NEW.is_subscribed THEN 
        CASE WHEN NEW.is_subscribed THEN 'subscribe'::consent_action_enum 
             ELSE 'unsubscribe'::consent_action_enum END
      ELSE 'update_preferences'::consent_action_enum
    END,
    NEW.email,
    NEW.preference_type,
    OLD.consent_status,
    NEW.consent_status,
    OLD.is_subscribed,
    NEW.is_subscribed,
    'system',
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'Automatic preference creation'
      WHEN OLD.consent_status != NEW.consent_status THEN 'Consent status updated'
      WHEN OLD.is_subscribed != NEW.is_subscribed THEN 'Subscription status changed'
      ELSE 'Preferences updated'
    END
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for logging consent changes
CREATE TRIGGER trigger_log_consent_change
  AFTER INSERT OR UPDATE ON email_preferences
  FOR EACH ROW
  EXECUTE FUNCTION log_consent_change();

-- ============================================================================
-- STEP 9: INSERT DEFAULT PRACTICE QUOTAS
-- ============================================================================

-- Insert default quotas for existing practices
INSERT INTO practice_email_quotas (practice_id)
SELECT id FROM practices 
WHERE id NOT IN (SELECT practice_id FROM practice_email_quotas);

-- ============================================================================
-- TABLE COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE email_preferences IS 'Granular email preferences and consent tracking per practice';
COMMENT ON TABLE email_consent_log IS 'Comprehensive audit trail for all consent and preference changes';
COMMENT ON TABLE email_suppression_list IS 'Practice-specific email suppression lists for compliance';
COMMENT ON TABLE practice_email_quotas IS 'Practice-level email quotas, rate limits, and compliance settings';

COMMENT ON COLUMN email_preferences.double_opt_in_token IS 'Secure token for double opt-in confirmation';
COMMENT ON COLUMN email_preferences.unsubscribe_token IS 'Secure token for one-click unsubscribe links';
COMMENT ON COLUMN email_consent_log.legal_basis IS 'GDPR legal basis for data processing';
COMMENT ON COLUMN practice_email_quotas.data_retention_days IS 'Days to retain email data for compliance'; 