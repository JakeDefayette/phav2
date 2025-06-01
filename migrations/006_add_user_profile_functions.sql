-- Migration: 006_add_user_profile_functions.sql
-- Description: Add missing user profile management functions
-- Author: Authentication Fix
-- Date: 2025-05-31

-- ============================================================================
-- USER PROFILE MANAGEMENT FUNCTIONS
-- ============================================================================

-- Function to ensure user profile exists (called by application auth service)
CREATE OR REPLACE FUNCTION ensure_user_profile(user_id uuid)
RETURNS void AS $$
DECLARE
  auth_user auth.users%ROWTYPE;
  user_metadata jsonb;
BEGIN
  -- Check if profile already exists
  IF EXISTS (SELECT 1 FROM user_profiles WHERE id = user_id) THEN
    RETURN;
  END IF;

  -- Get user data from auth.users
  SELECT * INTO auth_user FROM auth.users WHERE id = user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User with id % not found in auth.users', user_id;
  END IF;

  -- Extract user metadata
  user_metadata := COALESCE(auth_user.raw_user_meta_data, '{}'::jsonb);

  -- Create user profile with data from auth metadata
  INSERT INTO user_profiles (
    id,
    email,
    role,
    first_name,
    last_name,
    practice_id,
    created_at,
    updated_at
  ) VALUES (
    auth_user.id,
    auth_user.email,
    CASE 
      WHEN (user_metadata->>'role') = 'chiropractor' THEN 'practitioner'::user_role_enum
      WHEN (user_metadata->>'role') = 'practitioner' THEN 'practitioner'::user_role_enum
      WHEN (user_metadata->>'role') = 'parent' THEN 'parent'::user_role_enum
      ELSE 'parent'::user_role_enum -- Default to parent
    END,
    COALESCE(
      user_metadata->>'firstName', 
      split_part(COALESCE(user_metadata->>'full_name', ''), ' ', 1),
      'Unknown'
    ),
    COALESCE(
      user_metadata->>'lastName', 
      split_part(COALESCE(user_metadata->>'full_name', ''), ' ', 2),
      'User'
    ),
    CASE 
      WHEN user_metadata->>'practiceId' IS NOT NULL AND user_metadata->>'practiceId' != '' 
      THEN (user_metadata->>'practiceId')::uuid 
      ELSE NULL 
    END,
    COALESCE(auth_user.created_at, now()),
    now()
  );

  -- Log successful profile creation
  RAISE NOTICE 'Created user profile for user_id: %', user_id;
  
EXCEPTION
  WHEN others THEN
    -- Log error but don't fail completely
    RAISE WARNING 'Failed to create user profile for %: %', user_id, SQLERRM;
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- AUTOMATIC USER PROFILE CREATION TRIGGER
-- ============================================================================

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Create user profile automatically for new users
  PERFORM ensure_user_profile(NEW.id);
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log error but don't prevent user creation
    RAISE WARNING 'Failed to auto-create profile for new user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users table (if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION handle_new_user();
  END IF;
END $$;

-- ============================================================================
-- RETROACTIVE PROFILE CREATION FOR EXISTING USERS
-- ============================================================================

-- Create profiles for any existing auth.users who don't have profiles
DO $$
DECLARE
  user_record RECORD;
  created_count INTEGER := 0;
BEGIN
  -- Find auth users without profiles
  FOR user_record IN 
    SELECT au.id, au.email, au.created_at, au.raw_user_meta_data
    FROM auth.users au
    LEFT JOIN user_profiles up ON up.id = au.id
    WHERE up.id IS NULL
  LOOP
    BEGIN
      -- Create profile for this user
      PERFORM ensure_user_profile(user_record.id);
      created_count := created_count + 1;
    EXCEPTION
      WHEN others THEN
        RAISE WARNING 'Failed to create retroactive profile for user %: %', user_record.id, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE 'Created % retroactive user profiles', created_count;
END $$;

-- ============================================================================
-- PERMISSIONS
-- ============================================================================

-- Grant permissions for the functions
GRANT EXECUTE ON FUNCTION ensure_user_profile(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION ensure_user_profile(uuid) TO anon;
GRANT EXECUTE ON FUNCTION handle_new_user() TO postgres;

-- ============================================================================
-- VALIDATION
-- ============================================================================

-- Verify that the function was created
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'ensure_user_profile'
  ) THEN
    RAISE EXCEPTION 'ensure_user_profile function was not created successfully';
  END IF;
  
  RAISE NOTICE '✅ ensure_user_profile function created successfully';
END $$;