import { query, queryOne, execute } from './db';

// ===== Restaurants =====
export async function createRestaurant(name: string, photoUrl: string) {
  await execute(
    'INSERT INTO restaurants (id, name, photo_url) VALUES (?, ?, ?)',
    [require('uuid').v4(), name, photoUrl]
  );
}
export async function getAllRestaurants() {
  return await query('SELECT * FROM restaurants ORDER BY created_at DESC');
}

// ===== Daily Orders =====
export async function createDailyOrder(orderDate: string, restaurantId: string, deadline: string) {
  await execute(
    'INSERT INTO daily_orders (id, order_date, restaurant_id, order_deadline) VALUES (?, ?, ?, ?)',
    [require('uuid').v4(), orderDate, restaurantId, deadline]
  );
}
export async function getDailyOrders() {
  return await query(`
    SELECT d.*, r.name as restaurant_name, r.photo_url as restaurant_photo
    FROM daily_orders d
    JOIN restaurants r ON d.restaurant_id = r.id
    ORDER BY d.order_date DESC
  `);
}
export async function getActiveDailyOrder() {
  return await queryOne(`
    SELECT d.*, r.name as restaurant_name, r.photo_url as restaurant_photo
    FROM daily_orders d
    JOIN restaurants r ON d.restaurant_id = r.id
    WHERE d.status = 'open' AND d.order_deadline > NOW()
    ORDER BY d.order_date DESC
    LIMIT 1
  `);
}
export async function closeDailyOrder(id: string) {
  await execute("UPDATE daily_orders SET status = 'closed' WHERE id = ?", [id]);
}

// ===== Employees =====
export async function createEmployee(name: string, department: string) {
  await execute(
    'INSERT INTO employees (id, name, department) VALUES (?, ?, ?)',
    [require('uuid').v4(), name, department]
  );
}
export async function getAllEmployees() {
  return await query('SELECT * FROM employees ORDER BY name');
}
export async function deleteEmployee(id: string) {
  await execute('DELETE FROM orders WHERE employee_id = ?', [id]);
  await execute('DELETE FROM employees WHERE id = ?', [id]);
}

// ===== Orders =====
export async function placeOrder(dailyOrderId: string, employeeId: string, dishName: string, price: number, quantity: number) {
  await execute(
    'INSERT INTO orders (id, daily_order_id, employee_id, employee_name, dish_name, price, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [require('uuid').v4(), dailyOrderId, employeeId, '', dishName, price, quantity]
  );
}
export async function getEmployeeOrders(dailyOrderId: string, employeeId: string) {
  return await query(
    'SELECT * FROM orders WHERE daily_order_id = ? AND employee_id = ?',
    [dailyOrderId, employeeId]
  );
}
export async function getAllOrdersForDate(date: string, sortBy: string = 'name') {
  const orderCol = sortBy === 'dish' ? 'o.dish_name' : 'e.department, COALESCE(e.name, o.employee_name)';
  return await query(`
    SELECT o.*, e.name as employee_name, e.department, r.name as restaurant_name
    FROM orders o
    LEFT JOIN employees e ON o.employee_id = e.id
    JOIN daily_orders d ON o.daily_order_id = d.id
    JOIN restaurants r ON d.restaurant_id = r.id
    WHERE d.order_date = ?
    ORDER BY ${orderCol}, o.dish_name
  `, [date]);
}
export async function updateOrder(id: string, quantity: number) {
  await execute('UPDATE orders SET quantity = ? WHERE id = ?', [quantity, id]);
}
export async function deleteOrder(id: string) {
  await execute('DELETE FROM orders WHERE id = ?', [id]);
}

// ===== Monthly Report =====
export async function getMonthlyReport(year: number, month: number) {
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const end = month === 12 ? `${year + 1}-01-01` : `${year}-${month + 1 < 10 ? '0' + (month + 1) : month + 1}-01`;

  const totals = await query(`
    SELECT e.name, e.department,
           SUM(o.price * o.quantity) as total_amount,
           COUNT(o.id) as order_count
    FROM orders o
    LEFT JOIN employees e ON o.employee_id = e.id
    JOIN daily_orders d ON o.daily_order_id = d.id
    WHERE d.order_date >= ? AND d.order_date < ?
    GROUP BY e.id ORDER BY e.department, e.name
  `, [start, end]);

  const details = await query(`
    SELECT d.order_date, r.name as restaurant_name,
           COALESCE(e.name, o.employee_name) as employee_name, COALESCE(e.department, '-') as department,
           o.dish_name, o.price, o.quantity, o.created_at as order_time
    FROM orders o
    LEFT JOIN employees e ON o.employee_id = e.id
    JOIN daily_orders d ON o.daily_order_id = d.id
    JOIN restaurants r ON d.restaurant_id = r.id
    WHERE d.order_date >= ? AND d.order_date < ?
    ORDER BY d.order_date, e.department, e.name
  `, [start, end]);

  return { summary: totals, details, totalLines: details.length };
}
