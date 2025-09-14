-- Comprehensive database schema for calendar appointment system
-- Run this script in your Supabase SQL Editor

-- First, ensure we have the uuid extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create user_profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT CHECK (role IN ('buyer', 'seller')) NOT NULL DEFAULT 'buyer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Create google_calendar_tokens table (for OAuth tokens)
CREATE TABLE IF NOT EXISTS public.google_calendar_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_type TEXT DEFAULT 'Bearer',
    expires_at TIMESTAMP WITH TIME ZONE,
    scope TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    -- Ensure one token per user
    UNIQUE(user_id)
);

-- 3. Create sellers table (business profiles for sellers)
CREATE TABLE IF NOT EXISTS public.sellers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    business_name TEXT,
    description TEXT,
    location TEXT,
    availability_settings JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    -- Ensure one seller profile per user
    UNIQUE(user_id)
);

-- 4. Create appointments table
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    buyer_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    seller_id UUID REFERENCES public.sellers(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')) DEFAULT 'pending',
    google_calendar_event_id TEXT,
    meet_link TEXT,
    buyer_email TEXT,
    seller_email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_calendar_tokens ENABLE ROW LEVEL SECURITY;

-- 6. Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Anyone can view sellers" ON public.sellers;
DROP POLICY IF EXISTS "Users can update own seller profile" ON public.sellers;
DROP POLICY IF EXISTS "Users can insert own seller profile" ON public.sellers;
DROP POLICY IF EXISTS "Users can view own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Buyers can create appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can update own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can view own tokens" ON public.google_calendar_tokens;
DROP POLICY IF EXISTS "Users can update own tokens" ON public.google_calendar_tokens;
DROP POLICY IF EXISTS "Users can insert own tokens" ON public.google_calendar_tokens;

-- 7. Create RLS Policies

-- User profiles: Users can only see and edit their own profile
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Sellers: Users can view all sellers, but only edit their own
CREATE POLICY "Anyone can view sellers" ON public.sellers
    FOR SELECT USING (is_active = true);

CREATE POLICY "Users can update own seller profile" ON public.sellers
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own seller profile" ON public.sellers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Appointments: Users can see appointments they're involved in
CREATE POLICY "Users can view own appointments" ON public.appointments
    FOR SELECT USING (
        auth.uid() = buyer_id OR 
        auth.uid() = (SELECT user_id FROM public.sellers WHERE id = seller_id)
    );

CREATE POLICY "Buyers can create appointments" ON public.appointments
    FOR INSERT WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Users can update own appointments" ON public.appointments
    FOR UPDATE USING (
        auth.uid() = buyer_id OR 
        auth.uid() = (SELECT user_id FROM public.sellers WHERE id = seller_id)
    );

-- Google Calendar tokens: Users can only access their own tokens
CREATE POLICY "Users can view own tokens" ON public.google_calendar_tokens
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own tokens" ON public.google_calendar_tokens
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tokens" ON public.google_calendar_tokens
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 8. Create function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name)
    VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Create trigger to automatically create user profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 10. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. Create triggers for updated_at timestamps
DROP TRIGGER IF EXISTS handle_updated_at ON public.user_profiles;
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at ON public.sellers;
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.sellers
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at ON public.appointments;
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.appointments
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at ON public.google_calendar_tokens;
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.google_calendar_tokens
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- 12. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_sellers_user_id ON public.sellers(user_id);
CREATE INDEX IF NOT EXISTS idx_sellers_active ON public.sellers(is_active);
CREATE INDEX IF NOT EXISTS idx_appointments_buyer ON public.appointments(buyer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_seller ON public.appointments(seller_id);
CREATE INDEX IF NOT EXISTS idx_appointments_start_time ON public.appointments(start_time);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_google_tokens_user ON public.google_calendar_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_google_tokens_expires ON public.google_calendar_tokens(expires_at);

-- Grant necessary permissions
GRANT ALL ON public.user_profiles TO authenticated;
GRANT ALL ON public.sellers TO authenticated;
GRANT ALL ON public.appointments TO authenticated;
GRANT ALL ON public.google_calendar_tokens TO authenticated;

-- Grant permissions on sequences (if any)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;