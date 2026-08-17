import path from 'path';
import crypto from 'crypto';
import { v4 } from 'uuid';

export const dbPath = path.join(process.cwd(), 'data.db');

function createDatabase() {
  const Database = require('better-sqlite3');
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(`
    CREATE TABLE IF NOT EXISTS restaurants (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      photo_url TEXT,
      created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );
    CREATE TABLE IF NOT EXISTS daily_orders (
      id TEXT PRIMARY KEY,
      order_date TEXT NOT NULL,
      restaurant_id TEXT NOT NULL,
      order_deadline TEXT NOT NULL,
      status TEXT DEFAULT 'open',
      created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
    );
    CREATE TABLE IF NOT EXISTS employees (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      department TEXT,
      created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      daily_order_id TEXT NOT NULL,
      employee_id TEXT,
      employee_name TEXT,
      dish_name TEXT NOT NULL,
      price INTEGER NOT NULL,
      quantity INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      FOREIGN KEY (daily_order_id) REFERENCES daily_orders(id),
      FOREIGN KEY (employee_id) REFERENCES employees(id)
    );
    CREATE TABLE IF NOT EXISTS admins (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );
  `);
  const adminExists = db.prepare("SELECT COUNT(*) as cnt FROM admins WHERE username = ?").get('admin');
  if ((adminExists as any).cnt === 0) {
    const hash = crypto.createHash('sha256').update('admin123').digest('hex');
    db.prepare('INSERT OR IGNORE INTO admins (id, username, password_hash) VALUES (?, ?, ?)').run(v4(), 'admin', hash);
  }
  return db;
}

// Eager init: native module loads once and is cached by Node.js require
const db = createDatabase();

export { db };
