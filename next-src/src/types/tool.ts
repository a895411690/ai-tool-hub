export interface PricingPlan {
  plan: string;
  price: number;
  unit: string;
  quota: string;
  highlight: boolean;
}

export interface Tool {
  id: number;
  name: string;
  category: string;
  categories: string[];
  icon: string;
  desc: string;
  tags: string[];
  toolTags: string[];
  url: string;
  status?: string;
  platforms?: string[];
  difficulty?: string;
  updateTime?: string;
  pricing?: PricingPlan[];
  valueTag?: string;
  scenes?: string[];
  highlights?: string[];
  platform?: string[];
  relatedTools?: number[];
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface Scene {
  id: string;
  name: string;
  icon: string | React.ReactNode;
  description: string;
  toolIds: number[];
}

export interface SceneData {
  scenes: Scene[];
  sceneToolMapping: Record<string, string[]>;
}

export interface ToolsData {
  version: string;
  lastUpdated: string;
  categories: Category[];
  tools: Tool[];
}

export type SortOption = 'default' | 'hot' | 'free-first' | 'domestic' | 'name-asc' | 'name-desc' | 'popular';

export interface FilterState {
  category: string;
  sort: SortOption;
  searchTerm: string;
  advancedFilters: {
    price: string[];
    origin: string[];
    status: string[];
  };
}
