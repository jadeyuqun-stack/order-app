import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { createRestaurant, getAllRestaurants } from '@/lib/queries';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';

const PHOTO_DIR = path.join(process.cwd(), 'public', 'menu-photos');

if (!fs.existsSync(PHOTO_DIR)) fs.mkdirSync(PHOTO_DIR, { recursive: true });

export async function GET() {
  return NextResponse.json(getAllRestaurants());
}

export async function POST(request: Request) {
  // Support both JSON (name only) and FormData (name + photo file)
  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const file = formData.get('file') as File | null;

    if (!name) return NextResponse.json({ error: '餐廳名稱必填' }, { status: 400 });

    const id = uuidv4();
    let photoPath = '';

    if (file && file.size > 0) {
      const ext = path.extname(file.name).toLowerCase() || '.jpg';
      const safeName = `${id}${ext}`;
      const destPath = path.join(PHOTO_DIR, safeName);
      const bytes = await file.arrayBuffer();
      fs.writeFileSync(destPath, Buffer.from(bytes));
      photoPath = `/menu-photos/${safeName}`;
    }

    db.prepare('INSERT INTO restaurants (id, name, photo_url) VALUES (?, ?, ?)').run(id, name, photoPath);
    return NextResponse.json(getAllRestaurants());
  }

  // JSON body (no photo)
  const { name } = await request.json();
  if (!name) return NextResponse.json({ error: '餐廳名稱必填' }, { status: 400 });
  createRestaurant(name, '');
  return NextResponse.json(getAllRestaurants());
}

export async function PUT(request: Request) {
  const formData = await request.formData();
  const id = formData.get('id') as string;
  const file = formData.get('file') as File | null;

  if (!id) return NextResponse.json({ error: '缺少 ID' }, { status: 400 });

  if (file && file.size > 0) {
    const ext = path.extname(file.name).toLowerCase() || '.jpg';
    const safeName = `${id}${ext}`;
    const destPath = path.join(PHOTO_DIR, safeName);
    const bytes = await file.arrayBuffer();
    fs.writeFileSync(destPath, Buffer.from(bytes));
    db.prepare('UPDATE restaurants SET photo_url = ? WHERE id = ?').run(`/menu-photos/${safeName}`, id);
  }

  return NextResponse.json({ success: true });
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

    // Remove photo file if exists
    const exts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    for (const ext of exts) {
      const photoPath = path.join(PHOTO_DIR, `${id}${ext}`);
      if (fs.existsSync(photoPath)) fs.unlinkSync(photoPath);
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
