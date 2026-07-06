'use client';
import { useState } from 'react';

interface Props {
  stores: any[];
  menuItems: any[];
  setMenuItems: (m: any[]) => void;
  refresh: () => void;
}

export default function MenuManager({ stores, menuItems, setMenuItems, refresh }: Props) {
  const [storeId, setStoreId] = useState('');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');

  const handleAdd = async () => {
    if (!storeId || !name || !price) return;
    const res = await fetch('/api/menu-items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storeId, name, price: Number(price), category }),
    });
    const data = await res.json();
    setMenuItems(data);
    setName('');
    setPrice('');
    setCategory('');
  };

  const grouped = menuItems.reduce((acc: Record<string, any[]>, item: any) => {
    const key = item.store_name || '未知店家';
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Add Form */}
      <div className="bg-white p-4 rounded-lg border border-border space-y-3">
        <h3 className="font-semibold">新增菜色</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="菜色名稱"
            className="px-3 py-2 border border-border rounded-lg"
          />
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="價格"
            className="px-3 py-2 border border-border rounded-lg"
          />
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="分類（選填）"
            className="px-3 py-2 border border-border rounded-lg"
          />
        </div>
        <button
          onClick={handleAdd}
          disabled={!storeId || !name || !price}
          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          新增菜色
        </button>
      </div>

      {/* Menu List */}
      {Object.entries(grouped).map(([storeName, items]) => (
        <div key={storeName} className="bg-white rounded-lg border border-border">
          <div className="p-3 border-b border-gray-100 font-semibold text-sm text-gray-600">{storeName}</div>
          <div className="divide-y divide-gray-100">
            {items.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between px-4 py-2 text-sm">
                <div>
                  <span>{item.name}</span>
                  {item.category && <span className="text-gray-400 ml-2 text-xs">[{item.category}]</span>}
                </div>
                <span className="font-medium">NT${item.price}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
