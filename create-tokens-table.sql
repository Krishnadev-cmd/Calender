-- This script creates the google_calendar_tokens table if it doesn't exist
-- Run this in your Supabase SQL editor or via the CLI

-- Create the table
CREATE TABLE IF NOT EXISTS google_calendar_tokens (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  scope TEXT DEFAULT 'https://www.googleapis.com/auth/calendar',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_google_calendar_tokens_user_id ON google_calendar_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_google_calendar_tokens_expires_at ON google_calendar_tokens(expires_at);

-- Enable RLS (Row Level Security)
ALTER TABLE google_calendar_tokens ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (only if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'google_calendar_tokens' 
        AND policyname = 'Users can view their own tokens'
    ) THEN
        CREATE POLICY "Users can view their own tokens" ON google_calendar_tokens
          FOR SELECT USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'google_calendar_tokens' 
        AND policyname = 'Users can insert their own tokens'
    ) THEN
        CREATE POLICY "Users can insert their own tokens" ON google_calendar_tokens
          FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'google_calendar_tokens' 
        AND policyname = 'Users can update their own tokens'
    ) THEN
        CREATE POLICY "Users can update their own tokens" ON google_calendar_tokens
          FOR UPDATE USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'google_calendar_tokens' 
        AND policyname = 'Users can delete their own tokens'
    ) THEN
        CREATE POLICY "Users can delete their own tokens" ON google_calendar_tokens
          FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;