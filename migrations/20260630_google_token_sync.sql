-- Add google_access_token and google_refresh_token columns to user_settings table
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS google_access_token TEXT;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS google_refresh_token TEXT;

-- Reload PostgREST schema cache to make columns visible immediately
NOTIFY pgrst, 'reload schema';
