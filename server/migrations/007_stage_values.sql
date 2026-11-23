-- 007_stage_values.sql
-- Stitching becomes a recognised process stage so the daily stage tabs can
-- record or report it alongside cutting, ironing and packing.
-- Purely widening: existing CUTTING/PACKING/IRONING rows stay valid.

ALTER TABLE process_stage_daily DROP CONSTRAINT IF EXISTS process_stage_daily_stage_check;

ALTER TABLE process_stage_daily
  ADD CONSTRAINT process_stage_daily_stage_check
  CHECK (stage IN ('CUTTING', 'STITCHING', 'IRONING', 'PACKING'));
