import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../config/db';

export interface AuthUser {
  id: number;
  username: string;
  name: string;
  role: string;
  line_id: number | null;
}

// Read at call time: dotenv has run by then, and the secret can be rotated
// without a restart only if it changes in the environment.
const jwtSecret = () => process.env.JWT_SECRET || 'super_secret_key_change_this_later';

export const isAdmin = (user: AuthUser | undefined): boolean => user?.role === 'ADMIN';

// Verifies the token, then re-reads the user so role and line changes apply
// immediately (an old token can never keep access it should have lost).
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ success: false, message: 'Access denied' });
    return;
  }

  try {
    const payload = jwt.verify(token, jwtSecret()) as any;
    const userId = payload.id ?? payload.userId;

    if (!userId) {
      res.status(403).json({ success: false, message: 'Invalid token' });
      return;
    }

    const result = await pool.query(
      `SELECT user_id, username, full_name, role, assigned_line_id, is_active
       FROM users WHERE user_id = $1`,
      [userId]
    );
    const row = result.rows[0];

    if (!row || Number(row.is_active) !== 1) {
      res.status(401).json({ success: false, message: 'Account is inactive or no longer exists' });
      return;
    }

    (req as any).user = {
      id: row.user_id,
      username: row.username,
      name: row.full_name,
      role: row.role,
      line_id: row.assigned_line_id ?? null,
    } as AuthUser;

    next();
  } catch (error: any) {
    if (error?.name === 'TokenExpiredError' || error?.name === 'JsonWebTokenError') {
      res.status(403).json({ success: false, message: 'Invalid token' });
      return;
    }
    console.error('Auth middleware error:', error);
    res.status(500).json({ success: false, message: 'Authentication failed' });
  }
};

export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user as AuthUser | undefined;
    if (!user) {
      res.status(401).json({ success: false, message: 'Access denied' });
      return;
    }
    if (!roles.includes(user.role)) {
      res.status(403).json({ success: false, message: 'You do not have permission to do this' });
      return;
    }
    next();
  };
};
