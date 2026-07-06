import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS stores (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS menu_items (
    id TEXT PRIMARY KEY,
    store_id TEXT NOT NULL,
    name TEXT NOT NULL,
    price INTEGER NOT NULL,
    category TEXT,
    available INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (store_id) REFERENCES stores(id)
  );

  CREATE TABLE IF NOT EXISTS daily_orders (
    id TEXT PRIMARY KEY,
    order_date TEXT NOT NULL,
    store_id TEXT NOT NULL,
    order_deadline TEXT NOT NULL,
    status TEXT DEFAULT 'open',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (store_id) REFERENCES stores(id)
  );

  CREATE TABLE IF NOT EXISTS employees (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    department TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS admins (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    daily_order_id TEXT NOT NULL,
    employee_id TEXT NOT NULL,
    menu_item_id TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (daily_order_id) REFERENCES daily_orders(id),
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
  );
`);

// Create default admin (username: admin, password: admin123)
const adminExists = db.prepare("SELECT COUNT(*) as cnt FROM admins WHERE username = ?").get('admin');
if ((adminExists as any).cnt === 0) {
  const crypto = require('crypto');
  const hash = crypto.createHash('sha256').update('admin123').digest('hex');
  db.prepare('INSERT INTO admins (id, username, password_hash) VALUES (?, ?, ?)').run(
    require('uuid').v4(),
    'admin',
    hash
  );
}

export { db };
