'use client';

import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCompareStore } from '@/stores/useCompareStore';

export default function CompareBar() {
  const router = useRouter();
  const { selectedTools, removeTool, clearAll } = useCompareStore();

  if (selectedTools.length < 2) return null;

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        'border-t border-white/10 bg-gray-900/95 backdrop-blur-md',
        'px-6 py-4'
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-2 overflow-x-auto">
          <span className="shrink-0 text-sm text-white/60">已选择 ({selectedTools.length}/4):</span>
          {selectedTools.map((tool) => (
            <span
              key={tool.id}
              className="flex shrink-0 items-center gap-1.5 rounded-full bg-violet-500/20 px-3 py-1 text-sm text-violet-300 border border-violet-500/30"
            >
              {tool.name}
              <button
                onClick={() => removeTool(tool.id)}
                className="rounded-full p-0.5 transition-colors hover:bg-violet-500/30"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <button
            onClick={clearAll}
            className="rounded-lg px-4 py-2 text-sm text-white/60 transition-colors hover:bg-white/5 hover:text-white/80"
          >
            清除
          </button>
          <button
            onClick={() => router.push('/compare')}
            className={cn(
              'rounded-lg bg-violet-600 px-5 py-2 text-sm font-medium text-white',
              'transition-colors hover:bg-violet-500'
            )}
          >
            开始对比
          </button>
        </div>
      </div>
    </div>
  );
}
