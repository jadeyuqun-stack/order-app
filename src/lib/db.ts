import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS restaurants (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    photo_url TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS daily_orders (
    id TEXT PRIMARY KEY,
    order_date TEXT NOT NULL,
    restaurant_id TEXT NOT NULL,
    order_deadline TEXT NOT NULL,
    status TEXT DEFAULT 'open',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
  );

  CREATE TABLE IF NOT EXISTS employees (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    department TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    daily_order_id TEXT NOT NULL,
    employee_id TEXT,
    employee_name TEXT,
    dish_name TEXT NOT NULL,
    price INTEGER NOT NULL,
    quantity INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (daily_order_id) REFERENCES daily_orders(id),
    FOREIGN KEY (employee_id) REFERENCES employees(id)
  );

  CREATE TABLE IF NOT EXISTS admins (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

const adminExists = db.prepare("SELECT COUNT(*) as cnt FROM admins WHERE username = ?").get('admin');
if ((adminExists as any).cnt === 0) {
  const crypto = require('crypto');
  const hash = crypto.createHash('sha256').update('admin123').digest('hex');
  db.prepare('INSERT INTO admins (id, username, password_hash) VALUES (?, ?, ?)').run(
    require('uuid').v4(), 'admin', hash
  );
}

export { db };
