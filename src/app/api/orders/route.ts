import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  const dailyOrderId = searchParams.get('dailyOrderId');
  const name = searchParams.get('name');

  if (date) {
    const orders = db.prepare(`
      SELECT o.*, e.name as employee_name, e.department, r.name as restaurant_name
      FROM orders o
      LEFT JOIN employees e ON o.employee_id = e.id
      JOIN daily_orders d ON o.daily_order_id = d.id
      JOIN restaurants r ON d.restaurant_id = r.id
      WHERE d.order_date = ?
      ORDER BY e.department, COALESCE(e.name, o.employee_name), o.dish_name
    `).all(date);
    return NextResponse.json(orders);
  }

  if (dailyOrderId && name) {
    // First try to find employee by name
    const emp = db.prepare('SELECT * FROM employees WHERE name = ?').get(name);
    const empId = emp ? (emp as any).id : null;
    if (empId) {
      const orders = db.prepare(`
        SELECT o.*, r.name as restaurant_name
        FROM orders o
        JOIN daily_orders d ON o.daily_order_id = d.id
        JOIN restaurants r ON d.restaurant_id = r.id
        WHERE o.daily_order_id = ? AND o.employee_id = ?
      `).all(dailyOrderId, empId);
      return NextResponse.json(orders);
    }
    // Name not in employee list yet — show orders with this name
    const orders = db.prepare(`
      SELECT o.*, r.name as restaurant_name
      FROM orders o
      JOIN daily_orders d ON o.daily_order_id = d.id
      JOIN restaurants r ON d.restaurant_id = r.id
      WHERE o.daily_order_id = ? AND o.employee_name = ?
    `).all(dailyOrderId, name);
    return NextResponse.json(orders);
  }

  return NextResponse.json([]);
}

export async function POST(request: Request) {
  const { dailyOrderId, employeeId, name, dishName, price, quantity } = await request.json();

  // Auto-create employee record if name not found
  let finalEmpId = employeeId;
  if (!finalEmpId && name) {
    const emp = db.prepare('SELECT id FROM employees WHERE name = ?').get(name);
    if (emp) {
      finalEmpId = (emp as any).id;
    } else {
      const newId = require('uuid').v4();
      db.prepare('INSERT INTO employees (id, name) VALUES (?, ?)').run(newId, name);
      finalEmpId = newId;
    }
  }

  if (!dailyOrderId || !dishName || !price) {
    return NextResponse.json({ error: '缺少必要欄位' }, { status: 400 });
  }

  db.prepare('INSERT INTO orders (id, daily_order_id, employee_id, employee_name, dish_name, price, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
    require('uuid').v4(),
    dailyOrderId,
    finalEmpId || '',
    name || '',
    dishName,
    Number(price),
    Number(quantity) || 1
  );

  return NextResponse.json({ success: true });
}

export async function PUT(request: Request) {
  const { id, quantity } = await request.json();
  if (!id || quantity === undefined) return NextResponse.json({ error: '缺少欄位' }, { status: 400 });
  db.prepare('UPDATE orders SET quantity = ? WHERE id = ?').run(quantity, id);
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: '缺少 ID' }, { status: 400 });
  db.prepare('DELETE FROM orders WHERE id = ?').run(id);
  return NextResponse.json({ success: true });
}
