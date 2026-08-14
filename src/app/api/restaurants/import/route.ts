import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  const body = await request.json();
  const items: any[] = Array.isArray(body) ? body : (body?.items || []);
  if (!Array.isArray(items) || items.length === 0) return NextResponse.json({ error: '需要陣列' }, { status: 400 });

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
    db.prepare('INSERT INTO restaurants (id, name, photo_url) VALUES (?, ?, ?)').run(
      item.id || uuidv4(), item.name, item.photo_url || ''
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
