import { NextResponse } from 'next/server';
import { getMonthlyReport, getMonthlyReportDetails } from '@/lib/queries';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const year = Number(searchParams.get('year'));
  const month = Number(searchParams.get('month'));

  if (!year || !month) {
    return NextResponse.json({ error: '缺少年份或月份' }, { status: 400 });
  }

  const summary = getMonthlyReport(year, month);
  return NextResponse.json({ summary });
}

export async function POST(request: Request) {
  const { year, month } = await request.json();
  if (!year || !month) {
    return NextResponse.json({ error: '缺少年份或月份' }, { status: 400 });
  }

  const details = getMonthlyReportDetails(year, month);
  return NextResponse.json({ details, totalLines: details.length });
}
