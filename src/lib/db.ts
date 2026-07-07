import mariadb from 'mariadb';

const pool = mariadb.createPool({
  host: process.env.DB_HOST || '192.168.1.241',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'JAde123456~~',
  database: process.env.DB_NAME || 'food_order',
  connectionLimit: 5,
});

async function initDb() {
  const conn = await pool.getConnection();
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS restaurants (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        photo_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS daily_orders (
        id VARCHAR(36) PRIMARY KEY,
        order_date DATE NOT NULL,
        restaurant_id VARCHAR(36) NOT NULL,
        order_deadline DATETIME NOT NULL,
        status VARCHAR(20) DEFAULT 'open',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        department VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(36) PRIMARY KEY,
        daily_order_id VARCHAR(36) NOT NULL,
        employee_id VARCHAR(36),
        employee_name VARCHAR(100),
        dish_name VARCHAR(255) NOT NULL,
        price INT NOT NULL,
        quantity INT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (daily_order_id) REFERENCES daily_orders(id),
        FOREIGN KEY (employee_id) REFERENCES employees(id)
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id VARCHAR(36) PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(64) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const rows = await conn.query(
      "SELECT COUNT(*) as cnt FROM admins WHERE username = ?",
      ['admin']
    );
    if ((rows[0] as any).cnt === 0) {
      const crypto = require('crypto');
      const hash = crypto.createHash('sha256').update('JADE123').digest('hex');
      await conn.query(
        'INSERT INTO admins (id, username, password_hash) VALUES (?, ?, ?)',
        [require('uuid').v4(), 'admin', hash]
      );
    }
  } finally {
    conn.release();
  }
}

initDb();

export async function query(sql: string, params?: any[]) {
  const conn = await pool.getConnection();
  try {
    return await conn.query(sql, params);
  } finally {
    conn.release();
  }
}

export async function queryOne(sql: string, params?: any[]) {
  const conn = await pool.getConnection();
  try {
    const rows = await conn.query(sql, params);
    return (rows as any[])[0] || null;
  } finally {
    conn.release();
  }
}

export async function execute(sql: string, params?: any[]) {
  const conn = await pool.getConnection();
  try {
    return await conn.query(sql, params);
  } finally {
    conn.release();
  }
}
