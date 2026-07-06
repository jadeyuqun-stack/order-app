'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import RestaurantManager from './RestaurantManager';
import DailyOrderManager from './DailyOrderManager';
import EmployeeManager from './EmployeeManager';
import OrderManager from './OrderManager';
import ReportManager from './ReportManager';

export default function AdminDashboard() {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'restaurants' | 'daily' | 'employees' | 'orders' | 'report'>('restaurants');
  const [stores, setStores] = useState<any[]>([]);
  const [dailyOrders, setDailyOrders] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [report, setReport] = useState<any[]>([]);
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1);

  useEffect(() => {
    if (localStorage.getItem('adminLoggedIn') === 'true') setLoggedIn(true);
    else router.push('/dashboard/admin/login');
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('adminLoggedIn');
    router.push('/dashboard/admin/login');
  };

  const loadData = () => {
    Promise.all([
      fetch('/api/restaurants').then((r) => r.json()).catch(() => []),
      fetch('/api/daily-orders').then((r) => r.json()).catch(() => ({ dailyOrders: [] })).then((d) => d.dailyOrders || []),
      fetch('/api/employees').then((r) => r.json()).catch(() => []),
    ]).then(([s, d, e]) => {
      setStores(s);
      setDailyOrders(d);
      setEmployees(e);
    });
  };

  useEffect(() => { if (loggedIn) loadData(); }, [loggedIn]);

  if (loading) return <div className="text-center py-12 text-gray-400">載入中...</div>;

  const handleExportCSV = () => {
    if (report.length === 0) return;
    const headers = ['部門', '姓名', '訂餐次數', '總金額'];
    const rows = report.map((r: any) => [r.department || '-', r.name, r.order_count, r.total_amount]);
    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `訂餐明細_${reportYear}年${reportMonth}月.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">管理後台</h1>
        <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-red-500">登出</button>
      </div>

      <div className="flex gap-1 border-b overflow-x-auto">
        {[
          { key: 'restaurants', label: '餐廳' },
          { key: 'daily', label: '開單' },
          { key: 'employees', label: '人員' },
          { key: 'orders', label: '訂單' },
          { key: 'report', label: '月報' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              tab === t.key ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'restaurants' && <RestaurantManager stores={stores} setStores={setStores} refresh={loadData} />}
      {tab === 'daily' && <DailyOrderManager dailyOrders={dailyOrders} refresh={loadData} />}
      {tab === 'employees' && <EmployeeManager employees={employees} setEmployees={setEmployees} refresh={loadData} />}
      {tab === 'orders' && <OrderManager refresh={loadData} />}
      {tab === 'report' && (
        <ReportManager report={report} setReport={setReport} year={reportYear} setYear={setReportYear} month={reportMonth} setMonth={setReportMonth} exportCSV={handleExportCSV} />
      )}
    </div>
  );
}
