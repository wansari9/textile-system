import { Router, Request, Response } from 'express';
import pool from '../config/db';

const router = Router();

// POST /api/quality  (upsert today's QC tally for a customer)
router.post('/', async (req: Request, res: Response) => {
  const { customer_id, production_date, pcs_checked, pcs_faults, entered_by } = req.body;

  if (!customer_id || !production_date || pcs_checked === undefined) {
    return res.status(400).json({
      success: false,
      message: 'customer_id, production_date, and pcs_checked are required',
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO quality_checks (customer_id, production_date, pcs_checked, pcs_faults, entered_by)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (customer_id, production_date)
       DO UPDATE SET
         pcs_checked = EXCLUDED.pcs_checked,
         pcs_faults  = EXCLUDED.pcs_faults,
         entered_by  = EXCLUDED.entered_by,
         entered_at   = CURRENT_TIMESTAMP
       RETURNING check_id, customer_id, production_date, pcs_checked, pcs_faults, entered_by, entered_at`,
      [customer_id, production_date, pcs_checked, pcs_faults ?? 0, entered_by ?? null]
      // TODO: once auth middleware exists, take entered_by from req.user.userId instead of the body
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error('Upsert quality check error:', error);
    res.status(500).json({ success: false, message: 'Failed to save quality check' });
  }
});

// GET /api/quality  (?customer_id=&date=  or  ?from=&to=)
// Pulls from vw_quality_summary so pcs_ok and pass_rate_pct come pre-computed.
router.get('/', async (req: Request, res: Response) => {
  const { customer_id, date, from, to } = req.query;
  try {
    const conditions: string[] = [];
    const params: any[] = [];

    if (customer_id) {
      params.push(customer_id);
      conditions.push(`customer_id = $${params.length}`);
    }
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
      `SELECT * FROM vw_quality_summary ${whereClause} ORDER BY production_date DESC, customer_name`,
      params
    );
    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    console.error('List quality checks error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch quality checks' });
  }
});

export default router;