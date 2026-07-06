'use client';
import { useState } from 'react';

export default function RestaurantManager({ stores, setStores, refresh }: any) {
  const [name, setName] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [msg, setMsg] = useState('');

  const handleAdd = async () => {
    if (!name.trim()) return;
    const body: any = { name: name.trim() };
    if (photoFile) {
      // Simple approach: read as base64 data URL
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(photoFile);
      });
      body.photoUrl = dataUrl;
    }
    const res = await fetch('/api/restaurants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setStores(data);
    setName('');
    setPhotoFile(null);
    setMsg('新增成功');
    setTimeout(() => setMsg(''), 2000);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('確定刪除此餐廳？')) return;
    await fetch(`/api/restaurants?id=${id}`, { method: 'DELETE' });
    refresh();
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
            <label className="block text-xs text-gray-500 mb-1">菜單照片</label>
            <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} className="w-full px-3 py-1 border rounded-lg text-sm" />
          </div>
          <button onClick={handleAdd} className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-700">新增</button>
        </div>
        {msg && <p className="text-green-600 text-sm">{msg}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stores.map((r: any) => (
          <div key={r.id} className="bg-white rounded-xl border overflow-hidden">
            {r.photo_url && (
              <img src={r.photo_url} alt={r.name} className="w-full h-40 object-cover" />
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
