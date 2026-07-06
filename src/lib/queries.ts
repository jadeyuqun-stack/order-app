import { db } from './db';
import { v4 as uuidv4 } from 'uuid';

// ===== Stores =====
export function createStore(name: string) {
  const stmt = db.prepare('INSERT INTO stores (id, name) VALUES (?, ?)');
  stmt.run(uuidv4(), name);
}

export function getAllStores() {
  return db.prepare('SELECT * FROM stores ORDER BY created_at DESC').all();
}

// ===== Menu Items =====
export function createMenuItem(storeId: string, name: string, price: number, category: string) {
  const stmt = db.prepare('INSERT INTO menu_items (id, store_id, name, price, category) VALUES (?, ?, ?, ?, ?)');
  stmt.run(uuidv4(), storeId, name, price, category);
}

export function getMenuItemsByStore(storeId: string) {
  return db.prepare('SELECT * FROM menu_items WHERE store_id = ? AND available = 1 ORDER BY category, name').all(storeId);
}

export function getAllMenuItems() {
  return db.prepare('SELECT mi.*, s.name as store_name FROM menu_items mi JOIN stores s ON mi.store_id = s.id WHERE mi.available = 1 ORDER BY s.name, mi.category, mi.name').all();
}

export function updateMenuItemAvailability(id: string, available: number) {
  db.prepare('UPDATE menu_items SET available = ? WHERE id = ?').run(available, id);
}

// ===== Daily Orders =====
export function createDailyOrder(orderDate: string, storeId: string, deadline: string) {
  const stmt = db.prepare('INSERT INTO daily_orders (id, order_date, store_id, order_deadline) VALUES (?, ?, ?, ?)');
  stmt.run(uuidv4(), orderDate, storeId, deadline);
}

export function getDailyOrders() {
  return db.prepare(`
    SELECT d.*, s.name as store_name
    FROM daily_orders d
    JOIN stores s ON d.store_id = s.id
    ORDER BY d.order_date DESC
  `).all();
}

export function getActiveDailyOrder() {
  return db.prepare(`
    SELECT d.*, s.name as store_name
    FROM daily_orders d
    JOIN stores s ON d.store_id = s.id
    WHERE d.status = 'open' AND d.order_deadline > datetime('now')
    ORDER BY d.order_date DESC
    LIMIT 1
  `).get();
}

export function closeDailyOrder(id: string) {
  db.prepare("UPDATE daily_orders SET status = 'closed' WHERE id = ?").run(id);
}

// ===== Employees =====
export function createEmployee(name: string, department: string) {
  const stmt = db.prepare('INSERT INTO employees (id, name, department) VALUES (?, ?, ?)');
  stmt.run(uuidv4(), name, department);
}

export function getAllEmployees() {
  return db.prepare('SELECT * FROM employees ORDER BY name').all();
}

// ===== Orders =====
export function placeOrder(dailyOrderId: string, employeeId: string, menuItemId: string, quantity: number) {
  const stmt = db.prepare('INSERT INTO orders (id, daily_order_id, employee_id, menu_item_id, quantity) VALUES (?, ?, ?, ?, ?)');
  stmt.run(uuidv4(), dailyOrderId, employeeId, menuItemId, quantity);
}

export function getUserOrders(dailyOrderId: string, employeeId: string) {
  return db.prepare(`
    SELECT o.*, mi.name as item_name, mi.price, s.name as store_name
    FROM orders o
    JOIN menu_items mi ON o.menu_item_id = mi.id
    JOIN daily_orders d ON o.daily_order_id = d.id
    JOIN stores s ON d.store_id = s.id
    WHERE o.daily_order_id = ? AND o.employee_id = ?
  `).all(dailyOrderId, employeeId);
}

export function getUserMonthlySpending(employeeId: string, year: number, month: number) {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = month === 12 ? `${year + 1}-01-01` : `${year}-${month + 1 < 10 ? '0' + (month + 1) : month + 1}-01`;

  return db.prepare(`
    SELECT e.name, e.department, SUM(mi.price * o.quantity) as total_amount, COUNT(o.id) as order_count
    FROM orders o
    JOIN employees e ON o.employee_id = e.id
    JOIN menu_items mi ON o.menu_item_id = mi.id
    JOIN daily_orders d ON o.daily_order_id = d.id
    WHERE e.id = ?
      AND d.order_date >= ? AND d.order_date < ?
    GROUP BY e.id
  `).get({ employeeId, startDate, endDate });
}

export function getMonthlyReport(year: number, month: number) {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = month === 12 ? `${year + 1}-01-01` : `${year}-${month + 1 < 10 ? '0' + (month + 1) : month + 1}-01`;

  return db.prepare(`
    SELECT e.id, e.name, e.department,
           SUM(mi.price * o.quantity) as total_amount,
           COUNT(o.id) as order_count
    FROM orders o
    JOIN employees e ON o.employee_id = e.id
    JOIN menu_items mi ON o.menu_item_id = mi.id
    JOIN daily_orders d ON o.daily_order_id = d.id
    WHERE d.order_date >= ? AND d.order_date < ?
    GROUP BY e.id
    ORDER BY e.department, e.name
  `).all({ startDate, endDate });
}

export function getDailyOrderItems(dailyOrderId: string) {
  return db.prepare(`
    SELECT mi.*, s.name as store_name
    FROM menu_items mi
    JOIN stores s ON mi.store_id = s.id
    WHERE mi.available = 1
    ORDER BY s.name, mi.category, mi.name
  `).all();
}
