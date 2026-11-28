import { Router, Request, Response } from 'express';
import pool from '../config/db';
import { authenticateToken, canAccessLine, isAdmin, lineIdsFor, requireRole } from '../middleware/auth';

const router = Router();

// Every line route needs a signed-in user; individual routes decide whether
// the caller is an admin or a line manager.
router.use(authenticateToken);

const LINE_TYPES = ['SEWING', 'CUTTING'];

const localISODate = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

// GET /api/lines  (?branch_id=&status=&line_type=&date= optional filters)
// Also returns the active order and the score for the requested day so list
// screens don't need one request per line.
router.get('/', async (req: Request, res: Response) => {
  const { branch_id, status, line_type, date } = req.query;
  const scoreDate = typeof date === 'string' && date ? date : localISODate();
  try {
    // $1 is always the score/report date; filters follow.
    const conditions: string[] = [];
    const params: any[] = [scoreDate];

    if (branch_id) {
      params.push(branch_id);
      conditions.push(`pl.branch_id = $${params.length}`);
    }
    if (status) {
      params.push(status);
      conditions.push(`pl.status = $${params.length}`);
    }
    if (line_type) {
      params.push(String(line_type).toUpperCase());
      conditions.push(`pl.line_type = $${params.length}`);
    }

    // Line managers only ever see the lines assigned to them.
    const user = (req as any).user;
    if (!isAdmin(user)) {
      const allowed = lineIdsFor(user);
      if (allowed.length === 0) {
        return res.json({ success: true, data: [] });
      }
      params.push(allowed);
      conditions.push(`pl.line_id = ANY($${params.length}::int[])`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await pool.query(
      `SELECT pl.line_id, pl.branch_id, b.branch_name, pl.line_name, pl.line_type, pl.status, pl.created_at,
              s.total_produced AS produced_today, s.daily_target AS target_today, s.score::float8 AS score,
              la.assignment_id, la.daily_target AS assigned_target,
              p.product_id, p.product_name, p.order_no, p.gender,
              c.customer_id, c.customer_name
       FROM production_lines pl
       JOIN branches b ON b.branch_id = pl.branch_id
       LEFT JOIN vw_line_daily_score s
              ON s.line_id = pl.line_id AND s.production_date = $1
       LEFT JOIN LATERAL (
         SELECT la2.assignment_id, la2.daily_target, la2.product_id
         FROM line_assignments la2
         WHERE la2.line_id = pl.line_id AND la2.status = 'ACTIVE'
         ORDER BY la2.start_date DESC, la2.assignment_id DESC
         LIMIT 1
       ) la ON true
       LEFT JOIN products p ON p.product_id = la.product_id
       LEFT JOIN customers c ON c.customer_id = p.customer_id
       ${whereClause}
       ORDER BY pl.line_type, NULLIF(regexp_replace(pl.line_name, '[^0-9]', '', 'g'), '')::int, pl.line_name`,
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
  const user = (req as any).user;
  if (!canAccessLine(user, req.params.id)) {
    return res.status(403).json({ success: false, message: 'You can only view your own lines' });
  }
  try {
    const result = await pool.query(
      `SELECT pl.line_id, pl.branch_id, b.branch_name, pl.line_name, pl.line_type, pl.status, pl.created_at
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
router.post('/', requireRole('ADMIN'), async (req: Request, res: Response) => {
  const { branch_id, line_name, status, line_type } = req.body;
  if (!branch_id || !line_name) {
    return res.status(400).json({ success: false, message: 'branch_id and line_name are required' });
  }

  const normalizedType = line_type ? String(line_type).toUpperCase() : 'SEWING';
  if (!LINE_TYPES.includes(normalizedType)) {
    return res.status(400).json({ success: false, message: `line_type must be one of: ${LINE_TYPES.join(', ')}` });
  }

  try {
    const result = await pool.query(
      `INSERT INTO production_lines (branch_id, line_name, status, line_type)
       VALUES ($1, $2, COALESCE($3, 'ACTIVE'), $4)
       RETURNING line_id, branch_id, line_name, line_type, status, created_at`,
      [branch_id, line_name, status ?? null, normalizedType]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error('Create line error:', error);
    res.status(500).json({ success: false, message: 'Failed to create line' });
  }
});

// PUT /api/lines/:id  (rename, change status, move branch, change type)
router.put('/:id', requireRole('ADMIN'), async (req: Request, res: Response) => {
  const { branch_id, line_name, status, line_type } = req.body;

  const normalizedType = line_type ? String(line_type).toUpperCase() : null;
  if (normalizedType && !LINE_TYPES.includes(normalizedType)) {
    return res.status(400).json({ success: false, message: `line_type must be one of: ${LINE_TYPES.join(', ')}` });
  }

  try {
    const result = await pool.query(
      `UPDATE production_lines
       SET branch_id = COALESCE($1, branch_id),
           line_name = COALESCE($2, line_name),
           status    = COALESCE($3, status),
           line_type = COALESCE($4, line_type)
       WHERE line_id = $5
       RETURNING line_id, branch_id, line_name, line_type, status, created_at`,
      [branch_id, line_name, status, normalizedType, req.params.id]
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
// Only SEWING lines take assignments; cutting lines record stage output instead.
router.post('/:id/assign', requireRole('ADMIN'), async (req: Request, res: Response) => {
  const lineId = req.params.id;
  const { product_id, daily_target, start_date } = req.body;

  if (!product_id || !daily_target || !start_date) {
    return res.status(400).json({
      success: false,
      message: 'product_id, daily_target, and start_date are required',
    });
  }

  const client = await pool.connect();
  try {
    const line = await client.query(
      `SELECT line_id, line_type FROM production_lines WHERE line_id = $1`,
      [lineId]
    );
    if (!line.rows[0]) {
      return res.status(404).json({ success: false, message: 'Line not found' });
    }
    if (line.rows[0].line_type !== 'SEWING') {
      return res.status(400).json({ success: false, message: 'Products can only be assigned to SEWING lines' });
    }

    await client.query('BEGIN');

    const assignment = await client.query(
      `INSERT INTO line_assignments (line_id, product_id, daily_target, start_date, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING assignment_id`,
      [lineId, product_id, daily_target, start_date, (req as any).user.id]
    );

    // Mark the product ACTIVE if it was just sitting PENDING
    await client.query(
      `UPDATE products SET status = 'ACTIVE' WHERE product_id = $1 AND status = 'PENDING'`,
      [product_id]
    );

    const enriched = await client.query(
      `SELECT la.assignment_id, la.line_id, la.product_id, la.daily_target, la.start_date, la.end_date,
              la.status, la.created_at,
              pl.line_name, pl.line_type,
              p.product_name, p.style_code, p.color, p.size, p.order_quantity, p.order_no, p.gender,
              c.customer_id, c.customer_name
       FROM line_assignments la
       JOIN production_lines pl ON pl.line_id = la.line_id
       JOIN products p ON p.product_id = la.product_id
       JOIN customers c ON c.customer_id = p.customer_id
       WHERE la.assignment_id = $1`,
      [assignment.rows[0].assignment_id]
    );

    await client.query('COMMIT');
    res.status(201).json({ success: true, data: enriched.rows[0] });
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
  const user = (req as any).user;
  if (!canAccessLine(user, req.params.id)) {
    return res.status(403).json({ success: false, message: 'You can only view your own lines' });
  }
  try {
    const result = await pool.query(
      `SELECT la.assignment_id, la.line_id, la.daily_target, la.start_date, la.status,
              p.product_id, p.product_name, p.style_code, p.color, p.size, p.order_quantity,
              p.order_no, p.gender,
              c.customer_id, c.customer_name,
              pl.line_name, pl.line_type
       FROM line_assignments la
       JOIN products p ON p.product_id = la.product_id
       JOIN customers c ON c.customer_id = p.customer_id
       JOIN production_lines pl ON pl.line_id = la.line_id
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
router.get('/:id/history', requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT la.assignment_id, la.daily_target, la.start_date, la.end_date, la.status,
              p.product_id, p.product_name, p.order_no, p.gender,
              c.customer_id, c.customer_name
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
