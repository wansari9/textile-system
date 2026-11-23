-- 005_orders_gender.sql
-- Products are the order table in this system. Add the fields needed to treat
-- one product row as one customer order.

ALTER TABLE products ADD COLUMN IF NOT EXISTS gender VARCHAR(10);
ALTER TABLE products ADD COLUMN IF NOT EXISTS order_no VARCHAR(30);
ALTER TABLE products ADD COLUMN IF NOT EXISTS order_date DATE;

-- Backfill before adding constraints.
UPDATE products SET gender = 'UNISEX' WHERE gender IS NULL;
UPDATE products SET order_date = created_at::date WHERE order_date IS NULL;
UPDATE products
   SET order_no = 'ORD-' || LPAD(product_id::text, 5, '0')
 WHERE order_no IS NULL;

-- Order numbers are generated from a sequence for new rows.
CREATE SEQUENCE IF NOT EXISTS order_no_seq;

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

ALTER TABLE products
  ALTER COLUMN gender SET DEFAULT 'UNISEX';

ALTER TABLE products
  ALTER COLUMN order_date SET DEFAULT CURRENT_DATE;

ALTER TABLE products
  ALTER COLUMN order_no SET DEFAULT ('ORD-' || LPAD(nextval('order_no_seq')::text, 5, '0'));

ALTER TABLE products ALTER COLUMN gender SET NOT NULL;
ALTER TABLE products ALTER COLUMN order_no SET NOT NULL;

ALTER TABLE products DROP CONSTRAINT IF EXISTS products_gender_check;

ALTER TABLE products
  ADD CONSTRAINT products_gender_check
  CHECK (gender IN ('MEN', 'WOMEN', 'BOYS', 'GIRLS', 'KIDS', 'UNISEX'));

CREATE UNIQUE INDEX IF NOT EXISTS ux_products_order_no ON products (order_no);
CREATE INDEX IF NOT EXISTS ix_products_order_date ON products (order_date);
