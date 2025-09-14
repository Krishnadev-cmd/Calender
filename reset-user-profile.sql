-- STEP 1: Fix the database trigger (run this first)
-- Remove default role so role selection screen will show

-- 1. Remove default role from user_profiles table
ALTER TABLE public.user_profiles ALTER COLUMN role DROP DEFAULT;
ALTER TABLE public.user_profiles ALTER COLUMN role DROP NOT NULL;

-- 2. Update the trigger function to not set a default role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name, role)
    VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', NULL);
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 2: Reset existing users (run after the above)
-- Delete ALL user profiles to reset everyone for role selection
DELETE FROM public.sellers;
DELETE FROM public.user_profiles;

-- STEP 3: Clear Google Calendar tokens to force reconnection
DELETE FROM public.google_calendar_tokens;