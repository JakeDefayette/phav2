-- Migration: 002_create_core_tables.sql
-- Description: Create core tables for the PHA platform
-- Author: Database Schema Implementation
-- Date: 2025-05-26

-- ============================================================================
-- CORE USER AND PRACTICE TABLES
-- ============================================================================

-- User profiles (extends Supabase auth.users)
CREATE TABLE user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email varchar(255) NOT NULL UNIQUE,
  first_name varchar(100),
  last_name varchar(100),
  role user_role_enum NOT NULL DEFAULT 'parent',
  practice_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Practices table (includes branding fields)
CREATE TABLE practices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  email varchar(255) NOT NULL,
  phone varchar(50),
  address text,
  website varchar(255),
  subscription_tier subscription_tier_enum NOT NULL DEFAULT 'basic',
  subscription_expires_at timestamptz,
  -- Branding fields (merged from practice_branding)
  logo_url varchar(500),
  primary_color varchar(7) DEFAULT '#3B82F6',
  secondary_color varchar(7) DEFAULT '#10B981',
  custom_css text,
  custom_domain varchar(255),
  -- Settings
  settings jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add foreign key constraint for user_profiles.practice_id
ALTER TABLE user_profiles 
ADD CONSTRAINT fk_user_profiles_practice 
FOREIGN KEY (practice_id) REFERENCES practices(id) ON DELETE SET NULL;

-- Children profiles
CREATE TABLE children (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  first_name varchar(100) NOT NULL,
  last_name varchar(100),
  date_of_birth date NOT NULL,
  gender gender_enum,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- SURVEY SYSTEM TABLES (NEW ARCHITECTURE)
-- ============================================================================

-- Survey question definitions for dynamic surveys
CREATE TABLE survey_question_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text text NOT NULL,
  question_type question_type_enum NOT NULL,
  options jsonb, -- For multiple choice questions
  validation_rules jsonb, -- Validation constraints
  order_index integer NOT NULL,
  is_required boolean NOT NULL DEFAULT true,
  category varchar(100),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Assessments (streamlined without step_*_data)
CREATE TABLE assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  practice_id uuid REFERENCES practices(id) ON DELETE SET NULL,
  status assessment_status_enum NOT NULL DEFAULT 'in_progress',
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  brain_o_meter_score integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Survey responses (replaces step_*_data fields)
CREATE TABLE survey_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES survey_question_definitions(id) ON DELETE CASCADE,
  response_value text, -- Flexible storage for any response type
  response_data jsonb, -- Additional structured data if needed
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Ensure one response per question per assessment
  UNIQUE(assessment_id, question_id)
);

-- ============================================================================
-- REPORTS AND SHARING SYSTEM
-- ============================================================================

-- Reports
CREATE TABLE reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  practice_id uuid REFERENCES practices(id) ON DELETE SET NULL,
  content jsonb NOT NULL,
  share_token varchar(255) UNIQUE,
  is_public boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Report shares for viral tracking
CREATE TABLE report_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  shared_by_user_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  recipient_email varchar(255),
  recipient_phone varchar(50),
  share_method share_method_enum NOT NULL,
  share_token varchar(255) NOT NULL,
  viewed_at timestamptz,
  converted_to_assessment boolean NOT NULL DEFAULT false,
  conversion_assessment_id uuid REFERENCES assessments(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  
  -- Ensure at least one recipient method
  CONSTRAINT check_recipient CHECK (
    recipient_email IS NOT NULL OR recipient_phone IS NOT NULL
  )
);

-- ============================================================================
-- EMAIL SYSTEM TABLES
-- ============================================================================

-- Email templates
CREATE TABLE email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id uuid REFERENCES practices(id) ON DELETE CASCADE,
  name varchar(255) NOT NULL,
  template_type email_template_type_enum NOT NULL,
  subject varchar(500) NOT NULL,
  html_content text NOT NULL,
  text_content text,
  variables jsonb DEFAULT '[]', -- Available template variables
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Email campaigns
CREATE TABLE email_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id uuid NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  name varchar(255) NOT NULL,
  subject varchar(500) NOT NULL,
  html_content text NOT NULL,
  text_content text,
  status campaign_status_enum NOT NULL DEFAULT 'draft',
  scheduled_at timestamptz,
  sent_at timestamptz,
  recipient_count integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Email subscribers
CREATE TABLE email_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id uuid NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  email varchar(255) NOT NULL,
  first_name varchar(100),
  last_name varchar(100),
  is_active boolean NOT NULL DEFAULT true,
  source subscription_source_enum NOT NULL DEFAULT 'website',
  subscribed_at timestamptz NOT NULL DEFAULT now(),
  unsubscribed_at timestamptz,
  
  -- Unique email per practice
  UNIQUE(practice_id, email)
);

-- Email sends (detailed tracking)
CREATE TABLE email_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES email_campaigns(id) ON DELETE CASCADE,
  template_id uuid REFERENCES email_templates(id) ON DELETE SET NULL,
  subscriber_id uuid REFERENCES email_subscribers(id) ON DELETE CASCADE,
  recipient_email varchar(255) NOT NULL,
  status email_status_enum NOT NULL DEFAULT 'pending',
  sent_at timestamptz,
  delivered_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  bounced_at timestamptz,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  
  -- Ensure either campaign or template is specified
  CONSTRAINT check_email_source CHECK (
    campaign_id IS NOT NULL OR template_id IS NOT NULL
  )
);

