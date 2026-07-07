import { NextResponse } from 'next/server';
import { createDailyOrder, getDailyOrders, getActiveDailyOrder, closeDailyOrder } from '@/lib/queries';

export async function GET() {
  // Auto-close expired orders
  const db = await import('@/lib/db');
  await db.execute("UPDATE daily_orders SET status = 'closed' WHERE status = 'open' AND order_deadline <= NOW()");
  return NextResponse.json({ active: await getActiveDailyOrder(), dailyOrders: await getDailyOrders() });
}

export async function POST(request: Request) {
  const { orderDate, restaurantId, deadline } = await request.json();
  if (!orderDate || !restaurantId || !deadline) {
    return NextResponse.json({ error: '缺少必要欄位' }, { status: 400 });
  }
  await createDailyOrder(orderDate, restaurantId, deadline);
  return NextResponse.json(await getDailyOrders());
}

export async function PUT(request: Request) {
  const { id, deadline } = await request.json();
  if (!id || !deadline) return NextResponse.json({ error: '缺少欄位' }, { status: 400 });
  const { execute } = await import('@/lib/db');
  await execute('UPDATE daily_orders SET order_deadline = ? WHERE id = ?', [deadline, id]);
  return NextResponse.json(await getDailyOrders());
}

export async function DELETE(request: Request) {
  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: '缺少 ID' }, { status: 400 });
  await closeDailyOrder(id);
  return NextResponse.json({ success: true });
}
