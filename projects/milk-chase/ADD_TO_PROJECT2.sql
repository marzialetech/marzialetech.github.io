-- Run this in your Project 2 Supabase SQL Editor (qvrrlfzogtuahmvsbvmu)
-- This adds the milk_chase_scores table so Milk Chase can use the same project as auth/fitness.
--
-- Also in Project 2: Authentication > URL Configuration > Redirect URLs, add:
--   https://marziale.tech
--   https://marziale.tech/**

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

ALTER TABLE milk_chase_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anonymous insert" ON milk_chase_scores;
DROP POLICY IF EXISTS "Allow anonymous select" ON milk_chase_scores;
DROP POLICY IF EXISTS "Allow anonymous delete" ON milk_chase_scores;

CREATE POLICY "Allow anonymous insert" ON milk_chase_scores
    FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anonymous select" ON milk_chase_scores
    FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anonymous delete" ON milk_chase_scores
    FOR DELETE TO anon USING (true);

CREATE INDEX IF NOT EXISTS idx_milk_chase_scores_time_seconds ON milk_chase_scores(time_seconds DESC);
CREATE INDEX IF NOT EXISTS idx_milk_chase_scores_school ON milk_chase_scores(school);
CREATE INDEX IF NOT EXISTS idx_milk_chase_scores_created_at ON milk_chase_scores(created_at DESC);
