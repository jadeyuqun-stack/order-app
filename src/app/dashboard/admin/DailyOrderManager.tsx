'use client';
import { useState, useEffect } from 'react';

function formatDeadline(str: string) {
  if (!str) return '-';
  // Stored deadline is "YYYY-MM-DDTHH:MM" — already Taiwan local time, just display as-is
  const parts = str.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!parts) return str;
  const [, , mo, da, h, mi] = parts;
  return `${parseInt(mo)}月${parseInt(da)}日 ${h}:${mi}`;
}

// Convert stored deadline to datetime-local format "YYYY-MM-DDTHH:MM"
// Handles both "2026-07-10T11:08" (no TZ) and "2026-07-10T03:08:00.000Z" (UTC ISO)
function toDatetimeLocal(str: string) {
  if (!str) return '';
  // Already in datetime-local format? return as-is
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(str)) return str;
  const d = new Date(str);
  if (isNaN(d.getTime())) return str.slice(0, 16);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day}T${hh}:${mm}`;
}

export default function DailyOrderManager({ dailyOrders, refresh }: any) {
  const [restaurantId, setRestaurantId] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [deadline, setDeadline] = useState('');
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDeadline, setEditDeadline] = useState('');

  useEffect(() => {
    fetch('/api/restaurants').then((r) => r.json()).then(setRestaurants).catch(() => {});
  }, []);

  const handleCreate = async () => {
    if (!restaurantId || !orderDate || !deadline) return;
    await fetch('/api/daily-orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderDate, restaurantId, deadline }),
    });
    refresh();
    setDeadline('');
  };

  const handleClose = async (id: string) => {
    if (!confirm('確定要提前截止點餐嗎？')) return;
    await fetch('/api/daily-orders', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    refresh();
  };

  const startEdit = (order: any) => {
    setEditingId(order.id);
    setEditDeadline(toDatetimeLocal(order.order_deadline));
  };

  const handleSaveDeadline = async (id: string) => {
    await fetch('/api/daily-orders', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, deadline: editDeadline }),
    });
    setEditingId(null);
    refresh();
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-lg border space-y-3">
        <h3 className="font-semibold">每日開單</h3>
        <div className="flex gap-2 flex-wrap items-end">
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs text-gray-500 mb-1">選擇餐廳</label>
            <select value={restaurantId} onChange={(e) => setRestaurantId(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
              <option value="">選擇餐廳</option>
              {restaurants.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs text-gray-500 mb-1">日期</label>
            <input type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs text-gray-500 mb-1">截止時間</label>
            <input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <button onClick={handleCreate} disabled={!restaurantId || !orderDate || !deadline} className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">建立</button>
        </div>
      </div>

      <div className="space-y-2">
        {dailyOrders.map((o: any) => (
          <div key={o.id} className={`p-4 rounded-lg border flex items-center justify-between flex-wrap gap-2 ${o.status === 'open' ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
            <div className="flex items-center gap-3">
              <span className="font-medium">{o.restaurant_name}</span>
              <span className="text-gray-500 text-sm">{o.order_date}</span>
              <span className="text-gray-400 text-xs">截止 {formatDeadline(o.order_deadline)}</span>
            </div>
            <div className="flex items-center gap-2">
              {o.status === 'open' && (
                <>
                  <button onClick={() => startEdit(o)} className="text-xs text-blue-500 hover:text-blue-700 underline">修改截止</button>
                  <button onClick={() => handleClose(o.id)} className="px-3 py-1 bg-orange-500 text-white text-xs rounded hover:bg-orange-600">訂購截止</button>
                </>
              )}
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${o.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                {o.status === 'open' ? '點餐中' : '已截止'}
              </span>
            </div>
          </div>
        ))}
        {dailyOrders.length === 0 && <p className="text-center text-gray-400 py-8">尚無開單記錄</p>}
      </div>
    </div>
  );
}
