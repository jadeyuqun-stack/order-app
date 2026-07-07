import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createDailyOrder, getDailyOrders, getActiveDailyOrder, closeDailyOrder } from '@/lib/queries';

export async function GET() {
  // Auto-close expired orders
  db.prepare("UPDATE daily_orders SET status = 'closed' WHERE status = 'open' AND order_deadline <= datetime('now')").run();
  return NextResponse.json({ active: getActiveDailyOrder(), dailyOrders: getDailyOrders() });
}

export async function POST(request: Request) {
  const { orderDate, restaurantId, deadline } = await request.json();
  if (!orderDate || !restaurantId || !deadline) {
    return NextResponse.json({ error: '缺少必要欄位' }, { status: 400 });
  }
  createDailyOrder(orderDate, restaurantId, deadline);
  return NextResponse.json(getDailyOrders());
}

export async function PUT(request: Request) {
  const { id, deadline } = await request.json();
  if (!id || !deadline) return NextResponse.json({ error: '缺少欄位' }, { status: 400 });
  db.prepare('UPDATE daily_orders SET order_deadline = ? WHERE id = ?').run(deadline, id);
  return NextResponse.json(getDailyOrders());
}

export async function DELETE(request: Request) {
  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: '缺少 ID' }, { status: 400 });
  closeDailyOrder(id);
  return NextResponse.json({ success: true });
}
