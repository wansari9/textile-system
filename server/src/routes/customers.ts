import { Router, Request, Response } from 'express';
import pool from '../config/db';

const router = Router();

// GET /api/customers  (?all=true to include inactive)
router.get('/', async (req: Request, res: Response) => {
  const includeInactive = req.query.all === 'true';
  try {
    const sql = includeInactive
      ? `SELECT customer_id, customer_name, contact_person, phone, email, address, is_active, created_at
         FROM customers ORDER BY customer_name`
      : `SELECT customer_id, customer_name, contact_person, phone, email, address, is_active, created_at
         FROM customers WHERE is_active = 1 ORDER BY customer_name`;
    const result = await pool.query(sql);
    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    console.error('List customers error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch customers' });
  }
});

// GET /api/customers/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT customer_id, customer_name, contact_person, phone, email, address, is_active, created_at
       FROM customers WHERE customer_id = $1`,
      [req.params.id]
    );
    if (!result.rows[0]) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error('Get customer error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch customer' });
  }
});

// POST /api/customers
router.post('/', async (req: Request, res: Response) => {
  const { customer_name, contact_person, phone, email, address } = req.body;
  if (!customer_name) {
    return res.status(400).json({ success: false, message: 'customer_name is required' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO customers (customer_name, contact_person, phone, email, address)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING customer_id, customer_name, contact_person, phone, email, address, is_active, created_at`,
      [customer_name, contact_person ?? null, phone ?? null, email ?? null, address ?? null]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error('Create customer error:', error);
    res.status(500).json({ success: false, message: 'Failed to create customer' });
  }
});

// PUT /api/customers/:id
router.put('/:id', async (req: Request, res: Response) => {
  const { customer_name, contact_person, phone, email, address, is_active } = req.body;
  try {
    const result = await pool.query(
      `UPDATE customers
       SET customer_name = COALESCE($1, customer_name),
           contact_person = COALESCE($2, contact_person),
           phone = COALESCE($3, phone),
           email = COALESCE($4, email),
           address = COALESCE($5, address),
           is_active = COALESCE($6, is_active)
       WHERE customer_id = $7
       RETURNING customer_id, customer_name, contact_person, phone, email, address, is_active, created_at`,
      [customer_name, contact_person, phone, email, address, is_active, req.params.id]
    );
    if (!result.rows[0]) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error('Update customer error:', error);
    res.status(500).json({ success: false, message: 'Failed to update customer' });
  }
});

// DELETE /api/customers/:id  (soft delete - keeps history intact)
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `UPDATE customers SET is_active = 0 WHERE customer_id = $1 RETURNING customer_id`,
      [req.params.id]
    );
    if (!result.rows[0]) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    res.json({ success: true, message: 'Customer deactivated' });
  } catch (error: any) {
    console.error('Delete customer error:', error);
    res.status(500).json({ success: false, message: 'Failed to deactivate customer' });
  }
});

export default router;