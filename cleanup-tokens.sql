-- Clean up all Google Calendar tokens to sync with revoked permissions
-- Run this in Supabase SQL Editor

-- Delete all Google Calendar tokens since permissions were revoked
DELETE FROM public.google_calendar_tokens;

-- Optional: You can also check what was deleted by running this first:
-- SELECT * FROM public.google_calendar_tokens;