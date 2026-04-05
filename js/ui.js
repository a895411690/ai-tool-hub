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
 * Render hot tools section (v4.3.0)
 * Shows top 6-8 hot/popular tools in a dedicated section
 */
function renderHotTools() {
    const grid = document.getElementById('hotToolsGrid');
    if (!grid) return;

    // Get hot tools (status=hot) or fallback to first 6 tools
    let hotTools = state.tools.filter(t => t.status === 'hot');

    // If less than 4 hot tools, supplement with other tools
    if (hotTools.length < 4) {
        const otherTools = state.tools
            .filter(t => t.status !== 'hot')
            .slice(0, 8 - hotTools.length);
        hotTools = [...hotTools, ...otherTools];
    }

    // Limit to max 8 tools
    hotTools = hotTools.slice(0, 8);

    // Generate HTML for each hot tool card
    const html = hotTools.map(tool => {
        const categoryName = getCategoryName(tool.category);

        // Generate tags
        let tagsHtml = '';
        if (tool.tags?.includes('free')) tagsHtml += '<span class="tag tag-free">免费</span>';
        else if (tool.tags?.includes('vip')) tagsHtml += '<span class="tag tag-vip">VIP</span>';
        if (tool.toolTags?.includes('国产')) tagsHtml += '<span class="tag tag-domestic">国产</span>';

        return `
            <div class="hot-tool-card" onclick="showToolDetail(${tool.id})">
                <div class="hot-tool-icon">
                    <i class="fas ${escapeAttr(tool.icon)}"></i>
                </div>
                <div class="hot-tool-info">
                    <div class="hot-tool-name">${escapeHtml(tool.name)}</div>
                    <div class="hot-tool-desc">${escapeHtml(tool.desc)}</div>
                    <div class="hot-tool-tags">${tagsHtml}</div>
                </div>
                <i class="fas fa-arrow-right hot-tool-arrow"></i>
            </div>
        `;
    }).join('');

    grid.innerHTML = html;
}

/**
 * Render statistics dashboard (v4.4.0)
 * Shows usage statistics, category distribution, and top tools ranking
 */
function renderStatisticsDashboard() {
    // Update stat cards
    const totalToolsEl = document.getElementById('totalToolsCount');
    const totalClicksEl = document.getElementById('totalClicksCount');
    const favoritesEl = document.getElementById('favoritesCount');
    const categoriesEl = document.getElementById('categoriesCount');

    if (totalToolsEl) totalToolsEl.textContent = state.tools.length;
    if (categoriesEl) categoriesEl.textContent = state.categories.length;
    if (favoritesEl) favoritesEl.textContent = state.favorites.length;

    // Calculate total clicks
    let totalClicks = 0;
    Object.values(state.clickStats || {}).forEach(count => { totalClicks += count; });
    if (totalClicksEl) totalClicksEl.textContent = totalClicks;

    // Render category distribution bars
    const categoryBarsContainer = document.getElementById('categoryBars');
    if (categoryBarsContainer && state.categories.length > 0) {
        const categoryColors = [
            '#6366f1', '#ec4899', '#10b981', '#f59e0b',
            '#0ea5e9', '#8b5cf6', '#ef4444', '#14b8a6',
            '#f97316', '#06b6d4'
        ];

        const maxToolsInCategory = Math.max(...state.categories.map(cat =>
            state.tools.filter(t => t.category === cat.id).length
        ));

        const barsHtml = state.categories.map((cat, index) => {
            const count = state.tools.filter(t => t.category === cat.id).length;
            const percentage = maxToolsInCategory > 0 ? (count / maxToolsInCategory) * 100 : 0;
            const color = categoryColors[index % categoryColors.length];

            return `
                <div class="category-bar-item">
                    <span class="category-bar-label">${escapeHtml(cat.name)}</span>
                    <div class="category-bar-track">
                        <div class="category-bar-fill" style="width: ${percentage}%; background: linear-gradient(90deg, ${color}, ${color}dd);"></div>
                    </div>
                    <span class="category-bar-count">${count}</span>
                </div>
            `;
        }).join('');

        categoryBarsContainer.innerHTML = barsHtml;
    }

    // Render top tools ranking
    const topToolsListContainer = document.getElementById('topToolsList');
    if (topToolsListContainer) {
        // Sort tools by click count descending
        const sortedTools = [...state.tools].sort((a, b) =>
            (state.clickStats[b.id] || 0) - (state.clickStats[a.id] || 0)
        ).slice(0, 5);

        const listHtml = sortedTools.map((tool, index) => {
            const clicks = state.clickStats[tool.id] || 0;
            const rankClass = index === 0 ? 'top-rank-1' : index === 1 ? 'top-rank-2' : index === 2 ? 'top-rank-3' : 'top-rank-default';

            return `
                <div class="top-tool-item" onclick="showToolDetail(${tool.id})">
                    <span class="top-rank ${rankClass}">${index + 1}</span>
                    <div class="top-tool-info">
                        <div class="top-tool-name">${escapeHtml(tool.name)}</div>
                        <div class="top-tool-clicks">${clicks} 次点击</div>
                    </div>
                    <i class="fas ${escapeAttr(tool.icon)} top-tool-icon" style="color: var(--text-muted);"></i>
                </div>
            `;
        }).join('');

        topToolsListContainer.innerHTML = listHtml || '<p class="text-muted text-center py-4">暂无使用数据</p>';
    }
}

