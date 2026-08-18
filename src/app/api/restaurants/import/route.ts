import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getAllRestaurants } from '@/lib/queries';

export async function POST(request: Request) {
  const body = await request.json();
  const items: any[] = Array.isArray(body) ? body : (body?.items || []);
  if (!Array.isArray(items) || items.length === 0) return NextResponse.json({ error: '需要陣列' }, { status: 400 });

  // Use a single transaction to batch all inserts
  const existingNames = new Set(db.prepare('SELECT name FROM restaurants').all().map((r: any) => r.name));

  let imported = 0;
  let skipped = 0;

  const insert = db.prepare('INSERT INTO restaurants (id, name, photo_url) VALUES (?, ?, ?)');
  const txn = db.transaction(() => {
    for (const item of items) {
      if (existingNames.has(item.name)) {
        skipped++;
        continue;
      }
      insert.run(item.id || uuidv4(), item.name, item.photo_url || '');
      existingNames.add(item.name);
      imported++;
    }
  });
  txn();

  return NextResponse.json({
    restaurants: getAllRestaurants(),
    imported,
    skipped,
  });
}
