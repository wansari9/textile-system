import { Router, Request, Response } from 'express';
import pool from '../config/db';

const router = Router();

// POST /api/workforce  (upsert today's headcount for a line — one row per line per day)
router.post('/', async (req: Request, res: Response) => {
  const { line_id, production_date, workers_required, workers_present, notes, recorded_by } = req.body;

  if (!line_id || !production_date || workers_present === undefined) {
    return res.status(400).json({
      success: false,
      message: 'line_id, production_date, and workers_present are required',
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
      [line_id, production_date, workers_required ?? null, workers_present, notes ?? null, recorded_by ?? null]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error('Upsert workforce error:', error);
    res.status(500).json({ success: false, message: 'Failed to save workforce count' });
  }
});

// GET /api/workforce  (?line_id=&date=  or  ?line_id=&from=&to=)
router.get('/', async (req: Request, res: Response) => {
  const { line_id, date, from, to } = req.query;
  try {
    const conditions: string[] = [];
    const params: any[] = [];

    if (line_id) {
      params.push(line_id);
      conditions.push(`dw.line_id = $${params.length}`);
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