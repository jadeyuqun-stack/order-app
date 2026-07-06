'use client';
import { useState, useEffect } from 'react';

interface Props {
  dailyOrders: any[];
  refresh: () => void;
}

export default function DailyOrderManager({ dailyOrders, refresh }: Props) {
  const [stores, setStores] = useState<any[]>([]);
  const [storeId, setStoreId] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [deadline, setDeadline] = useState('');

  useEffect(() => {
    fetch('/api/stores').then((r) => r.json()).then(setStores).catch(() => {});
  }, []);

  const handleCreate = async () => {
    if (!storeId || !orderDate || !deadline) return;
    await fetch('/api/daily-orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderDate, storeId, deadline }),
    });
    refresh();
    setDeadline('');
  };

  const handleClose = async (id: string) => {
    await fetch(`/api/daily-orders?id=${id}`, { method: 'DELETE' });
    refresh();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-lg border border-border space-y-3">
        <h3 className="font-semibold">新增每日開單</h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <select
            value={storeId}
            onChange={(e) => setStoreId(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg"
          >
            <option value="">選擇店家</option>
            {stores.map((s: any) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <input
            type="date"
            value={orderDate}
            onChange={(e) => setOrderDate(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg"
          />
          <input
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg"
          />
          <button
            onClick={handleCreate}
            disabled={!storeId || !orderDate || !deadline}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            建立開單
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {dailyOrders.map((order: any) => (
          <div
            key={order.id}
            className={`p-4 rounded-lg border flex items-center justify-between ${
              order.status === 'open' ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div>
              <span className="font-medium">{order.store_name}</span>
              <span className="text-gray-500 ml-2 text-sm">{order.order_date}</span>
              <span className="text-gray-400 ml-2 text-xs">截止 {order.order_deadline}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                order.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
              }`}>
                {order.status === 'open' ? '點餐中' : '已截止'}
              </span>
              {order.status === 'open' && (
                <button
                  onClick={() => handleClose(order.id)}
                  className="text-xs text-red-500 hover:text-red-700 underline"
                >
                  提前截止
                </button>
              )}
            </div>
          </div>
        ))}
        {dailyOrders.length === 0 && (
          <p className="text-center text-gray-400 py-8">尚無開單記錄</p>
        )}
      </div>
    </div>
  );
}
