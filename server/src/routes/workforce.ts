import { Router, Request, Response } from 'express';
import pool from '../config/db';
import { authenticateToken, canAccessLine, lineIdsFor } from '../middleware/auth';

const router = Router();

// Admins and line managers both record workforce, but a line manager is locked
// to the lines assigned to them.
router.use(authenticateToken);

// POST /api/workforce  (upsert today's headcount for a line — one row per line per day)
router.post('/', async (req: Request, res: Response) => {
  const authUser = (req as any).user;
  const admin = authUser.role === 'ADMIN';
  const { production_date, workers_required, workers_present, notes } = req.body;

  let lineId: number | null = req.body.line_id ? Number(req.body.line_id) : null;
  if (!admin) {
    const allowed = lineIdsFor(authUser);
    if (allowed.length === 0) {
      return res.status(403).json({ success: false, message: 'No production line is assigned to this account' });
    }
    if (!lineId) lineId = allowed[0];
    if (!canAccessLine(authUser, lineId)) {
      return res.status(403).json({ success: false, message: 'You can only record workforce for your assigned lines' });
    }
  }
  if (!lineId) {
    return res.status(403).json({ success: false, message: 'No production line is assigned to this account' });
  }
  if (!production_date || workers_present === undefined) {
    return res.status(400).json({
      success: false,
      message: 'production_date and workers_present are required',
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO daily_workforce (line_id, production_date, workers_required, workers_present, notes, recorded_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (line_id, production_date)
       DO UPDATE SET
         workers_required = EXCLUDED.workers_required,
         workers_present  = EXCLUDED.workers_present,
         notes            = EXCLUDED.notes,
         recorded_by      = EXCLUDED.recorded_by,
         recorded_at       = CURRENT_TIMESTAMP
       RETURNING record_id, line_id, production_date, workers_required, workers_present, notes, recorded_by, recorded_at`,
      // recorded_by always comes from the token, never the body.
      [lineId, production_date, workers_required ?? null, workers_present, notes ?? null, authUser.id]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error('Upsert workforce error:', error);
    res.status(500).json({ success: false, message: 'Failed to save workforce count' });
  }
});

// GET /api/workforce  (?line_id=&date=  or  ?line_id=&from=&to=)
// Line managers only ever receive rows for their assigned lines.
router.get('/', async (req: Request, res: Response) => {
  const authUser = (req as any).user;
  const admin = authUser.role === 'ADMIN';
  const { line_id, date, from, to } = req.query;

  let scopedLineIds: number[] | null = null;
  if (!admin) {
    scopedLineIds = lineIdsFor(authUser);
    if (scopedLineIds.length === 0) {
      return res.json({ success: true, data: [] });
    }
    if (line_id && !scopedLineIds.includes(Number(line_id))) {
      return res.status(403).json({ success: false, message: 'You can only view your assigned lines' });
    }
  }

  try {
    const conditions: string[] = [];
    const params: any[] = [];

    if (line_id) {
      params.push(line_id);
      conditions.push(`dw.line_id = $${params.length}`);
    } else if (scopedLineIds) {
      params.push(scopedLineIds);
      conditions.push(`dw.line_id = ANY($${params.length}::int[])`);
    }
    if (date) {
      params.push(date);
      conditions.push(`dw.production_date = $${params.length}`);
    } else if (from && to) {
      params.push(from);
      conditions.push(`dw.production_date >= $${params.length}`);
      params.push(to);
      conditions.push(`dw.production_date <= $${params.length}`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await pool.query(
      `SELECT dw.record_id, dw.line_id, pl.line_name, dw.production_date,
              dw.workers_required, dw.workers_present, dw.notes, dw.recorded_by, dw.recorded_at
       FROM daily_workforce dw
       JOIN production_lines pl ON pl.line_id = dw.line_id
       ${whereClause}
       ORDER BY dw.production_date DESC, pl.line_name`,
      params
    );
    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    console.error('List workforce error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch workforce records' });
  }
});

export default router;
