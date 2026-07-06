'use client';
import { useState } from 'react';

export default function DailyOrderManager({ dailyOrders, refresh }: any) {
  const [restaurantId, setRestaurantId] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [deadline, setDeadline] = useState('');
  const [restaurants, setRestaurants] = useState<any[]>([]);

  useState(() => {
    fetch('/api/restaurants').then((r) => r.json()).then(setRestaurants).catch(() => {});
  });

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
          <div key={o.id} className={`p-4 rounded-lg border flex items-center justify-between ${o.status === 'open' ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
            <div>
              <span className="font-medium">{o.restaurant_name}</span>
              <span className="text-gray-500 ml-2 text-sm">{o.order_date}</span>
              <span className="text-gray-400 ml-2 text-xs">截止 {o.order_deadline}</span>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${o.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
              {o.status === 'open' ? '點餐中' : '已截止'}
            </span>
          </div>
        ))}
        {dailyOrders.length === 0 && <p className="text-center text-gray-400 py-8">尚無開單記錄</p>}
      </div>
    </div>
  );
}
