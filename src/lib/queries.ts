import { db } from './db';
import { v4 as uuidv4 } from 'uuid';

// ===== Restaurants =====
export function createRestaurant(name: string, photoUrl: string) {
  db.prepare('INSERT INTO restaurants (id, name, photo_url) VALUES (?, ?, ?)').run(uuidv4(), name, photoUrl);
}
export function getAllRestaurants() {
  return db.prepare('SELECT * FROM restaurants ORDER BY created_at DESC').all();
}

// ===== Daily Orders =====
export function createDailyOrder(orderDate: string, restaurantId: string, deadline: string) {
  db.prepare('INSERT INTO daily_orders (id, order_date, restaurant_id, order_deadline) VALUES (?, ?, ?, ?)').run(uuidv4(), orderDate, restaurantId, deadline);
}
export function getDailyOrders() {
  return db.prepare(`SELECT d.*, r.name as restaurant_name, r.photo_url as restaurant_photo FROM daily_orders d JOIN restaurants r ON d.restaurant_id = r.id ORDER BY d.order_date DESC`).all();
}
export function getActiveDailyOrder() {
  const now = new Date().toISOString();
  return db.prepare(`SELECT d.*, r.name as restaurant_name, r.photo_url as restaurant_photo FROM daily_orders d JOIN restaurants r ON d.restaurant_id = r.id WHERE d.status = 'open' AND d.order_deadline > ? ORDER BY d.order_date DESC LIMIT 1`).get(now);
}
export function closeDailyOrder(id: string) {
  db.prepare("UPDATE daily_orders SET status = 'closed' WHERE id = ?").run(id);
}

// ===== Employees =====
export function createEmployee(name: string, department: string) {
  db.prepare('INSERT INTO employees (id, name, department) VALUES (?, ?, ?)').run(uuidv4(), name, department);
}
export function getAllEmployees() {
  return db.prepare('SELECT * FROM employees ORDER BY name').all();
}
export function deleteEmployee(id: string) {
  db.prepare('DELETE FROM orders WHERE employee_id = ?').run(id);
  db.prepare('DELETE FROM employees WHERE id = ?').run(id);
}

// ===== Orders (employee self-fill) =====
export function placeOrder(dailyOrderId: string, employeeId: string, dishName: string, price: number, quantity: number) {
  db.prepare('INSERT INTO orders (id, daily_order_id, employee_id, dish_name, price, quantity) VALUES (?, ?, ?, ?, ?, ?)').run(uuidv4(), dailyOrderId, employeeId, dishName, price, quantity);
}
export function getEmployeeOrders(dailyOrderId: string, employeeId: string) {
  return db.prepare('SELECT * FROM orders WHERE daily_order_id = ? AND employee_id = ?').all(dailyOrderId, employeeId);
}
export function getAllOrdersForDate(date: string) {
  return db.prepare(`
    SELECT o.*, e.name as employee_name, e.department, r.name as restaurant_name
    FROM orders o
    JOIN employees e ON o.employee_id = e.id
    JOIN daily_orders d ON o.daily_order_id = d.id
    JOIN restaurants r ON d.restaurant_id = r.id
    WHERE d.order_date = ?
    ORDER BY e.department, e.name, o.dish_name
  `).all(date);
}
export function updateOrder(id: string, quantity: number, price?: number) {
  if (price !== undefined) {
    db.prepare('UPDATE orders SET quantity = ?, price = ? WHERE id = ?').run(quantity, price, id);
  } else {
    db.prepare('UPDATE orders SET quantity = ? WHERE id = ?').run(quantity, id);
  }
}
export function deleteOrder(id: string) {
  db.prepare('DELETE FROM orders WHERE id = ?').run(id);
}

// ===== Monthly Report =====
export function getMonthlyReport(year: number, month: number) {
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const end = month === 12 ? `${year + 1}-01-01` : `${year}-${month + 1 < 10 ? '0' + (month + 1) : month + 1}-01`;
  return db.prepare(`
    SELECT e.id, e.name, e.department,
           SUM(o.price * o.quantity) as total_amount,
           COUNT(o.id) as order_count
    FROM orders o
    JOIN employees e ON o.employee_id = e.id
    JOIN daily_orders d ON o.daily_order_id = d.id
    WHERE d.order_date >= ? AND d.order_date < ?
    GROUP BY e.id ORDER BY e.department, e.name
  `).all(start, end);
}
