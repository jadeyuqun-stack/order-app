'use client';
import { useEffect, useState } from 'react';

interface DailyOrder {
  id: string;
  order_date: string;
  restaurant_name: string;
  order_deadline: string;
  status: string;
}

interface OrderItem {
  id: string;
  employee_name: string;
  department: string;
  dish_name: string;
  price: number;
  quantity: number;
}

export default function HomePage() {
  const [activeOrder, setActiveOrder] = useState<DailyOrder | null>(null);
  const [todayOrders, setTodayOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    Promise.all([
      fetch('/api/daily-orders').then((r) => r.json()),
      fetch(`/api/orders?date=${today}`).then((r) => r.json()),
    ]).then(([ordersData, todayData]) => {
      setActiveOrder(ordersData.active || null);
      setTodayOrders(todayData);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-12 text-gray-400">載入中...</div>;

  return (
    <div className="space-y-8">
      <div className="text-center py-8">
        <h1 className="text-3xl font-bold mb-2">公司內部點餐系統</h1>
        <p className="text-gray-500">每日精選餐廳，員工自主填寫</p>
      </div>

      {activeOrder ? (
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">今日餐廳</p>
              <h2 className="text-2xl font-bold mt-1">{activeOrder.restaurant_name}</h2>
              <p className="text-blue-100 mt-1">截止時間：{activeOrder.order_deadline}</p>
            </div>
            <a href="/menu" className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
              前往點餐 →
            </a>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
          <p className="text-yellow-700 font-medium">⏸️ 今日尚未開放點餐</p>
        </div>
      )}

      <EmployeeSelector />

      {todayOrders.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">📋 今日訂購狀況（{todayOrders.length} 筆）</h3>
          <div className="bg-white rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-3">部門</th>
                  <th className="text-left p-3">姓名</th>
                  <th className="text-left p-3">菜色</th>
                  <th className="text-right p-3">數量</th>
                  <th className="text-right p-3">單價</th>
                  <th className="text-right p-3">金額</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {todayOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="p-3 text-gray-500">{o.department || '-'}</td>
                    <td className="p-3 font-medium">{o.employee_name}</td>
                    <td className="p-3">{o.dish_name}</td>
                    <td className="p-3 text-right">{o.quantity}</td>
                    <td className="p-3 text-right">NT${o.price}</td>
                    <td className="p-3 text-right font-medium">NT${o.price * o.quantity}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t font-semibold">
                <tr>
                  <td colSpan={4} className="p-3 text-right">合計</td>
                  <td className="p-3 text-right">{todayOrders.reduce((s, o) => s + o.quantity, 0)}</td>
                  <td className="p-3 text-right text-primary">NT${todayOrders.reduce((s, o) => s + o.price * o.quantity, 0)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function EmployeeSelector() {
  const [employees, setEmployees] = useState<{ id: string; name: string; department: string }[]>([]);
  const [selectedId, setSelectedId] = useState(localStorage.getItem('employeeId') || '');

  useEffect(() => {
    fetch('/api/employees').then((r) => r.json()).then(setEmployees).catch(() => {});
  }, []);

  if (employees.length === 0) return null;

  return (
    <div className="bg-white rounded-xl p-6 border border-border">
      <h3 className="font-semibold mb-3">我是員工，請選擇我的身份</h3>
      <div className="flex flex-wrap gap-2">
        {employees.map((emp) => (
          <button
            key={emp.id}
            onClick={() => {
              setSelectedId(emp.id);
              localStorage.setItem('employeeId', emp.id);
              localStorage.setItem('employeeName', emp.name);
            }}
            className={`px-4 py-2 rounded-lg border text-sm transition-colors ${
              selectedId === emp.id ? 'bg-primary text-white border-primary' : 'hover:bg-gray-50'
            }`}
          >
            {emp.name}{emp.department && <span className="text-gray-400 ml-1">[{emp.department}]</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
