-- 003_line_types.sql
-- Production lines now have a type. Sewing lines are the default; cutting is
-- done on three dedicated lines that are seeded once.

ALTER TABLE production_lines
  ADD COLUMN IF NOT EXISTS line_type VARCHAR(20) NOT NULL DEFAULT 'SEWING';

ALTER TABLE production_lines DROP CONSTRAINT IF EXISTS production_lines_line_type_check;

ALTER TABLE production_lines
  ADD CONSTRAINT production_lines_line_type_check
  CHECK (line_type IN ('SEWING', 'CUTTING'));

CREATE INDEX IF NOT EXISTS ix_production_lines_type ON production_lines (line_type);

-- Seed Cutting 1/2/3 under the main branch (or the first branch if none is
-- marked as main). ON CONFLICT makes this safe to re-run.
INSERT INTO production_lines (branch_id, line_name, status, line_type)
SELECT b.branch_id, v.line_name, 'ACTIVE', 'CUTTING'
FROM (
  SELECT branch_id
  FROM branches
  ORDER BY is_main DESC, branch_id
  LIMIT 1
) b
CROSS JOIN (
  VALUES ('Cutting 1'), ('Cutting 2'), ('Cutting 3')
) AS v(line_name)
ON CONFLICT (line_name) DO NOTHING;
