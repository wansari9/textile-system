import { Router, Request, Response } from 'express';
import pool from '../config/db';

const router = Router();

// Matches the CHECK constraint on process_stage_daily.stage
const VALID_STAGES = ['CUTTING', 'PACKING', 'IRONING'];

// POST /api/stages  (upsert today's completed qty for a stage/product)
router.post('/', async (req: Request, res: Response) => {
  const { stage, product_id, production_date, qty_completed, entered_by } = req.body;

  if (!stage || !product_id || !production_date || qty_completed === undefined) {
    return res.status(400).json({
      success: false,
      message: 'stage, product_id, production_date, and qty_completed are required',
    });
  }

  const normalizedStage = String(stage).toUpperCase();
  if (!VALID_STAGES.includes(normalizedStage)) {
    return res.status(400).json({
      success: false,
      message: `stage must be one of: ${VALID_STAGES.join(', ')}`,
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO process_stage_daily (stage, product_id, production_date, qty_completed, entered_by)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (stage, product_id, production_date)
       DO UPDATE SET
         qty_completed = EXCLUDED.qty_completed,
         entered_by    = EXCLUDED.entered_by,
         entered_at     = CURRENT_TIMESTAMP
       RETURNING record_id, stage, product_id, production_date, qty_completed, entered_by, entered_at`,
      [normalizedStage, product_id, production_date, qty_completed, entered_by ?? null]
      // TODO: once auth middleware exists, take entered_by from req.user.userId instead of the body
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error('Upsert stage progress error:', error);
    res.status(500).json({ success: false, message: 'Failed to save stage progress' });
  }
});

// GET /api/stages  (?product_id=&stage=&date=  or  ?from=&to=)
router.get('/', async (req: Request, res: Response) => {
  const { product_id, stage, date, from, to } = req.query;
  try {
    const conditions: string[] = [];
    const params: any[] = [];

    if (product_id) {
      params.push(product_id);
      conditions.push(`psd.product_id = $${params.length}`);
    }
    if (stage) {
      params.push(String(stage).toUpperCase());
      conditions.push(`psd.stage = $${params.length}`);
    }
    if (date) {
      params.push(date);
      conditions.push(`psd.production_date = $${params.length}`);
    } else if (from && to) {
      params.push(from);
      conditions.push(`psd.production_date >= $${params.length}`);
      params.push(to);
      conditions.push(`psd.production_date <= $${params.length}`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await pool.query(
      `SELECT psd.record_id, psd.stage, psd.production_date, psd.qty_completed,
              p.product_id, p.product_name, c.customer_id, c.customer_name
       FROM process_stage_daily psd
       JOIN products p ON p.product_id = psd.product_id
       JOIN customers c ON c.customer_id = p.customer_id
       ${whereClause}
       ORDER BY psd.production_date DESC, psd.stage`,
      params
    );
    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    console.error('List stage progress error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stage progress' });
  }
});

// GET /api/stages/summary  (?date=  or  ?from=&to= — pulls from vw_process_stage_summary)
router.get('/summary', async (req: Request, res: Response) => {
  const { date, from, to } = req.query;
  try {
    const conditions: string[] = [];
    const params: any[] = [];

    if (date) {
      params.push(date);
      conditions.push(`production_date = $${params.length}`);
    } else if (from && to) {
      params.push(from);
      conditions.push(`production_date >= $${params.length}`);
      params.push(to);
      conditions.push(`production_date <= $${params.length}`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await pool.query(
      `SELECT * FROM vw_process_stage_summary ${whereClause} ORDER BY production_date DESC, stage`,
      params
    );
    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    console.error('Get stage summary error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stage summary' });
  }
});

export default router;