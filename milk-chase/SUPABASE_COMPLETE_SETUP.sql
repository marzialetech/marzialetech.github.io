-- Complete Supabase SQL Commands for Milk Chase Game
-- Run these commands in your Supabase SQL Editor
-- This script creates the table and all necessary columns for the current game version

-- Step 1: Create the main scores table
CREATE TABLE IF NOT EXISTS milk_chase_scores (
    id BIGSERIAL PRIMARY KEY,
    player_name TEXT NOT NULL,
    time_seconds DOUBLE PRECISION NOT NULL,
    school TEXT,
    car_design TEXT DEFAULT 'usa',
    car_color TEXT DEFAULT '#cc2222',
    car_wheels_color TEXT DEFAULT '#1a1a1a',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Enable Row Level Security
ALTER TABLE milk_chase_scores ENABLE ROW LEVEL SECURITY;

-- Step 3: Create RLS Policies (Allow anonymous read/write)
-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Allow anonymous insert" ON milk_chase_scores;
DROP POLICY IF EXISTS "Allow anonymous select" ON milk_chase_scores;
DROP POLICY IF EXISTS "Allow anonymous delete" ON milk_chase_scores;

-- Allow anonymous users to insert scores
CREATE POLICY "Allow anonymous insert" ON milk_chase_scores
    FOR INSERT TO anon WITH CHECK (true);

-- Allow anonymous users to read scores
CREATE POLICY "Allow anonymous select" ON milk_chase_scores
    FOR SELECT TO anon USING (true);

-- Allow anonymous users to delete scores (for admin functionality if needed)
CREATE POLICY "Allow anonymous delete" ON milk_chase_scores
    FOR DELETE TO anon USING (true);

-- Step 4: Add columns if they don't exist (for existing tables)
-- These are safe to run even if columns already exist
ALTER TABLE milk_chase_scores 
ADD COLUMN IF NOT EXISTS school TEXT;

ALTER TABLE milk_chase_scores 
ADD COLUMN IF NOT EXISTS car_design TEXT DEFAULT 'usa';

ALTER TABLE milk_chase_scores 
ADD COLUMN IF NOT EXISTS car_color TEXT DEFAULT '#cc2222';

ALTER TABLE milk_chase_scores 
ADD COLUMN IF NOT EXISTS car_wheels_color TEXT DEFAULT '#1a1a1a';

-- Step 5: Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_milk_chase_scores_time_seconds ON milk_chase_scores(time_seconds DESC);
CREATE INDEX IF NOT EXISTS idx_milk_chase_scores_school ON milk_chase_scores(school);
CREATE INDEX IF NOT EXISTS idx_milk_chase_scores_created_at ON milk_chase_scores(created_at DESC);

-- Step 6: Add column comments for documentation
COMMENT ON COLUMN milk_chase_scores.player_name IS 'Player name (max 15 characters)';
COMMENT ON COLUMN milk_chase_scores.time_seconds IS 'Game time in seconds (higher is better)';
COMMENT ON COLUMN milk_chase_scores.school IS 'School affiliation: lowville, southlewis, or null';
COMMENT ON COLUMN milk_chase_scores.car_design IS 'Car skin design: usa, cow, southlewis, lowville, stripe, spots, zigzag, or waves';
COMMENT ON COLUMN milk_chase_scores.car_color IS 'Car body color in hex format (e.g., #cc2222)';
COMMENT ON COLUMN milk_chase_scores.car_wheels_color IS 'Wheels color in hex format (e.g., #1a1a1a)';
COMMENT ON COLUMN milk_chase_scores.created_at IS 'Timestamp when the score was submitted';

-- Step 7: Verify the table structure
-- Run this query to verify everything is set up correctly:
-- SELECT column_name, data_type, column_default, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'milk_chase_scores'
-- ORDER BY ordinal_position;
