import { NextResponse } from 'next/server';
import { placeOrder, getEmployeeOrders, getAllOrdersForDate, updateOrder, deleteOrder, getAllEmployees, createEmployee } from '@/lib/queries';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  const sortBy = searchParams.get('sortBy');
  const dailyOrderId = searchParams.get('dailyOrderId');
  const name = searchParams.get('name');

  if (date) {
    const orders = getAllOrdersForDate(date, sortBy || 'name');
    return NextResponse.json(orders);
  }

  if (dailyOrderId && name) {
    const employees: any = getAllEmployees();
    const emp = employees.find((e: any) => e.name === name);
    const empId = emp ? emp.id : null;
    if (empId) {
      const orders = getEmployeeOrders(dailyOrderId, empId);
      return NextResponse.json(orders);
    }
    return NextResponse.json([]);
  }

  return NextResponse.json([]);
}

export async function POST(request: Request) {
  const { dailyOrderId, employeeId, name, dishName, price, quantity } = await request.json();

  let finalEmpId = employeeId;
  if (!finalEmpId && name) {
    const employees: any = getAllEmployees();
    const emp = employees.find((e: any) => e.name === name);
    if (emp) {
      finalEmpId = emp.id;
    } else {
      createEmployee(name, '');
      const newEmps: any = getAllEmployees();
      const newEmp = newEmps.find((e: any) => e.name === name);
      finalEmpId = newEmp?.id || '';
    }
  }

  if (!dailyOrderId || !dishName || !price) {
    return NextResponse.json({ error: '缺少必要欄位' }, { status: 400 });
  }

  placeOrder(dailyOrderId, finalEmpId || '', dishName, Number(price), Number(quantity) || 1);
  return NextResponse.json({ success: true });
}

export async function PUT(request: Request) {
  const { id, quantity } = await request.json();
  if (!id || quantity === undefined) return NextResponse.json({ error: '缺少欄位' }, { status: 400 });
  updateOrder(id, quantity);
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: '缺少 ID' }, { status: 400 });
  deleteOrder(id);
  return NextResponse.json({ success: true });
}
