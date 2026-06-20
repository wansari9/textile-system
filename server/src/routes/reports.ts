import { Router, Request, Response } from 'express';
import pool from '../config/db';

const router = Router();

// GET /api/reports/daily?date=YYYY-MM-DD
// Factory-wide total for the day + per-line/product breakdown.
router.get('/daily', async (req: Request, res: Response) => {
  const { date } = req.query;
  if (!date) {
    return res.status(400).json({ success: false, message: 'date query param is required' });
  }
  try {
    const [totalResult, breakdownResult] = await Promise.all([
      pool.query(`SELECT * FROM vw_daily_factory_total WHERE production_date = $1`, [date]),
      pool.query(
        `SELECT * FROM vw_daily_line_summary WHERE production_date = $1 ORDER BY line_name`,
        [date]
      ),
    ]);
    res.json({
      success: true,
      data: {
        total: totalResult.rows[0] ?? null,
        by_line: breakdownResult.rows,
      },
    });
  } catch (error: any) {
    console.error('Daily report error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate daily report' });
  }
});

// GET /api/reports/weekly?start=YYYY-MM-DD&end=YYYY-MM-DD
router.get('/weekly', async (req: Request, res: Response) => {
  const { start, end } = req.query;
  if (!start || !end) {
    return res.status(400).json({ success: false, message: 'start and end query params are required' });
  }
  try {
    const result = await pool.query(
      `SELECT ws.week_start, ws.line_id, pl.line_name, ws.product_id, p.product_name, c.customer_name,
              ws.total_produced, ws.total_defect, ws.total_target
       FROM vw_weekly_summary ws
       JOIN production_lines pl ON pl.line_id = ws.line_id
       JOIN products p ON p.product_id = ws.product_id
       JOIN customers c ON c.customer_id = p.customer_id
       WHERE ws.week_start BETWEEN $1 AND $2
       ORDER BY ws.week_start DESC, pl.line_name`,
      [start, end]
    );
    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    console.error('Weekly report error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate weekly report' });
  }
});

// GET /api/reports/customer/:id
// Order progress for every product belonging to this customer.
// (Built directly off products+hourly_production rather than vw_product_progress,
//  since that view doesn't expose customer_id — only customer_name.)
router.get('/customer/:id', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT p.product_id, p.product_name, p.style_code, p.color, p.size,
              p.order_quantity, p.status,
              COALESCE(SUM(hp.qty_produced), 0) AS total_produced_to_date,
              p.order_quantity - COALESCE(SUM(hp.qty_produced), 0) AS remaining_qty,
              ROUND((COALESCE(SUM(hp.qty_produced), 0)::NUMERIC / p.order_quantity) * 100, 1) AS pct_complete
       FROM products p
       LEFT JOIN hourly_production hp ON hp.product_id = p.product_id
       WHERE p.customer_id = $1
       GROUP BY p.product_id, p.product_name, p.style_code, p.color, p.size, p.order_quantity, p.status
       ORDER BY p.created_at DESC`,
      [req.params.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    console.error('Customer report error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate customer report' });
  }
});

// GET /api/reports/line/:id?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/line/:id', async (req: Request, res: Response) => {
  const { from, to } = req.query;
  if (!from || !to) {
    return res.status(400).json({ success: false, message: 'from and to query params are required' });
  }
  try {
    const result = await pool.query(
      `SELECT * FROM vw_daily_line_summary
       WHERE line_id = $1 AND production_date BETWEEN $2 AND $3
       ORDER BY production_date DESC`,
      [req.params.id, from, to]
    );
    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    console.error('Line report error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate line report' });
  }
});

// GET /api/reports/efficiency?line_id=&from=&to=  (units produced per worker)
router.get('/efficiency', async (req: Request, res: Response) => {
  const { line_id, from, to } = req.query;
  try {
    const conditions: string[] = [];
    const params: any[] = [];

    if (line_id) {
      params.push(line_id);
      conditions.push(`line_id = $${params.length}`);
    }
    if (from && to) {
      params.push(from);
      conditions.push(`production_date >= $${params.length}`);
      params.push(to);
      conditions.push(`production_date <= $${params.length}`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await pool.query(
      `SELECT * FROM vw_line_efficiency ${whereClause} ORDER BY production_date DESC, line_name`,
      params
    );
    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    console.error('Efficiency report error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate efficiency report' });
  }
});

// GET /api/reports/company?date=  or  ?from=&to=
// Combines line-based production with branch-level totals (vw_company_daily_total).
router.get('/company', async (req: Request, res: Response) => {
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
      `SELECT * FROM vw_company_daily_total ${whereClause} ORDER BY production_date DESC`,
      params
    );
    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    console.error('Company report error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate company report' });
  }
});

export default router;