import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './config/db';

// Controllers / Routes
import productionRoutes from './routes/productionRoutes';
import authRoutes from './routes/auth';
import customerRoutes from './routes/customers';
import productRoutes from './routes/products';
import lineRoutes from './routes/lines';
import workforceRoutes from './routes/workforce';
import branchRoutes from './routes/branches';
import stageRoutes from './routes/stages';
import qualityRoutes from './routes/quality';
import reportRoutes from './routes/reports';
import userRoutes from './routes/users';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// A simple test route
app.get('/api/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as current_time');
    res.json({ success: true, message: 'Database is connected!', time: result.rows[0].current_time });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Database connection failed' });
  }
});

// Mount Routes
app.use('/api/production', productionRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/lines', lineRoutes);
app.use('/api/workforce', workforceRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/stages', stageRoutes);
app.use('/api/quality', qualityRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});