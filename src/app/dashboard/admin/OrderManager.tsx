'use client';
import { useState, useEffect } from 'react';

export default function OrderManager({ refresh }: any) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [orders, setOrders] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'dish'>('name');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/orders?date=${date}&sortBy=${sortBy}`)
      .then((r) => r.json())
      .then(setOrders)
      .finally(() => setLoading(false));
  }, [date, sortBy]);

  const handleSave = async (id: string) => {
    await fetch('/api/orders', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, quantity: editQty }) });
    setEditingId(null);
    refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('確定刪除此訂單？')) return;
    await fetch(`/api/orders?id=${id}`, { method: 'DELETE' });
    refresh();
  };

  if (loading) return <div className="text-center py-12 text-gray-400">載入中...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <label className="text-sm font-medium">查詢日期：</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="px-3 py-2 border rounded-lg" />
        <div className="flex items-center gap-1 ml-4">
          <span className="text-sm text-gray-500">排序：</span>
          <button
            onClick={() => setSortBy('name')}
            className={`px-3 py-1 text-xs rounded-full border ${sortBy === 'name' ? 'bg-primary text-white border-primary' : 'border-gray-300 hover:bg-gray-50'}`}
          >
            依姓名
          </button>
          <button
            onClick={() => setSortBy('dish')}
            className={`px-3 py-1 text-xs rounded-full border ${sortBy === 'dish' ? 'bg-primary text-white border-primary' : 'border-gray-300 hover:bg-gray-50'}`}
          >
            依菜色
          </button>
        </div>
        <span className="text-sm text-gray-500 ml-auto">共 {orders.length} 筆</span>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-12 text-gray-400">當日尚無訂單</div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-3">姓名</th>
                <th className="text-left p-3">餐廳</th>
                <th className="text-left p-3">菜色</th>
                <th className="text-right p-3">數量</th>
                <th className="text-right p-3">單價</th>
                <th className="text-right p-3">金額</th>
                <th className="text-center p-3">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="p-3 font-medium">{o.employee_name}</td>
                  <td className="p-3">{o.restaurant_name}</td>
                  <td className="p-3">{o.dish_name}</td>
                  <td className="p-3 text-right">
                    {editingId === o.id ? (
                      <div className="flex items-center justify-end gap-1">
                        <input type="number" value={editQty} onChange={(e) => setEditQty(Number(e.target.value))} className="w-16 px-2 py-1 border rounded text-right" min={1} />
                        <button onClick={() => handleSave(o.id)} className="px-2 py-1 bg-green-500 text-white text-xs rounded">存</button>
                        <button onClick={() => setEditingId(null)} className="px-2 py-1 bg-gray-200 text-xs rounded">取</button>
                      </div>
                    ) : (
                      <button onClick={() => { setEditingId(o.id); setEditQty(o.quantity); }}>{o.quantity}</button>
                    )}
                  </td>
                  <td className="p-3 text-right">NT${o.price}</td>
                  <td className="p-3 text-right font-medium">NT${o.price * o.quantity}</td>
                  <td className="p-3 text-center">
                    <button onClick={() => handleDelete(o.id)} className="text-red-400 hover:text-red-600 text-xs">刪除</button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 border-t font-semibold">
              <tr>
                <td colSpan={3} className="p-3 text-right">合計</td>
                <td className="p-3 text-right">{orders.reduce((s: number, o: any) => s + o.quantity, 0)}</td>
                <td></td>
                <td className="p-3 text-right text-primary">NT${orders.reduce((s: number, o: any) => s + o.price * o.quantity, 0)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
