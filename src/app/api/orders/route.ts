import { NextResponse } from 'next/server';
import { placeOrder, getUserOrders, getAllEmployees } from '@/lib/queries';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dailyOrderId = searchParams.get('dailyOrderId');
  const employeeId = searchParams.get('employeeId');

  if (dailyOrderId && employeeId) {
    return NextResponse.json(getUserOrders(dailyOrderId, employeeId));
  }
  return NextResponse.json(getAllEmployees());
}

export async function POST(request: Request) {
  const { dailyOrderId, employeeId, menuItemId, quantity } = await request.json();
  if (!dailyOrderId || !employeeId || !menuItemId) {
    return NextResponse.json({ error: '缺少必要欄位' }, { status: 400 });
  }
  placeOrder(dailyOrderId, employeeId, menuItemId, Number(quantity) || 1);
  return NextResponse.json({ success: true });
}
