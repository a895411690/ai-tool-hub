'use client';


import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Presentation, Code, Video, Palette, PenTool, Music, Search, Bot,
  ArrowRight, Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToolStore } from '@/stores/useToolStore';

const sceneIcons: Record<string, React.ElementType> = {
  presentation: Presentation,
  code: Code,
  video: Video,
  palette: Palette,
  'pen-tool': PenTool,
  music: Music,
  search: Search,
  bot: Bot,
};

interface SceneWithCount {
  id: string;
  name: string;
  icon: string;
  description: string;
  toolCount: number;
}

const gradients = [
  'from-violet-500/20 to-blue-500/20',
  'from-cyan-500/20 to-emerald-500/20',
  'from-rose-500/20 to-orange-500/20',
  'from-pink-500/20 to-purple-500/20',
  'from-amber-500/20 to-yellow-500/20',
  'from-indigo-500/20 to-blue-500/20',
  'from-teal-500/20 to-green-500/20',
  'from-fuchsia-500/20 to-pink-500/20',
];

export default function ScenesPage() {
  const { loadData, dataLoaded } = useToolStore();
  const [scenes, setScenes] = useState<SceneWithCount[]>([
    { id: 'ppt', name: '我要做PPT', icon: 'presentation', description: '用 AI 快速生成精美演示文稿', toolCount: 0 },
    { id: 'coding', name: '我要写代码', icon: 'code', description: 'AI 辅助编程，提升开发效率', toolCount: 0 },
    { id: 'video', name: '我要做短视频', icon: 'video', description: 'AI 视频生成与编辑工具', toolCount: 0 },
    { id: 'drawing', name: '我要画图', icon: 'palette', description: 'AI 绘画与图像生成', toolCount: 0 },
    { id: 'copywriting', name: '我要写文案', icon: 'pen-tool', description: 'AI 文案写作与优化', toolCount: 0 },
    { id: 'music', name: '我要做音乐', icon: 'music', description: 'AI 音乐创作与编曲', toolCount: 0 },
    { id: 'research', name: '我要做调研', icon: 'search', description: 'AI 搜索与深度研究', toolCount: 0 },
    { id: 'agent', name: '我要建AI应用', icon: 'bot', description: 'AI 智能体与应用构建平台', toolCount: 0 },
  ]);

  useEffect(() => {
    if (!dataLoaded) loadData();
  }, [dataLoaded, loadData]);

  useEffect(() => {
    fetch('/data/scenes.json')
      .then((res) => res.json())
      .then((data) => {
        setScenes(prev =>
          prev.map(s => {
            const found = data.scenes?.find((d: { id: string; toolIds: number[] }) => d.id === s.id);
            return found ? { ...s, toolCount: found.toolIds.length } : s;
          })
        );
      })
      .catch(console.error);
  }, []);

  return (
    <div className="relative min-h-screen bg-gray-950 text-white"><div className="relative z-10">
        {/* Hero */}
        <section className="flex flex-col items-center justify-center px-6 pt-24 pb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-white/60 backdrop-blur-sm">
            <Layers className="h-4 w-4 text-cyan-400" />
            <span>按场景找工具</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
              你想做什么？
            </span>
          </h1>
          <p className="mt-4 max-w-xl text-lg text-white/50">
            选择你的使用场景，我们为你推荐最合适的 AI 工具
          </p>
        </section>

        {/* Scene grid */}
        <section className="mx-auto max-w-5xl px-6 pb-24">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {scenes.map((scene, idx) => {
              const Icon = sceneIcons[scene.icon] || Bot;
              return (
                      <Link
                  key={scene.id}
                  href={`/scenes/${scene.id}`}
                  className="group"
                >
                  <div
                    className={cn(
                      'relative overflow-hidden rounded-2xl border border-white/10',
                      'bg-white/[0.03] backdrop-blur-sm p-6',
                      'transition-all duration-300',
                      'hover:-translate-y-1 hover:border-white/20 hover:shadow-[0_8px_40px_rgba(139,92,246,0.1)]'
                    )}
                  >
                    {/* Gradient bg */}
                    <div
                      className={cn(
                        'pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br blur-3xl opacity-50',
                        gradients[idx]
                      )}
                    />

                    <div className="relative flex items-start gap-5">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/5 text-white/70 transition-colors group-hover:bg-white/10">
                        <Icon className="h-7 w-7" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-white/90 group-hover:text-white">
                          {scene.name}
                        </h3>
                        <p className="mt-1 text-sm text-white/40">{scene.description}</p>
                        <div className="mt-3 flex items-center gap-2">
                          <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-xs text-white/50">
                            {scene.toolCount} 款工具
                          </span>
                          <ArrowRight className="h-4 w-4 text-white/30 transition-transform group-hover:translate-x-1 group-hover:text-white/60" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
