-- Check Database State for PHA-v2 Project
-- Run these queries in your Supabase SQL editor or PostgreSQL client

-- 1. Check which tables exist in the public schema
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Check which enum types exist
SELECT typname as enum_name, 
       array_agg(enumlabel ORDER BY enumsortorder) as enum_values
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typtype = 'e'
GROUP BY typname
ORDER BY typname;

-- 3. Check the structure of the assessments table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'assessments'
ORDER BY ordinal_position;

-- 4. Check the structure of the user_profiles table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- 5. Check if the handle_new_user function exists and its definition
SELECT routine_name, routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'handle_new_user';

-- 6. Check foreign key constraints
SELECT
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_name;

-- 7. Check if there are any existing assessments with old data structure
SELECT 
    COUNT(*) as total_assessments,
    COUNT(step_1_data) as has_step_1_data,
    COUNT(step_2_data) as has_step_2_data,
    COUNT(step_3_data) as has_step_3_data,
    COUNT(lifestyle_responses) as has_lifestyle_responses,
    COUNT(symptoms_responses) as has_symptoms_responses,
    COUNT(child_name) as has_child_name,
    COUNT(child_age) as has_child_age
FROM assessments; 