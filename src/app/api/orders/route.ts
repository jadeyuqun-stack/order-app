import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  const sortBy = searchParams.get('sortBy');
  const dailyOrderId = searchParams.get('dailyOrderId');
  const name = searchParams.get('name');

  if (date) {
    const orderBy = sortBy === 'dish'
      ? 'o.dish_name, COALESCE(e.name, o.employee_name)'
      : 'e.department, COALESCE(e.name, o.employee_name), o.dish_name';
    const orders = db.prepare(`
      SELECT o.*, e.name as employee_name, e.department, r.name as restaurant_name
      FROM orders o
      LEFT JOIN employees e ON o.employee_id = e.id
      JOIN daily_orders d ON o.daily_order_id = d.id
      JOIN restaurants r ON d.restaurant_id = r.id
      WHERE d.order_date = ?
      ORDER BY ${orderBy}
    `).all(date);
    return NextResponse.json(orders);
  }

  if (dailyOrderId && name) {
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
  const { id, quantity, price } = await request.json();
  if (!id) return NextResponse.json({ error: '缺少 ID' }, { status: 400 });
  const sets: string[] = [];
  const vals: any[] = [];
  if (quantity !== undefined) { sets.push('quantity = ?'); vals.push(Number(quantity)); }
  if (price !== undefined) { sets.push('price = ?'); vals.push(Number(price)); }
  if (sets.length === 0) return NextResponse.json({ error: '沒有更新欄位' }, { status: 400 });
  vals.push(id);
  db.prepare(`UPDATE orders SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: '缺少 ID' }, { status: 400 });
  db.prepare('DELETE FROM orders WHERE id = ?').run(id);
  return NextResponse.json({ success: true });
}
