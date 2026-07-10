'use client';
import { useEffect, useState } from 'react';

function formatDeadline(isoStr: string) {
  if (!isoStr) return '-';
  const parts = isoStr.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!parts) return '-';
  const [, , mo, da, h, mi] = parts;
  const hh = String((parseInt(h) + 8) % 24).padStart(2, '0');
  return `${parseInt(mo)}月${parseInt(da)}日 ${hh}:${mi}`;
}

interface CartItem {
  dishName: string;
  price: string;
  quantity: string;
}

export default function MenuPage() {
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [myName, setMyName] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [dishName, setDishName] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMyName(localStorage.getItem('orderName') || '');
    fetch('/api/daily-orders')
      .then((r) => r.json())
      .then((data) => {
        setActiveOrder(data.active);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (activeOrder && myName) {
      fetch(`/api/orders?dailyOrderId=${activeOrder.id}&name=${encodeURIComponent(myName)}`)
        .then((r) => r.json())
        .then(setMyOrders);
    }
  }, [activeOrder, myName]);

  const handleSaveName = () => {
    if (myName.trim()) localStorage.setItem('orderName', myName.trim());
  };

  const addToCart = () => {
    if (!dishName.trim() || !price) return;
    setCart((prev) => [...prev, { dishName: dishName.trim(), price, quantity: quantity || '1' }]);
    setDishName(''); setPrice(''); setQuantity('1');
  };

  const removeFromCart = (idx: number) => {
    setCart((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleBatchSubmit = async () => {
    if (!activeOrder || !myName.trim() || cart.length === 0) return;
    for (const item of cart) {
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dailyOrderId: activeOrder.id,
          name: myName.trim(),
          dishName: item.dishName,
          price: Number(item.price),
          quantity: Number(item.quantity) || 1,
        }),
      });
    }
    setSubmitted(true);
    setCart([]);
    fetch(`/api/orders?dailyOrderId=${activeOrder.id}&name=${encodeURIComponent(myName.trim())}`)
      .then((r) => r.json())
      .then(setMyOrders);
  };

  if (loading) return <div className="text-center py-12 text-gray-400">載入中...</div>;
  if (!activeOrder) return <div className="text-center py-12 text-gray-500">目前沒有開放點餐</div>;
  if (submitted) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-green-600 mb-2">送出成功！</h2>
        <p className="text-gray-500">共 {myOrders.length} 筆訂單</p>
        <div className="mt-6 flex gap-3 justify-center">
          <button onClick={() => setSubmitted(false)} className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-700">繼續點餐</button>
          <a href="/" className="px-6 py-2 border rounded-lg hover:bg-gray-50">回首頁</a>
        </div>
      </div>
    );
  }

  const cartTotal = cart.reduce((s, item) => s + Number(item.price) * Number(item.quantity || 1), 0);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm text-blue-600">今日餐廳：<strong>{activeOrder.restaurant_name}</strong></p>
        <p className="text-sm text-blue-500">截止時間：{formatDeadline(activeOrder.order_deadline)}</p>
      </div>

      {activeOrder.restaurant_photo && (
        <div className="bg-white rounded-xl border p-4">
          <h3 className="font-semibold mb-2">📸 菜單照片</h3>
          <img src={activeOrder.restaurant_photo} alt="菜單" className="w-full rounded-lg object-contain" />
        </div>
      )}

      {/* Name */}
      <div className="bg-white rounded-xl border p-4">
        <label className="block text-sm font-medium mb-1">我的姓名</label>
        <input
          type="text"
          value={myName}
          onChange={(e) => setMyName(e.target.value)}
          onBlur={handleSaveName}
          placeholder="請輸入您的姓名"
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Add to cart form */}
      <div className="bg-white rounded-xl border p-6 space-y-3">
        <h2 className="text-lg font-bold">加入餐點</h2>
        <div className="grid grid-cols-3 gap-3">
          <input type="text" value={dishName} onChange={(e) => setDishName(e.target.value)} placeholder="菜色名稱" className="px-4 py-2 border rounded-lg" />
          <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="價格" className="px-4 py-2 border rounded-lg" />
          <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="數量" min={1} className="px-4 py-2 border rounded-lg" />
        </div>
        <button
          onClick={addToCart}
          disabled={!dishName.trim() || !price}
          className="w-full py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
        >
          ＋ 加入清單
        </button>
      </div>

      {/* Cart */}
      {cart.length > 0 && (
        <div className="bg-white rounded-xl border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">🛒 點餐清單（{cart.length} 項）</h3>
            <span className="text-primary font-bold">小計 NT${cartTotal}</span>
          </div>
          <div className="divide-y">
            {cart.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 text-sm">
                <div className="flex-1">
                  <span className="font-medium">{item.dishName}</span>
                  <span className="text-gray-400 ml-2">x{item.quantity}</span>
                </div>
                <span className="font-medium mr-3">NT${Number(item.price) * Number(item.quantity || 1)}</span>
                <button onClick={() => removeFromCart(idx)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
              </div>
            ))}
          </div>
          <button
            onClick={handleBatchSubmit}
            disabled={cart.length === 0}
            className="w-full py-3 bg-primary text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            一次送出全部（{cart.length} 項）
          </button>
        </div>
      )}

      {/* Submitted orders */}
      {myOrders.length > 0 && (
        <div className="bg-white rounded-xl border p-4">
          <h3 className="font-semibold mb-2">{myName} 的訂單</h3>
          <div className="divide-y">
            {myOrders.map((o) => (
              <div key={o.id} className="flex justify-between py-2 text-sm">
                <span>{o.dish_name} x{o.quantity}</span>
                <span className="font-medium">NT${o.price * o.quantity}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
