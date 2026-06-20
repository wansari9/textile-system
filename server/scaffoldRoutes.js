const fs = require('fs');
const path = require('path');

const write = (f, content) => {
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, content);
}

const mAuthTs = `import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ message: 'Access denied' });
    return;
  }

  jwt.verify(token, process.env.JWT_SECRET || 'secret', (err: any, user: any) => {
    if (err) {
      res.status(403).json({ message: 'Invalid token' });
      return;
    }
    (req as any).user = user;
    next();
  });
};`;

const cAuthTs = `import { Request, Response } from 'express';
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
};`;

const rAuthTs = `import { Router } from 'express';
import { login, getMe } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/login', login);
router.get('/me', authenticateToken, getMe);

export default router;`;

// A generic template for the CRUD routes
const routeTemplate = (name, table) => `import { Router } from 'express';
import pool from '../config/db';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Allow reading/writing with token
// router.use(authenticateToken);

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM ${table}');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  res.json({ success: true, message: '${name} endpoint placeholder (POST)' });
});

export default router;`;

write('./src/middleware/auth.ts', mAuthTs);
write('./src/controllers/authController.ts', cAuthTs);
write('./src/routes/auth.ts', rAuthTs);
write('./src/routes/customers.ts', routeTemplate('Customers', 'customers'));
write('./src/routes/products.ts', routeTemplate('Products', 'products'));
write('./src/routes/lines.ts', routeTemplate('Lines', 'production_lines'));
write('./src/routes/workforce.ts', routeTemplate('Workforce', 'daily_workforce'));
write('./src/routes/branches.ts', routeTemplate('Branches', 'branches'));
write('./src/routes/stages.ts', routeTemplate('Stages', 'process_stage_daily'));
write('./src/routes/quality.ts', routeTemplate('Quality', 'quality_checks'));
write('./src/routes/reports.ts', routeTemplate('Reports', 'vw_daily_factory_total'));
write('./src/routes/users.ts', routeTemplate('Users', 'users'));

console.log("Scaffold complete.");