import { Router, Request, Response } from 'express';
import { login } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/login', login);

router.get('/me', authenticateToken, (req: Request, res: Response) => {
  const user = (req as any).user;
  res.json({ success: true, user });
});

export default router;