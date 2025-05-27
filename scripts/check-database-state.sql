-- Check current database state
-- Run this in Supabase SQL Editor to see what tables and types exist

-- Check existing custom types
SELECT 
  t.typname as type_name,
  string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) as enum_values
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
GROUP BY t.typname
ORDER BY t.typname;

-- Check existing tables
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check if specific tables exist
SELECT 
  table_name,
  CASE 
    WHEN table_name IN (
      SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    ) THEN 'EXISTS'
    ELSE 'MISSING'
  END as status
FROM (
  VALUES 
    ('user_profiles'),
    ('practices'),
    ('children'),
    ('survey_question_definitions'),
    ('assessments'),
    ('survey_responses'),
    ('reports'),
    ('report_shares'),
    ('email_templates'),
    ('email_campaigns'),
    ('email_subscribers'),
    ('email_sends'),
    ('practice_analytics')
) AS expected_tables(table_name)
ORDER BY table_name; 