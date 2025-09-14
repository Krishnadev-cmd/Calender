-- Fix for role selection issue
-- This removes the default role from user profiles created by the trigger
-- So that the role selection screen will be shown

-- 1. Drop the existing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Modify the user_profiles table to remove the default role
ALTER TABLE public.user_profiles ALTER COLUMN role DROP DEFAULT;

-- 3. Modify the function to not set a role (leave it null)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name, role)
    VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', NULL);
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Recreate the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. Update the role column to allow NULL values and remove NOT NULL constraint
ALTER TABLE public.user_profiles ALTER COLUMN role DROP NOT NULL;