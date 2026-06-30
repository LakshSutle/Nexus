-- Add google_calendar_enabled column to user_settings table (defaults to false for safety)
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS google_calendar_enabled BOOLEAN DEFAULT false;

-- Reload PostgREST schema cache to make column visible immediately
NOTIFY pgrst, 'reload schema';
