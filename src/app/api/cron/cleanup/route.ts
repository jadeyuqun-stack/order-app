import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST() {
  const now = new Date();
  // First day of current month
  const firstOfThisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  // First day of last month
  const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
  const lastYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const firstOfLastMonth = `${lastYear}-${String(lastMonth + 1).padStart(2, '0')}-01`;
  // First day of current month (end bound for last month)
  const endOfLastMonth = firstOfThisMonth;

  // Count orders to delete
  const count = db.prepare(`
    SELECT COUNT(*) as cnt FROM orders o
    JOIN daily_orders d ON o.daily_order_id = d.id
    WHERE d.order_date >= ? AND d.order_date < ?
  `).get(firstOfLastMonth, endOfLastMonth) as { cnt: number };

  if (count.cnt === 0) {
    return NextResponse.json({ success: true, deleted: 0 });
  }

  // Delete orders for last month's daily orders
  db.prepare(`
    DELETE FROM orders WHERE daily_order_id IN (
      SELECT id FROM daily_orders WHERE order_date >= ? AND order_date < ?
    )
  `).run(firstOfLastMonth, endOfLastMonth);

  // Delete daily orders for last month
  db.prepare(`
    DELETE FROM daily_orders WHERE order_date >= ? AND order_date < ?
  `).run(firstOfLastMonth, endOfLastMonth);

  return NextResponse.json({ success: true, deleted: count.cnt });
}
