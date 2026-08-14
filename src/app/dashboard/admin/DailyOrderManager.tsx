'use client';
import { useState } from 'react';

// Convert UTC ISO deadline to Taiwan time display "07月10日 11:30"
function formatDeadline(str: string) {
  if (!str) return '-';
  const d = new Date(str);
  if (isNaN(d.getTime())) return '-';
  const utcH = d.getUTCHours();
  const utcM = d.getUTCMinutes();
  const utcD = d.getUTCDate();
  const utcMo = d.getUTCMonth() + 1;
  const h = String((utcH + 8) % 24).padStart(2, '0');
  const m = String(utcM).padStart(2, '0');
  // Handle day rollover from +8
  let day = utcD;
  let mo = utcMo;
  if (utcH >= 16) { day += 1; }
  else if ((utcH + 8) >= 24) { day += 1; }
  return `${mo}月${day}日 ${h}:${m}`;
}

// Convert UTC ISO deadline to datetime-local value "YYYY-MM-DDTHH:MM" (Taiwan time)
function toDatetimeLocal(str: string) {
  if (!str) return '';
  // Already in datetime-local format?
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(str)) return str;
  const d = new Date(str);
  if (isNaN(d.getTime())) return '';
  const utcH = d.getUTCHours();
  const utcM = d.getUTCMinutes();
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  const hh = String((utcH + 8) % 24).padStart(2, '0');
  const mm = String(utcM).padStart(2, '0');
  return `${y}-${String(m).padStart(2,'0')}-${String(day).padStart(2,'0')}T${hh}:${mm}`;
}

export default function DailyOrderManager({ dailyOrders, stores, refresh }: any) {
  const [restaurantId, setRestaurantId] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [deadline, setDeadline] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDeadline, setEditDeadline] = useState('');

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
    if (!editDeadline) return;
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
              {stores.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
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
                  {editingId === o.id ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="datetime-local"
                        value={editDeadline}
                        onChange={(e) => setEditDeadline(e.target.value)}
                        className="px-2 py-1 border rounded text-xs"
                      />
                      <button onClick={() => handleSaveDeadline(o.id)} className="px-2 py-1 bg-green-500 text-white text-xs rounded">存</button>
                      <button onClick={() => setEditingId(null)} className="px-2 py-1 bg-gray-200 text-xs rounded">取</button>
                    </div>
                  ) : (
                    <button onClick={() => startEdit(o)} className="text-xs text-blue-500 hover:text-blue-700 underline">修改截止</button>
                  )}
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
