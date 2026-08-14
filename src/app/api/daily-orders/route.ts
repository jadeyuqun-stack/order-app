import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createDailyOrder, getDailyOrders, getActiveDailyOrder, closeDailyOrder } from '@/lib/queries';

// Convert datetime-local value "2026-07-10T11:30" (Taiwan +8 local) to UTC ISO
// "2026-07-10T03:30:00.000Z" for storage and comparison.
// We add "+08:00" suffix so the browser parses it as Taiwan time, then toISOString() converts to UTC.
function taiwanToLocalToUTC(localStr: string): string {
  // localStr is "2026-07-10T11:30" — append +08:00 so JS treats it as Taiwan time
  const withTZ = localStr.replace('T', 'T') + ':00+08:00';
  return new Date(withTZ).toISOString();
}

// Convert UTC ISO back to datetime-local format for editing
function utcToTaiwanLocal(isoStr: string): string {
  const d = new Date(isoStr);
  const utc = d.getTime() + d.getTimezoneOffset() * 60000;
  const tw = new Date(utc + 8 * 3600000);
  const y = tw.getFullYear();
  const m = String(tw.getMonth() + 1).padStart(2, '0');
  const day = String(tw.getDate()).padStart(2, '0');
  const hh = String(tw.getHours()).padStart(2, '0');
  const mm = String(tw.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day}T${hh}:${mm}`;
}

export async function GET() {
  const now = new Date().toISOString();
  db.prepare("UPDATE daily_orders SET status = 'closed' WHERE status = 'open' AND order_deadline <= ?").run(now);
  // Pass 7 days ago so frontend only loads recent orders
  const dateFrom = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  return NextResponse.json({ active: getActiveDailyOrder(), dailyOrders: getDailyOrders(dateFrom) });
}

export async function POST(request: Request) {
  const { orderDate, restaurantId, deadline } = await request.json();
  if (!orderDate || !restaurantId || !deadline) {
    return NextResponse.json({ error: '缺少必要欄位' }, { status: 400 });
  }
  createDailyOrder(orderDate, restaurantId, taiwanToLocalToUTC(deadline));
  const dateFrom = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  return NextResponse.json(getDailyOrders(dateFrom));
}

export async function PUT(request: Request) {
  const { id, deadline } = await request.json();
  if (!id || !deadline) return NextResponse.json({ error: '缺少欄位' }, { status: 400 });
  db.prepare('UPDATE daily_orders SET order_deadline = ? WHERE id = ?').run(taiwanToLocalToUTC(deadline), id);
  const dateFrom = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  return NextResponse.json(getDailyOrders(dateFrom));
}

export async function DELETE(request: Request) {
  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: '缺少 ID' }, { status: 400 });
  closeDailyOrder(id);
  return NextResponse.json({ success: true });
}
