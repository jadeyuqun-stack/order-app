'use client';
import { useState } from 'react';

function formatDate(dateStr: string) {
  if (!dateStr) return '-';
  const [y, m, d] = dateStr.split('-');
  return `${parseInt(m)}月${parseInt(d)}日`;
}

function formatTime(timeStr: string) {
  if (!timeStr) return '-';
  const d = new Date(timeStr);
  if (isNaN(d.getTime())) return '-';
  const utcH = d.getUTCHours();
  const utcM = d.getUTCMinutes();
  const h = String((utcH + 8) % 24).padStart(2, '0');
  const m = String(utcM).padStart(2, '0');
  return `${h}:${m}`;
}

export default function ReportManager({ report, setReport, year, setYear, month, setMonth, exportCSV }: any) {
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    const res = await fetch(`/api/monthly-report?year=${year}&month=${month}`);
    const data = await res.json();
    setReport(data);
    setLoading(false);
  };

  const handleClearMonth = async () => {
    if (!confirm(`確定要清除 ${year}年${month}月 的所有訂單明細嗎？此操作無法復原。`)) return;
    setClearing(true);
    await fetch('/api/orders/clear-month', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ year, month }),
    });
    setClearing(false);
    const res = await fetch(`/api/monthly-report?year=${year}&month=${month}`);
    const data = await res.json();
    setReport(data);
  };

  const handleDownloadCSV = async () => {
    setDetailLoading(true);
    const res = await fetch('/api/monthly-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ year, month }),
    });
    const data = await res.json();
    setDetailLoading(false);
    if (data.details) exportCSV({ summary: report.summary, details: data.details });
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
      </div>

      {report && report.summary && report.summary.length > 0 && (
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold mb-2">💰 總彙總（每人當月累積）</h4>
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

          <div className="flex gap-3 justify-end">
            <button onClick={handleDownloadCSV} disabled={detailLoading} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
              {detailLoading ? '讀取中...' : '匯出 CSV'}
            </button>
          </div>
        </div>
      )}

      {report && report.summary && report.summary.length > 0 && (
        <div className="text-right">
          <button onClick={handleClearMonth} disabled={clearing} className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
            {clearing ? '清除中...' : `清除 ${year}年${month}月 明細`}
          </button>
        </div>
      )}
    </div>
  );
}
