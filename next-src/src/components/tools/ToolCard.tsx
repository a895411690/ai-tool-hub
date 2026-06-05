'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Heart, ExternalLink } from 'lucide-react';
import type { Tool } from '@/types/tool';
import { useUserStore } from '@/stores/useUserStore';
import { useCompareStore } from '@/stores/useCompareStore';
import { getToolSlug, getPricingHighlight } from '@/lib/tools-data';
import { cn } from '@/lib/utils';
import { trackClick } from '@/lib/api';
import { ToolIcon } from '@/lib/icon-map';

const TAG_STYLES: Record<string, string> = {
  free: 'bg-emerald-500/15 text-emerald-400',
  vip: 'bg-amber-500/15 text-amber-400',
  new: 'bg-blue-500/15 text-blue-400',
  hot: 'bg-red-500/15 text-red-400',
  domestic: 'bg-purple-500/15 text-purple-400',
};

const TAG_LABELS: Record<string, string> = {
  free: '免费',
  vip: 'VIP',
  new: '新',
  hot: '热门',
  domestic: '国产',
};

const VALUE_TAG_STYLES: Record<string, string> = {
  '免费够用': 'bg-emerald-500/15 text-emerald-400',
  '有免费额度': 'bg-blue-500/15 text-blue-400',
  '纯付费': 'bg-red-500/15 text-red-400',
  '需订阅ChatGPT Plus': 'bg-amber-500/15 text-amber-400',
};

interface ToolCardProps {
  tool: Tool;
}

export function ToolCard({ tool }: ToolCardProps) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const toggleFavorite = useUserStore((s) => s.toggleFavorite);
  const isFavorite = useUserStore((s) => s.isFavorite(tool.id));

  const { addTool, removeTool, isSelected } = useCompareStore();
  const compareSelected = isSelected(tool.id);
  const slug = getToolSlug(tool);
  const priceLabel = getPricingHighlight(tool.pricing);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: y * -10, y: x * 10 });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTilt({ x: 0, y: 0 });
  }, []);

  const allTags: string[] = [];
  if (tool.tags) allTags.push(...tool.tags);
  if (tool.toolTags) {
    for (const tt of tool.toolTags) {
      if (tt === '国产') allTags.push('domestic');
    }
  }
  if (tool.status === 'hot' && !allTags.includes('hot')) allTags.push('hot');

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ perspective: '800px' }}
      className="group relative"
    >
      <div
        style={{
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transition: 'transform 0.15s ease-out',
        }}
        className={cn(
          'relative overflow-hidden rounded-2xl border border-white/8 bg-white/[0.03] backdrop-blur-sm',
          'transition-all duration-300 ease-out',
          'hover:-translate-y-2 hover:border-blue-500/30 hover:shadow-[0_8px_40px_rgba(59,130,246,0.12)]'
        )}
      >
        {/* Border scan animation on hover */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="absolute -top-full left-1/2 h-full w-[2px] -translate-x-1/2 bg-gradient-to-b from-transparent via-blue-400 to-transparent animate-[scan_2s_linear_infinite]" />
        </div>

        {/* Compare checkbox */}
        <label className="absolute right-3 top-3 z-10 flex cursor-pointer items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={compareSelected}
            onChange={() => (compareSelected ? removeTool(tool.id) : addTool(tool))}
            className="h-3.5 w-3.5 rounded border-white/20 bg-white/5 accent-blue-500"
          />
          <span className="text-[10px] text-white/30">对比</span>
        </label>

        {/* Card links to detail page */}
        <Link href={`/tools/${slug}`} className="block">
          {/* Header */}
          <div className="flex items-start gap-4 p-5 pb-3">
            {/* Left color strip */}
            <div className="absolute left-0 top-0 h-full w-1 rounded-l-2xl bg-gradient-to-b from-blue-500 to-purple-500 opacity-0 transition-opacity group-hover:opacity-100" />

            {/* Icon */}
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20">
              <ToolIcon name={tool.icon} className="h-6 w-6 text-white/70" />
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex items-center gap-2">
                <h3 className="truncate text-base font-semibold text-white">{tool.name}</h3>
              </div>

              {/* Tags row */}
              <div className="flex flex-wrap gap-1">
                {allTags
                  .filter((t, i, arr) => arr.indexOf(t) === i)
                  .slice(0, 3)
                  .map((tag) => (
                    <span
                      key={tag}
                      className={cn(
                        'rounded-md px-1.5 py-0.5 text-[10px] font-medium',
                        TAG_STYLES[tag] ?? 'bg-white/10 text-white/50'
                      )}
                    >
                      {TAG_LABELS[tag] ?? tag}
                    </span>
                  ))}
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="mx-5 line-clamp-2 text-sm leading-relaxed text-white/40">{tool.desc}</p>
        </Link>

        {/* Footer with price + actions */}
        <div className="flex items-center justify-between p-5 pt-3">
          <div className="flex items-center gap-2">
            {/* Price tag */}
            {tool.valueTag && (
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[10px] font-medium',
                  VALUE_TAG_STYLES[tool.valueTag] || 'bg-white/10 text-white/50'
                )}
              >
                {tool.valueTag}
              </span>
            )}
            {priceLabel && !tool.valueTag && (
              <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/40">
                {priceLabel}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleFavorite(tool.id)}
              className="text-white/20 transition-colors hover:text-red-400"
            >
              <Heart
                className={cn('h-4 w-4', isFavorite && 'fill-red-400 text-red-400')}
              />
            </button>
            <a
              href={tool.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => { e.stopPropagation(); trackClick(tool.id, slug, 'card'); }}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium',
                'border border-white/10 bg-white/5 text-white/60',
                'transition-all hover:border-blue-500/30 hover:bg-blue-500/10 hover:text-blue-400'
              )}
            >
              访问
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
