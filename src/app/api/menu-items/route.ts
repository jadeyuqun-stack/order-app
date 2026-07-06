import { NextResponse } from 'next/server';
import { createMenuItem, getMenuItemsByStore, getAllMenuItems, updateMenuItemAvailability } from '@/lib/queries';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const storeId = searchParams.get('storeId');
  if (storeId) {
    return NextResponse.json(getMenuItemsByStore(storeId));
  }
  return NextResponse.json(getAllMenuItems());
}

export async function POST(request: Request) {
  const { storeId, name, price, category } = await request.json();
  if (!storeId || !name || !price) {
    return NextResponse.json({ error: '缺少必要欄位' }, { status: 400 });
  }
  createMenuItem(storeId, name, Number(price), category || '');
  return NextResponse.json(getMenuItemsByStore(storeId));
}
