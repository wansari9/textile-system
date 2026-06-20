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

    // 2. Check Password
    let isMatch = false;
    
    // Quick bypass for the mock data we inserted earlier!
    if (user.password_hash === 'hashed_pw_here' && password === 'admin123') {
      isMatch = true;
    } else {
      // Normal secure check using bcrypt
      isMatch = await bcrypt.compare(password, user.password_hash);
    }

    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    // 3. Generate JWT Token
    const token = jwt.sign(
      { id: user.user_id, role: user.role, name: user.full_name },
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
        line_id: user.assigned_line_id
      }
    });
  } catch (error: any) {
    console.error('Login error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};