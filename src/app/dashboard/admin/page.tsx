'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import RestaurantManager from './RestaurantManager';
import DailyOrderManager from './DailyOrderManager';
import OrderManager from './OrderManager';
import ReportManager from './ReportManager';

export default function AdminDashboard() {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'restaurants' | 'daily' | 'orders' | 'report'>('restaurants');
  const [stores, setStores] = useState<any[]>([]);
  const [dailyOrders, setDailyOrders] = useState<any[]>([]);
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
    ]).then(([s, d]) => {
      setStores(s);
      setDailyOrders(d);
    });
  };

  useEffect(() => { if (loggedIn) loadData(); }, [loggedIn]);

  if (loading) return <div className="text-center py-12 text-gray-400">載入中...</div>;

  const handleExportCSV = (data: any) => {
    if (!data) return;

    // Sheet 1: 訂單明細
    const detailLines: string[] = [];
    detailLines.push('Sheet: 訂單明細');
    const detailHeaders = ['日期', '時間', '餐廳', '姓名', '部門', '菜色', '數量', '單價', '金額'];
    detailLines.push(detailHeaders.join(','));
    if (data.details) {
      data.details.forEach((d: any) => {
        const datePart = d.order_date ? (() => {
          const [m, day] = d.order_date.split('-').slice(1, 3);
          return `${parseInt(m)}月${parseInt(day)}日`;
        })() : '';
        let timePart = '-';
        if (d.order_time) {
          const t = new Date(d.order_time);
          if (!isNaN(t.getTime())) {
            const utcH = t.getUTCHours();
            const utcM = t.getUTCMinutes();
            const h = String((utcH + 8) % 24).padStart(2, '0');
            timePart = `${h}:${String(utcM).padStart(2, '0')}`;
          }
        }
        detailLines.push([datePart, timePart, d.restaurant_name, d.employee_name, d.department || '-', d.dish_name, d.quantity, d.price, d.price * d.quantity].join(','));
      });
    }
    const detailCsv = '﻿' + detailLines.join('\n');
    const detailBlob = new Blob([detailCsv], { type: 'text/csv;charset=utf-8;' });
    const detailUrl = URL.createObjectURL(detailBlob);
    const detailA = document.createElement('a');
    detailA.href = detailUrl;
    detailA.download = `玉群環境科技_訂單明細_${reportYear}年${reportMonth}月.csv`;
    detailA.click();
    URL.revokeObjectURL(detailUrl);

    // Sheet 2: 總會總
    const totalLines: string[] = [];
    totalLines.push('Sheet: 總會總');
    const totalHeaders = ['部門', '姓名', '訂餐次數', '總金額'];
    totalLines.push(totalHeaders.join(','));
    if (data.summary) {
      data.summary.forEach((r: any) => {
        totalLines.push([r.department || '-', r.name, r.order_count, r.total_amount].join(','));
      });
    }
    const totalCsv = '﻿' + totalLines.join('\n');
    const totalBlob = new Blob([totalCsv], { type: 'text/csv;charset=utf-8;' });
    const totalUrl = URL.createObjectURL(totalBlob);
    const totalA = document.createElement('a');
    totalA.href = totalUrl;
    totalA.download = `玉群環境科技_總會總_${reportYear}年${reportMonth}月.csv`;
    totalA.click();
    URL.revokeObjectURL(totalUrl);
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
      {tab === 'orders' && <OrderManager refresh={loadData} />}
      {tab === 'report' && (
        <ReportManager report={report} setReport={setReport} year={reportYear} setYear={setReportYear} month={reportMonth} setMonth={setReportMonth} exportCSV={handleExportCSV} />
      )}
    </div>
  );
}
