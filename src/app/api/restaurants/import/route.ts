import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getAllRestaurants } from '@/lib/queries';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  const { items } = await request.json();
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
    db.prepare('INSERT INTO restaurants (id, name, photo_url) VALUES (?, ?, ?)').run(
      uuidv4(), item.name, item.photo_url || ''
    );
    existingNames.add(item.name);
    imported++;
  }

  return NextResponse.json({
    restaurants: getAllRestaurants(),
    imported,
    skipped,
  });
}
