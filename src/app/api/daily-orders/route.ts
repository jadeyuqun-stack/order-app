import { NextResponse } from 'next/server';
import { createDailyOrder, getDailyOrders, getActiveDailyOrder, closeDailyOrder } from '@/lib/queries';

export async function GET() {
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

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: '缺少 ID' }, { status: 400 });
  closeDailyOrder(id);
  return NextResponse.json({ success: true });
}
