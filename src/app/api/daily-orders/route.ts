import { NextResponse } from 'next/server';
import { createDailyOrder, getDailyOrders, getActiveDailyOrder, closeDailyOrder, getAllStores } from '@/lib/queries';

export async function GET() {
  const active = getActiveDailyOrder();
  const all = getDailyOrders();
  return NextResponse.json({ active, dailyOrders: all });
}

export async function POST(request: Request) {
  const body = await request.json();

  // If body has storeName, resolve to storeId
  if (body.storeName) {
    const stores = getAllStores();
    const storeRow = stores.find((s: any) => s.name === body.storeName);
    if (storeRow) body.storeId = (storeRow as any).id;
  }

  const { orderDate, storeId, deadline } = body;
  if (!orderDate || !storeId || !deadline) {
    return NextResponse.json({ error: '缺少必要欄位' }, { status: 400 });
  }
  createDailyOrder(orderDate, storeId, deadline);
  return NextResponse.json(getDailyOrders());
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: '缺少 ID' }, { status: 400 });
  closeDailyOrder(id);
  return NextResponse.json({ success: true });
}
