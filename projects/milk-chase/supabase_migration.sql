-- Add car_design and car_color columns to milk_chase_scores table

-- Add car_design column (text, defaults to 'usa')
ALTER TABLE milk_chase_scores
ADD COLUMN IF NOT EXISTS car_design TEXT DEFAULT 'usa';

-- Add car_color column (text, defaults to '#cc2222')
ALTER TABLE milk_chase_scores
ADD COLUMN IF NOT EXISTS car_color TEXT DEFAULT '#cc2222';

-- Optional: Add comments to document the columns
COMMENT ON COLUMN milk_chase_scores.car_design IS 'Car skin design: usa, red, cow, southlewis, or lowville';
COMMENT ON COLUMN milk_chase_scores.car_color IS 'Car color in hex format (e.g., #cc2222)';
