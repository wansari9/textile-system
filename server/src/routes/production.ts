import { Router } from 'express';
import { logHourlyProduction, getDailyFactoryTotal, getHourlyProduction } from '../controllers/productionController';

const router = Router();

// POST /api/production/hourly
router.post('/hourly', logHourlyProduction);

// GET /api/production/hourly?date=YYYY-MM-DD
router.get('/hourly', getHourlyProduction);

// GET /api/production/daily-report
router.get('/daily-report', getDailyFactoryTotal);

export default router;