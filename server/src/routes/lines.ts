import { Router, Request, Response } from 'express';
import pool from '../config/db';

const router = Router();

// GET /api/lines  (?branch_id=&status= optional filters)
router.get('/', async (req: Request, res: Response) => {
  const { branch_id, status } = req.query;
  try {
    const conditions: string[] = [];
    const params: any[] = [];

    if (branch_id) {
      params.push(branch_id);
      conditions.push(`pl.branch_id = $${params.length}`);
    }
    if (status) {
      params.push(status);
      conditions.push(`pl.status = $${params.length}`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await pool.query(
      `SELECT pl.line_id, pl.branch_id, b.branch_name, pl.line_name, pl.status, pl.created_at
       FROM production_lines pl
       JOIN branches b ON b.branch_id = pl.branch_id
       ${whereClause}
       ORDER BY pl.line_name`,
      params
    );
    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    console.error('List lines error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch lines' });
  }
});

// GET /api/lines/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT pl.line_id, pl.branch_id, b.branch_name, pl.line_name, pl.status, pl.created_at
       FROM production_lines pl
       JOIN branches b ON b.branch_id = pl.branch_id
       WHERE pl.line_id = $1`,
      [req.params.id]
    );
    if (!result.rows[0]) {
      return res.status(404).json({ success: false, message: 'Line not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error('Get line error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch line' });
  }
});

// POST /api/lines
router.post('/', async (req: Request, res: Response) => {
  const { branch_id, line_name, status } = req.body;
  if (!branch_id || !line_name) {
    return res.status(400).json({ success: false, message: 'branch_id and line_name are required' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO production_lines (branch_id, line_name, status)
       VALUES ($1, $2, COALESCE($3, 'ACTIVE'))
       RETURNING line_id, branch_id, line_name, status, created_at`,
      [branch_id, line_name, status ?? null]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error('Create line error:', error);
    res.status(500).json({ success: false, message: 'Failed to create line' });
  }
});

// PUT /api/lines/:id  (rename, change status, move branch)
router.put('/:id', async (req: Request, res: Response) => {
  const { branch_id, line_name, status } = req.body;
  try {
    const result = await pool.query(
      `UPDATE production_lines
       SET branch_id = COALESCE($1, branch_id),
           line_name = COALESCE($2, line_name),
           status    = COALESCE($3, status)
       WHERE line_id = $4
       RETURNING line_id, branch_id, line_name, status, created_at`,
      [branch_id, line_name, status, req.params.id]
    );
    if (!result.rows[0]) {
      return res.status(404).json({ success: false, message: 'Line not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error('Update line error:', error);
    res.status(500).json({ success: false, message: 'Failed to update line' });
  }
});

// POST /api/lines/:id/assign  (assign a product to this line)
// The DB trigger trg_close_prev_assignment auto-closes any existing active
// assignment on this line, so this always becomes the new active assignment.
router.post('/:id/assign', async (req: Request, res: Response) => {
  const lineId = req.params.id;
  const { product_id, daily_target, start_date, created_by } = req.body;

  if (!product_id || !daily_target || !start_date) {
    return res.status(400).json({
      success: false,
      message: 'product_id, daily_target, and start_date are required',
    });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const assignment = await client.query(
      `INSERT INTO line_assignments (line_id, product_id, daily_target, start_date, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING assignment_id, line_id, product_id, daily_target, start_date, end_date, status, created_at`,
      [lineId, product_id, daily_target, start_date, created_by ?? null]
      // TODO: once auth middleware exists, take created_by from req.user.userId instead of the body
    );

    // Mark the product ACTIVE if it was just sitting PENDING
    await client.query(
      `UPDATE products SET status = 'ACTIVE' WHERE product_id = $1 AND status = 'PENDING'`,
      [product_id]
    );

    await client.query('COMMIT');
    res.status(201).json({ success: true, data: assignment.rows[0] });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Assign product to line error:', error);
    res.status(500).json({ success: false, message: 'Failed to assign product to line' });
  } finally {
    client.release();
  }
});

// GET /api/lines/:id/current  (the active assignment running on this line right now)
router.get('/:id/current', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT la.assignment_id, la.line_id, la.daily_target, la.start_date, la.status,
              p.product_id, p.product_name, p.style_code, p.color, p.size, p.order_quantity,
              c.customer_id, c.customer_name
       FROM line_assignments la
       JOIN products p ON p.product_id = la.product_id
       JOIN customers c ON c.customer_id = p.customer_id
       WHERE la.line_id = $1 AND la.status = 'ACTIVE'`,
      [req.params.id]
    );
    if (!result.rows[0]) {
      return res.status(404).json({ success: false, message: 'No active assignment on this line' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error('Get current assignment error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch current assignment' });
  }
});

// GET /api/lines/:id/history  (full assignment history for this line)
router.get('/:id/history', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT la.assignment_id, la.daily_target, la.start_date, la.end_date, la.status,
              p.product_id, p.product_name, c.customer_id, c.customer_name
       FROM line_assignments la
       JOIN products p ON p.product_id = la.product_id
       JOIN customers c ON c.customer_id = p.customer_id
       WHERE la.line_id = $1
       ORDER BY la.start_date DESC`,
      [req.params.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    console.error('Get line history error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch line history' });
  }
});

export default router;