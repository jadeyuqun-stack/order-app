import { NextResponse } from 'next/server';
import { placeOrder, getEmployeeOrders, getAllOrdersForDate, updateOrder, deleteOrder } from '@/lib/queries';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  const dailyOrderId = searchParams.get('dailyOrderId');
  const employeeId = searchParams.get('employeeId');

  if (date) return NextResponse.json(getAllOrdersForDate(date));
  if (dailyOrderId && employeeId) return NextResponse.json(getEmployeeOrders(dailyOrderId, employeeId));
  return NextResponse.json([]);
}

export async function POST(request: Request) {
  const { dailyOrderId, employeeId, dishName, price, quantity } = await request.json();
  if (!dailyOrderId || !employeeId || !dishName || !price) {
    return NextResponse.json({ error: '缺少必要欄位' }, { status: 400 });
  }
  placeOrder(dailyOrderId, employeeId, dishName, Number(price), Number(quantity) || 1);
  return NextResponse.json({ success: true });
}

export async function PUT(request: Request) {
  const { id, quantity } = await request.json();
  if (!id || quantity === undefined) return NextResponse.json({ error: '缺少欄位' }, { status: 400 });
  updateOrder(id, quantity);
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: '缺少 ID' }, { status: 400 });
  deleteOrder(id);
  return NextResponse.json({ success: true });
}
