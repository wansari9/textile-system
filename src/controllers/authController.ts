import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/db';

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];

    if (!user || user.is_active === 0) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign(
      { userId: user.user_id, role: user.role, branchId: user.branch_id }, 
      process.env.JWT_SECRET || 'secret', 
      { expiresIn: '8h' }
    );

    res.json({ success: true, token, user: { id: user.user_id, role: user.role, username: user.username } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  const user = (req as any).user;
  res.json({ success: true, user });
};