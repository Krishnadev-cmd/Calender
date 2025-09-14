-- Insert some sample seller data for testing
-- Run this in your Supabase SQL Editor after ensuring you have users

-- First, let's see what users exist
-- SELECT * FROM auth.users LIMIT 5;

-- Insert sample seller profiles (replace UUIDs with actual user IDs from your auth.users table)
-- You'll need to replace 'your-actual-user-id-here' with real UUIDs from your auth.users table

/*
Example - replace with your actual user IDs:

INSERT INTO public.user_profiles (id, email, full_name, role) VALUES
('your-user-id-1', 'seller1@example.com', 'Dr. Sarah Johnson', 'seller'),
('your-user-id-2', 'seller2@example.com', 'John Smith Consulting', 'seller');

INSERT INTO public.sellers (user_id, business_name, description, location, is_active) VALUES
('your-user-id-1', 'Medical Consultation Services', 'Expert medical consultations and health advice', 'New York, NY', true),
('your-user-id-2', 'Business Strategy Consulting', 'Professional business consulting and strategic planning', 'San Francisco, CA', true);
*/

-- To see what users you have, run this first:
SELECT id, email, raw_user_meta_data->>'full_name' as full_name 
FROM auth.users 
ORDER BY created_at DESC;

-- Then check if you have any user_profiles:
SELECT * FROM public.user_profiles ORDER BY created_at DESC;

-- And check if you have any sellers:
SELECT * FROM public.sellers ORDER BY created_at DESC;