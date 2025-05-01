-- Add level and correct_count columns to words table
ALTER TABLE words ADD COLUMN level INTEGER DEFAULT 5;
ALTER TABLE words ADD COLUMN correct_count INTEGER DEFAULT 0;

-- Create index for level column for better query performance
CREATE INDEX IF NOT EXISTS idx_words_level ON words(level);