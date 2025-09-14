-- Fix Row-Level Security (RLS) policies for google_calendar_tokens table
-- This will allow users to manage their own Google Calendar tokens

-- 1. First, check if RLS is enabled on the table
-- SELECT * FROM information_schema.tables WHERE table_name = 'google_calendar_tokens';

-- 2. Create or replace RLS policies to allow users to manage their own tokens
-- Policy to allow users to SELECT their own tokens
CREATE POLICY "Users can view their own google calendar tokens" ON public.google_calendar_tokens
    FOR SELECT USING (auth.uid() = user_id);

-- Policy to allow users to INSERT their own tokens
CREATE POLICY "Users can insert their own google calendar tokens" ON public.google_calendar_tokens
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to UPDATE their own tokens
CREATE POLICY "Users can update their own google calendar tokens" ON public.google_calendar_tokens
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy to allow users to DELETE their own tokens
CREATE POLICY "Users can delete their own google calendar tokens" ON public.google_calendar_tokens
    FOR DELETE USING (auth.uid() = user_id);

-- 3. Enable RLS on the table (if not already enabled)
ALTER TABLE public.google_calendar_tokens ENABLE ROW LEVEL SECURITY;

-- 4. Optional: Check existing policies (run after the above)
-- SELECT * FROM pg_policies WHERE tablename = 'google_calendar_tokens';