-- Migration: add_messenger_tag_to_profiles
-- Description: Adds messenger_tag column to profiles table for inline quick-editing
-- in My Staff directory. This field is the display label shown in the Messenger module.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS messenger_tag TEXT;

-- Comment for documentation
COMMENT ON COLUMN profiles.messenger_tag IS 'Display label for Messenger module, e.g. "PGT Mathematics"';

-- Update RLS to allow editing messenger_tag for staff profiles
-- Note: RLS policies on profiles table should already allow the owner to update their own profile