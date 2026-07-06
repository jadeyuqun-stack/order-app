import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
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

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: '缺少 ID' }, { status: 400 });

  db.prepare('DELETE FROM orders WHERE employee_id = ?').run(id);
  db.prepare('DELETE FROM employees WHERE id = ?').run(id);

  return NextResponse.json({ success: true });
}
