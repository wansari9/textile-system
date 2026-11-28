-- =====================================================================
-- AmirtexOS — single database setup file
-- PostgreSQL 14+
-- =====================================================================
--
-- Fresh install:
--   createdb textile_db
--   psql -U postgres -d textile_db -f ai_studio_code.sql
--   cd server && npm run seed
--
-- `npm run seed` creates the default admin/manager accounts, branches,
-- production lines and demo data. This file only owns the schema.
--
-- The file is safe to re-run. Tables, indexes and the sequence use
-- IF NOT EXISTS; views use CREATE OR REPLACE; and the compatibility block
-- adds columns/constraints that an older database may be missing. It never
-- drops tables or user data.
--
-- Everything below replaces the former server/migrations/001–008 files.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 1. Core tables (dependency order)
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS branches (
    branch_id SERIAL PRIMARY KEY,
    branch_name VARCHAR(100) NOT NULL UNIQUE,
    is_main SMALLINT DEFAULT 0 CHECK (is_main IN (0,1)),
    is_active SMALLINT DEFAULT 1 CHECK (is_active IN (0,1)),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS production_lines (
    line_id SERIAL PRIMARY KEY,
    branch_id INTEGER NOT NULL REFERENCES branches(branch_id),
    line_name VARCHAR(50) NOT NULL UNIQUE,
    line_type VARCHAR(20) NOT NULL DEFAULT 'SEWING'
        CHECK (line_type IN ('SEWING','CUTTING')),
    status VARCHAR(20) DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE','MAINTENANCE','INACTIVE')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- assigned_line_id is the manager's primary line; user_lines is the full set.
-- Re-declared here so a database created before multi-line support gets it.
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150),
    role VARCHAR(20) NOT NULL
        CHECK (role IN ('ADMIN','LINE_MANAGER','SUPERVISOR')),
    assigned_line_id INTEGER,
    is_active SMALLINT DEFAULT 1 CHECK (is_active IN (0,1)),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS assigned_line_id INTEGER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM pg_constraint c
      JOIN pg_class t ON t.oid = c.conrelid
      JOIN pg_attribute a
        ON a.attrelid = t.oid AND a.attnum = ANY (c.conkey)
     WHERE c.contype = 'f'
       AND t.relname = 'users'
       AND a.attname = 'assigned_line_id'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT fk_users_line
      FOREIGN KEY (assigned_line_id) REFERENCES production_lines(line_id);
  END IF;
END $$;

-- A line manager can manage several lines.
CREATE TABLE IF NOT EXISTS user_lines (
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    line_id INTEGER NOT NULL REFERENCES production_lines(line_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, line_id)
);

CREATE TABLE IF NOT EXISTS customers (
    customer_id SERIAL PRIMARY KEY,
    customer_name VARCHAR(150) NOT NULL,
    contact_person VARCHAR(100),
    phone VARCHAR(30),
    email VARCHAR(150),
    address VARCHAR(300),
    is_active SMALLINT DEFAULT 1 CHECK (is_active IN (0,1)),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- One sequence drives generated order numbers (ORD-00001, ORD-00002, …).
CREATE SEQUENCE IF NOT EXISTS order_no_seq;

-- One product row is one customer order.
CREATE TABLE IF NOT EXISTS products (
    product_id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(customer_id),
    product_name VARCHAR(150) NOT NULL,
    style_code VARCHAR(50),
    color VARCHAR(50),
    size VARCHAR(20),
    gender VARCHAR(10) NOT NULL DEFAULT 'UNISEX'
        CHECK (gender IN ('MEN','WOMEN','BOYS','GIRLS','KIDS','UNISEX')),
    order_no VARCHAR(30) NOT NULL
        DEFAULT ('ORD-' || LPAD(nextval('order_no_seq')::text, 5, '0')),
    order_date DATE DEFAULT CURRENT_DATE,
    order_quantity INTEGER NOT NULL CHECK (order_quantity > 0),
    daily_target INTEGER NOT NULL CHECK (daily_target > 0),
    status VARCHAR(20) DEFAULT 'PENDING'
        CHECK (status IN ('PENDING','ACTIVE','COMPLETED','ON_HOLD','CANCELLED')),
    start_date DATE,
    due_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS branch_daily_production (
    record_id SERIAL PRIMARY KEY,
    branch_id INTEGER NOT NULL REFERENCES branches(branch_id),
    production_date DATE NOT NULL,
    daily_target INTEGER DEFAULT 0 CHECK (daily_target >= 0),
    qty_produced INTEGER DEFAULT 0 CHECK (qty_produced >= 0),
    entered_by INTEGER REFERENCES users(user_id),
    entered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_branch_daily UNIQUE (branch_id, production_date)
);

CREATE TABLE IF NOT EXISTS line_assignments (
    assignment_id SERIAL PRIMARY KEY,
    line_id INTEGER NOT NULL REFERENCES production_lines(line_id),
    product_id INTEGER NOT NULL REFERENCES products(product_id),
    daily_target INTEGER NOT NULL CHECK (daily_target > 0),
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE','COMPLETED','CANCELLED')),
    created_by INTEGER REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Starting a new assignment closes the previous ACTIVE one on that line.
CREATE OR REPLACE FUNCTION close_prev_assignment() RETURNS TRIGGER AS $$
BEGIN
  UPDATE line_assignments
     SET status = 'COMPLETED', end_date = NEW.start_date - 1
   WHERE line_id = NEW.line_id
     AND status = 'ACTIVE';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_close_prev_assignment ON line_assignments;
CREATE TRIGGER trg_close_prev_assignment
BEFORE INSERT ON line_assignments
FOR EACH ROW EXECUTE FUNCTION close_prev_assignment();

CREATE TABLE IF NOT EXISTS hourly_production (
    log_id SERIAL PRIMARY KEY,
    assignment_id INTEGER NOT NULL REFERENCES line_assignments(assignment_id),
    line_id INTEGER NOT NULL REFERENCES production_lines(line_id),
    product_id INTEGER NOT NULL REFERENCES products(product_id),
    production_date DATE NOT NULL,
    hour_number SMALLINT NOT NULL CHECK (hour_number BETWEEN 1 AND 12),
    qty_produced INTEGER DEFAULT 0 CHECK (qty_produced >= 0),
    qty_defect INTEGER DEFAULT 0 CHECK (qty_defect >= 0),
    entered_by INTEGER REFERENCES users(user_id),
    entered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER REFERENCES users(user_id),
    updated_at TIMESTAMP,
    CONSTRAINT uq_hourly UNIQUE (line_id, production_date, hour_number)
);

CREATE TABLE IF NOT EXISTS daily_workforce (
    record_id SERIAL PRIMARY KEY,
    line_id INTEGER NOT NULL REFERENCES production_lines(line_id),
    production_date DATE NOT NULL,
    workers_required INTEGER CHECK (workers_required >= 0),
    workers_present INTEGER DEFAULT 0 CHECK (workers_present >= 0),
    notes TEXT,
    recorded_by INTEGER REFERENCES users(user_id),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_workforce UNIQUE (line_id, production_date)
);

CREATE TABLE IF NOT EXISTS audit_log (
    audit_id SERIAL PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    record_id INTEGER NOT NULL,
    action VARCHAR(20) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    changed_by INTEGER REFERENCES users(user_id),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cutting output is recorded per cutting line; other stages leave line_id NULL.
-- line_key turns NULL into 0 so one unique index covers both cases.
CREATE TABLE IF NOT EXISTS process_stage_daily (
    record_id SERIAL PRIMARY KEY,
    stage VARCHAR(20) NOT NULL
        CHECK (stage IN ('CUTTING','STITCHING','IRONING','PACKING')),
    product_id INTEGER NOT NULL REFERENCES products(product_id),
    line_id INTEGER REFERENCES production_lines(line_id),
    production_date DATE NOT NULL,
    qty_completed INTEGER DEFAULT 0 CHECK (qty_completed >= 0),
    line_key INTEGER GENERATED ALWAYS AS (COALESCE(line_id, 0)) STORED,
    entered_by INTEGER REFERENCES users(user_id),
    entered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS quality_checks (
    check_id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(customer_id),
    production_date DATE NOT NULL,
    pcs_checked INTEGER DEFAULT 0 CHECK (pcs_checked >= 0),
    pcs_faults INTEGER DEFAULT 0 CHECK (pcs_faults >= 0),
    entered_by INTEGER REFERENCES users(user_id),
    entered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_quality_daily UNIQUE (customer_id, production_date)
);

-- ---------------------------------------------------------------------
-- 2. Compatibility block
-- Adds anything an older database is missing. On a fresh database these
-- statements are no-ops. Safe to re-run.
-- ---------------------------------------------------------------------

ALTER TABLE daily_workforce ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE production_lines
  ADD COLUMN IF NOT EXISTS line_type VARCHAR(20) NOT NULL DEFAULT 'SEWING';

ALTER TABLE products ADD COLUMN IF NOT EXISTS gender VARCHAR(10);
ALTER TABLE products ADD COLUMN IF NOT EXISTS order_no VARCHAR(30);
ALTER TABLE products ADD COLUMN IF NOT EXISTS order_date DATE;

UPDATE products SET gender = 'UNISEX' WHERE gender IS NULL;
UPDATE products SET order_date = created_at::date WHERE order_date IS NULL;
UPDATE products
   SET order_no = 'ORD-' || LPAD(nextval('order_no_seq')::text, 5, '0')
 WHERE order_no IS NULL;

ALTER TABLE products ALTER COLUMN gender SET DEFAULT 'UNISEX';
ALTER TABLE products ALTER COLUMN order_date SET DEFAULT CURRENT_DATE;
ALTER TABLE products
  ALTER COLUMN order_no
  SET DEFAULT ('ORD-' || LPAD(nextval('order_no_seq')::text, 5, '0'));
ALTER TABLE products ALTER COLUMN gender SET NOT NULL;
ALTER TABLE products ALTER COLUMN order_no SET NOT NULL;

ALTER TABLE process_stage_daily
  ADD COLUMN IF NOT EXISTS line_id INTEGER REFERENCES production_lines(line_id);
ALTER TABLE process_stage_daily
  ADD COLUMN IF NOT EXISTS line_key INTEGER
  GENERATED ALWAYS AS (COALESCE(line_id, 0)) STORED;

-- Role: LINE_MANAGER replaces SUPERVISOR, which stays accepted for old rows.
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('ADMIN','LINE_MANAGER','SUPERVISOR'));
UPDATE users SET role = 'LINE_MANAGER' WHERE role = 'SUPERVISOR';

ALTER TABLE production_lines DROP CONSTRAINT IF EXISTS production_lines_line_type_check;
ALTER TABLE production_lines
  ADD CONSTRAINT production_lines_line_type_check
  CHECK (line_type IN ('SEWING','CUTTING'));

ALTER TABLE products DROP CONSTRAINT IF EXISTS products_gender_check;
ALTER TABLE products
  ADD CONSTRAINT products_gender_check
  CHECK (gender IN ('MEN','WOMEN','BOYS','GIRLS','KIDS','UNISEX'));

ALTER TABLE process_stage_daily DROP CONSTRAINT IF EXISTS process_stage_daily_stage_check;
ALTER TABLE process_stage_daily
  ADD CONSTRAINT process_stage_daily_stage_check
  CHECK (stage IN ('CUTTING','STITCHING','IRONING','PACKING'));

-- The pre-004 single unique constraint is superseded by ux_stage_daily_line.
ALTER TABLE process_stage_daily DROP CONSTRAINT IF EXISTS uq_stage_daily;

-- Backfill the multi-line set from the legacy single-line column.
INSERT INTO user_lines (user_id, line_id)
SELECT user_id, assigned_line_id
  FROM users
 WHERE assigned_line_id IS NOT NULL
ON CONFLICT (user_id, line_id) DO NOTHING;

-- Keep the order-number sequence in step with existing orders.
SELECT setval(
  'order_no_seq',
  COALESCE(
    (SELECT MAX(SUBSTRING(order_no FROM 5)::int)
       FROM products
      WHERE order_no ~ '^ORD-[0-9]+$'),
    0
  ) + 1,
  false
);

-- ---------------------------------------------------------------------
-- 3. Indexes
-- ---------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS ix_users_assigned_line ON users (assigned_line_id);
CREATE INDEX IF NOT EXISTS ix_user_lines_line ON user_lines (line_id);
CREATE INDEX IF NOT EXISTS ix_production_lines_type ON production_lines (line_type);

CREATE INDEX IF NOT EXISTS ix_products_customer ON products (customer_id);
CREATE INDEX IF NOT EXISTS ix_products_order_date ON products (order_date);
CREATE UNIQUE INDEX IF NOT EXISTS ux_products_order_no ON products (order_no);

CREATE INDEX IF NOT EXISTS ix_assign_line ON line_assignments (line_id);
CREATE INDEX IF NOT EXISTS ix_assign_product ON line_assignments (product_id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_one_active_per_line
  ON line_assignments (line_id) WHERE status = 'ACTIVE';

CREATE INDEX IF NOT EXISTS ix_hourly_date ON hourly_production (production_date);
CREATE INDEX IF NOT EXISTS ix_hourly_product ON hourly_production (product_id);

CREATE UNIQUE INDEX IF NOT EXISTS ux_stage_daily_line
  ON process_stage_daily (stage, product_id, production_date, line_key);
CREATE INDEX IF NOT EXISTS ix_stage_date ON process_stage_daily (production_date);
CREATE INDEX IF NOT EXISTS ix_stage_line ON process_stage_daily (line_id);

CREATE INDEX IF NOT EXISTS ix_quality_date ON quality_checks (production_date);

-- ---------------------------------------------------------------------
-- 4. Reporting views
-- ---------------------------------------------------------------------

CREATE OR REPLACE VIEW vw_daily_line_summary AS
SELECT
    hp.production_date,
    hp.line_id,
    pl.line_name,
    hp.product_id,
    p.product_name,
    c.customer_name,
    la.daily_target,
    SUM(hp.qty_produced) AS total_produced,
    SUM(hp.qty_defect) AS total_defect,
    ROUND((SUM(hp.qty_produced)::NUMERIC / la.daily_target) * 100, 1) AS pct_of_target,
    p.order_no,
    p.gender,
    pl.line_type
FROM hourly_production hp
JOIN production_lines pl ON pl.line_id = hp.line_id
JOIN products p ON p.product_id = hp.product_id
JOIN customers c ON c.customer_id = p.customer_id
JOIN line_assignments la ON la.assignment_id = hp.assignment_id
GROUP BY
    hp.production_date,
    hp.line_id,
    pl.line_name,
    hp.product_id,
    p.product_name,
    c.customer_name,
    la.daily_target,
    p.order_no,
    p.gender,
    pl.line_type;

CREATE OR REPLACE VIEW vw_daily_factory_total AS
SELECT
    production_date,
    SUM(total_produced) AS total_produced,
    SUM(total_defect) AS total_defect,
    SUM(daily_target) AS total_assigned_target,
    SUM(daily_target) AS total_target,
    COUNT(DISTINCT line_id) AS active_lines,
    ROUND((SUM(total_produced)::NUMERIC / NULLIF(SUM(daily_target), 0)) * 100, 1) AS efficiency_pct
FROM vw_daily_line_summary
GROUP BY production_date;

CREATE OR REPLACE VIEW vw_weekly_summary AS
SELECT
    DATE_TRUNC('week', production_date)::DATE AS week_start,
    line_id,
    product_id,
    SUM(total_produced) AS total_produced,
    SUM(total_defect) AS total_defect,
    SUM(daily_target) AS total_target,
    order_no,
    gender,
    line_type
FROM vw_daily_line_summary
GROUP BY
    DATE_TRUNC('week', production_date)::DATE,
    line_id,
    product_id,
    order_no,
    gender,
    line_type;

CREATE OR REPLACE VIEW vw_product_progress AS
SELECT
    p.product_id,
    p.product_name,
    c.customer_name,
    p.order_quantity,
    COALESCE(SUM(hp.qty_produced), 0) AS total_produced_to_date,
    p.order_quantity - COALESCE(SUM(hp.qty_produced), 0) AS remaining_qty,
    ROUND((COALESCE(SUM(hp.qty_produced), 0)::NUMERIC / p.order_quantity) * 100, 1) AS pct_complete,
    p.status,
    p.order_no,
    p.gender,
    p.order_date,
    c.customer_id
FROM products p
JOIN customers c ON c.customer_id = p.customer_id
LEFT JOIN hourly_production hp ON hp.product_id = p.product_id
GROUP BY
    p.product_id,
    p.product_name,
    c.customer_name,
    p.order_quantity,
    p.status,
    p.order_no,
    p.gender,
    p.order_date,
    c.customer_id;

CREATE OR REPLACE VIEW vw_line_efficiency AS
SELECT
    dls.production_date,
    dls.line_id,
    dls.line_name,
    dls.total_produced,
    dw.workers_required,
    dw.workers_present,
    ROUND(dls.total_produced::NUMERIC / NULLIF(dw.workers_present, 0), 2) AS units_per_worker
FROM vw_daily_line_summary dls
LEFT JOIN daily_workforce dw
       ON dw.line_id = dls.line_id AND dw.production_date = dls.production_date;

CREATE OR REPLACE VIEW vw_branch_daily_summary AS
SELECT
    bdp.production_date,
    b.branch_id,
    b.branch_name,
    bdp.daily_target,
    bdp.qty_produced,
    bdp.qty_produced - bdp.daily_target AS difference
FROM branch_daily_production bdp
JOIN branches b ON b.branch_id = bdp.branch_id;

CREATE OR REPLACE VIEW vw_company_daily_total AS
SELECT
    production_date,
    SUM(total_produced) AS total_produced,
    SUM(total_target) AS total_target
FROM (
    SELECT production_date, total_produced, total_assigned_target AS total_target
      FROM vw_daily_factory_total
    UNION ALL
    SELECT production_date, qty_produced AS total_produced, daily_target AS total_target
      FROM branch_daily_production
) subquery
GROUP BY production_date;

CREATE OR REPLACE VIEW vw_process_stage_summary AS
SELECT
    psd.production_date,
    psd.stage,
    psd.product_id,
    p.product_name,
    c.customer_name,
    psd.qty_completed,
    psd.line_id,
    pl.line_name,
    p.order_no
FROM process_stage_daily psd
JOIN products p ON p.product_id = psd.product_id
JOIN customers c ON c.customer_id = p.customer_id
LEFT JOIN production_lines pl ON pl.line_id = psd.line_id;

CREATE OR REPLACE VIEW vw_quality_summary AS
SELECT
    qc.production_date,
    qc.customer_id,
    c.customer_name,
    qc.pcs_checked,
    qc.pcs_faults,
    qc.pcs_checked - qc.pcs_faults AS pcs_ok,
    ROUND(((qc.pcs_checked - qc.pcs_faults)::NUMERIC / NULLIF(qc.pcs_checked, 0)) * 100, 1) AS pass_rate_pct
FROM quality_checks qc
JOIN customers c ON c.customer_id = qc.customer_id;

-- Line production score: attainment only, capped at 100.
CREATE OR REPLACE VIEW vw_line_daily_score AS
SELECT
    production_date,
    line_id,
    line_name,
    line_type,
    SUM(total_produced) AS total_produced,
    SUM(daily_target) AS daily_target,
    CASE
      WHEN SUM(daily_target) > 0
        THEN LEAST(100, ROUND((SUM(total_produced)::NUMERIC / SUM(daily_target)) * 100, 1))
      ELSE NULL
    END AS score
FROM vw_daily_line_summary
GROUP BY production_date, line_id, line_name, line_type;

-- One row per order (product) with its customer, active lines and progress.
CREATE OR REPLACE VIEW vw_orders AS
SELECT
    p.product_id,
    p.order_no,
    p.order_date,
    p.gender,
    p.product_name,
    p.style_code,
    p.color,
    p.size,
    p.order_quantity,
    p.daily_target,
    p.status,
    p.start_date,
    p.due_date,
    p.created_at,
    c.customer_id,
    c.customer_name,
    COALESCE(hp.produced_to_date, 0) AS produced_to_date,
    GREATEST(p.order_quantity - COALESCE(hp.produced_to_date, 0), 0) AS remaining_qty,
    ROUND((COALESCE(hp.produced_to_date, 0)::NUMERIC / NULLIF(p.order_quantity, 0)) * 100, 1) AS pct_complete,
    al.line_name,
    al.line_id,
    al.assignment_id
FROM products p
JOIN customers c ON c.customer_id = p.customer_id
LEFT JOIN (
    SELECT product_id, SUM(qty_produced) AS produced_to_date
      FROM hourly_production
     GROUP BY product_id
) hp ON hp.product_id = p.product_id
LEFT JOIN LATERAL (
    SELECT
        STRING_AGG(DISTINCT pl.line_name, ', ' ORDER BY pl.line_name) AS line_name,
        MIN(la.line_id) AS line_id,
        MIN(la.assignment_id) AS assignment_id
    FROM line_assignments la
    JOIN production_lines pl ON pl.line_id = la.line_id
    WHERE la.product_id = p.product_id
      AND la.status = 'ACTIVE'
) al ON true;

-- ---------------------------------------------------------------------
-- 5. Required reference data
-- The seeder creates branches and the six production lines on a fresh DB;
-- this insert covers an existing database that predates cutting lines.
-- ---------------------------------------------------------------------

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

COMMIT;
