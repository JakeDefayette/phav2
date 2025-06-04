-- Migration: Add Email Template Versioning System
-- Created: 2024-06-02
-- Description: Adds version control for email templates with history tracking

-- Create email_template_versions table
CREATE TABLE email_template_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES email_templates(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  template_type VARCHAR(50) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  variables JSONB DEFAULT '[]'::jsonb,
  change_description TEXT,
  is_published BOOLEAN DEFAULT false,
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique version numbers per template
  UNIQUE(template_id, version_number)
);

-- Create index for performance
CREATE INDEX idx_email_template_versions_template_id ON email_template_versions(template_id);
CREATE INDEX idx_email_template_versions_created_at ON email_template_versions(created_at);
CREATE INDEX idx_email_template_versions_published ON email_template_versions(is_published);

-- Add version tracking to existing email_templates table
ALTER TABLE email_templates 
ADD COLUMN current_version INTEGER DEFAULT 1,
ADD COLUMN version_description TEXT;

-- Create function to auto-increment version numbers
CREATE OR REPLACE FUNCTION get_next_template_version(template_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  next_version INTEGER;
BEGIN
  SELECT COALESCE(MAX(version_number), 0) + 1 
  INTO next_version 
  FROM email_template_versions 
  WHERE template_id = template_uuid;
  
  RETURN next_version;
END;
$$ LANGUAGE plpgsql;

-- Create function to create template version on update
CREATE OR REPLACE FUNCTION create_template_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create version if template content actually changed
  IF (OLD.html_content IS DISTINCT FROM NEW.html_content OR 
      OLD.subject IS DISTINCT FROM NEW.subject OR 
      OLD.name IS DISTINCT FROM NEW.name OR
      OLD.variables IS DISTINCT FROM NEW.variables) THEN
    
    -- Insert new version record
    INSERT INTO email_template_versions (
      template_id,
      version_number,
      name,
      template_type,
      subject,
      html_content,
      text_content,
      variables,
      change_description,
      is_published,
      created_by
    ) VALUES (
      NEW.id,
      get_next_template_version(NEW.id),
      NEW.name,
      NEW.template_type,
      NEW.subject,
      NEW.html_content,
      NEW.text_content,
      NEW.variables,
      NEW.version_description,
      true, -- Mark as published since it's the current version
      NEW.updated_by
    );
    
    -- Update current version number in main table
    NEW.current_version := get_next_template_version(NEW.id) - 1;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically version templates on update
CREATE TRIGGER trigger_create_template_version
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION create_template_version();

-- Create initial versions for existing templates
INSERT INTO email_template_versions (
  template_id,
  version_number,
  name,
  template_type,
  subject,
  html_content,
  text_content,
  variables,
  change_description,
  is_published
)
SELECT 
  id,
  1,
  name,
  template_type,
  subject,
  html_content,
  text_content,
  variables,
  'Initial version',
  true
FROM email_templates
WHERE is_active = true;

-- Add updated_by column to email_templates for tracking
ALTER TABLE email_templates 
ADD COLUMN updated_by UUID REFERENCES user_profiles(id);

-- Create view for latest template versions with history
CREATE OR REPLACE VIEW email_templates_with_versions AS
SELECT 
  t.*,
  v.version_number as latest_version,
  v.change_description as latest_change_description,
  COUNT(v_all.id) as total_versions
FROM email_templates t
LEFT JOIN email_template_versions v ON t.id = v.template_id AND v.version_number = t.current_version
LEFT JOIN email_template_versions v_all ON t.id = v_all.template_id
GROUP BY t.id, v.version_number, v.change_description;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON email_template_versions TO authenticated;
GRANT USAGE ON SEQUENCE email_template_versions_id_seq TO authenticated;
GRANT SELECT ON email_templates_with_versions TO authenticated; 