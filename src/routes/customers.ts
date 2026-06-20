import { Router } from 'express';
import pool from '../config/db';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Allow reading/writing with token
// router.use(authenticateToken);

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM customers');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  res.json({ success: true, message: 'Customers endpoint placeholder (POST)' });
});

export default router;