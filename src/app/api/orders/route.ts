import { NextResponse } from 'next/server';
import { placeOrder, getEmployeeOrders, getAllOrdersForDate, updateOrder, deleteOrder, getAllEmployees } from '@/lib/queries';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  const sortBy = searchParams.get('sortBy');
  const dailyOrderId = searchParams.get('dailyOrderId');
  const name = searchParams.get('name');

  if (date) {
    const orders = await getAllOrdersForDate(date, sortBy || 'name');
    return NextResponse.json(orders);
  }

  if (dailyOrderId && name) {
    // Find employee by name
    const employees = await getAllEmployees();
    const emp = employees.find((e: any) => e.name === name);
    const empId = emp ? emp.id : null;
    if (empId) {
      const orders = await getEmployeeOrders(dailyOrderId, empId);
      return NextResponse.json(orders);
    }
    // Name not in employee list — find by employee_name column
    const db = await import('@/lib/db');
    const orders = await db.query(
      `SELECT o.*, r.name as restaurant_name
       FROM orders o
       JOIN daily_orders d ON o.daily_order_id = d.id
       JOIN restaurants r ON d.restaurant_id = r.id
       WHERE o.daily_order_id = ? AND o.employee_name = ?`,
      [dailyOrderId, name]
    );
    return NextResponse.json(orders);
  }

  return NextResponse.json([]);
}

export async function POST(request: Request) {
  const { dailyOrderId, employeeId, name, dishName, price, quantity } = await request.json();

  let finalEmpId = employeeId;
  if (!finalEmpId && name) {
    const employees = await getAllEmployees();
    const emp = employees.find((e: any) => e.name === name);
    if (emp) {
      finalEmpId = emp.id;
    } else {
      // Auto-create employee
      const { createEmployee: ce } = await import('@/lib/queries');
      await ce(name, '');
      const newEmps = await getAllEmployees();
      const newEmp = newEmps.find((e: any) => e.name === name);
      finalEmpId = newEmp?.id || '';
    }
  }

  if (!dailyOrderId || !dishName || !price) {
    return NextResponse.json({ error: '缺少必要欄位' }, { status: 400 });
  }

  await placeOrder(dailyOrderId, finalEmpId || '', dishName, Number(price), Number(quantity) || 1);
  return NextResponse.json({ success: true });
}

export async function PUT(request: Request) {
  const { id, quantity } = await request.json();
  if (!id || quantity === undefined) return NextResponse.json({ error: '缺少欄位' }, { status: 400 });
  await updateOrder(id, quantity);
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: '缺少 ID' }, { status: 400 });
  await deleteOrder(id);
  return NextResponse.json({ success: true });
}
