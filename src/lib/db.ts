import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function initDb() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS restaurants (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        photo_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS daily_orders (
        id TEXT PRIMARY KEY,
        order_date DATE NOT NULL,
        restaurant_id TEXT NOT NULL,
        order_deadline TIMESTAMP NOT NULL,
        status TEXT DEFAULT 'open',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        department TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        daily_order_id TEXT NOT NULL,
        employee_id TEXT,
        employee_name TEXT,
        dish_name TEXT NOT NULL,
        price INTEGER NOT NULL,
        quantity INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (daily_order_id) REFERENCES daily_orders(id),
        FOREIGN KEY (employee_id) REFERENCES employees(id)
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const adminRes = await client.query(
      "SELECT COUNT(*) as cnt FROM admins WHERE username = $1",
      ['admin']
    );
    if (parseInt(adminRes.rows[0].cnt) === 0) {
      const crypto = require('crypto');
      const hash = crypto.createHash('sha256').update('JADE123').digest('hex');
      await client.query(
        'INSERT INTO admins (id, username, password_hash) VALUES ($1, $2, $3)',
        [require('uuid').v4(), 'admin', hash]
      );
    }
  } finally {
    client.release();
  }
}

initDb();

export async function query(text: string, params?: any[]) {
  const client = await pool.connect();
  try {
    const res = await client.query(text, params);
    return res.rows;
  } finally {
    client.release();
  }
}

export async function queryOne(text: string, params?: any[]) {
  const client = await pool.connect();
  try {
    const res = await client.query(text, params);
    return res.rows[0] || null;
  } finally {
    client.release();
  }
}

export async function execute(text: string, params?: any[]) {
  const client = await pool.connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}
