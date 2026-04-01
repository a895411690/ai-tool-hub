// Import functions
import { showToast } from './utils.js';

// Global State
let allTools = [];
let categories = [];
let currentCategory = 'all';
let searchHistory = JSON.parse(localStorage.getItem('ai-tool-hub-search-history') || '[]');
let favorites = JSON.parse(localStorage.getItem('ai-tool-hub-favorites') || '[]');

// Initialize
// Note: loadTools is called from main.js


// Load Tools
async function loadTools() {
    console.log('loadTools function called');
    try {
        console.log('开始加载工具...');
        const response = await fetch('tools.json');
        console.log('fetch response:', response);
        
        if (!response.ok) {
            throw new Error(`网络请求失败: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('工具数据加载成功:', data);
        
        if (!data || !Array.isArray(data.tools) || !Array.isArray(data.categories)) {
            throw new Error('工具数据结构不正确');
        }
        
        allTools = data.tools;
        categories = data.categories;
        console.log('工具数据已更新:', { allTools: allTools.length, categories: categories.length });
        
        console.log('开始渲染分类...');
        const container = document.getElementById('categoryFilter');
        console.log('categoryFilter element:', container);
        if (container) {
            container.setAttribute('role', 'navigation');
            container.setAttribute('aria-label', '工具分类');
            
            const buttons = categories.map(cat => 
                `<button class="category-btn px-5 py-2 rounded-full glass text-sm font-medium transition-all" data-category="${cat.id}" onclick="filterCategory('${cat.id}')" aria-label="查看${cat.name}分类的工具" tabindex="0">${cat.name}</button>`
            ).join('');
            container.innerHTML = '<button class="category-btn active px-5 py-2 rounded-full glass text-sm font-medium transition-all" data-category="all" onclick="filterCategory(\'all\')" aria-label="查看全部工具" tabindex="0">全部</button>' + buttons;
            console.log('分类渲染成功');
        } else {
            console.error('未找到categoryFilter元素');
        }
        
        console.log('开始渲染工具...');
        const grid = document.getElementById('toolsGrid');
        console.log('toolsGrid element:', grid);
        if (grid) {
            grid.setAttribute('role', 'grid');
            grid.setAttribute('aria-label', 'AI工具列表');
            
            grid.innerHTML = allTools.map(tool => `
                <div class="glass-card rounded-2xl p-5 group cursor-pointer" onclick="showToolDetail(${tool.id})" role="gridcell" aria-label="${tool.name} - ${tool.desc}" tabindex="0">
                    <div class="flex items-start justify-between mb-3">
                        <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                            <i class="fas ${tool.icon} text-xl text-primary" aria-hidden="true"></i>
                        </div>
                        <div class="flex gap-2">
                            ${tool.tags?.includes('new') ? '<span class="tag-new text-xs px-2 py-0.5 rounded-full" aria-label="新工具">NEW</span>' : ''}
                            <button onclick="toggleFavorite(${tool.id}, event)" class="text-gray-500 hover:text-yellow-400 transition-all ${favorites.includes(tool.id) ? 'text-yellow-400' : ''}" aria-label="${favorites.includes(tool.id) ? '取消收藏' : '收藏'} ${tool.name}" tabindex="0">
                                <i class="fas fa-star" aria-hidden="true"></i>
                            </button>
                        </div>
                    </div>
                    <h3 class="font-bold text-white mb-1">${tool.name}</h3>
                    <p class="text-gray-400 text-sm mb-3 line-clamp-2">${tool.desc}</p>
                    <div class="flex flex-wrap gap-1 mb-3">
                        ${tool.tags?.includes('free') ? '<span class="tag-stable text-xs px-2 py-0.5 rounded" aria-label="免费工具">免费</span>' : ''}
                        ${tool.tags?.includes('hot') ? '<span class="tag-recommended text-xs px-2 py-0.5 rounded" aria-label="热门工具">热门</span>' : ''}
                    </div>
                    <div class="flex items-center justify-between">
                        <span class="text-xs text-gray-500">${categories.find(c => c.id === tool.category)?.name}</span>
                        <button onclick="openTool(${tool.id}, '${tool.url}', event)" class="px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-secondary text-white text-sm hover:shadow-lg transition-all" aria-label="使用${tool.name}" tabindex="0">使用</button>
                    </div>
                </div>
            `).join('');
            console.log('工具渲染成功');
        } else {
            console.error('未找到toolsGrid元素');
        }
        
        console.log('开始隐藏加载状态...');
        const loadingState = document.getElementById('loadingState');
        console.log('loadingState element:', loadingState);
        if (loadingState) {
            loadingState.classList.add('hidden');
            console.log('加载状态已隐藏');
            
            // 显示加载成功消息
            const successMessage = document.createElement('div');
            successMessage.className = 'text-center py-4';
            successMessage.innerHTML = '<p class="text-green-500">加载成功！</p>';
            document.getElementById('toolsGrid').parentNode.insertBefore(successMessage, document.getElementById('toolsGrid'));
        } else {
            console.error('未找到loadingState元素');
        }
    } catch (error) {
        console.error('加载工具失败:', error);
        showToast(`加载失败: ${error.message}`);
        
        // Show error state
        const loadingState = document.getElementById('loadingState');
        if (loadingState) {
            loadingState.innerHTML = `
                <div class="text-center">
                    <i class="fas fa-exclamation-circle text-red-500 text-4xl mb-4"></i>
                    <h3 class="text-xl font-bold mb-2">加载失败</h3>
                    <p class="text-gray-400 mb-4">${error.message}</p>
                    <button onclick="loadTools()" class="px-6 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:shadow-lg transition-all">
                        重试
                    </button>
                </div>
            `;
        }
    }
}

// Export state and functions
export { allTools, categories, currentCategory, searchHistory, favorites, loadTools };