/**
 * Create a tool card element with modern design and enhanced features
 * @param {Object} tool - Tool data object
 * @returns {string} HTML string for the tool card
 */
function createToolCard(tool) {
    const categoryName = getCategoryName(tool.category);
    const favorite = isFavorite(tool.id);

    // Generate status badge (hot/stable/new)
    let statusBadge = '';
    if (tool.status === 'hot') {
        statusBadge = '<span class="status-badge status-hot"><i class="fas fa-fire"></i> 热门</span>';
    } else if (tool.status === 'stable') {
        statusBadge = '<span class="status-badge status-stable"><i class="fas fa-check-circle"></i> 稳定</span>';
    }

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
        if (tool.toolTags.includes('开源')) tagsHtml += '<span class="tag tag-open-source">开源</span>';
        if (tool.toolTags.includes('无需登录')) tagsHtml += '<span class="tag tag-no-login">无需登录</span>';
    }

    // Generate difficulty indicator
    let difficultyLabel = '';
    if (tool.difficulty) {
        const difficultyConfig = {
            beginner: { label: '入门', icon: 'fa-seedling', color: 'difficulty-beginner' },
            intermediate: { label: '进阶', icon: 'fa-leaf', color: 'difficulty-intermediate' },
            advanced: { label: '高级', icon: 'fa-tree', color: 'difficulty-advanced' }
        };
        const diff = difficultyConfig[tool.difficulty] || difficultyConfig.beginner;
        difficultyLabel = `<span class="difficulty-badge ${diff.color}"><i class="fas ${diff.icon}"></i> ${diff.label}</span>`;
    }

    // Generate platform badges
    let platformBadges = '';
    if (tool.platform && Array.isArray(tool.platform)) {
        const platformIcons = { web: 'fa-globe', local: 'fa-server', mobile: 'fa-mobile-alt', desktop: 'fa-desktop' };
        platformBadges = `<div class="platform-badges">${tool.platform.map(p => `<i class="fas ${platformIcons[p] || 'fa-cog'}" title="${p}"></i>`).join('')}</div>`;
    }

    // Generate update time display
    let updateTimeDisplay = '';
    if (tool.updateTime) {
        updateTimeDisplay = `<span class="update-time"><i class="fas fa-clock"></i> ${escapeHtml(tool.updateTime)}</span>`;
    }

    return `
        <div class="tool-card" onclick="showToolDetail(${tool.id})">
            <div class="card-header">
                <div class="card-icon">
                    <i class="fas ${escapeAttr(tool.icon)}"></i>
                </div>
                <div class="card-badges">
                    ${statusBadge}
                    ${difficultyLabel}
                </div>
                <button onclick="toggleFavorite(${tool.id}, event)" class="favorite-btn ${favorite ? 'active' : ''}" aria-label="${favorite ? '取消收藏' : '收藏'} ${escapeHtml(tool.name)}">
                    <i class="fas fa-star"></i>
                </button>
            </div>
            <h3 class="card-title">${escapeHtml(tool.name)}</h3>
            <p class="card-desc">${escapeHtml(tool.desc)}</p>
            <div class="card-meta">
                ${updateTimeDisplay}
                ${platformBadges}
            </div>
            <div class="card-tags">
                ${tagsHtml}
            </div>
            <div class="card-footer">
                <span class="card-category">${escapeHtml(categoryName)}</span>
                <button onclick="openTool(${tool.id}, '${escapeAttr(tool.url)}', event)" class="card-action-btn">
                    <i class="fas fa-external-link-alt"></i> 使用
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

    // Apply current sort and filter
    applyFiltersAndSort();
}

let currentSort = 'default';

// Advanced Filters State (v4.3.0)
const advancedFilters = {
    price: [],
    origin: [],
    status: []
};

function sortTools(tools, sortBy) {
    currentSort = sortBy;

    const sorted = [...tools];
    switch (sortBy) {
        case 'name-asc':
            return sorted.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
        case 'name-desc':
            return sorted.sort((a, b) => b.name.localeCompare(a.name, 'zh-CN'));
        case 'hot':
            return sorted.sort((a, b) => {
                if (a.status === 'hot' && b.status !== 'hot') return -1;
                if (b.status === 'hot' && a.status !== 'hot') return 1;
                return 0;
            });
        case 'free-first':
            return sorted.sort((a, b) => {
                const aFree = a.tags?.includes('free') ? 0 : 1;
                const bFree = b.tags?.includes('free') ? 0 : 1;
                return aFree - bFree;
            });
        case 'domestic':
            return sorted.sort((a, b) => {
                const aDomestic = a.toolTags?.includes('国产') ? 0 : 1;
                const bDomestic = b.toolTags?.includes('国产') ? 0 : 1;
                return aDomestic - bDomestic;
            });
        default:
            return tools;
    }
}

function applyAdvancedFilters(tools) {
    let filtered = [...tools];

    // Apply price filter
    if (advancedFilters.price.length > 0) {
        filtered = filtered.filter(tool =>
            advancedFilters.price.some(price =>
                tool.tags?.includes(price)
            )
        );
    }

    // Apply origin filter
    if (advancedFilters.origin.length > 0) {
        filtered = filtered.filter(tool =>
            advancedFilters.origin.some(origin =>
                tool.toolTags?.includes(origin)
            )
        );
    }

    // Apply status filter
    if (advancedFilters.status.length > 0) {
        filtered = filtered.filter(tool =>
            advancedFilters.status.some(status =>
                tool.status === status
            )
        );
    }

    return filtered;
}

function applyFiltersAndSort() {
    let filtered = state.currentCategory === 'all'
        ? [...state.tools]
        : state.tools.filter(t => t.category === state.currentCategory);

    // Apply search if active
    const searchTerm = document.getElementById('mainSearch')?.value.toLowerCase() || '';
    if (searchTerm) {
        filtered = filtered.filter(tool =>
            tool.name.toLowerCase().includes(searchTerm) ||
            tool.desc.toLowerCase().includes(searchTerm)
        );
    }

    // Apply advanced filters
    filtered = applyAdvancedFilters(filtered);

    // Apply sorting
    filtered = sortTools(filtered, currentSort);

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
 * Setup search functionality with debounced input handling (v4.4.0 Enhanced)
 */
function setupSearch() {
    const searchInput = document.getElementById('mainSearch');
    if (!searchInput) return;

    let searchDebounceTimeout = null;
    let currentSearchTerm = '';

    // Search suggestions container (v4.4.0)
    const suggestionsContainer = document.createElement('div');
    suggestionsContainer.id = 'searchSuggestions';
    suggestionsContainer.className = 'search-suggestions';
    searchInput.parentNode.appendChild(suggestionsContainer);

    // Search results counter element (v4.4.0)
    let resultsCounter = document.querySelector('.results-counter');
    if (!resultsCounter) {
        resultsCounter = document.createElement('div');
        resultsCounter.className = 'results-counter hidden';
        resultsCounter.innerHTML = '<span class="count-number">0</span> 个工具匹配';
        const toolsGrid = document.getElementById('toolsGrid');
        if (toolsGrid && toolsGrid.parentNode) {
            toolsGrid.parentNode.insertBefore(resultsCounter, toolsGrid);
        }
    }

    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.trim().toLowerCase();
        currentSearchTerm = term;
        const clearSearchBtn = document.getElementById('clearSearchBtn');
        if (clearSearchBtn) clearSearchBtn.classList.toggle('hidden', !term);

        // Show/hide suggestions (v4.4.0)
        if (term.length >= 1 && term.length < 50) {
            showSearchSuggestions(term, suggestionsContainer);
        } else {
            hideSearchSuggestions(suggestionsContainer);
        }

        // Clear previous debounce timer
        if (searchDebounceTimeout) {
            clearTimeout(searchDebounceTimeout);
        }

        // Debounced search execution
        searchDebounceTimeout = setTimeout(() => {
            applyFiltersAndSort();

            // Update results counter (v4.4.0)
            updateResultsCounter(term);

            // Save search history using state function
            if (term) {
                addToSearchHistory(term);
            }
        }, SEARCH_DEBOUNCE_TIME);
    });

    // Hide suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container') && !e.target.closest('#searchSuggestions')) {
            hideSearchSuggestions(suggestionsContainer);
        }
    });

    searchInput.addEventListener('focus', () => {
        // Show search history or suggestions
        if (state.searchHistory.length > 0 && !currentSearchTerm) {
            showSearchHistory();
        } else if (currentSearchTerm) {
            showSearchSuggestions(currentSearchTerm, suggestionsContainer);
        }
    });
}

/**
 * Show search suggestions based on input (v4.4.0)
 * @param {string} term - Search term
 * @param {HTMLElement} container - Suggestions container element
 */
function showSearchSuggestions(term, container) {
    if (!container || !term) return;

    // Generate suggestions from tool names and descriptions
    const suggestions = new Set();

    state.tools.forEach(tool => {
        // Match in name
        if (tool.name.toLowerCase().includes(term)) {
            suggestions.add({ text: tool.name, type: 'name', icon: tool.icon, id: tool.id });
        }
        // Match in description
        if (tool.desc.toLowerCase().includes(term)) {
            suggestions.add({ text: tool.name, type: 'desc', icon: tool.icon, id: tool.id });
        }
        // Match in tags
        if (tool.toolTags?.some(tag => tag.toLowerCase().includes(term))) {
            suggestions.add({ text: term, type: 'tag', icon: 'fa-tag' });
        }
    });

    // Limit to top 6 suggestions
    const topSuggestions = Array.from(suggestions).slice(0, 6);

    if (topSuggestions.length === 0) {
        hideSearchSuggestions(container);
        return;
    }

    container.innerHTML = topSuggestions.map(s => `
        <div class="suggestion-item" onclick="setSearch('${escapeAttr(s.text)}')">
            <i class="fas ${escapeAttr(s.icon || 'fa-search')} suggestion-icon"></i>
            <span class="suggestion-text">${highlightText(escapeHtml(s.text), term)}</span>
            <span class="suggestion-type">${s.type === 'name' ? '名称' : s.type === 'desc' ? '描述' : '标签'}</span>
        </div>
    `).join('');

    container.classList.add('show');
}

/**
 * Hide search suggestions (v4.4.0)
 * @param {HTMLElement} container - Suggestions container element
 */
function hideSearchSuggestions(container) {
    if (container) {
        container.classList.remove('show');
        setTimeout(() => { if (!container.classList.contains('show')) container.innerHTML = ''; }, 300);
    }
}

/**
 * Highlight matching text in string (v4.4.0)
 * @param {string} text - Original text
 * @param {string} searchTerm - Term to highlight
 * @returns {string} HTML with highlighted matches
 */
function highlightText(text, searchTerm) {
    if (!searchTerm || !text) return text;
    const regex = new RegExp(`(${escapeRegex(searchTerm)})`, 'gi');
    return text.replace(regex, '<mark class="search-highlight">$1</mark>');
}

/**
 * Escape special regex characters (v4.4.0)
 * @param {string} string - String to escape
 * @returns {string} Escaped string
 */
function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Update search results counter display (v4.4.0)
 * @param {string} searchTerm - Current search term
 */
function updateResultsCounter(searchTerm) {
    const counter = document.querySelector('.results-counter');
    if (!counter) return;

    const countNumber = counter.querySelector('.count-number');

    if (searchTerm) {
        // Count visible tools (this will be updated after renderTools completes)
        const toolsGrid = document.getElementById('toolsGrid');
        const visibleCount = toolsGrid?.children?.length || 0;

        if (countNumber) countNumber.textContent = visibleCount;
        counter.classList.remove('hidden');
    } else {
        counter.classList.add('hidden');
    }
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
    applyFiltersAndSort();
}

/**
 * Toggle advanced filters panel visibility (v4.3.0)
 */
function toggleAdvancedFilters() {
    const container = document.querySelector('.advanced-filters');
    if (container) {
        container.classList.toggle('expanded');
    }
}

/**
 * Toggle a specific advanced filter option (v4.3.0)
 * @param {string} category - Filter category (price, origin, status)
 * @param {string} value - Filter value
 * @param {boolean} checked - Whether the filter is checked
 */
function toggleAdvancedFilter(category, value, checked) {
    if (checked) {
        if (!advancedFilters[category].includes(value)) {
            advancedFilters[category].push(value);
        }
    } else {
        advancedFilters[category] = advancedFilters[category].filter(v => v !== value);
    }

    // Apply filters immediately
    applyFiltersAndSort();

    // Show toast with active filter count
    const totalActive = advancedFilters.price.length + advancedFilters.origin.length + advancedFilters.status.length;
    if (totalActive > 0) {
        showToast(`已启用 ${totalActive} 个筛选条件`);
    }
}

/**
 * Clear all advanced filters and reset display (v4.3.0)
 */
function clearAllFilters() {
    advancedFilters.price = [];
    advancedFilters.origin = [];
    advancedFilters.status = [];

    // Uncheck all checkboxes
    document.querySelectorAll('.advanced-filters input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
    });

    // Re-apply filters
    applyFiltersAndSort();

    showToast('已清除所有筛选条件');
}

// Export functions
export { renderCategories, renderHotTools, renderStatisticsDashboard, renderTools, filterCategory, loadSavedFilters, setSearch, clearSearch, setupSearch, sortTools, applyFiltersAndSort, toggleAdvancedFilters, toggleAdvancedFilter, clearAllFilters };
