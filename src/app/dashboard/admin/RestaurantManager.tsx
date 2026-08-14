'use client';
import { useState } from 'react';
import Image from 'next/image';

export default function RestaurantManager({ stores, setStores, refresh }: any) {
  const [name, setName] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [msg, setMsg] = useState('');

  const handleAdd = async () => {
    if (!name.trim()) return;
    // Create restaurant first (no photo)
    const res = await fetch('/api/restaurants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim() }),
    });
    const data = await res.json();
    setStores(data);
    setName('');
    setPhotoFile(null);

    // Upload photo if provided
    if (photoFile && data.length > 0) {
      const newRestaurant = data[data.length - 1];
      const form = new FormData();
      form.append('id', newRestaurant.id);
      form.append('file', photoFile);
      await fetch('/api/restaurants', { method: 'PUT', body: form });
      const res2 = await fetch('/api/restaurants');
      setStores(await res2.json());
    }
    setMsg('新增成功');
    setTimeout(() => setMsg(''), 2000);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('確定刪除此餐廳？')) return;
    await fetch(`/api/restaurants?id=${id}`, { method: 'DELETE' });
    refresh();
  };

  const handleExport = async () => {
    const res = await fetch('/api/restaurants/export');
    const data = await res.json();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `餐廳資料_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const text = await file.text();
      let items: any[];
      try {
        items = JSON.parse(text);
        if (!Array.isArray(items)) items = [items];
      } catch {
        setMsg('JSON 格式錯誤');
        setTimeout(() => setMsg(''), 3000);
        return;
      }
      const res = await fetch('/api/restaurants/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      const data = await res.json();
      setStores(data.restaurants || []);
      setMsg(`匯入成功：${data.imported} 筆，跳過 ${data.skipped} 筆`);
      setTimeout(() => setMsg(''), 3000);
      refresh();
    };
    input.click();
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-lg border space-y-3">
        <h3 className="font-semibold">新增餐廳</h3>
        <div className="flex gap-2 flex-wrap items-end">
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs text-gray-500 mb-1">餐廳名稱</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="例如：鼎泰豐" className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs text-gray-500 mb-1">菜單照片（可選）</label>
            <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} className="w-full px-3 py-1 border rounded-lg text-sm" />
          </div>
          <button onClick={handleAdd} className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-700">新增</button>
        </div>
        {msg && <p className="text-green-600 text-sm">{msg}</p>}
      </div>

      <div className="flex gap-2">
        <button onClick={handleExport} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">匯出餐廳資料</button>
        <button onClick={handleImport} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm">匯入餐廳資料</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stores.map((r: any) => (
          <div key={r.id} className="bg-white rounded-xl border overflow-hidden">
            {r.photo_url && (
              <Image
                src={r.photo_url}
                alt={r.name}
                width={400}
                height={160}
                className="w-full h-40 object-cover"
                loading="lazy"
              />
            )}
            <div className="p-3 flex items-center justify-between">
              <span className="font-medium">{r.name}</span>
              <button onClick={() => handleDelete(r.id)} className="text-red-400 hover:text-red-600 text-xs">刪除</button>
            </div>
          </div>
        ))}
        {stores.length === 0 && <p className="text-gray-400 text-sm col-span-full text-center py-8">尚無餐廳資料</p>}
      </div>
    </div>
  );
}
