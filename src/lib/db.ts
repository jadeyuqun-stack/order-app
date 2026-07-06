import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data.db');
const db = new Database(dbPath);

db.pragma('journal_mode = wal');

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

export { db };
