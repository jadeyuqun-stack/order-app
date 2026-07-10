import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createDailyOrder, getDailyOrders, getActiveDailyOrder, closeDailyOrder } from '@/lib/queries';

// datetime-local inputs produce "2026-07-10T13:00" (no timezone, no ms).
// Store deadlines exactly as-is so they round-trip through the UI unchanged.
// For comparison, convert to ISO by appending "Z" (treat stored value as UTC).
export function getNowISO(): string {
  return new Date().toISOString();
}

export function deadlineToISO(deadline: string): string {
  // deadline is stored as "2026-07-10T13:00" — treat as UTC for comparison
  return deadline + ':00.000Z';
}

export async function GET() {
  const now = getNowISO();
  db.prepare("UPDATE daily_orders SET status = 'closed' WHERE status = 'open' AND (order_deadline || ':00.000Z') <= ?").run(now);
  return NextResponse.json({ active: getActiveDailyOrder(), dailyOrders: getDailyOrders() });
}

export async function POST(request: Request) {
  const { orderDate, restaurantId, deadline } = await request.json();
  if (!orderDate || !restaurantId || !deadline) {
    return NextResponse.json({ error: '缺少必要欄位' }, { status: 400 });
  }
  // Store as plain "YYYY-MM-DDTHH:MM" — round-trips perfectly through datetime-local
  const stored = deadline.replace(/:\d{2}\.\d{3}Z$/, '').replace(/Z$/, '');
  createDailyOrder(orderDate, restaurantId, stored);
  return NextResponse.json(getDailyOrders());
}

export async function PUT(request: Request) {
  const { id, deadline } = await request.json();
  if (!id || !deadline) return NextResponse.json({ error: '缺少欄位' }, { status: 400 });
  const stored = deadline.replace(/:\d{2}\.\d{3}Z$/, '').replace(/Z$/, '');
  db.prepare('UPDATE daily_orders SET order_deadline = ? WHERE id = ?').run(stored, id);
  return NextResponse.json(getDailyOrders());
}

export async function DELETE(request: Request) {
  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: '缺少 ID' }, { status: 400 });
  closeDailyOrder(id);
  return NextResponse.json({ success: true });
}
