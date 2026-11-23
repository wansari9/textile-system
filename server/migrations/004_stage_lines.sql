-- 004_stage_lines.sql
-- Cutting output is recorded per cutting line. Other stages keep line_id NULL
-- and therefore keep one row per product/date as before.
--
-- line_key is a generated column so a single unique index can cover both
-- cases: NULL line_id becomes 0 for ironing/packing, while cutting rows keep
-- their real line_id.

ALTER TABLE process_stage_daily
  ADD COLUMN IF NOT EXISTS line_id INTEGER REFERENCES production_lines(line_id);

ALTER TABLE process_stage_daily
  ADD COLUMN IF NOT EXISTS line_key INTEGER
  GENERATED ALWAYS AS (COALESCE(line_id, 0)) STORED;

ALTER TABLE process_stage_daily DROP CONSTRAINT IF EXISTS uq_stage_daily;

CREATE UNIQUE INDEX IF NOT EXISTS ux_stage_daily_line
  ON process_stage_daily (stage, product_id, production_date, line_key);

CREATE INDEX IF NOT EXISTS ix_stage_line ON process_stage_daily (line_id);
