-- Robust Migration: Create enums and core tables for PHA platform
-- Description: Enhanced migration with verification steps and better error handling
-- Author: Database Schema Implementation
-- Date: 2025-05-26

-- ============================================================================
-- STEP 1: CREATE ALL ENUM TYPES WITH VERIFICATION
-- ============================================================================

-- User roles
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_enum') THEN
        CREATE TYPE user_role_enum AS ENUM ('parent', 'practitioner', 'admin');
        RAISE NOTICE 'Created user_role_enum';
    ELSE
        RAISE NOTICE 'user_role_enum already exists';
    END IF;
END $$;

-- Subscription tiers
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_tier_enum') THEN
        CREATE TYPE subscription_tier_enum AS ENUM ('basic', 'premium', 'enterprise');
        RAISE NOTICE 'Created subscription_tier_enum';
    ELSE
        RAISE NOTICE 'subscription_tier_enum already exists';
    END IF;
END $$;

-- Gender options
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gender_enum') THEN
        CREATE TYPE gender_enum AS ENUM ('male', 'female', 'other', 'prefer_not_to_say');
        RAISE NOTICE 'Created gender_enum';
    ELSE
        RAISE NOTICE 'gender_enum already exists';
    END IF;
END $$;

-- Assessment status
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'assessment_status_enum') THEN
        CREATE TYPE assessment_status_enum AS ENUM ('in_progress', 'completed', 'abandoned');
        RAISE NOTICE 'Created assessment_status_enum';
    ELSE
        RAISE NOTICE 'assessment_status_enum already exists';
    END IF;
END $$;

-- Question types for dynamic surveys
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'question_type_enum') THEN
        CREATE TYPE question_type_enum AS ENUM ('multiple_choice', 'text', 'number', 'boolean', 'scale', 'date');
        RAISE NOTICE 'Created question_type_enum';
    ELSE
        RAISE NOTICE 'question_type_enum already exists';
    END IF;
END $$;

-- Share methods for viral tracking
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'share_method_enum') THEN
        CREATE TYPE share_method_enum AS ENUM ('email', 'sms', 'social', 'direct_link');
        RAISE NOTICE 'Created share_method_enum';
    ELSE
        RAISE NOTICE 'share_method_enum already exists';
    END IF;
END $$;

-- Email template types
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'email_template_type_enum') THEN
        CREATE TYPE email_template_type_enum AS ENUM ('welcome', 'assessment_complete', 'report_share', 'campaign', 'reminder');
        RAISE NOTICE 'Created email_template_type_enum';
    ELSE
        RAISE NOTICE 'email_template_type_enum already exists';
    END IF;
END $$;

-- Campaign status
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'campaign_status_enum') THEN
        CREATE TYPE campaign_status_enum AS ENUM ('draft', 'scheduled', 'sending', 'sent', 'cancelled');
        RAISE NOTICE 'Created campaign_status_enum';
    ELSE
        RAISE NOTICE 'campaign_status_enum already exists';
    END IF;
END $$;

-- Subscription sources
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_source_enum') THEN
        CREATE TYPE subscription_source_enum AS ENUM ('website', 'assessment', 'referral', 'import');
        RAISE NOTICE 'Created subscription_source_enum';
    ELSE
        RAISE NOTICE 'subscription_source_enum already exists';
    END IF;
END $$;

-- Email delivery status
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'email_status_enum') THEN
        CREATE TYPE email_status_enum AS ENUM ('pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed');
        RAISE NOTICE 'Created email_status_enum';
    ELSE
        RAISE NOTICE 'email_status_enum already exists';
    END IF;
END $$;

-- Analytics metrics
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'analytics_metric_enum') THEN
        CREATE TYPE analytics_metric_enum AS ENUM (
            'assessments_completed', 
            'reports_generated', 
            'reports_shared', 
            'email_opens', 
            'email_clicks', 
            'referrals_generated', 
            'conversion_rate'
        );
        RAISE NOTICE 'Created analytics_metric_enum';
    ELSE
        RAISE NOTICE 'analytics_metric_enum already exists';
    END IF;
END $$;

-- ============================================================================
-- STEP 2: VERIFY ALL ENUMS EXIST BEFORE PROCEEDING
-- ============================================================================

DO $$
DECLARE
    missing_enums text[] := ARRAY[]::text[];
