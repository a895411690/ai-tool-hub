// Import state from centralized state module
import state, { getCategoryName, isFavorite } from './state.js';
import { escapeHtml, escapeAttr } from './utils.js';

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
        `<button class="category-btn px-5 py-2 rounded-full border text-sm font-medium transition-all" data-category="${escapeAttr(cat.id)}" data-action="filter-category" aria-label="查看${escapeHtml(cat.name)}分类的工具" tabindex="0">${escapeHtml(cat.name)}</button>`
    ).join('');

    container.innerHTML = '<button class="category-btn active px-5 py-2 rounded-full border text-sm font-medium transition-all" data-category="all" data-action="filter-category" aria-label="查看全部工具" tabindex="0">全部</button>' + buttons;
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
        // Generate tags
        const tagsHtml = generateTagsHtml(tool);

        return `
            <div class="hot-tool-card" data-tool-id="${tool.id}">
                <div class="hot-tool-icon" style="background: linear-gradient(135deg, rgba(0,212,255,0.1), rgba(168,85,247,0.1)); color: #00d4ff;">
                    <i class="fas ${escapeAttr(tool.icon)}"></i>
                </div>
                <div class="hot-tool-info">
                    <div class="hot-tool-name">${escapeHtml(tool.name)}</div>
                    <div class="hot-tool-desc">${escapeHtml(tool.desc)}</div>
                    <div class="hot-tool-tags">${tagsHtml}</div>
                </div>
                <i class="fas fa-arrow-right hot-tool-arrow" style="color: #00d4ff;"></i>
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
    const totalToolsStatsEl = document.getElementById('totalToolsCountStats');
    if (totalToolsStatsEl) totalToolsStatsEl.textContent = state.tools.length;
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
            '#00d4ff', '#a855f7', '#00ff88', '#faad14',
            '#ff4d4f', '#13c2c2', '#722ed1', '#eb2f96',
            '#fa8c16', '#2f54eb'
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
                        <div class="category-bar-fill" style="width: ${percentage}%; background: ${color};"></div>
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
            const rankColor = index === 0 ? '#00d4ff' : index === 1 ? '#a855f7' : index === 2 ? '#00ff88' : '';

            return `
                <div class="top-tool-item" data-tool-id="${tool.id}">
                    <span class="top-rank ${rankClass}" ${rankColor ? `style="color: ${rankColor};"` : ''}>${index + 1}</span>
                    <div class="top-tool-info">
                        <div class="top-tool-name">${escapeHtml(tool.name)}</div>
                        <div class="top-tool-clicks">${clicks} 次点击</div>
                    </div>
                    <i class="fas ${escapeAttr(tool.icon)} top-tool-icon" style="color: var(--ant-text-tertiary);"></i>
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
    const statusBadge = generateStatusBadgeHtml(tool.status);

    // Generate tags HTML
    const tagsHtml = generateTagsHtml(tool);

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
        platformBadges = generatePlatformBadgesHtml(tool.platform);
    }

    // Generate update time display
    let updateTimeDisplay = '';
    if (tool.updateTime) {
        updateTimeDisplay = `<span class="update-time"><i class="fas fa-clock"></i> ${escapeHtml(tool.updateTime)}</span>`;
    }

    return `
        <div class="tool-card" data-tool-id="${tool.id}">
            <div class="card-header">
                <div class="card-icon" style="background: linear-gradient(135deg, rgba(0,212,255,0.1), rgba(168,85,247,0.1));">
                    <i class="fas ${escapeAttr(tool.icon)}"></i>
                </div>
                <div class="card-badges">
                    ${statusBadge}
                    ${difficultyLabel}
                </div>
                <button data-action="toggle-favorite" data-tool-id="${tool.id}" class="favorite-btn ${favorite ? 'active' : ''}" aria-label="${favorite ? '取消收藏' : '收藏'} ${escapeHtml(tool.name)}" ${favorite ? 'style="color: #00d4ff;"' : ''}>
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
                <button data-action="open-tool" data-tool-id="${tool.id}" data-tool-url="${escapeAttr(tool.url)}" class="card-action-btn" style="background: linear-gradient(135deg, #00d4ff, #a855f7);">
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

    const searchTerm = document.getElementById('mainSearch')?.value.trim() || '';

    if (tools.length === 0 && searchTerm) {
        grid.innerHTML = '';
        grid.setAttribute('role', 'grid');
        grid.setAttribute('aria-label', 'AI工具列表');
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `
            <div class="empty-state-icon">🔍</div>
            <h3 class="empty-state-title">未找到相关工具</h3>
            <p class="empty-state-desc">没有与 "${escapeHtml(searchTerm)}" 匹配的 AI 工具</p>
            <button class="empty-state-btn" data-action="clear-all-filters">查看全部工具</button>
        `;
        grid.appendChild(emptyState);
        return;
    }
    
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


// ── UI helper functions (moved from utils.js for clearer responsibility boundary) ──

const RATING_LABELS = ['', '很差', '较差', '一般', '很好', '极好'];

function generateTagsHtml(tool) {
    let html = '';
    if (tool.tags) {
        if (tool.tags.includes('free')) html += '<span class="tag tag-free">免费</span>';
        else if (tool.tags.includes('vip')) html += '<span class="tag tag-vip">VIP</span>';
        if (tool.tags.includes('new')) html += '<span class="tag tag-new">NEW</span>';
        if (tool.tags.includes('hot')) html += '<span class="tag tag-hot">热门</span>';
    }
    if (tool.toolTags) {
        if (tool.toolTags.includes('国产')) html += '<span class="tag tag-domestic">国产</span>';
        if (tool.toolTags.includes('海外')) html += '<span class="tag tag-overseas">海外</span>';
        if (tool.toolTags.includes('开源')) html += '<span class="tag tag-open-source">开源</span>';
        if (tool.toolTags.includes('无需登录')) html += '<span class="tag tag-no-login">无需登录</span>';
    }
    return html;
}

function generatePlatformBadgesHtml(platform) {
    if (!platform || !Array.isArray(platform)) return '';
    const icons = { web: 'fa-globe', local: 'fa-server', mobile: 'fa-mobile-alt', desktop: 'fa-desktop' };
    return `<div class="platform-badges">${platform.map(p =>
        `<i class="fas ${icons[p] || 'fa-cog'}" title="${escapeAttr(p)}"></i>`
    ).join('')}</div>`;
}

function generateStatusBadgeHtml(status) {
    if (status === 'hot') return '<span class="status-badge status-hot"><i class="fas fa-fire"></i> 热门推荐</span>';
    if (status === 'stable') return '<span class="status-badge status-stable"><i class="fas fa-check-circle"></i> 稳定可靠</span>';
    return '';
}

export { createToolCard, renderCategories, renderHotTools, renderStatisticsDashboard, renderTools };

// UI helper re-exports for consumers that import from renderer.js
export { RATING_LABELS, generateTagsHtml, generatePlatformBadgesHtml, generateStatusBadgeHtml };

