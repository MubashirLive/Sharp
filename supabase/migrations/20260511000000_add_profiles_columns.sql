-- Add missing columns to profiles table that the app code expects
-- but were never created in the schema

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'principal';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mobile TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT true;