BEGIN
    -- Check for all required enums
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_enum') THEN
        missing_enums := array_append(missing_enums, 'user_role_enum');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_tier_enum') THEN
        missing_enums := array_append(missing_enums, 'subscription_tier_enum');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gender_enum') THEN
        missing_enums := array_append(missing_enums, 'gender_enum');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'assessment_status_enum') THEN
        missing_enums := array_append(missing_enums, 'assessment_status_enum');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'question_type_enum') THEN
        missing_enums := array_append(missing_enums, 'question_type_enum');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'share_method_enum') THEN
        missing_enums := array_append(missing_enums, 'share_method_enum');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'email_template_type_enum') THEN
        missing_enums := array_append(missing_enums, 'email_template_type_enum');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'campaign_status_enum') THEN
        missing_enums := array_append(missing_enums, 'campaign_status_enum');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_source_enum') THEN
        missing_enums := array_append(missing_enums, 'subscription_source_enum');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'email_status_enum') THEN
        missing_enums := array_append(missing_enums, 'email_status_enum');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'analytics_metric_enum') THEN
        missing_enums := array_append(missing_enums, 'analytics_metric_enum');
    END IF;
    
    -- If any enums are missing, raise an error
    IF array_length(missing_enums, 1) > 0 THEN
        RAISE EXCEPTION 'Missing required enum types: %', array_to_string(missing_enums, ', ');
    ELSE
        RAISE NOTICE 'All required enum types verified successfully';
    END IF;
END $$;

-- ============================================================================
-- STEP 3: CREATE CORE TABLES (AFTER ENUM VERIFICATION)
-- ============================================================================

-- Practices table (create first to avoid circular dependency)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'practices') THEN
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
        RAISE NOTICE 'Created practices table';
    ELSE
        RAISE NOTICE 'practices table already exists';
    END IF;
END $$;

-- User profiles (extends Supabase auth.users) - create without foreign key first
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
        CREATE TABLE user_profiles (
          id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
          email varchar(255) NOT NULL UNIQUE,
          first_name varchar(100),
          last_name varchar(100),
          role user_role_enum NOT NULL DEFAULT 'parent',
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        );
        RAISE NOTICE 'Created user_profiles table';
    ELSE
        RAISE NOTICE 'user_profiles table already exists';
    END IF;
END $$;

-- Add practice_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND column_name = 'practice_id'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN practice_id uuid;
    RAISE NOTICE 'Added practice_id column to user_profiles';
  ELSE
    RAISE NOTICE 'practice_id column already exists in user_profiles';
  END IF;
END $$;

-- Add foreign key constraint for user_profiles.practice_id (only if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_user_profiles_practice'
    AND table_name = 'user_profiles'
  ) THEN
    ALTER TABLE user_profiles 
    ADD CONSTRAINT fk_user_profiles_practice 
    FOREIGN KEY (practice_id) REFERENCES practices(id) ON DELETE SET NULL;
    RAISE NOTICE 'Added foreign key constraint fk_user_profiles_practice';
  ELSE
    RAISE NOTICE 'Foreign key constraint fk_user_profiles_practice already exists';
  END IF;
END $$;

-- Children profiles
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'children') THEN
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
        RAISE NOTICE 'Created children table';
    ELSE
        RAISE NOTICE 'children table already exists';
    END IF;
END $$;

-- Survey question definitions for dynamic surveys
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'survey_question_definitions') THEN
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
        RAISE NOTICE 'Created survey_question_definitions table';
    ELSE
        RAISE NOTICE 'survey_question_definitions table already exists';
    END IF;
END $$;

-- Assessments (streamlined without step_*_data)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'assessments') THEN
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
        RAISE NOTICE 'Created assessments table';
    ELSE
        RAISE NOTICE 'assessments table already exists';
    END IF;
END $$;

-- Survey responses (replaces step_*_data fields)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'survey_responses') THEN
        CREATE TABLE survey_responses (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          assessment_id uuid NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
          question_id uuid NOT NULL REFERENCES survey_question_definitions(id) ON DELETE CASCADE,
          response_value text, -- Flexible storage for any response type
          response_data jsonb, -- Additional structured data if needed
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        );
        RAISE NOTICE 'Created survey_responses table';
    ELSE
        RAISE NOTICE 'survey_responses table already exists';
    END IF;
END $$;

-- Reports
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reports') THEN
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
        RAISE NOTICE 'Created reports table';
    ELSE
        RAISE NOTICE 'reports table already exists';
    END IF;
END $$;

-- Report shares for viral tracking
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'report_shares') THEN
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
          created_at timestamptz NOT NULL DEFAULT now()
        );
        RAISE NOTICE 'Created report_shares table';
    ELSE
        RAISE NOTICE 'report_shares table already exists';
    END IF;
END $$;

