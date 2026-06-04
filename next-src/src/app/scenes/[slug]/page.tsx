'use client';


import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Presentation, Code, Video, Palette, PenTool, Music, Search, Bot,
} from 'lucide-react';
import { useToolStore } from '@/stores/useToolStore';
import { ToolCard } from '@/components/tools/ToolCard';
import type { Tool } from '@/types/tool';

const sceneIcons: Record<string, React.ElementType> = {
  presentation: Presentation, code: Code, video: Video, palette: Palette,
  'pen-tool': PenTool, music: Music, search: Search, bot: Bot,
};

const sceneMeta: Record<string, { name: string; icon: string; desc: string }> = {
  ppt: { name: '我要做PPT', icon: 'presentation', desc: '用 AI 快速生成精美演示文稿' },
  coding: { name: '我要写代码', icon: 'code', desc: 'AI 辅助编程，提升开发效率' },
  video: { name: '我要做短视频', icon: 'video', desc: 'AI 视频生成与编辑工具' },
  drawing: { name: '我要画图', icon: 'palette', desc: 'AI 绘画与图像生成' },
  copywriting: { name: '我要写文案', icon: 'pen-tool', desc: 'AI 文案写作与优化' },
  music: { name: '我要做音乐', icon: 'music', desc: 'AI 音乐创作与编曲' },
  research: { name: '我要做调研', icon: 'search', desc: 'AI 搜索与深度研究' },
  agent: { name: '我要建AI应用', icon: 'bot', desc: 'AI 智能体与应用构建平台' },
};

export default function SceneDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { tools, isLoading, loadData, dataLoaded } = useToolStore();
  const [sceneTools, setSceneTools] = useState<Tool[]>([]);
  const meta = sceneMeta[slug] || { name: slug, icon: 'bot', desc: '' };

  useEffect(() => {
    if (!dataLoaded) loadData();
  }, [dataLoaded, loadData]);

  useEffect(() => {
    if (tools.length === 0) return;
    fetch('/data/scenes.json')
      .then((res) => res.json())
      .then((data) => {
        const scene = data.scenes?.find((s: { id: string }) => s.id === slug);
        if (scene) {
          const matched = scene.toolIds
            .map((id: number) => tools.find((t: Tool) => t.id === id))
            .filter(Boolean) as Tool[];
          setSceneTools(matched);
        }
      })
      .catch(console.error);
  }, [tools, slug]);

  const Icon = sceneIcons[meta.icon] || Bot;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b border-white/10 bg-gray-950/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-6 py-4">
          <Link
            href="/scenes"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-white/50 transition-colors hover:bg-white/5 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-blue-500/20">
              <Icon className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">{meta.name}</h1>
              <p className="text-xs text-white/40">{meta.desc}</p>
            </div>
          </div>
          <div className="flex-1" />
          <span className="rounded-full bg-white/5 px-3 py-1 text-sm text-white/50">
            {sceneTools.length} 款工具
          </span>
        </div>
      </div>

      {/* Tool grid */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        {sceneTools.length === 0 && !isLoading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <p className="text-lg text-white/50">该场景暂无工具推荐</p>
            <Link href="/scenes" className="text-sm text-violet-400 hover:underline">
              返回场景列表
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sceneTools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
