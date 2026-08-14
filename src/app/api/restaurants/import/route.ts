import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

const PHOTO_DIR = path.join(process.cwd(), 'public', 'menu-photos');

export async function GET() {
  const items = db.prepare('SELECT id, name, photo_url FROM restaurants ORDER BY created_at DESC').all();
  return NextResponse.json(items.map((r: any) => ({
    id: r.id,
    name: r.name,
    photo_url: r.photo_url,
  })));
}

export async function POST(request: Request) {
  const items: any = await request.json();
  if (!Array.isArray(items)) return NextResponse.json({ error: '需要陣列' }, { status: 400 });

  const existingNames = new Set(
    db.prepare('SELECT name FROM restaurants').all().map((r: any) => r.name)
  );

  let imported = 0;
  let skipped = 0;
  for (const item of items) {
    if (existingNames.has(item.name)) {
      skipped++;
      continue;
    }
    // Only import path, not base64 data
    db.prepare('INSERT INTO restaurants (id, name, photo_url) VALUES (?, ?, ?)').run(
      item.id || require('uuid').v4(), item.name, item.photo_url || ''
    );
    existingNames.add(item.name);
    imported++;
  }

  return NextResponse.json({
    restaurants: db.prepare('SELECT id, name, photo_url FROM restaurants ORDER BY created_at DESC').all(),
    imported,
    skipped,
  });
}
