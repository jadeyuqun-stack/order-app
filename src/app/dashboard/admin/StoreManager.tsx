'use client';
import { useState } from 'react';

interface StoreManagerProps {
  stores: any[];
  setStores: (s: any[]) => void;
  refresh: () => void;
}

export default function StoreManager({ stores, setStores, refresh }: StoreManagerProps) {
  const [name, setName] = useState('');

  const handleAdd = async () => {
    if (!name.trim()) return;
    const res = await fetch('/api/stores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim() }),
    });
    const data = await res.json();
    setStores(data);
    setName('');
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="輸入店家名稱"
          className="flex-1 px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <button
          onClick={handleAdd}
          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-700"
        >
          新增店家
        </button>
      </div>

      <div className="grid gap-2">
        {stores.map((store: any) => (
          <div key={store.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-border">
            <span className="font-medium">{store.name}</span>
            <span className="text-xs text-gray-400">{store.created_at}</span>
          </div>
        ))}
        {stores.length === 0 && (
          <p className="text-center text-gray-400 py-8">尚無店家資料</p>
        )}
      </div>
    </div>
  );
}
