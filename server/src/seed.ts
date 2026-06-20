import pool from './config/db';
import bcrypt from 'bcrypt';

async function seed() {
  try {
    console.log('🌱 Starting DB seed...');

    const hashedAdminPassword = await bcrypt.hash('admin123', 10);
    const userCheck = await pool.query("SELECT * FROM users WHERE username = $1", ['admin']);
    
    if (userCheck.rows.length === 0) {
      await pool.query(
        "INSERT INTO users (username, password_hash, full_name, email, role, is_active) VALUES ($1, $2, $3, $4, $5, $6)",
        ['admin', hashedAdminPassword, 'System Admin', 'admin@amirtex.com', 'ADMIN', 1]
      );
      console.log('✅ Admin user created (username: admin, password: admin123)');
    } else {
      console.log('⚠️ Admin user already exists');
    }

    const branchCheck = await pool.query("SELECT * FROM branches");
    if (branchCheck.rows.length === 0) {
      await pool.query("INSERT INTO branches (branch_name, is_main, is_active) VALUES ('Main Factory', 1, 1), ('North Satellite', 0, 1)");
      console.log('✅ Branches created');
    } else {
      console.log('⚠️ Branches already exist');
    }

    const lineCheck = await pool.query("SELECT * FROM production_lines");
    if (lineCheck.rows.length === 0) {
      const branchRes = await pool.query("SELECT branch_id FROM branches WHERE branch_name = 'Main Factory'");
      if (branchRes.rows.length > 0) {
        const branchId = branchRes.rows[0].branch_id;
        await pool.query(
          "INSERT INTO production_lines (branch_id, line_name, status) VALUES ($1, 'Line 1', 'ACTIVE'), ($1, 'Line 2', 'ACTIVE'), ($1, 'Line 3', 'MAINTENANCE')",
          [branchId]
        );
        console.log('✅ Production lines created');
      }
    } else {
      console.log('⚠️ Production lines already exist');
    }

    const customerCheck = await pool.query("SELECT * FROM customers");
    if (customerCheck.rows.length === 0) {
      const custInsert = await pool.query(
        "INSERT INTO customers (customer_name, contact_person, phone) VALUES ('Zara', 'John Doe', '123-456-7890') RETURNING customer_id"
      );
      const customerId = custInsert.rows[0].customer_id;
      
      await pool.query(
        "INSERT INTO products (customer_id, product_name, style_code, color, size, order_quantity, daily_target, status) VALUES ($1, 'T-Shirt Model A', 'TS-01', 'Red', 'M', 5000, 500, 'ACTIVE')",
        [customerId]
      );
      console.log('✅ Dummy customer and product created');
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