import { Router } from 'express';
import { logHourlyProduction, getDailyFactoryTotal, getHourlyProduction } from '../controllers/productionController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// Hourly entry is open to admins and line managers, but the controllers scope
// line managers to their own line.
router.use(authenticateToken);

// POST /api/production/hourly
router.post('/hourly', logHourlyProduction);

// GET /api/production/hourly?date=YYYY-MM-DD
router.get('/hourly', getHourlyProduction);

// GET /api/production/daily-report  (admin reporting)
router.get('/daily-report', requireRole('ADMIN'), getDailyFactoryTotal);

export default router;