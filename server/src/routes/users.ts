import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import pool from '../config/db';

const router = Router();

const SAFE_COLUMNS = `user_id, username, full_name, email, role, assigned_line_id, is_active, created_at`;
// password_hash is never selected back out — keep it out of every response.

// GET /api/users  (?role=&line_id=&all=true to include inactive)
router.get('/', async (req: Request, res: Response) => {
  const { role, line_id, all } = req.query;
  try {
    const conditions: string[] = [];
    const params: any[] = [];

    if (all !== 'true') {
      conditions.push('is_active = 1');
    }
    if (role) {
      params.push(role);
      conditions.push(`role = $${params.length}`);
    }
    if (line_id) {
      params.push(line_id);
      conditions.push(`assigned_line_id = $${params.length}`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await pool.query(
      `SELECT ${SAFE_COLUMNS} FROM users ${whereClause} ORDER BY full_name`,
      params
    );
    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    console.error('List users error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
});

// GET /api/users/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT ${SAFE_COLUMNS} FROM users WHERE user_id = $1`,
      [req.params.id]
    );
    if (!result.rows[0]) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user' });
  }
});

// POST /api/users  (create — typically an admin creating a supervisor account)
router.post('/', async (req: Request, res: Response) => {
  const { username, password, full_name, email, role, assigned_line_id } = req.body;

  if (!username || !password || !full_name || !role) {
    return res.status(400).json({
      success: false,
      message: 'username, password, full_name, and role are required',
    });
  }
  if (!['ADMIN', 'SUPERVISOR'].includes(role)) {
    return res.status(400).json({ success: false, message: "role must be 'ADMIN' or 'SUPERVISOR'" });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (username, password_hash, full_name, email, role, assigned_line_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING ${SAFE_COLUMNS}`,
      [username, passwordHash, full_name, email ?? null, role, assigned_line_id ?? null]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    if (error.code === '23505') {
      // unique_violation on username
      return res.status(409).json({ success: false, message: 'Username already exists' });
    }
    console.error('Create user error:', error);
    res.status(500).json({ success: false, message: 'Failed to create user' });
  }
});

// PUT /api/users/:id  (profile fields — not password, see /:id/password)
router.put('/:id', async (req: Request, res: Response) => {
  const { full_name, email, role, assigned_line_id, is_active } = req.body;

  if (role && !['ADMIN', 'SUPERVISOR'].includes(role)) {
    return res.status(400).json({ success: false, message: "role must be 'ADMIN' or 'SUPERVISOR'" });
  }

  try {
    const result = await pool.query(
      `UPDATE users
       SET full_name        = COALESCE($1, full_name),
           email             = COALESCE($2, email),
           role              = COALESCE($3, role),
           assigned_line_id  = COALESCE($4, assigned_line_id),
           is_active         = COALESCE($5, is_active)
       WHERE user_id = $6
       RETURNING ${SAFE_COLUMNS}`,
      [full_name, email, role, assigned_line_id, is_active, req.params.id]
    );
    if (!result.rows[0]) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, message: 'Failed to update user' });
  }
});

// PUT /api/users/:id/password  (separate endpoint so it's never accidentally bundled into a profile edit)
router.put('/:id/password', async (req: Request, res: Response) => {
  const { password } = req.body;
  if (!password || password.length < 8) {
    return res.status(400).json({ success: false, message: 'password must be at least 8 characters' });
  }
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `UPDATE users SET password_hash = $1 WHERE user_id = $2 RETURNING user_id`,
      [passwordHash, req.params.id]
    );
    if (!result.rows[0]) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, message: 'Password updated' });
  } catch (error: any) {
    console.error('Update password error:', error);
    res.status(500).json({ success: false, message: 'Failed to update password' });
  }
});

// DELETE /api/users/:id  (soft delete — never hard-delete a user, history references them)
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `UPDATE users SET is_active = 0 WHERE user_id = $1 RETURNING user_id`,
      [req.params.id]
    );
    if (!result.rows[0]) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, message: 'User deactivated' });
  } catch (error: any) {
    console.error('Deactivate user error:', error);
    res.status(500).json({ success: false, message: 'Failed to deactivate user' });
  }
});

export default router;