-- Email templates
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_templates') THEN
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
        RAISE NOTICE 'Created email_templates table';
    ELSE
        RAISE NOTICE 'email_templates table already exists';
    END IF;
END $$;

-- Email campaigns
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_campaigns') THEN
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
        RAISE NOTICE 'Created email_campaigns table';
    ELSE
        RAISE NOTICE 'email_campaigns table already exists';
    END IF;
END $$;

-- Email subscribers
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_subscribers') THEN
        CREATE TABLE email_subscribers (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          practice_id uuid NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
          email varchar(255) NOT NULL,
          first_name varchar(100),
          last_name varchar(100),
          is_active boolean NOT NULL DEFAULT true,
          source subscription_source_enum NOT NULL DEFAULT 'website',
          subscribed_at timestamptz NOT NULL DEFAULT now(),
          unsubscribed_at timestamptz
        );
        RAISE NOTICE 'Created email_subscribers table';
    ELSE
        RAISE NOTICE 'email_subscribers table already exists';
    END IF;
END $$;

-- Email sends (detailed tracking) - DROP AND RECREATE
DROP TABLE IF EXISTS email_sends CASCADE;

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
  
  -- Add constraint inline
  CONSTRAINT check_email_source CHECK (
    campaign_id IS NOT NULL OR template_id IS NOT NULL
  )
);

-- Practice analytics
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'practice_analytics') THEN
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
          updated_at timestamptz NOT NULL DEFAULT now()
        );
        RAISE NOTICE 'Created practice_analytics table';
    ELSE
        RAISE NOTICE 'practice_analytics table already exists';
    END IF;
END $$;

-- ============================================================================
-- STEP 4: ADD CONSTRAINTS (AFTER ALL TABLES EXIST)
-- ============================================================================

-- Add unique constraint for survey_responses (only if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'survey_responses_assessment_id_question_id_key'
    AND table_name = 'survey_responses'
  ) THEN
    ALTER TABLE survey_responses 
    ADD CONSTRAINT survey_responses_assessment_id_question_id_key 
    UNIQUE(assessment_id, question_id);
    RAISE NOTICE 'Added unique constraint survey_responses_assessment_id_question_id_key';
  ELSE
    RAISE NOTICE 'Unique constraint survey_responses_assessment_id_question_id_key already exists';
  END IF;
END $$;

-- Add check constraint for report_shares (only if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'check_recipient'
    AND table_name = 'report_shares'
  ) THEN
    ALTER TABLE report_shares 
    ADD CONSTRAINT check_recipient CHECK (
      recipient_email IS NOT NULL OR recipient_phone IS NOT NULL
    );
    RAISE NOTICE 'Added check constraint check_recipient';
  ELSE
    RAISE NOTICE 'Check constraint check_recipient already exists';
  END IF;
END $$;

-- Add unique constraint for email_subscribers (only if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'email_subscribers_practice_id_email_key'
    AND table_name = 'email_subscribers'
  ) THEN
    ALTER TABLE email_subscribers 
    ADD CONSTRAINT email_subscribers_practice_id_email_key 
    UNIQUE(practice_id, email);
    RAISE NOTICE 'Added unique constraint email_subscribers_practice_id_email_key';
  ELSE
    RAISE NOTICE 'Unique constraint email_subscribers_practice_id_email_key already exists';
  END IF;
END $$;

-- Add unique constraint for practice_analytics (only if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'practice_analytics_practice_id_metric_name_time_period_key'
    AND table_name = 'practice_analytics'
  ) THEN
    ALTER TABLE practice_analytics 
    ADD CONSTRAINT practice_analytics_practice_id_metric_name_time_period_key 
    UNIQUE(practice_id, metric_name, time_period, period_start);
    RAISE NOTICE 'Added unique constraint practice_analytics_practice_id_metric_name_time_period_key';
  ELSE
    RAISE NOTICE 'Unique constraint practice_analytics_practice_id_metric_name_time_period_key already exists';
  END IF;
END $$;

-- ============================================================================
-- STEP 5: CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- User profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_practice_id ON user_profiles(practice_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);

