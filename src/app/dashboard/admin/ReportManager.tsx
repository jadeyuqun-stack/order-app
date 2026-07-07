'use client';
import { useState } from 'react';

function formatDate(dateStr: string) {
  if (!dateStr) return '-';
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

function formatTime(timeStr: string) {
  if (!timeStr) return '-';
  // Format: "2026-07-07 13:30" or similar
  const parts = timeStr.split(' ');
  if (parts.length > 1) {
    const t = parts[1].substring(0, 5);
    return t;
  }
  return timeStr.substring(0, 5);
}

export default function ReportManager({ report, setReport, year, setYear, month, setMonth, exportCSV }: any) {
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    const res = await fetch(`/api/monthly-report?year=${year}&month=${month}`);
    const data = await res.json();
    setReport(data);
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-end flex-wrap">
        <div>
          <label className="block text-sm text-gray-500 mb-1">年份</label>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="px-3 py-2 border rounded-lg">
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-500 mb-1">月份</label>
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="px-3 py-2 border rounded-lg">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => <option key={m} value={m}>{m}月</option>)}
          </select>
        </div>
        <button onClick={handleGenerate} disabled={loading} className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {loading ? '載入中...' : '產生報表'}
        </button>
        {report && report.summary && report.summary.length > 0 && (
          <button onClick={() => exportCSV(report)} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">匯出 CSV</button>
        )}
      </div>

      {report && report.summary && report.summary.length > 0 && (
        <div className="space-y-6">
          {/* Totals sheet */}
          <div>
            <h4 className="font-semibold mb-2">💰 總會總（每人當月累積）</h4>
            <table className="w-full text-sm bg-white rounded-lg border">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-3">部門</th>
                  <th className="text-left p-3">姓名</th>
                  <th className="text-right p-3">訂餐次數</th>
                  <th className="text-right p-3">總金額</th>
                </tr>
              </thead>
              <tbody>
                {report.summary.map((r: any, i: number) => (
                  <tr key={i} className="border-b hover:bg-gray-50">
                    <td className="p-3">{r.department || '-'}</td>
                    <td className="p-3 font-medium">{r.name}</td>
                    <td className="p-3 text-right">{r.order_count}</td>
                    <td className="p-3 text-right font-semibold text-primary">NT${r.total_amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Detail sheet */}
          <div>
            <h4 className="font-semibold mb-2">📋 訂單明細（{report.totalLines} 筆）</h4>
            <table className="w-full text-sm bg-white rounded-lg border">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-3">日期</th>
                  <th className="text-left p-3">時間</th>
                  <th className="text-left p-3">餐廳</th>
                  <th className="text-left p-3">姓名</th>
                  <th className="text-left p-3">菜色</th>
                  <th className="text-right p-3">數量</th>
                  <th className="text-right p-3">單價</th>
                  <th className="text-right p-3">金額</th>
                </tr>
              </thead>
              <tbody>
                {report.details.map((d: any, i: number) => (
                  <tr key={i} className="border-b hover:bg-gray-50">
                    <td className="p-3">{formatDate(d.order_date)}</td>
                    <td className="p-3">{formatTime(d.order_time)}</td>
                    <td className="p-3">{d.restaurant_name}</td>
                    <td className="p-3">{d.employee_name}</td>
                    <td className="p-3">{d.dish_name}</td>
                    <td className="p-3 text-right">{d.quantity}</td>
                    <td className="p-3 text-right">NT${d.price}</td>
                    <td className="p-3 text-right font-medium">NT${d.price * d.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
