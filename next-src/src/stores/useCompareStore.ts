import { create } from 'zustand';
import type { Tool } from '@/types/tool';

interface CompareStore {
  selectedTools: Tool[];
  addTool: (tool: Tool) => void;
  removeTool: (toolId: number) => void;
  clearAll: () => void;
  isSelected: (toolId: number) => boolean;
}

export const useCompareStore = create<CompareStore>((set, get) => ({
  selectedTools: [],

  addTool: (tool) => {
    const { selectedTools } = get();
    if (selectedTools.length >= 4) return;
    if (selectedTools.find(t => t.id === tool.id)) return;
    set({ selectedTools: [...selectedTools, tool] });
  },

  removeTool: (toolId) => {
    set({ selectedTools: get().selectedTools.filter(t => t.id !== toolId) });
  },

  clearAll: () => set({ selectedTools: [] }),

  isSelected: (toolId) => get().selectedTools.some(t => t.id === toolId),
}));
