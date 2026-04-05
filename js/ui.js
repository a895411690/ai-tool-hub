// Import state and security utilities
import { allTools, categories, currentCategory, searchHistory, favorites } from './app.js';
import { escapeHtml, escapeAttr, MAX_SEARCH_HISTORY, SEARCH_DEBOUNCE_TIME } from './utils.js';

/**
 * Render category filter buttons
 * Creates clickable category buttons for filtering tools
 */
function renderCategories() {
    const container = document.getElementById('categoryFilter');
    if (!container) return;
    
    container.setAttribute('role', 'navigation');
    container.setAttribute('aria-label', '工具分类');
    
    const buttons = categories.map(cat => 
        `<button class="category-btn px-5 py-2 rounded-full glass text-sm font-medium transition-all" data-category="${escapeAttr(cat.id)}" onclick="filterCategory('${escapeAttr(cat.id)}')" aria-label="查看${escapeHtml(cat.name)}分类的工具" tabindex="0">${escapeHtml(cat.name)}</button>`
    ).join('');
    
    container.innerHTML = '<button class="category-btn active px-5 py-2 rounded-full glass text-sm font-medium transition-all" data-category="all" onclick="filterCategory(\'all\')" aria-label="查看全部工具" tabindex="0">全部</button>' + buttons;
}

/**
 * Create a tool card element with XSS protection
 * @param {Object} tool - Tool data object
 * @returns {string} HTML string for the tool card
 */
function createToolCard(tool) {
    const categoryName = categories.find(c => c.id === tool.category)?.name || '';
    const isFavorite = favorites.includes(tool.id);
    
    return `
        <div class="glass-card rounded-2xl p-5 group cursor-pointer" onclick="showToolDetail(${tool.id})" role="gridcell" aria-label="${escapeHtml(tool.name)} - ${escapeHtml(tool.desc)}" tabindex="0">
            <div class="flex items-start justify-between mb-3">
                <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                    <i class="fas ${escapeAttr(tool.icon)} text-xl text-primary" aria-hidden="true"></i>
                </div>
                <div class="flex gap-2">
                    ${tool.tags?.includes('new') ? '<span class="tag-new text-xs px-2 py-0.5 rounded-full" aria-label="新工具">NEW</span>' : ''}
                    <button onclick="toggleFavorite(${tool.id}, event)" class="text-gray-500 hover:text-yellow-400 transition-all ${isFavorite ? 'text-yellow-400' : ''}" aria-label="${isFavorite ? '取消收藏' : '收藏'} ${escapeHtml(tool.name)}" tabindex="0">
                        <i class="fas fa-star" aria-hidden="true"></i>
                    </button>
                </div>
            </div>
            <h3 class="font-bold text-white mb-1">${escapeHtml(tool.name)}</h3>
            <p class="text-gray-400 text-sm mb-3 line-clamp-2">${escapeHtml(tool.desc)}</p>
            <div class="flex flex-wrap gap-1 mb-3">
                ${tool.tags?.includes('free') ? '<span class="tag-stable text-xs px-2 py-0.5 rounded" aria-label="免费工具">免费</span>' : ''}
                ${tool.tags?.includes('hot') ? '<span class="tag-recommended text-xs px-2 py-0.5 rounded" aria-label="热门工具">热门</span>' : ''}
            </div>
            <div class="flex items-center justify-between">
                <span class="text-xs text-gray-500">${escapeHtml(categoryName)}</span>
                <button onclick="openTool(${tool.id}, '${escapeAttr(tool.url)}', event)" class="px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-secondary text-white text-sm hover:shadow-lg transition-all" aria-label="使用${escapeHtml(tool.name)}" tabindex="0">使用</button>
            </div>
        </div>
    `;
}

/**
 * Render tools grid with DocumentFragment for performance optimization
 * @param {Array} tools - Array of tool objects to render
 */
function renderTools(tools) {
    const grid = document.getElementById('toolsGrid');
    if (!grid) return;
    
    grid.setAttribute('role', 'grid');
    grid.setAttribute('aria-label', 'AI工具列表');
    
    // Use DocumentFragment to minimize reflows
    const fragment = document.createDocumentFragment();
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = tools.map(createToolCard).join('');
    
    while (tempDiv.firstChild) {
        fragment.appendChild(tempDiv.firstChild);
    }
    
    grid.innerHTML = '';
    grid.appendChild(fragment);
}

/**
 * Filter tools by category and update UI
 * @param {string} category - Category ID to filter by ('all' for no filter)
 */
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

/**
 * Load saved filter preferences from localStorage
 */
function loadSavedFilters() {
    const savedCategory = localStorage.getItem('ai-tool-hub-filter-category');
    if (savedCategory && savedCategory !== 'all') {
        setTimeout(() => filterCategory(savedCategory), 500);
    }
}

// Debounce timer for localStorage writes
let localStorageWriteTimeout = null;

/**
 * Debounced localStorage write to optimize performance
 * @param {string} key - localStorage key
 * @param {string} value - Value to store
 */
function debouncedLocalStorageWrite(key, value) {
    if (localStorageWriteTimeout) {
        clearTimeout(localStorageWriteTimeout);
    }
    localStorageWriteTimeout = setTimeout(() => {
        localStorage.setItem(key, value);
        localStorageWriteTimeout = null;
    }, 100); // 100ms debounce for localStorage writes
}

/**
 * Setup search functionality with debounced input handling
 */
function setupSearch() {
    const searchInput = document.getElementById('mainSearch');
    if (!searchInput) return;
    
    let searchDebounceTimeout = null;
    
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        document.getElementById('clearSearchBtn').classList.toggle('hidden', !term);
        
        // Clear previous debounce timer
        if (searchDebounceTimeout) {
            clearTimeout(searchDebounceTimeout);
        }
        
        // Debounced search execution
        searchDebounceTimeout = setTimeout(() => {
            const filtered = allTools.filter(tool => 
                tool.name.toLowerCase().includes(term) || 
                tool.desc.toLowerCase().includes(term)
            );
            renderTools(filtered);
            
            // Save search history with debounce
            if (term && !searchHistory.includes(term)) {
                searchHistory.unshift(term);
                searchHistory.splice(MAX_SEARCH_HISTORY);
                debouncedLocalStorageWrite('ai-tool-hub-search-history', JSON.stringify(searchHistory));
            }
        }, SEARCH_DEBOUNCE_TIME);
    });

    searchInput.addEventListener('focus', () => {
        if (searchHistory.length > 0) {
            document.getElementById('searchHistory').innerHTML = searchHistory.map(h => 
                `<div class="px-4 py-2 hover:bg-primary/20 cursor-pointer flex items-center gap-2" onclick="setSearch('${escapeAttr(h)}')">
                    <i class="fas fa-history text-gray-500 text-sm"></i><span>${escapeHtml(h)}</span>
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

/**
 * Set search input value and trigger search
 * @param {string} term - Search term to set
 */
function setSearch(term) {
    const searchInput = document.getElementById('mainSearch');
    if (!searchInput) return;
    searchInput.value = term;
    document.getElementById('searchHistory').classList.remove('show');
    searchInput.dispatchEvent(new Event('input'));
}

/**
 * Clear search input and reset tool display
 */
function clearSearch() {
    const searchInput = document.getElementById('mainSearch');
    if (!searchInput) return;
    searchInput.value = '';
    document.getElementById('clearSearchBtn').classList.add('hidden');
    renderTools(allTools);
}

// Export functions
export { renderCategories, renderTools, filterCategory, loadSavedFilters, setSearch, clearSearch, setupSearch };
