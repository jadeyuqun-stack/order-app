'use client';
import { useState } from 'react';

interface Props {
  report: any[];
  setReport: (r: any[]) => void;
  year: number;
  setYear: (y: number) => void;
  month: number;
  setMonth: (m: number) => void;
  exportCSV: () => void;
}

export default function ReportManager({ report, setReport, year, setYear, month, setMonth, exportCSV }: Props) {
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
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="px-3 py-2 border border-border rounded-lg"
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-500 mb-1">月份</label>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="px-3 py-2 border border-border rounded-lg"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>{m}月</option>
            ))}
          </select>
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '載入中...' : '產生報表'}
        </button>
        {report.length > 0 && (
          <button
            onClick={exportCSV}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            匯出 CSV
          </button>
        )}
      </div>

      {report.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-gray-50">
                <th className="text-left p-3 font-medium">部門</th>
                <th className="text-left p-3 font-medium">姓名</th>
                <th className="text-right p-3 font-medium">訂餐次數</th>
                <th className="text-right p-3 font-medium">總金額</th>
              </tr>
            </thead>
            <tbody>
              {report.map((r: any, i: number) => (
                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3">{r.department || '-'}</td>
                  <td className="p-3 font-medium">{r.name}</td>
                  <td className="p-3 text-right">{r.order_count}</td>
                  <td className="p-3 text-right font-semibold text-primary">NT${r.total_amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
