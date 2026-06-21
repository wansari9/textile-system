-- Add notes column to daily_workforce for per-line free-text notes (e.g. "No Workers", "New Workers")
ALTER TABLE daily_workforce ADD COLUMN IF NOT EXISTS notes TEXT;
