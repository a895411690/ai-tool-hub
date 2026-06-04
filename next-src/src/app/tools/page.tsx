'use client';

import { useEffect } from 'react';
import { useToolStore } from '@/stores/useToolStore';
import { CategoryFilter } from '@/components/tools/CategoryFilter';
import { SortBar } from '@/components/tools/SortBar';
import { ToolGrid } from '@/components/tools/ToolGrid';
import { SearchBar } from '@/components/hero/SearchBar';

export default function ToolsBrowsePage() {
  const { loadData, dataLoaded } = useToolStore();

  useEffect(() => {
    if (!dataLoaded) loadData();
  }, [dataLoaded, loadData]);

  return (
    <div className="mx-auto max-w-7xl px-6 pt-24 pb-16">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">全部工具</h1>
        <p className="mt-1 text-sm text-white/40">浏览全部 AI 工具，按分类和排序筛选</p>
      </div>

      <div className="mb-6">
        <SearchBar />
      </div>

      <div className="mb-4">
        <CategoryFilter />
      </div>

      <div className="mb-6">
        <SortBar />
      </div>

      <ToolGrid />
    </div>
  );
}
