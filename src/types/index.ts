// TypeScript 类型定义

// 工具标签
export interface ToolTag {
  id: string;
  name: string;
  color?: string;
}

// 工具分类
export interface Category {
  id: string;
  name: string;
  icon: string;
}

// AI工具
export interface Tool {
  id: number;
  name: string;
  category: string;
  icon: string;
  desc: string;
  description?: string;
  tags: string[];
  toolTags: string[];
  url: string;
  updateTime?: string;
  status?: 'stable' | 'beta' | 'deprecated';
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  platform?: string[];
  relatedTools?: number[];
  rating?: number;
  usage?: number;
}

// 提示词分类
export interface PromptCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
}

// AI提示词
export interface Prompt {
  id: number;
  title: string;
  category: string;
  description: string;
  content: string;
  tags: string[];
  author: string;
  usage: number;
  rating: number;
}

// 应用状态
export interface AppState {
  allTools: Tool[];
  allPrompts: Prompt[];
  categories: Category[];
  promptCategories: PromptCategory[];
  currentCategory: string;
  currentPromptCategory: string;
  searchQuery: string;
  favorites: number[];
  promptFavorites: number[];
  compareList: number[];
  recentTools: number[];
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

// 用户
export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  provider: 'github' | 'google';
}

// 工具数据
export interface ToolsData {
  version: string;
  lastUpdated: string;
  categories: Category[];
  tools: Tool[];
}

// 提示词数据
export interface PromptsData {
  version: string;
  categories: PromptCategory[];
  prompts: Prompt[];
}

// 主题
export interface Topic {
  id: string;
  name: string;
  description: string;
  icon: string;
  tools: number[];
}

// 主题数据
export interface TopicsData {
  version: string;
  topics: Topic[];
}
