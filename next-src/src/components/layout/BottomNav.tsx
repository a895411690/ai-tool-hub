'use client';

import { Home, LayoutGrid, Heart, Trophy } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: Home, label: '首页', href: '/' },
  { icon: LayoutGrid, label: '工具', href: '/tools' },
  { icon: Trophy, label: '排行', href: '/leaderboard' },
  { icon: Heart, label: '我的', href: '/user' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[100] border-t border-white/10 bg-gray-950/90 backdrop-blur-xl pb-[env(safe-area-inset-bottom,8px)] md:hidden">
      <div className="flex justify-around max-w-[500px] mx-auto pt-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-0.5 py-1.5 px-4 rounded-lg transition-colors duration-150',
                isActive
                  ? 'text-blue-400'
                  : 'text-white/30 hover:text-white/60'
              )}
            >
              <Icon className={cn('w-5 h-5 transition-transform duration-150', isActive && 'scale-110')} />
              <span className="text-[10px]">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
