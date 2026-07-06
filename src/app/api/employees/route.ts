import { NextResponse } from 'next/server';
import { createEmployee, getAllEmployees } from '@/lib/queries';

export async function GET() {
  return NextResponse.json(getAllEmployees());
}

export async function POST(request: Request) {
  const { name, department } = await request.json();
  if (!name) {
    return NextResponse.json({ error: '姓名必填' }, { status: 400 });
  }
  createEmployee(name, department || '');
  return NextResponse.json(getAllEmployees());
}
