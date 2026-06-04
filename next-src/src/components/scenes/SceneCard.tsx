'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { trackClick } from '@/lib/api';

interface SceneCardProps {
  scene: {
    id: string;
    name: string;
    icon: React.ReactNode;
    description: string;
  };
}

export default function SceneCard({ scene }: SceneCardProps) {
  const handleClick = () => { trackClick(0, '__scene__', undefined, scene.id).catch(() => {}); };
  return (
    <Link href={`/scenes/${scene.id}`} onClick={handleClick}>
      <div
        className={cn(
          'group relative flex flex-col items-center gap-3 rounded-2xl p-6',
          'bg-white/5 backdrop-blur-sm border border-white/10',
          'transition-all duration-300',
          'hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(139,92,246,0.15)]',
          'hover:border-violet-500/30'
        )}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400 transition-colors group-hover:bg-violet-500/20">
          {scene.icon}
        </div>
        <h3 className="text-sm font-medium text-white/90">{scene.name}</h3>
        <p className="text-center text-xs text-white/50 leading-relaxed">{scene.description}</p>
      </div>
    </Link>
  );
}
