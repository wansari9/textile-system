import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import pool from '../config/db';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// User administration is an admin-only area.
router.use(authenticateToken, requireRole('ADMIN'));

// password_hash is never selected back out — keep it out of every response.
// line_ids is the authoritative set; assigned_line_id stays as the primary line
// so older clients and reports keep working.
const SAFE_COLUMNS = `u.user_id, u.username, u.full_name, u.email, u.role,
  u.assigned_line_id, u.is_active, u.created_at,
  COALESCE(
    (SELECT array_agg(ul.line_id ORDER BY ul.line_id)
       FROM user_lines ul WHERE ul.user_id = u.user_id),
    '{}'::int[]
  ) AS line_ids`;

const VALID_ROLES = ['ADMIN', 'LINE_MANAGER', 'SUPERVISOR'];
const LINE_MANAGER_ROLES = ['LINE_MANAGER', 'SUPERVISOR'];

const normalizeLineIds = (value: unknown): number[] => {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map(Number).filter(Number.isFinite))];
};

const linesExist = async (lineIds: number[]): Promise<boolean> => {
  if (lineIds.length === 0) return true;
  const result = await pool.query(
    `SELECT line_id FROM production_lines WHERE line_id = ANY($1::int[])`,
    [lineIds]
  );
  return result.rowCount === lineIds.length;
};

const replaceUserLines = async (client: any, userId: number, lineIds: number[]): Promise<void> => {
  await client.query(`DELETE FROM user_lines WHERE user_id = $1`, [userId]);
  if (lineIds.length > 0) {
    await client.query(
      `INSERT INTO user_lines (user_id, line_id)
       SELECT $1, unnest($2::int[])
       ON CONFLICT (user_id, line_id) DO NOTHING`,
      [userId, lineIds]
    );
  }
};

// GET /api/users  (?role=&line_id=&all=true to include inactive)
router.get('/', async (req: Request, res: Response) => {
  const { role, line_id, all } = req.query;
  try {
    const conditions: string[] = [];
    const params: any[] = [];

    if (all !== 'true') {
      conditions.push('u.is_active = 1');
    }
    if (role) {
      params.push(role);
      conditions.push(`u.role = $${params.length}`);
    }
    if (line_id) {
      params.push(line_id);
      conditions.push(
        `EXISTS (SELECT 1 FROM user_lines ul
                  WHERE ul.user_id = u.user_id AND ul.line_id = $${params.length})`
      );
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await pool.query(
      `SELECT ${SAFE_COLUMNS} FROM users u ${whereClause} ORDER BY u.full_name`,
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
      `SELECT ${SAFE_COLUMNS} FROM users u WHERE u.user_id = $1`,
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

// POST /api/users  (create — typically an admin creating a line manager account)
router.post('/', async (req: Request, res: Response) => {
  const { username, password, full_name, email, role } = req.body;

  if (!username || !password || !full_name || !role) {
    return res.status(400).json({
      success: false,
      message: 'username, password, full_name, and role are required',
    });
  }
  if (!VALID_ROLES.includes(role)) {
    return res.status(400).json({ success: false, message: "role must be 'ADMIN', 'LINE_MANAGER', or 'SUPERVISOR'" });
  }

  // Accept the new multi-line field, and the old single-line field for
  // compatibility with older clients.
  const explicitLines = req.body.assigned_line_ids !== undefined
    ? normalizeLineIds(req.body.assigned_line_ids)
    : req.body.assigned_line_id
      ? [Number(req.body.assigned_line_id)]
      : [];
  const lineIds = explicitLines.filter(Number.isFinite);

  // A line manager without a line cannot enter anything, so refuse to create
  // one. Legacy SUPERVISOR accounts follow the same rule.
  if (LINE_MANAGER_ROLES.includes(role) && lineIds.length === 0) {
    return res.status(400).json({ success: false, message: 'A line manager must be assigned to at least one production line' });
  }

  const client = await pool.connect();
  try {
    if (!(await linesExist(lineIds))) {
      return res.status(400).json({ success: false, message: 'One or more assigned lines do not exist' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await client.query('BEGIN');

    const inserted = await client.query(
      `INSERT INTO users (username, password_hash, full_name, email, role, assigned_line_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING user_id`,
      [username, passwordHash, full_name, email ?? null, role, lineIds[0] ?? null]
    );
    const userId = inserted.rows[0].user_id;
    await replaceUserLines(client, userId, lineIds);

    const result = await client.query(`SELECT ${SAFE_COLUMNS} FROM users u WHERE u.user_id = $1`, [userId]);
    await client.query('COMMIT');
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    await client.query('ROLLBACK');
    if (error.code === '23505') {
      // unique_violation on username
      return res.status(409).json({ success: false, message: 'Username already exists' });
    }
    console.error('Create user error:', error);
    res.status(500).json({ success: false, message: 'Failed to create user' });
  } finally {
    client.release();
  }
});

// PUT /api/users/:id  (profile fields — not password, see /:id/password)
router.put('/:id', async (req: Request, res: Response) => {
  const { full_name, email, role, is_active } = req.body;

  if (role && !VALID_ROLES.includes(role)) {
    return res.status(400).json({ success: false, message: "role must be 'ADMIN', 'LINE_MANAGER', or 'SUPERVISOR'" });
  }

  const client = await pool.connect();
  try {
    const current = await client.query(
      `SELECT u.role, u.assigned_line_id,
              COALESCE(
                (SELECT array_agg(ul.line_id ORDER BY ul.line_id)
                   FROM user_lines ul WHERE ul.user_id = u.user_id),
                '{}'::int[]
              ) AS line_ids
       FROM users u WHERE u.user_id = $1`,
      [req.params.id]
    );
    if (!current.rows[0]) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const currentRow = current.rows[0];
    const linesProvided = req.body.assigned_line_ids !== undefined || req.body.assigned_line_id !== undefined;
    const nextLineIds = req.body.assigned_line_ids !== undefined
      ? normalizeLineIds(req.body.assigned_line_ids)
      : req.body.assigned_line_id
        ? [Number(req.body.assigned_line_id)]
        : (currentRow.line_ids || []).map(Number);

    const nextRole = role ?? currentRow.role;

    if (LINE_MANAGER_ROLES.includes(nextRole) && nextLineIds.length === 0) {
      return res.status(400).json({ success: false, message: 'A line manager must be assigned to at least one production line' });
    }
    if (!(await linesExist(nextLineIds))) {
      return res.status(400).json({ success: false, message: 'One or more assigned lines do not exist' });
    }

    const nextPrimary = linesProvided ? (nextLineIds[0] ?? null) : currentRow.assigned_line_id;

    await client.query('BEGIN');
    const result = await client.query(
      `UPDATE users
       SET full_name        = COALESCE($1, full_name),
           email             = COALESCE($2, email),
           role              = COALESCE($3, role),
           assigned_line_id  = $4,
           is_active         = COALESCE($5, is_active)
       WHERE user_id = $6
       RETURNING user_id`,
      [full_name, email, role, nextPrimary, is_active, req.params.id]
    );
    if (!result.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (linesProvided) {
      await replaceUserLines(client, Number(req.params.id), nextLineIds);
    }

    const updated = await client.query(`SELECT ${SAFE_COLUMNS} FROM users u WHERE u.user_id = $1`, [req.params.id]);
    await client.query('COMMIT');
    res.json({ success: true, data: updated.rows[0] });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Update user error:', error);
    res.status(500).json({ success: false, message: 'Failed to update user' });
  } finally {
    client.release();
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