-- Practices indexes
CREATE INDEX IF NOT EXISTS idx_practices_subscription_tier ON practices(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_practices_custom_domain ON practices(custom_domain) WHERE custom_domain IS NOT NULL;

-- Children indexes
CREATE INDEX IF NOT EXISTS idx_children_parent_id ON children(parent_id);
CREATE INDEX IF NOT EXISTS idx_children_date_of_birth ON children(date_of_birth);

-- Survey question definitions indexes
CREATE INDEX IF NOT EXISTS idx_survey_questions_category ON survey_question_definitions(category);
CREATE INDEX IF NOT EXISTS idx_survey_questions_order ON survey_question_definitions(order_index);

-- Assessments indexes
CREATE INDEX IF NOT EXISTS idx_assessments_child_id ON assessments(child_id);
CREATE INDEX IF NOT EXISTS idx_assessments_practice_id ON assessments(practice_id);
CREATE INDEX IF NOT EXISTS idx_assessments_status ON assessments(status);
CREATE INDEX IF NOT EXISTS idx_assessments_completed_at ON assessments(completed_at);

-- Survey responses indexes
CREATE INDEX IF NOT EXISTS idx_survey_responses_assessment_id ON survey_responses(assessment_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_question_id ON survey_responses(question_id);

-- Reports indexes
CREATE INDEX IF NOT EXISTS idx_reports_assessment_id ON reports(assessment_id);
CREATE INDEX IF NOT EXISTS idx_reports_practice_id ON reports(practice_id);
CREATE INDEX IF NOT EXISTS idx_reports_share_token ON reports(share_token) WHERE share_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reports_is_public ON reports(is_public);

-- Report shares indexes
CREATE INDEX IF NOT EXISTS idx_report_shares_report_id ON report_shares(report_id);
CREATE INDEX IF NOT EXISTS idx_report_shares_shared_by ON report_shares(shared_by_user_id);
CREATE INDEX IF NOT EXISTS idx_report_shares_recipient_email ON report_shares(recipient_email);
CREATE INDEX IF NOT EXISTS idx_report_shares_share_token ON report_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_report_shares_converted ON report_shares(converted_to_assessment);

-- Email templates indexes
CREATE INDEX IF NOT EXISTS idx_email_templates_practice_id ON email_templates(practice_id);
CREATE INDEX IF NOT EXISTS idx_email_templates_type ON email_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_email_templates_active ON email_templates(is_active);

-- Email campaigns indexes
CREATE INDEX IF NOT EXISTS idx_email_campaigns_practice_id ON email_campaigns(practice_id);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON email_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_scheduled_at ON email_campaigns(scheduled_at);

-- Email subscribers indexes
CREATE INDEX IF NOT EXISTS idx_email_subscribers_practice_id ON email_subscribers(practice_id);
CREATE INDEX IF NOT EXISTS idx_email_subscribers_email ON email_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_email_subscribers_active ON email_subscribers(is_active);
CREATE INDEX IF NOT EXISTS idx_email_subscribers_source ON email_subscribers(source);

-- Email sends indexes
CREATE INDEX IF NOT EXISTS idx_email_sends_campaign_id ON email_sends(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_sends_template_id ON email_sends(template_id);
CREATE INDEX IF NOT EXISTS idx_email_sends_subscriber_id ON email_sends(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_email_sends_status ON email_sends(status);
CREATE INDEX IF NOT EXISTS idx_email_sends_recipient_email ON email_sends(recipient_email);

-- Practice analytics indexes
CREATE INDEX IF NOT EXISTS idx_practice_analytics_practice_id ON practice_analytics(practice_id);
CREATE INDEX IF NOT EXISTS idx_practice_analytics_metric ON practice_analytics(metric_name);
CREATE INDEX IF NOT EXISTS idx_practice_analytics_period ON practice_analytics(time_period, period_start);

-- ============================================================================
-- STEP 6: ADD TABLE COMMENTS
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

-- Add enum comments for documentation
COMMENT ON TYPE user_role_enum IS 'User roles in the system: parent (default), practitioner, admin';
COMMENT ON TYPE subscription_tier_enum IS 'Practice subscription tiers with different feature access';
COMMENT ON TYPE gender_enum IS 'Gender options for child profiles with privacy consideration';
COMMENT ON TYPE assessment_status_enum IS 'Assessment completion status tracking';
COMMENT ON TYPE question_type_enum IS 'Survey question types for dynamic survey configuration';
COMMENT ON TYPE share_method_enum IS 'Methods for sharing reports for viral tracking';
COMMENT ON TYPE email_template_type_enum IS 'Email template categories for different use cases';
COMMENT ON TYPE campaign_status_enum IS 'Email campaign lifecycle status';
COMMENT ON TYPE subscription_source_enum IS 'Source tracking for email subscriptions';
COMMENT ON TYPE email_status_enum IS 'Email delivery and engagement status tracking';
COMMENT ON TYPE analytics_metric_enum IS 'Predefined analytics metrics for practice reporting';

-- ============================================================================
-- FINAL VERIFICATION
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE 'All enum types and tables have been created with proper verification.';
END $$; 