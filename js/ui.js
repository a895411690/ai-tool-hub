// Import state from centralized state module (no circular dependency!)
import state, { getCategoryName, isFavorite, addToSearchHistory } from './state.js';
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
    
    const buttons = state.categories.map(cat => 
        `<button class="category-btn px-5 py-2 rounded-full glass text-sm font-medium transition-all" data-category="${escapeAttr(cat.id)}" onclick="filterCategory('${escapeAttr(cat.id)}')" aria-label="查看${escapeHtml(cat.name)}分类的工具" tabindex="0">${escapeHtml(cat.name)}</button>`
    ).join('');
    
    container.innerHTML = '<button class="category-btn active px-5 py-2 rounded-full glass text-sm font-medium transition-all" data-category="all" onclick="filterCategory(\'all\')" aria-label="查看全部工具" tabindex="0">全部</button>' + buttons;
}

/**
 * Create a tool card element with modern design
 * @param {Object} tool - Tool data object
 * @returns {string} HTML string for the tool card
 */
function createToolCard(tool) {
    const categoryName = getCategoryName(tool.category);
    const favorite = isFavorite(tool.id);
    
    // Generate tags HTML
    let tagsHtml = '';
    if (tool.tags) {
        if (tool.tags.includes('free')) tagsHtml += '<span class="tag tag-free">免费</span>';
        else if (tool.tags.includes('vip')) tagsHtml += '<span class="tag tag-vip">VIP</span>';
        if (tool.tags.includes('new')) tagsHtml += '<span class="tag tag-new">NEW</span>';
        if (tool.tags.includes('hot')) tagsHtml += '<span class="tag tag-hot">热门</span>';
    }
    
    // Generate toolTags HTML (domestic/overseas)
    if (tool.toolTags) {
        if (tool.toolTags.includes('国产')) tagsHtml += '<span class="tag tag-domestic">国产</span>';
        if (tool.toolTags.includes('海外')) tagsHtml += '<span class="tag tag-overseas">海外</span>';
    }
    
    return `
        <div class="tool-card" onclick="showToolDetail(${tool.id})">
            <div class="card-header">
                <div class="card-icon">
                    <i class="fas ${escapeAttr(tool.icon)}"></i>
                </div>
                <div class="card-actions">
                    ${tool.tags?.includes('new') ? '' : ''}
                    <button onclick="toggleFavorite(${tool.id}, event)" class="favorite-btn ${favorite ? 'active' : ''}" aria-label="${favorite ? '取消收藏' : '收藏'} ${escapeHtml(tool.name)}">
                        <i class="fas fa-star"></i>
                    </button>
                </div>
            </div>
            <h3 class="card-title">${escapeHtml(tool.name)}</h3>
            <p class="card-desc">${escapeHtml(tool.desc)}</p>
            <div class="card-tags">
                ${tagsHtml}
            </div>
            <div class="card-footer">
                <span class="card-category">${escapeHtml(categoryName)}</span>
                <button onclick="openTool(${tool.id}, '${escapeAttr(tool.url)}', event)" class="card-action-btn">
                    使用
                </button>
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
    state.currentCategory = category;
    localStorage.setItem('ai-tool-hub-filter-category', category);
    
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.category === category) btn.classList.add('active');
    });
    
    // Use getTools function to filter
    const filtered = category === 'all' ? state.tools : state.tools.filter(t => t.category === category);
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

/**
 * Setup search functionality with debounced input handling
 */
function setupSearch() {
    const searchInput = document.getElementById('mainSearch');
    if (!searchInput) return;
    
    let searchDebounceTimeout = null;
    
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const clearSearchBtn = document.getElementById('clearSearchBtn');
        if (clearSearchBtn) clearSearchBtn.classList.toggle('hidden', !term);
        
        // Clear previous debounce timer
        if (searchDebounceTimeout) {
            clearTimeout(searchDebounceTimeout);
        }
        
        // Debounced search execution
        searchDebounceTimeout = setTimeout(() => {
            const filtered = state.tools.filter(tool => 
                tool.name.toLowerCase().includes(term) || 
                tool.desc.toLowerCase().includes(term)
            );
            renderTools(filtered);
            
            // Save search history using state function
            if (term) {
                addToSearchHistory(term);
            }
        }, SEARCH_DEBOUNCE_TIME);
    });

    searchInput.addEventListener('focus', () => {
        if (state.searchHistory.length > 0) {
            const searchHistoryEl = document.getElementById('searchHistory');
            if (searchHistoryEl) {
                searchHistoryEl.innerHTML = state.searchHistory.map(h => 
                    `<div class="px-4 py-2 hover:bg-primary/20 cursor-pointer flex items-center gap-2" onclick="setSearch('${escapeAttr(h)}')">
                        <i class="fas fa-history text-gray-500 text-sm"></i><span>${escapeHtml(h)}</span>
                    </div>`
                ).join('');
                searchHistoryEl.classList.add('show');
            }
        }
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-history') && !e.target.closest('#mainSearch')) {
            const searchHistoryEl = document.getElementById('searchHistory');
            if (searchHistoryEl) searchHistoryEl.classList.remove('show');
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
    const searchHistoryEl = document.getElementById('searchHistory');
    if (searchHistoryEl) searchHistoryEl.classList.remove('show');
    searchInput.dispatchEvent(new Event('input'));
}

/**
 * Clear search input and reset tool display
 */
function clearSearch() {
    const searchInput = document.getElementById('mainSearch');
    if (!searchInput) return;
    searchInput.value = '';
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    if (clearSearchBtn) clearSearchBtn.classList.add('hidden');
    renderTools(state.tools);
}

// Export functions
export { renderCategories, renderTools, filterCategory, loadSavedFilters, setSearch, clearSearch, setupSearch };
