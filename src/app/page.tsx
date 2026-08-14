'use client';
import { useEffect, useState } from 'react';

function formatDeadline(isoStr: string) {
  if (!isoStr) return '-';
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return '-';
  const utcH = d.getUTCHours();
  const utcM = d.getUTCMinutes();
  const utcD = d.getUTCDate();
  const utcMo = d.getUTCMonth() + 1;
  const h = String((utcH + 8) % 24).padStart(2, '0');
  const m = String(utcM).padStart(2, '0');
  let day = utcD;
  if ((utcH + 8) >= 24) { day += 1; }
  return `${utcMo}月${day}日 ${h}:${m}`;
}

interface DailyOrder {
  id: string;
  order_date: string;
  restaurant_name: string;
  restaurant_id: string;
  order_deadline: string;
  status: string;
}

interface OrderItem {
  id: string;
  employee_name: string;
  department: string;
  dish_name: string;
  price: number;
  quantity: number;
  restaurant_name: string;
}

interface OrderSummary {
  dish_name: string;
  quantity: number;
  price: number;
  count: number;
  restaurant_name: string;
}

export default function HomePage() {
  const [activeOrder, setActiveOrder] = useState<DailyOrder | null>(null);
  const [todayOrders, setTodayOrders] = useState<OrderItem[]>([]);
  const [orderSummary, setOrderSummary] = useState<OrderSummary[]>([]);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    Promise.all([
      fetch('/api/daily-orders').then((r) => r.json()),
      fetch(`/api/orders?date=${today}`).then((r) => r.json()),
      fetch('/api/restaurants').then((r) => r.json().catch(() => [])),
    ]).then(([ordersData, todayData, restData]) => {
      setActiveOrder(ordersData.active || null);
      setTodayOrders(todayData);
      setRestaurants(Array.isArray(restData) ? restData : []);

      // Group by dish_name + quantity + price
      const grouped: Record<string, OrderSummary> = {};
      for (const o of todayData) {
        const key = `${o.dish_name}|${o.quantity}|${o.price}`;
        if (!grouped[key]) {
          grouped[key] = { dish_name: o.dish_name, quantity: o.quantity, price: o.price, count: 0, restaurant_name: o.restaurant_name || '' };
        }
        grouped[key].count++;
      }
      // Sort by dish name
      setOrderSummary(Object.values(grouped).sort((a, b) => a.dish_name.localeCompare(b.dish_name)));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-12 text-gray-400">載入中...</div>;

  return (
    <div className="space-y-8">
      <div className="text-center py-8">
        <h1 className="text-3xl font-bold mb-2">玉群環境科技 點餐系統</h1>
        <p className="text-gray-500">每日精選餐廳，員工自主填寫</p>
      </div>

      {activeOrder ? (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">今日餐廳</p>
                <h2 className="text-2xl font-bold mt-1">{activeOrder.restaurant_name}</h2>
                <p className="text-blue-100 mt-1">截止時間：{formatDeadline(activeOrder.order_deadline)}</p>
              </div>
              <a href="/menu" className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
                前往點餐 →
              </a>
            </div>
          </div>

          {activeOrder?.restaurant_id && (() => {
            const r = restaurants.find((r: any) => r.id === activeOrder.restaurant_id);
            return r?.photo_url ? (
              <div className="bg-white rounded-xl border p-4">
                <h3 className="font-semibold mb-2">📸 菜單照片</h3>
                <img src={r.photo_url} alt="菜單" className="w-full rounded-lg object-contain" />
              </div>
            ) : null;
          })()}
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
          <p className="text-yellow-700 font-medium">⏸️ 今日尚未開放點餐</p>
        </div>
      )}

      {/* Order Summary */}
      {orderSummary.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">📊 訂單匯總</h3>
          <div className="bg-white rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-3">餐廳</th>
                  <th className="text-left p-3">菜色</th>
                  <th className="text-right p-3">數量</th>
                  <th className="text-right p-3">單價</th>
                  <th className="text-right p-3">訂單數</th>
                  <th className="text-right p-3">小計</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {orderSummary.map((s, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="p-3 text-xs text-gray-500">{s.restaurant_name || '-'}</td>
                    <td className="p-3 font-medium">{s.dish_name}</td>
                    <td className="p-3 text-right">{s.quantity}</td>
                    <td className="p-3 text-right">NT${s.price}</td>
                    <td className="p-3 text-right">{s.count} 個訂單</td>
                    <td className="p-3 text-right font-semibold">NT${s.price * s.quantity * s.count}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t font-semibold">
                <tr>
                  <td colSpan={3} className="p-3 text-right">合計</td>
                  <td className="p-3 text-right">{todayOrders.length} 筆</td>
                  <td className="p-3 text-right text-primary">NT${todayOrders.reduce((s, o) => s + o.price * o.quantity, 0)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Detailed list */}
      {todayOrders.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">📋 今日訂購狀況（{todayOrders.length} 筆）</h3>
          <div className="bg-white rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-3">姓名</th>
                  <th className="text-left p-3">餐廳</th>
                  <th className="text-left p-3">菜色</th>
                  <th className="text-right p-3">數量</th>
                  <th className="text-right p-3">單價</th>
                  <th className="text-right p-3">金額</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {todayOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="p-3 font-medium">{o.employee_name}</td>
                    <td className="p-3 text-xs text-gray-500">{o.restaurant_name || '-'}</td>
                    <td className="p-3">{o.dish_name}</td>
                    <td className="p-3 text-right">{o.quantity}</td>
                    <td className="p-3 text-right">NT${o.price}</td>
                    <td className="p-3 text-right font-medium">NT${o.price * o.quantity}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t font-semibold">
                <tr>
                  <td colSpan={3} className="p-3 text-right">合計</td>
                  <td className="p-3 text-right">{todayOrders.reduce((s, o) => s + o.quantity, 0)}</td>
                  <td className="p-3 text-right text-primary">NT${todayOrders.reduce((s, o) => s + o.price * o.quantity, 0)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
