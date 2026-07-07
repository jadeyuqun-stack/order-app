import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const year = Number(searchParams.get('year'));
  const month = Number(searchParams.get('month'));
  if (!year || !month) return NextResponse.json({ error: '缺少年份或月份' }, { status: 400 });

  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const end = month === 12 ? `${year + 1}-01-01` : `${year}-${month + 1 < 10 ? '0' + (month + 1) : month + 1}-01`;

  // Per-person summary
  const summary = db.prepare(`
    SELECT e.id, e.name, e.department,
           SUM(o.price * o.quantity) as total_amount,
           COUNT(o.id) as order_count
    FROM orders o
    JOIN employees e ON o.employee_id = e.id
    JOIN daily_orders d ON o.daily_order_id = d.id
    WHERE d.order_date >= ? AND d.order_date < ?
    GROUP BY e.id ORDER BY e.department, e.name
  `).all(start, end);

  // Detail lines
  const details = db.prepare(`
    SELECT d.order_date, d.order_deadline, r.name as restaurant_name,
           e.name as employee_name, e.department,
           o.dish_name, o.price, o.quantity, o.created_at as order_time
    FROM orders o
    JOIN employees e ON o.employee_id = e.id
    JOIN daily_orders d ON o.daily_order_id = d.id
    JOIN restaurants r ON d.restaurant_id = r.id
    WHERE d.order_date >= ? AND d.order_date < ?
    ORDER BY d.order_date, e.department, e.name
  `).all(start, end);

  return NextResponse.json({ summary, details });
}
