'use client';
import { useState } from 'react';

export default function EmployeeManager({ employees, setEmployees, refresh }: any) {
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!name.trim()) return;
    const res = await fetch('/api/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), department: department.trim() }),
    });
    const data = await res.json();
    setEmployees(data);
    setName(''); setDepartment('');
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/employees?id=${id}`, { method: 'DELETE' });
    setConfirmDelete(null);
    refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="姓名" className="px-4 py-2 border rounded-lg flex-1 min-w-[120px]" onKeyDown={(e) => e.key === 'Enter' && handleAdd()} />
        <input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="部門" className="px-4 py-2 border rounded-lg flex-1 min-w-[120px]" onKeyDown={(e) => e.key === 'Enter' && handleAdd()} />
        <button onClick={handleAdd} className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-700">新增</button>
      </div>

      <div className="grid gap-2">
        {employees.map((emp: any) => (
          <div key={emp.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
            <div>
              <span className="font-medium">{emp.name}</span>
              {emp.department && <span className="text-gray-400 text-sm ml-2">[{emp.department}]</span>}
            </div>
            {confirmDelete === emp.id ? (
              <div className="flex items-center gap-1">
                <button onClick={() => handleDelete(emp.id)} className="px-2 py-1 bg-red-500 text-white text-xs rounded">確認</button>
                <button onClick={() => setConfirmDelete(null)} className="px-2 py-1 bg-gray-200 text-xs rounded">取消</button>
              </div>
            ) : (
              <button onClick={() => setConfirmDelete(emp.id)} className="px-3 py-1 bg-red-50 text-red-500 text-xs rounded border border-red-200 hover:bg-red-100">刪除</button>
            )}
          </div>
        ))}
        {employees.length === 0 && <p className="text-center text-gray-400 py-8">尚無員工資料</p>}
      </div>
    </div>
  );
}
