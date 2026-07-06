import { NextResponse } from 'next/server';
import { createStore, getAllStores } from '@/lib/queries';

export async function GET() {
  return NextResponse.json(getAllStores());
}

export async function POST(request: Request) {
  const { name } = await request.json();
  if (!name) return NextResponse.json({ error: '店名必填' }, { status: 400 });
  createStore(name);
  return NextResponse.json(getAllStores());
}