-- ============================================================================
-- ANALYTICS TABLE
-- ============================================================================

-- Practice analytics
CREATE TABLE practice_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id uuid NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  metric_name analytics_metric_enum NOT NULL,
  metric_value numeric NOT NULL DEFAULT 0,
  time_period varchar(50) NOT NULL, -- 'daily', 'weekly', 'monthly', 'yearly'
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Unique metric per practice per time period
  UNIQUE(practice_id, metric_name, time_period, period_start)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- User profiles indexes
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_practice_id ON user_profiles(practice_id);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);

-- Practices indexes
CREATE INDEX idx_practices_subscription_tier ON practices(subscription_tier);
CREATE INDEX idx_practices_custom_domain ON practices(custom_domain) WHERE custom_domain IS NOT NULL;

-- Children indexes
CREATE INDEX idx_children_parent_id ON children(parent_id);
CREATE INDEX idx_children_date_of_birth ON children(date_of_birth);

-- Survey question definitions indexes
CREATE INDEX idx_survey_questions_category ON survey_question_definitions(category);
CREATE INDEX idx_survey_questions_order ON survey_question_definitions(order_index);

-- Assessments indexes
CREATE INDEX idx_assessments_child_id ON assessments(child_id);
CREATE INDEX idx_assessments_practice_id ON assessments(practice_id);
CREATE INDEX idx_assessments_status ON assessments(status);
CREATE INDEX idx_assessments_completed_at ON assessments(completed_at);

-- Survey responses indexes
CREATE INDEX idx_survey_responses_assessment_id ON survey_responses(assessment_id);
CREATE INDEX idx_survey_responses_question_id ON survey_responses(question_id);

-- Reports indexes
CREATE INDEX idx_reports_assessment_id ON reports(assessment_id);
CREATE INDEX idx_reports_practice_id ON reports(practice_id);
CREATE INDEX idx_reports_share_token ON reports(share_token) WHERE share_token IS NOT NULL;
CREATE INDEX idx_reports_is_public ON reports(is_public);

-- Report shares indexes
CREATE INDEX idx_report_shares_report_id ON report_shares(report_id);
CREATE INDEX idx_report_shares_shared_by ON report_shares(shared_by_user_id);
CREATE INDEX idx_report_shares_recipient_email ON report_shares(recipient_email);
CREATE INDEX idx_report_shares_share_token ON report_shares(share_token);
CREATE INDEX idx_report_shares_converted ON report_shares(converted_to_assessment);

-- Email templates indexes
CREATE INDEX idx_email_templates_practice_id ON email_templates(practice_id);
CREATE INDEX idx_email_templates_type ON email_templates(template_type);
CREATE INDEX idx_email_templates_active ON email_templates(is_active);

-- Email campaigns indexes
CREATE INDEX idx_email_campaigns_practice_id ON email_campaigns(practice_id);
CREATE INDEX idx_email_campaigns_status ON email_campaigns(status);
CREATE INDEX idx_email_campaigns_scheduled_at ON email_campaigns(scheduled_at);

-- Email subscribers indexes
CREATE INDEX idx_email_subscribers_practice_id ON email_subscribers(practice_id);
CREATE INDEX idx_email_subscribers_email ON email_subscribers(email);
CREATE INDEX idx_email_subscribers_active ON email_subscribers(is_active);
CREATE INDEX idx_email_subscribers_source ON email_subscribers(source);

-- Email sends indexes
CREATE INDEX idx_email_sends_campaign_id ON email_sends(campaign_id);
CREATE INDEX idx_email_sends_template_id ON email_sends(template_id);
CREATE INDEX idx_email_sends_subscriber_id ON email_sends(subscriber_id);
CREATE INDEX idx_email_sends_status ON email_sends(status);
CREATE INDEX idx_email_sends_recipient_email ON email_sends(recipient_email);

-- Practice analytics indexes
CREATE INDEX idx_practice_analytics_practice_id ON practice_analytics(practice_id);
CREATE INDEX idx_practice_analytics_metric ON practice_analytics(metric_name);
CREATE INDEX idx_practice_analytics_period ON practice_analytics(time_period, period_start);

-- ============================================================================
-- TABLE COMMENTS
-- ============================================================================

COMMENT ON TABLE user_profiles IS 'User profiles extending Supabase auth with role-based access';
COMMENT ON TABLE practices IS 'Practice information including branding and subscription details';
COMMENT ON TABLE children IS 'Child profiles linked to parent users';
COMMENT ON TABLE survey_question_definitions IS 'Dynamic survey question configuration';
COMMENT ON TABLE assessments IS 'Assessment sessions for children';
COMMENT ON TABLE survey_responses IS 'Normalized survey responses replacing step-based data';
COMMENT ON TABLE reports IS 'Generated assessment reports with sharing capabilities';
COMMENT ON TABLE report_shares IS 'Viral tracking for report sharing and conversions';
COMMENT ON TABLE email_templates IS 'Reusable email templates for different purposes';
COMMENT ON TABLE email_campaigns IS 'Email marketing campaigns';
COMMENT ON TABLE email_subscribers IS 'Email subscription management';
COMMENT ON TABLE email_sends IS 'Detailed email delivery and engagement tracking';
COMMENT ON TABLE practice_analytics IS 'Analytics metrics for practice reporting and insights'; 