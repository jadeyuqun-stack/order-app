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

  // Enable FK enforcement
  db.pragma('foreign_keys = ON');

  try {
    // Delete orders linked to this restaurant's daily_orders
    db.prepare(`
      DELETE FROM orders WHERE daily_order_id IN (
        SELECT id FROM daily_orders WHERE restaurant_id = ?
      )
    `).run(id);
    // Delete daily_orders for this restaurant
    db.prepare('DELETE FROM daily_orders WHERE restaurant_id = ?').run(id);
    // Delete the restaurant
    db.prepare('DELETE FROM restaurants WHERE id = ?').run(id);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
