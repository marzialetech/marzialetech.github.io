-- Complete Supabase SQL Commands for Milk Chase Game
-- Run these commands in your Supabase SQL Editor

-- Create the main scores table
CREATE TABLE IF NOT EXISTS milk_chase_scores (
    id BIGSERIAL PRIMARY KEY,
    player_name TEXT NOT NULL,
    time_seconds DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE milk_chase_scores ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read/write
CREATE POLICY IF NOT EXISTS "Allow anonymous insert" ON milk_chase_scores
    FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow anonymous select" ON milk_chase_scores
    FOR SELECT TO anon USING (true);

-- Add school column
ALTER TABLE milk_chase_scores 
ADD COLUMN IF NOT EXISTS school TEXT;

-- Add car customization columns
ALTER TABLE milk_chase_scores 
ADD COLUMN IF NOT EXISTS car_design TEXT DEFAULT 'usa';

ALTER TABLE milk_chase_scores 
ADD COLUMN IF NOT EXISTS car_color TEXT DEFAULT '#cc2222';

ALTER TABLE milk_chase_scores 
ADD COLUMN IF NOT EXISTS car_wheels_color TEXT DEFAULT '#000000';

ALTER TABLE milk_chase_scores 
ADD COLUMN IF NOT EXISTS car_effect TEXT DEFAULT 'none';

-- Optional: Add comments to document columns
COMMENT ON COLUMN milk_chase_scores.car_design IS 'Car skin: usa, red, cow, southlewis, or lowville';
COMMENT ON COLUMN milk_chase_scores.car_color IS 'Car body color in hex format (e.g., #cc2222)';
COMMENT ON COLUMN milk_chase_scores.car_wheels_color IS 'Wheels color in hex format (e.g., #000000)';
COMMENT ON COLUMN milk_chase_scores.car_effect IS 'Car effect: none, bubbles, flames, or tracks';
COMMENT ON COLUMN milk_chase_scores.school IS 'School affiliation: lowville, southlewis, or null';
