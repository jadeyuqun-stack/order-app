import { NextResponse } from 'next/server';
import { getMonthlyReport } from '@/lib/queries';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const year = Number(searchParams.get('year'));
  const month = Number(searchParams.get('month'));
  if (!year || !month) {
    return NextResponse.json({ error: '缺少年份或月份' }, { status: 400 });
  }
  const report = getMonthlyReport(year, month);
  return NextResponse.json(report);
}
