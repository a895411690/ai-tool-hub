'use client';

import { useToolStore } from '@/stores/useToolStore';
import { cn } from '@/lib/utils';

export function CategoryFilter() {
  const categories = useToolStore((s) => s.categories);
  const selectedCategory = useToolStore((s) => s.selectedCategory);
  const setSelectedCategory = useToolStore((s) => s.setSelectedCategory);

  const allCategories = [{ id: 'all', name: '全部', icon: '🎯' }, ...categories];

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {allCategories.map((cat) => {
        const isActive = selectedCategory === cat.id;

        return (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all duration-300',
              isActive
                ? 'scale-105 bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-[0_0_16px_rgba(59,130,246,0.3)]'
                : 'border border-white/10 bg-white/5 text-white/50 hover:-translate-y-0.5 hover:bg-white/10 hover:text-white/80'
            )}
          >
            <span className="text-base">{cat.icon}</span>
            <span>{cat.name}</span>
          </button>
        );
      })}
    </div>
  );
}
