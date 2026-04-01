// Import state
import { allTools, categories, currentCategory, searchHistory, favorites } from './app.js';

// Render Categories
function renderCategories() {
    const container = document.getElementById('categoryFilter');
    container.setAttribute('role', 'navigation');
    container.setAttribute('aria-label', '工具分类');
    
    const buttons = categories.map(cat => 
        `<button class="category-btn px-5 py-2 rounded-full glass text-sm font-medium transition-all" data-category="${cat.id}" onclick="filterCategory('${cat.id}')" aria-label="查看${cat.name}分类的工具" tabindex="0">${cat.name}</button>`
    ).join('');
    container.innerHTML = '<button class="category-btn active px-5 py-2 rounded-full glass text-sm font-medium transition-all" data-category="all" onclick="filterCategory(\'all\')" aria-label="查看全部工具" tabindex="0">全部</button>' + buttons;
}

// Render Tools
function renderTools(tools) {
    const grid = document.getElementById('toolsGrid');
    grid.setAttribute('role', 'grid');
    grid.setAttribute('aria-label', 'AI工具列表');
    
    grid.innerHTML = tools.map(tool => `
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
}

// Filter Category with memory
function filterCategory(category) {
    window.currentCategory = category;
    localStorage.setItem('ai-tool-hub-filter-category', category);
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.category === category) btn.classList.add('active');
    });
    const filtered = category === 'all' ? allTools : allTools.filter(t => t.category === category);
    renderTools(filtered);
}

// Load saved filters
function loadSavedFilters() {
    const savedCategory = localStorage.getItem('ai-tool-hub-filter-category');
    if (savedCategory && savedCategory !== 'all') {
        setTimeout(() => filterCategory(savedCategory), 500);
    }
}

// Search with History
function setupSearch() {
    const searchInput = document.getElementById('mainSearch');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        document.getElementById('clearSearchBtn').classList.toggle('hidden', !term);
        
        const filtered = allTools.filter(tool => 
            tool.name.toLowerCase().includes(term) || 
            tool.desc.toLowerCase().includes(term)
        );
        renderTools(filtered);
        
        if (term && !searchHistory.includes(term)) {
            searchHistory.unshift(term);
            searchHistory.splice(10);
            localStorage.setItem('ai-tool-hub-search-history', JSON.stringify(searchHistory));
        }
    });

    searchInput.addEventListener('focus', () => {
        if (searchHistory.length > 0) {
            document.getElementById('searchHistory').innerHTML = searchHistory.map(h => 
                `<div class="px-4 py-2 hover:bg-primary/20 cursor-pointer flex items-center gap-2" onclick="setSearch('${h}')">
                    <i class="fas fa-history text-gray-500 text-sm"></i><span>${h}</span>
                </div>`
            ).join('');
            document.getElementById('searchHistory').classList.add('show');
        }
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-history') && !e.target.closest('#mainSearch')) {
            document.getElementById('searchHistory').classList.remove('show');
        }
    });
}

function setSearch(term) {
    const searchInput = document.getElementById('mainSearch');
    if (!searchInput) return;
    searchInput.value = term;
    document.getElementById('searchHistory').classList.remove('show');
    searchInput.dispatchEvent(new Event('input'));
}

function clearSearch() {
    const searchInput = document.getElementById('mainSearch');
    if (!searchInput) return;
    searchInput.value = '';
    document.getElementById('clearSearchBtn').classList.add('hidden');
    renderTools(allTools);
}

// Export functions
export { renderCategories, renderTools, filterCategory, loadSavedFilters, setSearch, clearSearch, setupSearch };
