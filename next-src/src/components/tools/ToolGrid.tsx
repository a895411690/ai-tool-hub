'use client';

import { SearchX } from 'lucide-react';
import { useToolStore } from '@/stores/useToolStore';
import { ToolCard } from './ToolCard';
import { cn } from '@/lib/utils';

export function ToolGrid() {
  const filteredTools = useToolStore((s) => s.filteredTools);
  const isLoading = useToolStore((s) => s.isLoading);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-64 animate-pulse rounded-2xl border border-white/5 bg-white/[0.02]"
          />
        ))}
      </div>
    );
  }

  if (filteredTools.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5">
          <SearchX className="h-8 w-8 text-white/20" />
        </div>
        <div>
          <p className="text-lg font-medium text-white/50">没有找到匹配的工具</p>
          <p className="mt-1 text-sm text-white/25">试试更换关键词或筛选条件</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-white/30">
        共找到 <span className="font-medium text-white/60">{filteredTools.length}</span> 个工具
      </p>

      <div
        className={cn(
          'grid grid-cols-1 gap-4',
          'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
        )}
      >
        {filteredTools.map((tool) => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </div>
    </div>
  );
}
