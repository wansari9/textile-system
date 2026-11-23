import { Request, Response } from 'express';
import pool from '../config/db';

// POST: Log Hourly Production — upsert so users can update values.
// Admins choose the line; line managers are locked to their assigned line and
// the active assignment on it, so the body can never point at another line.
export const logHourlyProduction = async (req: Request, res: Response): Promise<void> => {
  const authUser = (req as any).user;
  const admin = authUser.role === 'ADMIN';
  const { production_date, hour_number, qty_produced, qty_defect } = req.body;

  const lineId: number | null = admin ? req.body.line_id ?? null : authUser.line_id;
  if (!lineId) {
    res.status(403).json({ success: false, message: 'No production line is assigned to this account' });
    return;
  }
  if (!production_date || hour_number === undefined || qty_produced === undefined) {
    res.status(400).json({
      success: false,
      message: 'production_date, hour_number, and qty_produced are required',
    });
    return;
  }

  try {
    let assignmentId = req.body.assignment_id;
    let productId = req.body.product_id;

    if (!admin) {
      const current = await pool.query(
        `SELECT assignment_id, product_id
         FROM line_assignments
         WHERE line_id = $1 AND status = 'ACTIVE'
         ORDER BY start_date DESC, assignment_id DESC
         LIMIT 1`,
        [lineId]
      );
      if (!current.rows[0]) {
        res.status(409).json({ success: false, message: 'No active assignment on your line' });
        return;
      }
      assignmentId = current.rows[0].assignment_id;
      productId = current.rows[0].product_id;
    }

    const queryText = `
      INSERT INTO hourly_production
        (assignment_id, line_id, product_id, production_date, hour_number, qty_produced, qty_defect, entered_by)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (line_id, production_date, hour_number)
      DO UPDATE SET
        qty_produced = EXCLUDED.qty_produced,
        qty_defect  = EXCLUDED.qty_defect,
        updated_by  = EXCLUDED.entered_by,
        updated_at   = CURRENT_TIMESTAMP
      RETURNING *;
    `;
    // entered_by always comes from the token, never the body.
    const values = [assignmentId, lineId, productId, production_date, hour_number, qty_produced, qty_defect, authUser.id];

    const result = await pool.query(queryText, values);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error('Error logging hourly production:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET: Hourly production records for a given date (used to pre-fill HourlyEntry on reload)
// Line managers only ever receive rows for their own line.
export const getHourlyProduction = async (req: Request, res: Response): Promise<void> => {
  const { date } = req.query;
  if (!date) {
    res.status(400).json({ success: false, message: 'date query param is required' });
    return;
  }

  const authUser = (req as any).user;
  const admin = authUser.role === 'ADMIN';
  const lineId = admin ? req.query.line_id : authUser.line_id;
  if (!admin && !lineId) {
    res.status(200).json({ success: true, data: [] });
    return;
  }

  try {
    const params: any[] = [date];
    let sql = `SELECT log_id, line_id, hour_number, qty_produced, qty_defect
               FROM hourly_production
               WHERE production_date = $1`;
    if (lineId) {
      params.push(lineId);
      sql += ` AND line_id = $${params.length}`;
    }
    sql += ` ORDER BY line_id, hour_number`;

    const result = await pool.query(sql, params);
    res.status(200).json({ success: true, data: result.rows });
  } catch (error: any) {
    console.error('Error fetching hourly production:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET: Factory Daily Total Report (Admin)
export const getDailyFactoryTotal = async (req: Request, res: Response): Promise<void> => {
  const { date } = req.query; // Expecting ?date=YYYY-MM-DD

  try {
    let queryText = `SELECT * FROM vw_company_daily_total`;
    let values: any[] = [];

    // If a date is provided, filter by that date
    if (date) {
      queryText += ` WHERE production_date = $1`;
      values.push(date);
    } else {
      // Default to ordering by most recent if no date is provided
      queryText += ` ORDER BY production_date DESC LIMIT 30`;
    }

    const result = await pool.query(queryText, values);
    res.status(200).json({ success: true, data: result.rows });
  } catch (error: any) {
    console.error('Error fetching daily report:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};