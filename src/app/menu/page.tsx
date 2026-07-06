'use client';
import { useEffect, useState } from 'react';

export default function MenuPage() {
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [dishName, setDishName] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  const [employeeId, setEmployeeId] = useState('');
  const [employeeName, setEmployeeName] = useState('');

  useEffect(() => {
    setEmployeeId(localStorage.getItem('employeeId') || '');
    setEmployeeName(localStorage.getItem('employeeName') || '');
  }, []);

  useEffect(() => {
    fetch('/api/daily-orders')
      .then((r) => r.json())
      .then((data) => {
        setActiveOrder(data.active);
        if (data.active) {
          fetch(`/api/orders?dailyOrderId=${data.active.id}&employeeId=${employeeId}`)
            .then((r) => r.json())
            .then(setMyOrders);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [employeeId]);

  const handleSubmit = async () => {
    if (!activeOrder || !employeeId || !dishName || !price) return;
    await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dailyOrderId: activeOrder.id,
        employeeId,
        dishName,
        price: Number(price),
        quantity: Number(quantity) || 1,
      }),
    });
    setSubmitted(true);
    setDishName(''); setPrice(''); setQuantity('1');
    // Refresh orders
    fetch(`/api/orders?dailyOrderId=${activeOrder.id}&employeeId=${employeeId}`)
      .then((r) => r.json())
      .then(setMyOrders);
  };

  if (loading) return <div className="text-center py-12 text-gray-400">載入中...</div>;
  if (!activeOrder) {
    return <div className="text-center py-12 text-gray-500">目前沒有開放點餐</div>;
  }
  if (submitted) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-green-600 mb-2">送出成功！</h2>
        <p className="text-gray-500">繼續添加餐點或返回首頁</p>
        <div className="mt-6 flex gap-3 justify-center">
          <button onClick={() => setSubmitted(false)} className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-700">繼續添加</button>
          <a href="/" className="px-6 py-2 border rounded-lg hover:bg-gray-50">回首頁</a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm text-blue-600">今日餐廳：<strong>{activeOrder.restaurant_name}</strong></p>
        <p className="text-sm text-blue-500">截止時間：{activeOrder.order_deadline}</p>
      </div>

      <div className="bg-white rounded-xl border p-6 space-y-4">
        <h2 className="text-lg font-bold">填寫你的餐點</h2>
        <div className="grid grid-cols-2 gap-3">
          <input type="text" value={dishName} onChange={(e) => setDishName(e.target.value)} placeholder="菜色名稱" className="px-4 py-2 border rounded-lg" />
          <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="價格" className="px-4 py-2 border rounded-lg" />
          <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="數量" min={1} className="px-4 py-2 border rounded-lg" />
          <span className="text-sm text-gray-400 self-center">已選：{employeeName || '(請先在首頁選擇身份)'}</span>
        </div>
        <button
          onClick={handleSubmit}
          disabled={!employeeId || !dishName || !price}
          className="w-full py-3 bg-primary text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
        >
          加入訂單
        </button>
      </div>

      {myOrders.length > 0 && (
        <div className="bg-white rounded-xl border p-4">
          <h3 className="font-semibold mb-2">我的訂單</h3>
          <div className="divide-y">
            {myOrders.map((o) => (
              <div key={o.id} className="flex justify-between py-2 text-sm">
                <span>{o.dish_name} x{o.quantity}</span>
                <span className="font-medium">NT${o.price * o.quantity}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between pt-2 mt-2 border-t font-bold">
            <span>小計</span>
            <span className="text-primary">NT${myOrders.reduce((s, o) => s + o.price * o.quantity, 0)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
