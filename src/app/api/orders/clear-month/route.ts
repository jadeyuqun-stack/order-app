import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  const { year, month } = await request.json();
  if (!year || !month) {
    return NextResponse.json({ error: '缺少年份或月份' }, { status: 400 });
  }

  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const end = month === 12 ? `${year + 1}-01-01` : `${year}-${month + 1 < 10 ? '0' + (month + 1) : month + 1}-01`;

  // Find all daily_order_ids for the given month range
  const dailyOrders = db.prepare(`
    SELECT id FROM daily_orders WHERE order_date >= ? AND order_date < ?
  `).all(start, end);

  const dailyOrderIds = dailyOrders.map((d: any) => d.id);

  if (dailyOrderIds.length === 0) {
    return NextResponse.json({ success: true, deleted: 0 });
  }

  // Placeholders for IN clause
  const placeholders = dailyOrderIds.map(() => '?').join(',');

  // Delete orders linked to those daily_orders
  db.prepare(`DELETE FROM orders WHERE daily_order_id IN (${placeholders})`).run(...dailyOrderIds);

  return NextResponse.json({ success: true, deleted: dailyOrderIds.length });
}
