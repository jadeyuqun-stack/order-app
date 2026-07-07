import { NextResponse } from 'next/server';
import { createRestaurant, getAllRestaurants } from '@/lib/queries';
import { execute } from '@/lib/db';

export async function GET() {
  const data = await getAllRestaurants();
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const { name, photoUrl } = await request.json();
  if (!name) return NextResponse.json({ error: '餐廳名稱必填' }, { status: 400 });
  await createRestaurant(name, photoUrl || '');
  const data = await getAllRestaurants();
  return NextResponse.json(data);
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: '缺少 ID' }, { status: 400 });
  await execute('DELETE FROM daily_orders WHERE restaurant_id = ?', [id]);
  await execute('DELETE FROM restaurants WHERE id = ?', [id]);
  return NextResponse.json({ success: true });
}
