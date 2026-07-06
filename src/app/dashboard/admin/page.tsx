'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import StoreManager from './StoreManager';
import MenuManager from './MenuManager';
import DailyOrderManager from './DailyOrderManager';
import EmployeeManager from './EmployeeManager';
import ReportManager from './ReportManager';

export default function AdminDashboard() {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'stores' | 'menu' | 'daily' | 'employees' | 'report'>('stores');
  const [stores, setStores] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [dailyOrders, setDailyOrders] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [report, setReport] = useState<any[]>([]);
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1);

  useEffect(() => {
    if (localStorage.getItem('adminLoggedIn') === 'true') {
      setLoggedIn(true);
    } else {
      router.push('/dashboard/admin/login');
    }
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('adminLoggedIn');
    router.push('/dashboard/admin/login');
  };

  const loadData = () => {
    Promise.all([
      fetch('/api/stores').then((r) => r.json()).catch(() => []),
      fetch('/api/menu-items').then((r) => r.json()).catch(() => []),
      fetch('/api/daily-orders').then((r) => r.json()).catch(() => ({ dailyOrders: [] })).then((d) => d.dailyOrders || []),
      fetch('/api/employees').then((r) => r.json()).catch(() => []),
    ]).then(([s, m, d, e]) => {
      setStores(s);
      setMenuItems(m);
      setDailyOrders(d);
      setEmployees(e);
    });
  };

  useEffect(() => {
    if (loggedIn) loadData();
  }, [loggedIn]);

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
        <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-red-500">
          登出
        </button>
      </div>

      <div className="flex gap-1 border-b border-border">
        {[
          { key: 'stores', label: '店家管理' },
          { key: 'menu', label: '菜色管理' },
          { key: 'daily', label: '每日開單' },
          { key: 'employees', label: '員工管理' },
          { key: 'report', label: '月度匯出' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'stores' && <StoreManager stores={stores} setStores={setStores} refresh={loadData} />}
      {tab === 'menu' && <MenuManager stores={stores} menuItems={menuItems} setMenuItems={setMenuItems} refresh={loadData} />}
      {tab === 'daily' && <DailyOrderManager dailyOrders={dailyOrders} refresh={loadData} />}
      {tab === 'employees' && <EmployeeManager employees={employees} setEmployees={setEmployees} refresh={loadData} />}
      {tab === 'report' && (
        <ReportManager
          report={report}
          setReport={setReport}
          year={reportYear}
          setYear={setReportYear}
          month={reportMonth}
          setMonth={setReportMonth}
          exportCSV={handleExportCSV}
        />
      )}
    </div>
  );
}
