import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../config/db';

export interface AuthUser {
  id: number;
  username: string;
  name: string;
  role: string;
  /** Primary line, kept for older code. */
  line_id: number | null;
  /** Every line this user may manage. */
  line_ids: number[];
}

// Read at call time: dotenv has run by then, and the secret can be rotated
// without a restart only if it changes in the environment.
const jwtSecret = () => process.env.JWT_SECRET || 'super_secret_key_change_this_later';

export const isAdmin = (user: AuthUser | undefined): boolean => user?.role === 'ADMIN';

/** All line ids a user may manage, tolerating legacy tokens/rows. */
export const lineIdsFor = (user: AuthUser | undefined): number[] => {
  if (!user) return [];
  if (Array.isArray(user.line_ids) && user.line_ids.length > 0) {
    return user.line_ids.map(Number).filter(Number.isFinite);
  }
  return user.line_id ? [Number(user.line_id)] : [];
};

/** True for admins, or when the line is one of the user's assigned lines. */
export const canAccessLine = (user: AuthUser | undefined, lineId: unknown): boolean => {
  if (isAdmin(user)) return true;
  const id = Number(lineId);
  return Number.isFinite(id) && lineIdsFor(user).includes(id);
};

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
      res.status(401).json({ success: false, message: 'Invalid token' });
      return;
    }

    let row: any;
    try {
      const result = await pool.query(
        `SELECT u.user_id, u.username, u.full_name, u.role, u.assigned_line_id, u.is_active,
                COALESCE(
                  (SELECT array_agg(ul.line_id ORDER BY ul.line_id)
                     FROM user_lines ul WHERE ul.user_id = u.user_id),
                  '{}'::int[]
                ) AS line_ids
         FROM users u WHERE u.user_id = $1`,
        [userId]
      );
      row = result.rows[0];
    } catch (error: any) {
      // Legacy databases may not have user_lines yet; fall back to the single
      // assigned line instead of locking every line manager out.
      if (error?.code !== '42P01') throw error;
      const result = await pool.query(
        `SELECT user_id, username, full_name, role, assigned_line_id, is_active
         FROM users WHERE user_id = $1`,
        [userId]
      );
      row = result.rows[0];
      if (row) row.line_ids = row.assigned_line_id ? [row.assigned_line_id] : [];
    }

    if (!row || Number(row.is_active) !== 1) {
      res.status(401).json({ success: false, message: 'Account is inactive or no longer exists' });
      return;
    }

    const lineIds = Array.isArray(row.line_ids)
      ? row.line_ids.map(Number).filter(Number.isFinite)
      : [];
    if (lineIds.length === 0 && row.assigned_line_id) {
      lineIds.push(Number(row.assigned_line_id));
    }

    (req as any).user = {
      id: row.user_id,
      username: row.username,
      name: row.full_name,
      role: row.role,
      line_id: lineIds[0] ?? null,
      line_ids: lineIds,
    } as AuthUser;

    next();
  } catch (error: any) {
    if (error?.name === 'TokenExpiredError' || error?.name === 'JsonWebTokenError') {
      res.status(401).json({ success: false, message: 'Invalid token' });
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
