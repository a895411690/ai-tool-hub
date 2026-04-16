// 提示词管理
import state from './state.js';
import { showToast } from './ui.js';

export async function loadPrompts() {
    try {
        const response = await fetch('./prompts.json');
        if (!response.ok) throw new Error('Failed to load prompts');
        const data = await response.json();
        state.allPrompts = data.prompts;
        state.promptCategories = data.categories;
    } catch (error) {
        console.error('Failed to load prompts:', error);
    }
}

export function showPromptsPage() {
    const page = document.getElementById('promptsPage');
    if (page) page.classList.add('show');
    renderPromptCategories();
    renderPrompts(state.allPrompts);
}

export function closePromptsPage() {
    const page = document.getElementById('promptsPage');
    if (page) page.classList.remove('show');
}

export function renderPromptCategories() {
    const container = document.getElementById('promptCategoryFilter');
    if (!container) return;
    const html = `
        <button class="prompt-cat-btn active px-4 py-2 rounded-full glass text-sm transition-all" data-category="all" onclick="filterPromptCategory('all')">全部</button>
        ${state.promptCategories.map(cat => `
            <button class="prompt-cat-btn px-4 py-2 rounded-full glass text-sm transition-all" data-category="${cat.id}" onclick="filterPromptCategory('${cat.id}')">
                <i class="fas ${cat.icon} mr-1"></i>${cat.name}
            </button>
        `).join('')}
    `;
    container.innerHTML = html;
}

export function renderPrompts(prompts) {
    const grid = document.getElementById('promptsGrid');
    const emptyEl = document.getElementById('promptEmptyState');
    if (!grid && !emptyEl) return;
    
    if (!prompts || prompts.length === 0) {
        if (grid) grid.classList.add('hidden');
        if (emptyEl) emptyEl.classList.remove('hidden');
        return;
    }
    
    if (grid) {
        grid.classList.remove('hidden');
        if (emptyEl) emptyEl.classList.add('hidden');
    }
    
    grid.innerHTML = prompts.map(prompt => {
        const cat = state.promptCategories.find(c => c.id === prompt.category);
        const isFav = state.promptFavorites.includes(prompt.id);
        return `
            <div class="glass-card rounded-2xl p-5 group cursor-pointer hover:neon-border transition-all" onclick="showPromptDetail(${prompt.id})">
                <div class="flex items-start justify-between mb-3">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-gradient-to-br ${cat?.color || 'from-gray-500 to-gray-600'} flex items-center justify-center">
                            <i class="fas ${cat?.icon || 'fa-wand-magic-sparkles'} text-white text-sm"></i>
                        </div>
                        <div>
                            <h3 class="font-semibold text-sm line-clamp-1">${prompt.title}</h3>
                            <p class="text-xs text-gray-500">${cat?.name || prompt.category}</p>
                        </div>
                    </div>
                    <button onclick="event.stopPropagation(); togglePromptFavorite(${prompt.id})" class="text-gray-500 hover:text-red-500 transition-all">
                        <i class="${isFav ? 'fas text-red-500' : 'far'} fa-heart"></i>
                    </button>
                </div>
                <p class="text-sm text-gray-400 mb-3 line-clamp-2">${prompt.description}</p>
                <div class="flex items-center justify-between">
                    <span class="text-xs text-gray-500">${prompt.tags?.join(', ') || ''}</span>
                    <button onclick="event.stopPropagation(); copyPrompt(${prompt.id})" class="text-xs text-indigo-400 hover:underline">
                        复制
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

export function filterPromptCategory(category) {
    state.currentPromptCategory = category;
    document.querySelectorAll('.prompt-cat-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.category === category);
    });
    const filtered = category === 'all' ? state.allPrompts : state.allPrompts.filter(p => p.category === category);
    renderPrompts(filtered);
}

export function togglePromptFavorite(promptId) {
    if (state.promptFavorites.includes(promptId)) {
        state.promptFavorites = state.promptFavorites.filter(id => id !== promptId);
    } else {
        state.promptFavorites.push(promptId);
    }
    localStorage.setItem('promptFavorites', JSON.stringify(state.promptFavorites));
    filterPromptCategory(state.currentPromptCategory);
}

export function copyPrompt(promptId) {
    const prompt = state.allPrompts.find(p => p.id === promptId);
    if (prompt) {
        navigator.clipboard.writeText(prompt.content);
        showToast('提示词已复制到剪贴板');
    }
}

export function showPromptDetail(promptId) {
    const prompt = state.allPrompts.find(p => p.id === promptId);
    if (!prompt) return;
    
    const page = document.getElementById('detailPage');
    const content = document.getElementById('detailContent');
    if (!page || !content) return;
    const cat = state.promptCategories.find(c => c.id === prompt.category);
    
    content.innerHTML = `
        <div class="mb-6">
            <div class="flex items-center gap-3 mb-4">
                <div class="w-12 h-12 rounded-xl bg-gradient-to-br ${cat?.color || 'from-gray-500 to-gray-600'} flex items-center justify-center">
                    <i class="fas ${cat?.icon || 'fa-wand-magic-sparkles'} text-white text-lg"></i>
                </div>
                <div>
                    <h1 class="text-2xl font-bold">${prompt.title}</h1>
                    <p class="text-gray-500">${cat?.name || prompt.category}</p>
                </div>
            </div>
            <p class="text-gray-400 mb-4">${prompt.description}</p>
        </div>
        
        <div class="glass-card rounded-xl p-4 mb-6">
            <h3 class="font-semibold mb-3">提示词内容</h3>
            <pre class="text-sm text-gray-300 bg-black/30 p-4 rounded-lg overflow-x-auto">${prompt.content}</pre>
            <button onclick="copyPrompt(${prompt.id})" class="mt-3 w-full py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-sm font-medium hover:opacity-90 transition-all">
                复制提示词
            </button>
        </div>
        
        ${prompt.tags && prompt.tags.length > 0 ? `
            <div class="glass-card rounded-xl p-4 mb-6">
                <h3 class="font-semibold mb-2">标签</h3>
                <div class="flex flex-wrap gap-2">
                    ${prompt.tags.map(tag => `<span class="px-3 py-1 rounded-full glass text-sm">${tag}</span>`).join('')}
                </div>
            </div>
        ` : ''}
        
        ${prompt.examples && prompt.examples.length > 0 ? `
            <div class="glass-card rounded-xl p-4 mb-6">
                <h3 class="font-semibold mb-3">使用示例</h3>
                <div class="space-y-3">
                    ${prompt.examples.map(example => `
                        <div class="bg-black/20 rounded-lg p-3">
                            <p class="text-sm text-gray-400">${example}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : ''}
    `;
    
    page.classList.add('show');
}
