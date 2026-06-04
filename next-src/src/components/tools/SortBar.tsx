'use client';

import type { SortOption } from '@/types/tool';
import { useToolStore } from '@/stores/useToolStore';
import { cn } from '@/lib/utils';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'default', label: '默认' },
  { value: 'hot', label: '热门' },
  { value: 'popular', label: '热度' },
  { value: 'free-first', label: '免费' },
  { value: 'domestic', label: '国产' },
  { value: 'name-asc', label: 'A-Z' },
  { value: 'name-desc', label: 'Z-A' },
];

export function SortBar() {
  const sort = useToolStore((s) => s.sort);
  const setSort = useToolStore((s) => s.setSort);

  return (
    <div className="flex items-center gap-1">
      {SORT_OPTIONS.map((opt) => {
        const isActive = sort === opt.value;

        return (
          <button
            key={opt.value}
            onClick={() => setSort(opt.value)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200',
              isActive
                ? 'bg-blue-500/15 text-blue-400'
                : 'text-white/40 hover:bg-white/5 hover:text-white/70'
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
