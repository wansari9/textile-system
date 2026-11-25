import { Router, Request, Response } from 'express';
import pool from '../config/db';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// Reports are an admin-only area.
router.use(authenticateToken, requireRole('ADMIN'));

// Strict whitelist of sortable report fields. Values are SQL expressions, so
// the client can never inject SQL through ?sort=.
const SORTABLE: Record<'daily' | 'weekly', Record<string, string>> = {
  daily: {
    order_no: 'order_no',
    customer: 'customer_name',
    product: 'product_name',
    gender: 'gender',
    line: 'line_name',
    produced: 'total_produced',
    target: 'daily_target',
    pct: 'pct_of_target',
    date: 'production_date',
  },
  weekly: {
    order_no: 'ws.order_no',
    customer: 'c.customer_name',
    product: 'p.product_name',
    gender: 'ws.gender',
    line: 'pl.line_name',
    produced: 'ws.total_produced',
    target: 'ws.total_target',
    pct: 'ROUND((ws.total_produced::NUMERIC / NULLIF(ws.total_target, 0)) * 100, 1)',
    date: 'ws.week_start',
  },
};

const orderByFor = (
  report: 'daily' | 'weekly',
  sort: unknown,
  dir: unknown,
  fallback: string
): string => {
  const key = typeof sort === 'string' ? sort : '';
  const column = SORTABLE[report][key];
  if (!column) return fallback;
  const direction = String(dir).toLowerCase() === 'desc' ? 'DESC' : 'ASC';
  return `${column} ${direction}, ${fallback}`;
};

const localISODate = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

