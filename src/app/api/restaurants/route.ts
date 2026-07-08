import { NextResponse } from 'next/server';
import { createRestaurant, getAllRestaurants } from '@/lib/queries';
import { execute } from '@/lib/db';

export async function GET() {
  return NextResponse.json(await getAllRestaurants());
}

export async function POST(request: Request) {
  const { name, photoUrl } = await request.json();
  if (!name) return NextResponse.json({ error: '餐廳名稱必填' }, { status: 400 });
  await createRestaurant(name, photoUrl || '');
  return NextResponse.json(await getAllRestaurants());
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: '缺少 ID' }, { status: 400 });
  await execute('DELETE FROM daily_orders WHERE restaurant_id = $1', [id]);
  await execute('DELETE FROM restaurants WHERE id = $1', [id]);
  return NextResponse.json({ success: true });
}
