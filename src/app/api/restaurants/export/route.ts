import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(db.prepare('SELECT id, name, photo_url FROM restaurants ORDER BY created_at DESC').all());
}