// GET /api/reports/daily?date=YYYY-MM-DD[&sort=&dir=]
// Factory-wide total for the day + per-line/product breakdown.
router.get('/daily', async (req: Request, res: Response) => {
  const { date, sort, dir } = req.query;
  if (!date) {
    return res.status(400).json({ success: false, message: 'date query param is required' });
  }
  try {
    const orderBy = orderByFor('daily', sort, dir, 'line_name ASC');
    const [totalResult, breakdownResult] = await Promise.all([
      pool.query(`SELECT * FROM vw_daily_factory_total WHERE production_date = $1`, [date]),
      pool.query(
        `SELECT * FROM vw_daily_line_summary WHERE production_date = $1 ORDER BY ${orderBy}`,
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

// GET /api/reports/weekly?start=YYYY-MM-DD&end=YYYY-MM-DD[&sort=&dir=]
router.get('/weekly', async (req: Request, res: Response) => {
  const { start, end, sort, dir } = req.query;
  if (!start || !end) {
    return res.status(400).json({ success: false, message: 'start and end query params are required' });
  }
  try {
    const orderBy = orderByFor('weekly', sort, dir, 'ws.week_start DESC, pl.line_name ASC');
    const result = await pool.query(
      `SELECT ws.week_start, ws.line_id, pl.line_name, pl.line_type, ws.product_id, p.product_name,
              c.customer_name, ws.order_no, ws.gender,
              ws.total_produced, ws.total_defect, ws.total_target
       FROM vw_weekly_summary ws
       JOIN production_lines pl ON pl.line_id = ws.line_id
       JOIN products p ON p.product_id = ws.product_id
       JOIN customers c ON c.customer_id = p.customer_id
       WHERE ws.week_start BETWEEN $1 AND $2
       ORDER BY ${orderBy}`,
      [start, end]
    );
    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    console.error('Weekly report error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate weekly report' });
  }
});

// GET /api/reports/overview?date=YYYY-MM-DD
// One call that replaces the dashboard's per-line and per-branch fan-out.
router.get('/overview', async (req: Request, res: Response) => {
  const date = typeof req.query.date === 'string' && req.query.date ? req.query.date : localISODate();

  try {
    const [
      totals,
      byCustomer,
      byOrder,
      byBranch,
      byLine,
      byHour,
      stages,
      quality,
    ] = await Promise.all([
      pool.query(`SELECT * FROM vw_daily_factory_total WHERE production_date = $1`, [date]),

      pool.query(
        `SELECT c.customer_id, dls.customer_name,
                SUM(dls.total_produced)::int AS produced,
                SUM(dls.daily_target)::int AS target,
                SUM(dls.total_defect)::int AS defects,
                ROUND((SUM(dls.total_produced)::NUMERIC / NULLIF(SUM(dls.daily_target), 0)) * 100, 1)::float8 AS pct_of_target,
                COUNT(DISTINCT dls.product_id)::int AS orders
         FROM vw_daily_line_summary dls
         JOIN products p ON p.product_id = dls.product_id
         JOIN customers c ON c.customer_id = p.customer_id
         WHERE dls.production_date = $1
         GROUP BY c.customer_id, dls.customer_name
         ORDER BY dls.customer_name`,
        [date]
      ),

      pool.query(
        `SELECT dls.product_id, p.order_no, to_char(p.order_date, 'YYYY-MM-DD') AS order_date,
                dls.customer_name, dls.gender, dls.product_name,
                STRING_AGG(DISTINCT dls.line_name, ', ' ORDER BY dls.line_name) AS line_name,
                SUM(dls.total_produced)::int AS produced,
                SUM(dls.daily_target)::int AS target,
                SUM(dls.total_defect)::int AS defects,
                ROUND((SUM(dls.total_produced)::NUMERIC / NULLIF(SUM(dls.daily_target), 0)) * 100, 1)::float8 AS pct_of_target,
                p.status
         FROM vw_daily_line_summary dls
         JOIN products p ON p.product_id = dls.product_id
         WHERE dls.production_date = $1
         GROUP BY dls.product_id, p.order_no, p.order_date, dls.customer_name, dls.gender, dls.product_name, p.status
         ORDER BY p.order_no`,
        [date]
      ),

      pool.query(
        `SELECT b.branch_id, b.branch_name,
                COALESCE(bdp.daily_target, 0)::int AS target,
                COALESCE(bdp.qty_produced, 0)::int AS produced,
                (COALESCE(bdp.qty_produced, 0) - COALESCE(bdp.daily_target, 0))::int AS difference
         FROM branches b
         LEFT JOIN branch_daily_production bdp
                ON bdp.branch_id = b.branch_id AND bdp.production_date = $1
         WHERE b.is_active = 1
         ORDER BY b.branch_name`,
        [date]
      ),

      pool.query(
        `SELECT pl.line_id, pl.line_name, pl.line_type, pl.status,
                COALESCE(s.total_produced, 0)::int AS produced,
                COALESCE(s.daily_target, 0)::int AS target,
                s.score::float8 AS score,
                la.daily_target AS assigned_target,
                p.product_id, p.product_name, p.order_no, p.gender,
                c.customer_id, c.customer_name,
                COALESCE(dw.workers_present, 0)::int AS workers_present,
                COALESCE(dw.workers_required, 0)::int AS workers_required
         FROM production_lines pl
         LEFT JOIN vw_line_daily_score s
                ON s.line_id = pl.line_id AND s.production_date = $1
         LEFT JOIN daily_workforce dw
                ON dw.line_id = pl.line_id AND dw.production_date = $1
         LEFT JOIN LATERAL (
           SELECT la2.assignment_id, la2.daily_target, la2.product_id
           FROM line_assignments la2
           WHERE la2.line_id = pl.line_id AND la2.status = 'ACTIVE'
           ORDER BY la2.start_date DESC, la2.assignment_id DESC
           LIMIT 1
         ) la ON true
         LEFT JOIN products p ON p.product_id = la.product_id
         LEFT JOIN customers c ON c.customer_id = p.customer_id
         WHERE pl.status <> 'INACTIVE'
         ORDER BY NULLIF(regexp_replace(pl.line_name, '[^0-9]', '', 'g'), '')::int, pl.line_name`,
        [date]
      ),

      pool.query(
        `SELECT gs.hour_number, COALESCE(SUM(hp.qty_produced), 0)::int AS qty_produced
         FROM generate_series(1, 12) AS gs(hour_number)
         LEFT JOIN hourly_production hp
                ON hp.production_date = $1 AND hp.hour_number = gs.hour_number
         GROUP BY gs.hour_number
         ORDER BY gs.hour_number`,
        [date]
      ),

      pool.query(
        `SELECT stage, SUM(qty_completed)::int AS qty_completed
         FROM process_stage_daily
         WHERE production_date = $1
         GROUP BY stage
         ORDER BY stage`,
        [date]
      ),

      pool.query(
        `SELECT * FROM vw_quality_summary WHERE production_date = $1 ORDER BY customer_name`,
        [date]
      ),
    ]);

    res.json({
      success: true,
      data: {
        date,
        totals: totals.rows[0] ?? null,
        by_customer: byCustomer.rows,
        by_order: byOrder.rows,
        by_branch: byBranch.rows,
        by_line: byLine.rows,
        by_hour: byHour.rows,
        stages: stages.rows,
        quality: quality.rows,
      },
    });
  } catch (error: any) {
    console.error('Overview report error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate overview report' });
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
              p.order_quantity, p.status, p.order_no, p.gender, p.order_date,
              COALESCE(SUM(hp.qty_produced), 0) AS total_produced_to_date,
              p.order_quantity - COALESCE(SUM(hp.qty_produced), 0) AS remaining_qty,
              ROUND((COALESCE(SUM(hp.qty_produced), 0)::NUMERIC / p.order_quantity) * 100, 1) AS pct_complete
       FROM products p
       LEFT JOIN hourly_production hp ON hp.product_id = p.product_id
       WHERE p.customer_id = $1
       GROUP BY p.product_id, p.product_name, p.style_code, p.color, p.size,
                p.order_quantity, p.status, p.order_no, p.gender, p.order_date
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
