-- Add Google Calendar integration columns to appointments table
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS google_event_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS google_meet_link TEXT;

-- Update the appointments table to include seller email if not present
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS seller_email VARCHAR(255);