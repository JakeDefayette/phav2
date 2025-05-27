-- 005_cleanup_schema.sql
-- Description: Clean up redundant assessment columns and consolidate user role enums
-- ------------------------------------------------------------
-- Requirements implemented from docs/schema-analysis.md
-- - Remove step_1_data, step_2_data, step_3_data, child_name, child_age from assessments table
-- - Consolidate user role enums: convert user_profiles.role and profiles.role to user_role_enum
-- ------------------------------------------------------------

-- Transaction ensures atomicity
BEGIN;

-- 1) Clean up redundant assessment columns
ALTER TABLE public.assessments
    DROP COLUMN IF EXISTS step_1_data,
    DROP COLUMN IF EXISTS step_2_data,
    DROP COLUMN IF EXISTS step_3_data,
    DROP COLUMN IF EXISTS child_name,
    DROP COLUMN IF EXISTS child_age;

-- ------------------------------------------------------------------
-- 2) Consolidate user role enums
-- Ensure the canonical enum exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'user_role_enum'
    ) THEN
        CREATE TYPE user_role_enum AS ENUM ('parent', 'practitioner', 'admin');
    END IF;
END$$;

-- 2a) user_profiles table ------------------------------------------
-- Convert user_profiles.role to user_role_enum and update values
ALTER TABLE public.user_profiles
  ALTER COLUMN role SET DEFAULT 'parent'; -- Ensure default is compatible or re-affirm
ALTER TABLE public.user_profiles
  ALTER COLUMN role TYPE user_role_enum
  USING CASE LOWER(role::text)
    WHEN 'parent/guardian' THEN 'parent'::user_role_enum
    WHEN 'chiropractor'    THEN 'practitioner'::user_role_enum
    WHEN 'parent'          THEN 'parent'::user_role_enum
    WHEN 'practitioner'    THEN 'practitioner'::user_role_enum
    WHEN 'admin'           THEN 'admin'::user_role_enum
    ELSE COALESCE(NULLIF(role::text, '')::user_role_enum, 'parent'::user_role_enum)
  END;
ALTER TABLE public.user_profiles ALTER COLUMN role SET NOT NULL;


-- 2b) profiles table ------------------------------------------------
-- Convert profiles.role to user_role_enum and update values
ALTER TABLE public.profiles
  ALTER COLUMN role TYPE user_role_enum
  USING CASE LOWER(role::text)
    WHEN 'doctor'          THEN 'practitioner'::user_role_enum
    WHEN 'staff'           THEN 'practitioner'::user_role_enum
    WHEN 'parent'          THEN 'parent'::user_role_enum
    WHEN 'practitioner'    THEN 'practitioner'::user_role_enum
    WHEN 'admin'           THEN 'admin'::user_role_enum
    ELSE COALESCE(NULLIF(role::text, '')::user_role_enum, 'practitioner'::user_role_enum)
  END;
-- Example: If profiles.role should also be NOT NULL and have a default:
-- ALTER TABLE public.profiles ALTER COLUMN role SET NOT NULL;
-- ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'practitioner';


-- ------------------------------------------------------------------
-- 2c) Drop legacy enums
-- We are now confident that user_profiles.role and profiles.role use user_role_enum.
DROP TYPE IF EXISTS public.user_role;
DROP TYPE IF EXISTS public.app_user_role;

COMMIT; 