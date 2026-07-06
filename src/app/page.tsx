'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface DailyOrder {
  id: string;
  order_date: string;
  store_name: string;
  order_deadline: string;
  status: string;
}

export default function HomePage() {
  const [activeOrder, setActiveOrder] = useState<DailyOrder | null>(null);
  const [recentOrders, setRecentOrders] = useState<DailyOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/daily-orders')
      .then((r) => r.json())
      .then((data) => {
        setActiveOrder(data.active || null);
        setRecentOrders(data.dailyOrders || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="text-center py-8">
        <h1 className="text-3xl font-bold mb-2">公司內部點餐系統</h1>
        <p className="text-gray-500">每日精選店家，便捷線上點餐</p>
      </div>

      {/* Active Order */}
      {activeOrder ? (
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">今日店家</p>
              <h2 className="text-2xl font-bold mt-1">{activeOrder.store_name}</h2>
              <p className="text-blue-100 mt-1">
                截止時間：{activeOrder.order_deadline}
              </p>
            </div>
            <Link
              href="/menu"
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              前往點餐 →
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
          <p className="text-yellow-700 font-medium">⏸️ 今日尚未開放點餐</p>
          <p className="text-yellow-600 text-sm mt-1">請等待行政人員設定今日店家</p>
        </div>
      )}

      {/* Employee Quick Select */}
      <EmployeeSelector />

      {/* Recent Orders */}
      {recentOrders.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">近期開單記錄</h3>
          <div className="grid gap-3">
            {recentOrders.slice(0, 5).map((order) => (
              <div
                key={order.id}
                className={`p-4 rounded-lg border ${
                  order.status === 'open' ? 'bg-white border-green-200' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">{order.store_name}</span>
                    <span className="text-gray-500 text-sm ml-2">{order.order_date}</span>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      order.status === 'open'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {order.status === 'open' ? '點餐中' : '已截止'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function EmployeeSelector() {
  const [employees, setEmployees] = useState<{ id: string; name: string; department: string }[]>([]);
  const [selectedId, setSelectedId] = useState('');

  useEffect(() => {
    fetch('/api/employees')
      .then((r) => r.json())
      .then(setEmployees)
      .catch(() => {});
  }, []);

  if (employees.length === 0) {
    return (
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 text-center">
        <p className="text-gray-500">尚未新增員工資料，請至管理後台設定</p>
      </div>
    );
  }

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
              selectedId === emp.id
                ? 'bg-primary text-white border-primary'
                : 'hover:bg-gray-50'
            }`}
          >
            {emp.name}
            {emp.department && <span className="text-gray-400 ml-1">[{emp.department}]</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
