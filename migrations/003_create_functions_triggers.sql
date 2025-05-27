-- Migration: 003_create_functions_triggers.sql
-- Description: Create database functions, triggers, and RLS policies
-- Author: Database Schema Implementation
-- Date: 2025-05-26

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to generate share tokens
CREATE OR REPLACE FUNCTION generate_share_token()
RETURNS varchar(255) AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'base64url');
END;
$$ language 'plpgsql';

-- Function to calculate brain-o-meter score (placeholder implementation)
CREATE OR REPLACE FUNCTION calculate_brain_o_meter_score(assessment_uuid uuid)
RETURNS integer AS $$
DECLARE
  score integer := 0;
  response_count integer := 0;
BEGIN
  -- Count total responses for this assessment
  SELECT COUNT(*) INTO response_count
  FROM survey_responses 
  WHERE assessment_id = assessment_uuid;
  
  -- Simple scoring algorithm (to be enhanced based on actual requirements)
  -- This is a placeholder - actual implementation would be based on specific scoring rules
  score := LEAST(100, response_count * 10);
  
  RETURN score;
END;
$$ language 'plpgsql';

-- Function to get practice statistics
CREATE OR REPLACE FUNCTION get_practice_stats(practice_uuid uuid)
RETURNS jsonb AS $$
DECLARE
  stats jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_assessments', (
      SELECT COUNT(*) FROM assessments WHERE practice_id = practice_uuid
    ),
    'completed_assessments', (
      SELECT COUNT(*) FROM assessments 
      WHERE practice_id = practice_uuid AND status = 'completed'
    ),
    'total_reports', (
      SELECT COUNT(*) FROM reports WHERE practice_id = practice_uuid
    ),
    'total_shares', (
      SELECT COUNT(*) FROM report_shares rs
      JOIN reports r ON rs.report_id = r.id
      WHERE r.practice_id = practice_uuid
    ),
    'email_subscribers', (
      SELECT COUNT(*) FROM email_subscribers 
      WHERE practice_id = practice_uuid AND is_active = true
    ),
    'conversion_rate', (
      SELECT CASE 
        WHEN COUNT(*) > 0 THEN 
          ROUND((COUNT(*) FILTER (WHERE converted_to_assessment = true)::numeric / COUNT(*)) * 100, 2)
        ELSE 0 
      END
      FROM report_shares rs
      JOIN reports r ON rs.report_id = r.id
      WHERE r.practice_id = practice_uuid
    )
  ) INTO stats;
  
  RETURN stats;
END;
$$ language 'plpgsql';

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- ============================================================================

-- User profiles
CREATE TRIGGER trigger_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Practices
CREATE TRIGGER trigger_practices_updated_at
  BEFORE UPDATE ON practices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Children
CREATE TRIGGER trigger_children_updated_at
  BEFORE UPDATE ON children
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Survey question definitions
CREATE TRIGGER trigger_survey_question_definitions_updated_at
  BEFORE UPDATE ON survey_question_definitions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Assessments
CREATE TRIGGER trigger_assessments_updated_at
  BEFORE UPDATE ON assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Survey responses
CREATE TRIGGER trigger_survey_responses_updated_at
  BEFORE UPDATE ON survey_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Reports
CREATE TRIGGER trigger_reports_updated_at
  BEFORE UPDATE ON reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Email templates
CREATE TRIGGER trigger_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Email campaigns
CREATE TRIGGER trigger_email_campaigns_updated_at
  BEFORE UPDATE ON email_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Practice analytics
CREATE TRIGGER trigger_practice_analytics_updated_at
  BEFORE UPDATE ON practice_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC SHARE TOKEN GENERATION
-- ============================================================================

-- Generate share token for reports when needed
CREATE OR REPLACE FUNCTION generate_report_share_token()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_public = true AND NEW.share_token IS NULL THEN
    NEW.share_token = generate_share_token();
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_reports_share_token
  BEFORE INSERT OR UPDATE ON reports
  FOR EACH ROW
  EXECUTE FUNCTION generate_report_share_token();

-- ============================================================================
-- TRIGGERS FOR BRAIN-O-METER SCORE CALCULATION
-- ============================================================================

-- Update brain-o-meter score when assessment is completed
CREATE OR REPLACE FUNCTION update_brain_o_meter_score()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    NEW.brain_o_meter_score = calculate_brain_o_meter_score(NEW.id);
    NEW.completed_at = now();
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_assessments_brain_o_meter
  BEFORE UPDATE ON assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_brain_o_meter_score();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE practices ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_question_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sends ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_analytics ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES FOR USER_PROFILES
-- ============================================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Practitioners can view profiles in their practice
CREATE POLICY "Practitioners can view practice profiles" ON user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() 
      AND up.role = 'practitioner'
      AND up.practice_id = user_profiles.practice_id
    )
  );

-- ============================================================================
-- RLS POLICIES FOR PRACTICES
-- ============================================================================

-- Practice members can view their practice
CREATE POLICY "Practice members can view practice" ON practices
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.practice_id = practices.id
    )
  );

-- Practitioners can update their practice
CREATE POLICY "Practitioners can update practice" ON practices
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() 
      AND up.role = 'practitioner'
      AND up.practice_id = practices.id
    )
  );

