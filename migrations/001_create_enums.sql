-- Migration: 001_create_enums.sql
-- Description: Create all custom enum types for the PHA platform
-- Author: Database Schema Implementation
-- Date: 2025-05-26

-- User roles
CREATE TYPE user_role_enum AS ENUM ('parent', 'practitioner', 'admin');

-- Subscription tiers
CREATE TYPE subscription_tier_enum AS ENUM ('basic', 'premium', 'enterprise');

-- Gender options
CREATE TYPE gender_enum AS ENUM ('male', 'female', 'other', 'prefer_not_to_say');

-- Assessment status
CREATE TYPE assessment_status_enum AS ENUM ('in_progress', 'completed', 'abandoned');

-- Question types for dynamic surveys
CREATE TYPE question_type_enum AS ENUM ('multiple_choice', 'text', 'number', 'boolean', 'scale', 'date');

-- Share methods for viral tracking
CREATE TYPE share_method_enum AS ENUM ('email', 'sms', 'social', 'direct_link');

-- Email template types
CREATE TYPE email_template_type_enum AS ENUM ('welcome', 'assessment_complete', 'report_share', 'campaign', 'reminder');

-- Campaign status
CREATE TYPE campaign_status_enum AS ENUM ('draft', 'scheduled', 'sending', 'sent', 'cancelled');

-- Subscription sources
CREATE TYPE subscription_source_enum AS ENUM ('website', 'assessment', 'referral', 'import');

-- Email delivery status
CREATE TYPE email_status_enum AS ENUM ('pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed');

-- Analytics metrics
CREATE TYPE analytics_metric_enum AS ENUM (
  'assessments_completed', 
  'reports_generated', 
  'reports_shared', 
  'email_opens', 
  'email_clicks', 
  'referrals_generated', 
  'conversion_rate'
);

-- Add comments for documentation
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