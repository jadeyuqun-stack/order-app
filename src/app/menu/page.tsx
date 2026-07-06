'use client';
import { useEffect, useState } from 'react';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  store_name: string;
}

interface CartItem extends MenuItem {
  quantity: number;
}

export default function MenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [employeeId, setEmployeeId] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const eid = localStorage.getItem('employeeId') || '';
    setEmployeeId(eid);

    Promise.all([
      fetch('/api/daily-orders').then((r) => r.json()),
      fetch('/api/menu-items').then((r) => r.json()),
    ]).then(([ordersData, itemsData]) => {
      setActiveOrderId(ordersData.active?.id || null);
      setMenuItems(itemsData);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id);
      if (existing) {
        return prev.map((c) => (c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === itemId);
      if (existing && existing.quantity > 1) {
        return prev.map((c) => (c.id === itemId ? { ...c, quantity: c.quantity - 1 } : c));
      }
      return prev.filter((c) => c.id !== itemId);
    });
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleSubmit = async () => {
    if (!activeOrderId || !employeeId) return;
    for (const item of cart) {
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dailyOrderId: activeOrderId,
          employeeId,
          menuItemId: item.id,
          quantity: item.quantity,
        }),
      });
    }
    setSubmitted(true);
    setCart([]);
  };

  if (loading) return <div className="text-center py-12 text-gray-400">載入中...</div>;
  if (!activeOrderId) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">目前沒有開放點餐</p>
        <p className="text-gray-400 mt-2">請等待行政人員設定今日店家</p>
      </div>
    );
  }
  if (submitted) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-green-600 mb-2">訂餐成功！</h2>
        <p className="text-gray-500">您的訂單已送出，感謝您的點餐</p>
        <button
          onClick={() => setSubmitted(false)}
          className="mt-6 px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-700"
        >
          繼續瀏覽
        </button>
      </div>
    );
  }

  const categories = [...new Set(menuItems.map((item) => item.store_name + (item.category ? ' - ' + item.category : '')))];

  return (
    <div className="flex gap-6">
      {/* Menu */}
      <div className="flex-1">
        <h2 className="text-xl font-bold mb-4">📋 今日菜單</h2>
        {categories.map((cat) => {
          const catItems = menuItems.filter(
            (item) => item.store_name + (item.category ? ' - ' + item.category : '') === cat
          );
          return (
            <div key={cat} className="mb-6">
              <h3 className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wide">{cat}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {catItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => addToCart(item)}
                    className="flex items-center justify-between p-4 bg-white rounded-lg border border-border hover:border-primary hover:shadow-sm transition-all text-left"
                  >
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-500">{item.store_name}</p>
                    </div>
                    <p className="font-semibold text-primary">NT${item.price}</p>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Cart Sidebar */}
      <div className="w-80 shrink-0">
        <div className="sticky top-20 bg-white rounded-xl border border-border p-4">
          <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
            🛒 我的訂單
            {cart.length > 0 && (
              <span className="bg-primary text-white text-xs px-2 py-0.5 rounded-full">{cart.reduce((s, c) => s + c.quantity, 0)}</span>
            )}
          </h3>

          {cart.length === 0 ? (
            <p className="text-gray-400 text-sm py-4 text-center">尚未選擇任何餐點</p>
          ) : (
            <>
              <div className="space-y-2 max-h-80 overflow-y-auto mb-4">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-gray-500">NT${item.price}</p>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="w-7 h-7 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-sm"
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <button
                        onClick={() => addToCart(item)}
                        className="w-7 h-7 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-sm"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-3 mb-3">
                <div className="flex justify-between font-bold text-lg">
                  <span>合計</span>
                  <span className="text-primary">NT${totalAmount}</span>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={!employeeId}
                className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                  employeeId
                    ? 'bg-primary text-white hover:bg-blue-700'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                {!employeeId ? '請先選擇員工身份' : '送出訂單'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
