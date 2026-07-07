'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="bg-white border-b sticky top-0 z-50">
      <div className="container mx-auto px-4 max-w-6xl flex items-center justify-between h-14">
        <Link href="/" className="text-lg font-bold text-primary flex items-center gap-2">
          <span className="text-2xl">🍱</span> 玉群環境科技
        </Link>
        <div className="flex gap-1">
          {[
            { href: '/', label: '首頁' },
            { href: '/menu', label: '點餐' },
            { href: '/dashboard/admin', label: '管理後台' },
          ].map((item) => (
            <Link key={item.href} href={item.href} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              pathname === item.href || pathname?.startsWith(item.href) ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}>
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
