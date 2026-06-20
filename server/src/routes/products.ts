import { Router, Request, Response } from 'express';
import pool from '../config/db';

const router = Router();

const PRODUCT_COLUMNS = `product_id, customer_id, product_name, style_code, color, size,
  order_quantity, daily_target, status, start_date, due_date, created_at`;

// GET /api/products  (?customer_id=&status= optional filters)
router.get('/', async (req: Request, res: Response) => {
  const { customer_id, status } = req.query;
  try {
    const conditions: string[] = [];
    const params: any[] = [];

    if (customer_id) {
      params.push(customer_id);
      conditions.push(`customer_id = $${params.length}`);
    }
    if (status) {
      params.push(status);
      conditions.push(`status = $${params.length}`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await pool.query(
      `SELECT ${PRODUCT_COLUMNS} FROM products ${whereClause} ORDER BY created_at DESC`,
      params
    );
    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    console.error('List products error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch products' });
  }
});

// GET /api/products/customer/:customerId  (all products for one customer)
router.get('/customer/:customerId', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT ${PRODUCT_COLUMNS} FROM products WHERE customer_id = $1 ORDER BY created_at DESC`,
      [req.params.customerId]
    );
    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    console.error('List products by customer error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch products' });
  }
});

// GET /api/products/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT ${PRODUCT_COLUMNS} FROM products WHERE product_id = $1`,
      [req.params.id]
    );
    if (!result.rows[0]) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error('Get product error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch product' });
  }
});

// GET /api/products/:id/progress  (order fulfillment %, from vw_product_progress)
router.get('/:id/progress', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT * FROM vw_product_progress WHERE product_id = $1`,
      [req.params.id]
    );
    if (!result.rows[0]) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error('Get product progress error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch product progress' });
  }
});

// POST /api/products
router.post('/', async (req: Request, res: Response) => {
  const {
    customer_id, product_name, style_code, color, size,
    order_quantity, daily_target, status, start_date, due_date,
  } = req.body;

  if (!customer_id || !product_name || !order_quantity || !daily_target) {
    return res.status(400).json({
      success: false,
      message: 'customer_id, product_name, order_quantity, and daily_target are required',
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO products
         (customer_id, product_name, style_code, color, size, order_quantity, daily_target, status, start_date, due_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8, 'PENDING'), $9, $10)
       RETURNING ${PRODUCT_COLUMNS}`,
      [
        customer_id, product_name, style_code ?? null, color ?? null, size ?? null,
        order_quantity, daily_target, status ?? null, start_date ?? null, due_date ?? null,
      ]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error('Create product error:', error);
    res.status(500).json({ success: false, message: 'Failed to create product' });
  }
});

// PUT /api/products/:id
router.put('/:id', async (req: Request, res: Response) => {
  const {
    product_name, style_code, color, size,
    order_quantity, daily_target, status, start_date, due_date,
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE products
       SET product_name   = COALESCE($1, product_name),
           style_code     = COALESCE($2, style_code),
           color          = COALESCE($3, color),
           size           = COALESCE($4, size),
           order_quantity = COALESCE($5, order_quantity),
           daily_target   = COALESCE($6, daily_target),
           status         = COALESCE($7, status),
           start_date     = COALESCE($8, start_date),
           due_date       = COALESCE($9, due_date)
       WHERE product_id = $10
       RETURNING ${PRODUCT_COLUMNS}`,
      [product_name, style_code, color, size, order_quantity, daily_target, status, start_date, due_date, req.params.id]
    );
    if (!result.rows[0]) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error('Update product error:', error);
    res.status(500).json({ success: false, message: 'Failed to update product' });
  }
});

// DELETE /api/products/:id  (no is_active column on products - cancel instead of hard delete)
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `UPDATE products SET status = 'CANCELLED' WHERE product_id = $1 RETURNING product_id`,
      [req.params.id]
    );
    if (!result.rows[0]) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, message: 'Product cancelled' });
  } catch (error: any) {
    console.error('Cancel product error:', error);
    res.status(500).json({ success: false, message: 'Failed to cancel product' });
  }
});

export default router;