-- Migration: Add geolocation support to garages table
-- Run this in your Supabase SQL Editor

-- Add latitude and longitude columns to garages table
ALTER TABLE garages 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Add index for faster geolocation queries
CREATE INDEX IF NOT EXISTS idx_garages_location ON garages(latitude, longitude);

-- Update existing garages with sample coordinates (Indian cities)
-- You should replace these with actual coordinates for your garages

-- Mumbai garage (Sharma Auto Works)
UPDATE garages 
SET latitude = 19.0760, longitude = 72.8777 
WHERE id = '11111111-1111-1111-1111-111111111111';

-- Bangalore garage (Bangalore Car Care)
UPDATE garages 
SET latitude = 12.9716, longitude = 77.5946 
WHERE id = '22222222-2222-2222-2222-222222222222';

-- Delhi garage (Delhi Motors)
UPDATE garages 
SET latitude = 28.6139, longitude = 77.2090 
WHERE id = '33333333-3333-3333-3333-333333333333';

-- Pune garage (Pune Pitstop)
UPDATE garages 
SET latitude = 18.5204, longitude = 73.8567 
WHERE id = '44444444-4444-4444-4444-444444444444';

-- Chennai garage (Chennai Express Service)
UPDATE garages 
SET latitude = 13.0827, longitude = 80.2707 
WHERE id = '55555555-5555-5555-5555-555555555555';

-- Add comment to document the columns
COMMENT ON COLUMN garages.latitude IS 'Latitude coordinate for garage location (used for distance calculation)';
COMMENT ON COLUMN garages.longitude IS 'Longitude coordinate for garage location (used for distance calculation)';
