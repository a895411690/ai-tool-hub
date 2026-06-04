'use client';

import { Sparkles } from 'lucide-react';
import { useToolStore } from '@/stores/useToolStore';
import { cn } from '@/lib/utils';
import { SearchBar } from './SearchBar';

export function HeroSection() {
  const tools = useToolStore((s) => s.tools);

  return (
    <section className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#0a0a0a]">
      {/* Grid pattern background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Radial glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 blur-3xl" />

      <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center gap-6 px-4 text-center">
        {/* Badge */}
        <div
          className={cn(
            'inline-flex items-center gap-2 rounded-full border border-white/10',
            'bg-white/5 px-4 py-1.5 text-sm text-white/70 backdrop-blur-sm'
          )}
        >
          <Sparkles className="h-4 w-4 text-blue-400" />
          <span>AI Tool Hub · 智能工具导航</span>
        </div>

        {/* Title */}
        <h1 className="text-5xl font-bold leading-tight tracking-tight text-white md:text-6xl lg:text-7xl">
          发现最佳{' '}
          <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            AI 工具
          </span>
        </h1>

        {/* Subtitle */}
        <p className="max-w-2xl text-lg text-white/50 md:text-xl">
          一站式 AI 工具聚合导航平台，帮你快速发现优质 AI 工具
        </p>

        {/* Stats */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-white/40">
          <span>
            <span className="font-semibold text-white/80">{tools.length}+</span> 优质 AI 工具
          </span>
          <span className="h-4 w-px bg-white/10" />
          <span>
            完全 <span className="font-semibold text-emerald-400">免费</span>
          </span>
          <span className="h-4 w-px bg-white/10" />
          <span>
            持续 <span className="font-semibold text-blue-400">更新收录</span>
          </span>
        </div>

        {/* Search Bar */}
        <div className="mt-4 w-full max-w-2xl">
          <SearchBar />
        </div>
      </div>
    </section>
  );
}
