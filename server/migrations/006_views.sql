-- 006_views.sql
-- Extend the reporting views with order metadata, line type and cutting-line
-- attribution, then add the order list and line score views.
--
-- CREATE OR REPLACE VIEW can only append columns, so every existing column is
-- kept in its original position and new columns are added at the end.

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
