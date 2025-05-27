-- Migration: 004_add_subscription_tier_column.sql
-- Description: Safely add the subscription_tier column to the practices table and create its index if missing
-- Author: Migration Fix
-- Date: 2025-05-26

-- Ensure the subscription_tier_enum type exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_tier_enum') THEN
    CREATE TYPE subscription_tier_enum AS ENUM ('basic', 'premium', 'enterprise');
  END IF;
END $$;

-- Add subscription_tier column if it does not exist already
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'practices' 
      AND column_name = 'subscription_tier'
  ) THEN
    ALTER TABLE practices
      ADD COLUMN subscription_tier subscription_tier_enum NOT NULL DEFAULT 'basic';
  END IF;
END $$;

-- Create index on the new column (no-op if it already exists)
CREATE INDEX IF NOT EXISTS idx_practices_subscription_tier 
  ON practices(subscription_tier); 