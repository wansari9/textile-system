import pool from './config/db';
import bcrypt from 'bcrypt';

async function seed() {
  try {
    console.log('🌱 Starting DB seed...');

    // ---------------------------------------------------------------
    // Branches
    // ---------------------------------------------------------------
    const branchCheck = await pool.query('SELECT * FROM branches');
    if (branchCheck.rows.length === 0) {
      await pool.query(
        "INSERT INTO branches (branch_name, is_main, is_active) VALUES ('Main Factory', 1, 1), ('North Satellite', 0, 1)"
      );
      console.log('✅ Branches created');
    } else {
      console.log('⚠️ Branches already exist');
    }

    // ---------------------------------------------------------------
    // Production lines (3 sewing + 3 cutting)
    // ---------------------------------------------------------------
    const branchRes = await pool.query(
      'SELECT branch_id FROM branches ORDER BY is_main DESC, branch_id LIMIT 1'
    );
    if (branchRes.rows.length === 0) {
      throw new Error('No branch found — cannot seed production lines');
    }
    const branchId = branchRes.rows[0].branch_id;

    await pool.query(
      `INSERT INTO production_lines (branch_id, line_name, status, line_type)
       VALUES
         ($1, 'Line 1',    'ACTIVE',      'SEWING'),
         ($1, 'Line 2',    'ACTIVE',      'SEWING'),
         ($1, 'Line 3',    'MAINTENANCE', 'SEWING'),
         ($1, 'Cutting 1', 'ACTIVE',      'CUTTING'),
         ($1, 'Cutting 2', 'ACTIVE',      'CUTTING'),
         ($1, 'Cutting 3', 'ACTIVE',      'CUTTING')
       ON CONFLICT (line_name) DO NOTHING`,
      [branchId]
    );
    console.log('✅ Production lines ensured (including Cutting 1/2/3)');

    const lineOne = await pool.query("SELECT line_id FROM production_lines WHERE line_name = 'Line 1'");
    const lineOneId = lineOne.rows[0]?.line_id ?? null;

    // ---------------------------------------------------------------
    // Users
    // ---------------------------------------------------------------
    const hashedAdminPassword = await bcrypt.hash('admin123', 10);
    const userCheck = await pool.query('SELECT * FROM users WHERE username = $1', ['admin']);

    if (userCheck.rows.length === 0) {
      await pool.query(
        'INSERT INTO users (username, password_hash, full_name, email, role, is_active) VALUES ($1, $2, $3, $4, $5, $6)',
        ['admin', hashedAdminPassword, 'System Admin', 'admin@amirtex.com', 'ADMIN', 1]
      );
      console.log('✅ Admin user created (username: admin, password: admin123)');
    } else {
      console.log('⚠️ Admin user already exists');
    }

    const managerCheck = await pool.query('SELECT * FROM users WHERE username = $1', ['manager']);
    if (managerCheck.rows.length === 0) {
      const hashedManagerPassword = await bcrypt.hash('manager123', 10);
      await pool.query(
        `INSERT INTO users (username, password_hash, full_name, email, role, assigned_line_id, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          'manager',
          hashedManagerPassword,
          'Line 1 Manager',
          'manager@amirtex.com',
          'LINE_MANAGER',
          lineOneId,
          1,
        ]
      );
      console.log('✅ Line manager created (username: manager, password: manager123) — change this password');
    } else {
      console.log('⚠️ Line manager already exists');
    }

    // ---------------------------------------------------------------
    // Customer + sample order
    // ---------------------------------------------------------------
    const customerCheck = await pool.query('SELECT * FROM customers');
    if (customerCheck.rows.length === 0) {
      const custInsert = await pool.query(
        "INSERT INTO customers (customer_name, contact_person, phone) VALUES ('Zara', 'John Doe', '123-456-7890') RETURNING customer_id"
      );
      const customerId = custInsert.rows[0].customer_id;

      await pool.query(
        `INSERT INTO products
           (customer_id, product_name, style_code, color, size, gender, order_quantity, daily_target, status)
         VALUES ($1, 'T-Shirt Model A', 'TS-01', 'Red', 'M', 'UNISEX', 5000, 500, 'ACTIVE')`,
        [customerId]
      );
      console.log('✅ Dummy customer and order created');
    } else {
      console.log('⚠️ Dummy customers already exist');
    }

    console.log('🎉 Seeding complete!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
  } finally {
    await pool.end();
  }
}

seed();
