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

    // Build total rows and detail rows
    const totalRows: string[][] = [];
    if (data.summary) {
      data.summary.forEach((r: any) => {
        totalRows.push([r.department || '-', r.name, r.order_count, r.total_amount]);
      });
    }
    const detailRows: string[][] = [];
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
        detailRows.push([datePart, timePart, d.restaurant_name, d.employee_name, d.dish_name, d.quantity, d.price, d.price * d.quantity]);
      });
    }

    const maxLen = Math.max(totalRows.length, detailRows.length, 1);

    // Build side-by-side CSV: 總彙總 (left A-D) | 明細 (right F-K)
    const csvLines: string[] = [];
    // Title row: 總彙總 on left, 訂餐明細 on right
    csvLines.push([`${reportMonth}月總彙總`, '', '', '', '', '訂餐明細', '', '', '', '', '', '', '', ''].join(','));
    // Headers: 總彙總 first, then empty column, then 明細 headers
    csvLines.push([...['部門', '姓名', '訂餐次數', '總金額'], '', ...['日期', '時間', '餐廳', '姓名', '菜色', '數量', '單價', '金額']].join(','));

    for (let i = 0; i < maxLen; i++) {
      const tr = totalRows[i] || [];
      const dr = detailRows[i] || [];
      // Pad shorter rows
      const paddedTr = [...tr, ...Array(Math.max(0, 4 - tr.length)).fill('')];
      const paddedDr = [...dr, ...Array(Math.max(0, 8 - dr.length)).fill('')];
      csvLines.push([...paddedTr, '', ...paddedDr].join(','));
    }

    const csv = '﻿' + csvLines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `玉群環境科技_訂餐報表_${reportYear}年${reportMonth}月.csv`;
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
