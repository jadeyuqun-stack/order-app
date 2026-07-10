import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { createRestaurant, getAllRestaurants } from '@/lib/queries';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  return NextResponse.json(getAllRestaurants());
}

export async function POST(request: Request) {
  const { name, photoUrl } = await request.json();
  if (!name) return NextResponse.json({ error: '餐廳名稱必填' }, { status: 400 });
  createRestaurant(name, photoUrl || '');
  return NextResponse.json(getAllRestaurants());
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: '缺少 ID' }, { status: 400 });
  db.prepare('DELETE FROM daily_orders WHERE restaurant_id = ?').run(id);
  db.prepare('DELETE FROM restaurants WHERE id = ?').run(id);
  return NextResponse.json({ success: true });
}
