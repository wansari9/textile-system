import { Request, Response } from 'express';
import pool from '../config/db';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const login = async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body;

  try {
    // 1. Find user by username in PostgreSQL
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];

    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    if (Number(user.is_active) !== 1) {
      res.status(403).json({ success: false, message: 'Account is inactive' });
      return;
    }

    // 2. Check Password
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    // 3. Generate JWT Token. line_ids is the authoritative set of lines this
    //    manager can work on; line_id stays as the primary line for old clients.
    let lineIds: number[] = [];
    try {
      const lines = await pool.query(
        `SELECT array_agg(ul.line_id ORDER BY ul.line_id) AS line_ids
         FROM user_lines ul WHERE ul.user_id = $1`,
        [user.user_id]
      );
      lineIds = (lines.rows[0]?.line_ids || []).map(Number);
    } catch (error: any) {
      if (error?.code !== '42P01') throw error;
    }
    if (lineIds.length === 0 && user.assigned_line_id) {
      lineIds = [Number(user.assigned_line_id)];
    }

    const token = jwt.sign(
      {
        id: user.user_id,
        role: user.role,
        name: user.full_name,
        line_id: lineIds[0] ?? null,
        line_ids: lineIds,
      },
      process.env.JWT_SECRET || 'super_secret_key_change_this_later',
      { expiresIn: '1d' } // Token lasts for 1 day
    );

    // 4. Send response
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user.user_id,
        username: user.username,
        name: user.full_name,
        role: user.role,
        line_id: lineIds[0] ?? null,
        line_ids: lineIds,
      }
    });
  } catch (error: any) {
    console.error('Login error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};