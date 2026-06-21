import { Request, Response } from 'express';
import pool from '../config/db';

// POST: Log Hourly Production (Supervisor) — upsert so users can update values
export const logHourlyProduction = async (req: Request, res: Response): Promise<void> => {
  const { assignment_id, line_id, product_id, production_date, hour_number, qty_produced, qty_defect, user_id } = req.body;

  try {
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
    const values = [assignment_id, line_id, product_id, production_date, hour_number, qty_produced, qty_defect, user_id];

    const result = await pool.query(queryText, values);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error('Error logging hourly production:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET: Hourly production records for a given date (used to pre-fill HourlyEntry on reload)
export const getHourlyProduction = async (req: Request, res: Response): Promise<void> => {
  const { date } = req.query;
  if (!date) {
    res.status(400).json({ success: false, message: 'date query param is required' });
    return;
  }
  try {
    const result = await pool.query(
      `SELECT log_id, line_id, hour_number, qty_produced, qty_defect
       FROM hourly_production
       WHERE production_date = $1
       ORDER BY line_id, hour_number`,
      [date]
    );
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