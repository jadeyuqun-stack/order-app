import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { createRestaurant, getAllRestaurants } from '@/lib/queries';
import { v4 as uuidv4 } from 'uuid';

function mimeFromExt(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  if (ext === 'png') return 'image/png';
  if (ext === 'gif') return 'image/gif';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'svg') return 'image/svg+xml';
  return 'image/jpeg';
}

// Convert an uploaded File to a base64 data URI stored directly in the DB.
// (Photos are kept in SQLite so they survive — no dependency on ephemeral
//  files written to public/ which Render wipes on every deploy.)
async function fileToDataUri(file: File): Promise<string> {
  const buf = Buffer.from(await file.arrayBuffer());
  return `data:${mimeFromExt(file.name)};base64,${buf.toString('base64')}`;
}

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
    let photoUrl = '';

    if (file && file.size > 0) {
      photoUrl = await fileToDataUri(file);
    }

    db.prepare('INSERT INTO restaurants (id, name, photo_url) VALUES (?, ?, ?)').run(id, name, photoUrl);
    return NextResponse.json(getAllRestaurants());
  }

  // JSON body (no photo)
  const { name } = await request.json();
  if (!name) return NextResponse.json({ error: '餐廳名稱必填' }, { status: 400 });
  const id = uuidv4();
  db.prepare('INSERT INTO restaurants (id, name, photo_url) VALUES (?, ?, ?)').run(id, name, '');
  const newRestaurant = db.prepare('SELECT id, name, photo_url FROM restaurants WHERE id = ?').get(id);
  return NextResponse.json({ newRestaurant });
}

export async function PUT(request: Request) {
  const formData = await request.formData();
  const id = formData.get('id') as string;
  const file = formData.get('file') as File | null;

  if (!id) return NextResponse.json({ error: '缺少 ID' }, { status: 400 });

  if (file && file.size > 0) {
    const dataUri = await fileToDataUri(file);
    db.prepare('UPDATE restaurants SET photo_url = ? WHERE id = ?').run(dataUri, id);
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

    // Photo is stored in the DB (photo_url), removed with the row above.
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