-- ============================================================================
-- RLS POLICIES FOR CHILDREN
-- ============================================================================

-- Parents can manage their own children
CREATE POLICY "Parents can manage own children" ON children
  FOR ALL USING (parent_id = auth.uid());

-- Practitioners can view children in their practice
CREATE POLICY "Practitioners can view practice children" ON children
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN user_profiles parent ON parent.id = children.parent_id
      WHERE up.id = auth.uid() 
      AND up.role = 'practitioner'
      AND up.practice_id = parent.practice_id
    )
  );

-- ============================================================================
-- RLS POLICIES FOR ASSESSMENTS
-- ============================================================================

-- Parents can manage assessments for their children
CREATE POLICY "Parents can manage child assessments" ON assessments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM children c
      WHERE c.id = assessments.child_id AND c.parent_id = auth.uid()
    )
  );

-- Practitioners can view assessments in their practice
CREATE POLICY "Practitioners can view practice assessments" ON assessments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() 
      AND up.role = 'practitioner'
      AND up.practice_id = assessments.practice_id
    )
  );

-- ============================================================================
-- RLS POLICIES FOR SURVEY_RESPONSES
-- ============================================================================

-- Parents can manage responses for their children's assessments
CREATE POLICY "Parents can manage child survey responses" ON survey_responses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM assessments a
      JOIN children c ON c.id = a.child_id
      WHERE a.id = survey_responses.assessment_id AND c.parent_id = auth.uid()
    )
  );

-- Practitioners can view responses in their practice
CREATE POLICY "Practitioners can view practice survey responses" ON survey_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM assessments a
      JOIN user_profiles up ON up.id = auth.uid()
      WHERE a.id = survey_responses.assessment_id 
      AND up.role = 'practitioner'
      AND up.practice_id = a.practice_id
    )
  );

-- ============================================================================
-- RLS POLICIES FOR REPORTS
-- ============================================================================

-- Parents can view reports for their children
CREATE POLICY "Parents can view child reports" ON reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM assessments a
      JOIN children c ON c.id = a.child_id
      WHERE a.id = reports.assessment_id AND c.parent_id = auth.uid()
    )
  );

-- Public reports can be viewed by anyone with share token
CREATE POLICY "Public reports viewable with share token" ON reports
  FOR SELECT USING (is_public = true);

-- Practitioners can view reports in their practice
CREATE POLICY "Practitioners can view practice reports" ON reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() 
      AND up.role = 'practitioner'
      AND up.practice_id = reports.practice_id
    )
  );

-- ============================================================================
-- RLS POLICIES FOR EMAIL SYSTEM
-- ============================================================================

-- Practice members can manage email templates
CREATE POLICY "Practice members can manage email templates" ON email_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.practice_id = email_templates.practice_id
    )
  );

-- Practice members can manage email campaigns
CREATE POLICY "Practice members can manage email campaigns" ON email_campaigns
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.practice_id = email_campaigns.practice_id
    )
  );

-- Practice members can manage email subscribers
CREATE POLICY "Practice members can manage email subscribers" ON email_subscribers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.practice_id = email_subscribers.practice_id
    )
  );

-- Practice members can view email sends
CREATE POLICY "Practice members can view email sends" ON email_sends
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM email_campaigns ec
      JOIN user_profiles up ON up.id = auth.uid()
      WHERE ec.id = email_sends.campaign_id AND up.practice_id = ec.practice_id
    ) OR EXISTS (
      SELECT 1 FROM email_templates et
      JOIN user_profiles up ON up.id = auth.uid()
      WHERE et.id = email_sends.template_id AND up.practice_id = et.practice_id
    )
  );

-- ============================================================================
-- RLS POLICIES FOR ANALYTICS
-- ============================================================================

-- Practice members can view analytics
CREATE POLICY "Practice members can view analytics" ON practice_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.practice_id = practice_analytics.practice_id
    )
  );

-- ============================================================================
-- SURVEY QUESTION DEFINITIONS (PUBLIC READ)
-- ============================================================================

-- Survey questions are publicly readable (for assessment forms)
CREATE POLICY "Survey questions are publicly readable" ON survey_question_definitions
  FOR SELECT USING (true);

-- Only admins can modify survey questions
CREATE POLICY "Only admins can modify survey questions" ON survey_question_definitions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'admin'
    )
  );

-- ============================================================================
-- REPORT SHARES POLICIES
-- ============================================================================

-- Users can view shares they created
CREATE POLICY "Users can view own shares" ON report_shares
  FOR SELECT USING (shared_by_user_id = auth.uid());

-- Users can create shares for reports they have access to
CREATE POLICY "Users can create shares for accessible reports" ON report_shares
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM reports r
      JOIN assessments a ON a.id = r.assessment_id
      JOIN children c ON c.id = a.child_id
      WHERE r.id = report_shares.report_id AND c.parent_id = auth.uid()
    )
  );

-- Practitioners can view shares in their practice
CREATE POLICY "Practitioners can view practice shares" ON report_shares
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM reports r
      JOIN user_profiles up ON up.id = auth.uid()
      WHERE r.id = report_shares.report_id 
      AND up.role = 'practitioner'
      AND up.practice_id = r.practice_id
    )
  ); 