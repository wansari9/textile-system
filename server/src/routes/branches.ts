import { Router, Request, Response } from 'express';
import pool from '../config/db';

const router = Router();

// GET /api/branches  (?all=true to include inactive)
router.get('/', async (req: Request, res: Response) => {
  const includeInactive = req.query.all === 'true';
  try {
    const sql = includeInactive
      ? `SELECT branch_id, branch_name, is_main, is_active, created_at FROM branches ORDER BY branch_name`
      : `SELECT branch_id, branch_name, is_main, is_active, created_at
         FROM branches WHERE is_active = 1 ORDER BY branch_name`;
    const result = await pool.query(sql);
    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    console.error('List branches error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch branches' });
  }
});

// GET /api/branches/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT branch_id, branch_name, is_main, is_active, created_at FROM branches WHERE branch_id = $1`,
      [req.params.id]
    );
    if (!result.rows[0]) {
      return res.status(404).json({ success: false, message: 'Branch not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error('Get branch error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch branch' });
  }
});

// POST /api/branches
router.post('/', async (req: Request, res: Response) => {
  const { branch_name, is_main } = req.body;
  if (!branch_name) {
    return res.status(400).json({ success: false, message: 'branch_name is required' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO branches (branch_name, is_main)
       VALUES ($1,        COALESCE($2, 0))
       RETURNING branch_id, branch_name, is_main, is_active, created_at`,
      [branch_name, is_main ?? null]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error('Create branch error:', error);
    res.status(500).json({ success: false, message: 'Failed to create branch' });
  }
});

// PUT /api/branches/:id
router.put('/:id', async (req: Request, res: Response) => {
  const { branch_name, is_main, is_active } = req.body;
  try {
    const result = await pool.query(
      `UPDATE branches
       SET branch_name = COALESCE($1, branch_name),
           is_main     = COALESCE($2, is_main),
           is_active   = COALESCE($3, is_active)
       WHERE branch_id = $4
       RETURNING branch_id, branch_name, is_main, is_active, created_at`,
      [branch_name, is_main, is_active, req.params.id]
    );
    if (!result.rows[0]) {
      return res.status(404).json({ success: false, message: 'Branch not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error('Update branch error:', error);
    res.status(500).json({ success: false, message: 'Failed to update branch' });
  }
});

// DELETE /api/branches/:id  (soft delete)
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `UPDATE branches SET is_active = 0 WHERE branch_id = $1 RETURNING branch_id`,
      [req.params.id]
    );
    if (!result.rows[0]) {
      return res.status(404).json({ success: false, message: 'Branch not found' });
    }
    res.json({ success: true, message: 'Branch deactivated' });
  } catch (error: any) {
    console.error('Delete branch error:', error);
    res.status(500).json({ success: false, message: 'Failed to deactivate branch' });
  }
});

// ---------------------------------------------------------------------
// Branch-level daily production (the company-wide "Total Production"
// figure from the manual sheet — separate from per-line hourly entries)
// ---------------------------------------------------------------------

// POST /api/branches/:id/daily  (upsert today's branch-wide target/actual)
router.post('/:id/daily', async (req: Request, res: Response) => {
  const branchId = req.params.id;
  const { production_date, daily_target, qty_produced, entered_by } = req.body;

  if (!production_date) {
    return res.status(400).json({ success: false, message: 'production_date is required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO branch_daily_production (branch_id, production_date, daily_target, qty_produced, entered_by)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (branch_id, production_date)
       DO UPDATE SET
         daily_target = EXCLUDED.daily_target,
         qty_produced = EXCLUDED.qty_produced,
         entered_by   = EXCLUDED.entered_by,
         entered_at    = CURRENT_TIMESTAMP
       RETURNING record_id, branch_id, production_date, daily_target, qty_produced, entered_by, entered_at`,
      [branchId, production_date, daily_target ?? 0, qty_produced ?? 0, entered_by ?? null]
      // TODO: once auth middleware exists, take entered_by from req.user.userId instead of the body
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error('Upsert branch daily production error:', error);
    res.status(500).json({ success: false, message: 'Failed to save branch daily production' });
  }
});

// GET /api/branches/:id/daily  (?date=  or  ?from=&to=)
router.get('/:id/daily', async (req: Request, res: Response) => {
  const branchId = req.params.id;
  const { date, from, to } = req.query;
  try {
    const conditions: string[] = ['branch_id = $1'];
    const params: any[] = [branchId];

    if (date) {
      params.push(date);
      conditions.push(`production_date = $${params.length}`);
    } else if (from && to) {
      params.push(from);
      conditions.push(`production_date >= $${params.length}`);
      params.push(to);
      conditions.push(`production_date <= $${params.length}`);
    }

    const result = await pool.query(
      `SELECT record_id, branch_id, production_date, daily_target, qty_produced, entered_by, entered_at
       FROM branch_daily_production
       WHERE ${conditions.join(' AND ')}
       ORDER BY production_date DESC`,
      params
    );
    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    console.error('List branch daily production error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch branch daily production' });
  }
});

// GET /api/branches/:id/summary  (target vs actual vs difference, from vw_branch_daily_summary)
router.get('/:id/summary', async (req: Request, res: Response) => {
  try {
    const { date } = req.query;
    let query = `SELECT * FROM vw_branch_daily_summary WHERE branch_id = $1`;
    const params: any[] = [req.params.id];
    if (date) {
      query += ` AND production_date = $2`;
      params.push(date);
    }
    query += ` ORDER BY production_date DESC`;
    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    console.error('Get branch summary error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch branch summary' });
  }
});

export default router;