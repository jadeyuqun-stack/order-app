import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createDailyOrder, getDailyOrders, getActiveDailyOrder, closeDailyOrder } from '@/lib/queries';

// Convert datetime-local value (e.g. "2026-07-10T13:00") to UTC ISO string
// (e.g. "2026-07-10T05:00:00.000Z") so all stored times are consistent UTC
function toUtcIso(localStr: string): string {
  return new Date(localStr).toISOString();
}

export async function GET() {
  // Auto-close expired orders (both deadline and now are UTC ISO strings)
  const now = new Date().toISOString();
  db.prepare("UPDATE daily_orders SET status = 'closed' WHERE status = 'open' AND order_deadline <= ?").run(now);
  return NextResponse.json({ active: getActiveDailyOrder(), dailyOrders: getDailyOrders() });
}

export async function POST(request: Request) {
  const { orderDate, restaurantId, deadline } = await request.json();
  if (!orderDate || !restaurantId || !deadline) {
    return NextResponse.json({ error: '缺少必要欄位' }, { status: 400 });
  }
  createDailyOrder(orderDate, restaurantId, toUtcIso(deadline));
  return NextResponse.json(getDailyOrders());
}

export async function PUT(request: Request) {
  const { id, deadline } = await request.json();
  if (!id || !deadline) return NextResponse.json({ error: '缺少欄位' }, { status: 400 });
  db.prepare('UPDATE daily_orders SET order_deadline = ? WHERE id = ?').run(toUtcIso(deadline), id);
  return NextResponse.json(getDailyOrders());
}

export async function DELETE(request: Request) {
  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: '缺少 ID' }, { status: 400 });
  closeDailyOrder(id);
  return NextResponse.json({ success: true });
}
