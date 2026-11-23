import { Router, Request, Response } from 'express';
import pool from '../config/db';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// Daily stage records are an admin-only area.
router.use(authenticateToken, requireRole('ADMIN'));

// Matches the CHECK constraint on process_stage_daily.stage
const VALID_STAGES = ['CUTTING', 'STITCHING', 'IRONING', 'PACKING'];

// POST /api/stages  (upsert today's completed qty for a stage/product)
// Cutting rows can carry a line_id so each of the cutting lines is tracked
// separately; other stages keep one row per product/date (line_id NULL).
router.post('/', async (req: Request, res: Response) => {
  const { stage, product_id, production_date, qty_completed, line_id } = req.body;
  const enteredBy = (req as any).user.id;

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

  // line_id is optional (older clients never send it) but only meaningful for
  // cutting, and it must point at a line of type CUTTING.
  let lineId: number | null = null;
  if (line_id !== undefined && line_id !== null && line_id !== '') {
    if (normalizedStage !== 'CUTTING') {
      return res.status(400).json({
        success: false,
        message: 'line_id is only supported for the CUTTING stage',
      });
    }
    try {
      const line = await pool.query(
        `SELECT line_id, line_type FROM production_lines WHERE line_id = $1`,
        [line_id]
      );
      if (!line.rows[0]) {
        return res.status(400).json({ success: false, message: 'line_id does not match a production line' });
      }
      if (line.rows[0].line_type !== 'CUTTING') {
        return res.status(400).json({ success: false, message: 'line_id must reference a CUTTING line' });
      }
      lineId = line.rows[0].line_id;
    } catch (error: any) {
      console.error('Validate cutting line error:', error);
      return res.status(500).json({ success: false, message: 'Failed to validate cutting line' });
    }
  }

  try {
    const result = await pool.query(
      `INSERT INTO process_stage_daily (stage, product_id, line_id, production_date, qty_completed, entered_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (stage, product_id, production_date, line_key)
       DO UPDATE SET
         qty_completed = EXCLUDED.qty_completed,
         entered_by    = EXCLUDED.entered_by,
         entered_at    = CURRENT_TIMESTAMP
       RETURNING record_id, stage, product_id, line_id, production_date, qty_completed, entered_by, entered_at,
                 (SELECT line_name FROM production_lines WHERE line_id = process_stage_daily.line_id) AS line_name`,
      [normalizedStage, product_id, lineId, production_date, qty_completed, enteredBy]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error('Upsert stage progress error:', error);
    res.status(500).json({ success: false, message: 'Failed to save stage progress' });
  }
});

// GET /api/stages  (?product_id=&stage=&line_id=&date=  or  ?from=&to=)
router.get('/', async (req: Request, res: Response) => {
  const { product_id, stage, line_id, date, from, to } = req.query;
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
    if (line_id) {
      params.push(line_id);
      conditions.push(`psd.line_id = $${params.length}`);
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
              p.product_id, p.product_name, c.customer_id, c.customer_name,
              psd.line_id, pl.line_name, p.order_no
       FROM process_stage_daily psd
       JOIN products p ON p.product_id = psd.product_id
       JOIN customers c ON c.customer_id = p.customer_id
       LEFT JOIN production_lines pl ON pl.line_id = psd.line_id
       ${whereClause}
       ORDER BY psd.production_date DESC, psd.stage, pl.line_name`,
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
