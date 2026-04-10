// Import state and functions
import state, { toggleFavorite, recordToolClick, getToolClickCount, setToolRating, getToolRating } from './state.js';
import { renderTools } from './ui.js';
import { showToast, isValidUrl, escapeHtml, escapeAttr } from './utils.js';

/**
 * Open tool URL in new tab with security validation
 * @param {number} id - Tool ID
 * @param {string} url - Tool URL to open
 * @param {Event} event - Click event object
 */
function openTool(id, url, event) {
    event.stopPropagation();

    // Security: Validate URL to prevent javascript: injection
    if (!isValidUrl(url)) {
        showToast('无效的工具链接');
        return;
    }

    // Record click statistics
    recordToolClick(id);

    window.open(url, '_blank');
}

/**
 * Toggle tool favorite status (delegates to state module)
 * @param {number} id - Tool ID to toggle
 * @param {Event} event - Click event object
 */
function handleToggleFavorite(id, event) {
    event.stopPropagation();
    const isNowFavorite = toggleFavorite(id);

    if (isNowFavorite) {
        showToast('已收藏');
    } else {
        showToast('已取消收藏');
    }

    // Re-render tools to update UI
    renderTools(state.tools);

    // If detail modal is open, update it too
    const modal = document.getElementById('toolDetailModal');
    if (modal && modal.classList.contains('active')) {
        const favBtn = modal.querySelector('.detail-favorite-btn');
        if (favBtn) {
            favBtn.classList.toggle('active', isNowFavorite);
            favBtn.innerHTML = `<i class="fas fa-star"></i> ${isNowFavorite ? '已收藏' : '收藏'}`;
        }
    }
}

/**
 * Show tool detail modal with comprehensive information
 * @param {number} id - Tool ID to show details for
 */
function showToolDetail(id) {
    const tool = state.tools.find(t => t.id === id);
    if (!tool) return;

    // Record click statistics
    recordToolClick(id);

    const categoryName = state.categories.find(c => c.id === tool.category)?.name || '';
    const favorite = state.favorites.includes(tool.id);
    const clickCount = getToolClickCount(tool.id);

    // Generate tags HTML
    let tagsHtml = '';
    if (tool.tags) {
        if (tool.tags.includes('free')) tagsHtml += '<span class="tag tag-free">免费</span>';
        else if (tool.tags.includes('vip')) tagsHtml += '<span class="tag tag-vip">VIP</span>';
        if (tool.tags.includes('new')) tagsHtml += '<span class="tag tag-new">NEW</span>';
        if (tool.tags.includes('hot')) tagsHtml += '<span class="tag tag-hot">热门</span>';
    }

    if (tool.toolTags) {
        if (tool.toolTags.includes('国产')) tagsHtml += '<span class="tag tag-domestic">国产</span>';
        if (tool.toolTags.includes('海外')) tagsHtml += '<span class="tag tag-overseas">海外</span>';
        if (tool.toolTags.includes('开源')) tagsHtml += '<span class="tag tag-open-source">开源</span>';
        if (tool.toolTags.includes('无需登录')) tagsHtml += '<span class="tag tag-no-login">无需登录</span>';
    }

    // Generate platform badges
    const platformIcons = { web: 'fa-globe', local: 'fa-server', mobile: 'fa-mobile-alt', desktop: 'fa-desktop' };
    const platformBadges = tool.platform?.map(p =>
        `<span class="platform-badge"><i class="fas ${platformIcons[p] || 'fa-cog'}"></i> ${p}</span>`
    ).join('') || '';

    // Generate difficulty display
    const difficultyLabels = { beginner: '入门级', intermediate: '进阶级', advanced: '高级' };
    const difficultyDisplay = tool.difficulty ? difficultyLabels[tool.difficulty] : '';

    // Generate status badge
    let statusBadge = '';
    if (tool.status === 'hot') statusBadge = '<span class="status-badge status-hot"><i class="fas fa-fire"></i> 热门推荐</span>';
    else if (tool.status === 'stable') statusBadge = '<span class="status-badge status-stable"><i class="fas fa-check-circle"></i> 稳定可靠</span>';

    // Find related tools (same category)
    const relatedTools = state.tools
        .filter(t => t.category === tool.category && t.id !== tool.id)
        .slice(0, 3);
    const relatedToolsHtml = relatedTools.map(t => `
        <div class="related-tool-item" onclick="showToolDetail(${t.id})">
            <i class="fas ${escapeAttr(t.icon)}"></i>
            <span>${escapeHtml(t.name)}</span>
        </div>
    `).join('');

    // Populate modal content
    const modal = document.getElementById('toolDetailModal');
    if (!modal) return;

    modal.querySelector('.detail-header-icon').innerHTML = `<i class="fas ${escapeAttr(tool.icon)}"></i>`;
    modal.querySelector('.detail-title').textContent = tool.name;
    modal.querySelector('.detail-desc').textContent = tool.desc;
    modal.querySelector('.detail-category').textContent = categoryName;
    modal.querySelector('.detail-tags').innerHTML = tagsHtml + statusBadge;
    modal.querySelector('.detail-platform').innerHTML = platformBadges;
    modal.querySelector('.detail-difficulty').textContent = difficultyDisplay;
    modal.querySelector('.detail-update-time').textContent = tool.updateTime || '未知';
    modal.querySelector('.detail-url').href = tool.url;
    modal.querySelector('.detail-click-count').textContent = clickCount;

    // Update favorite button
    const favBtn = modal.querySelector('.detail-favorite-btn');
    favBtn.classList.toggle('active', favorite);
    favBtn.innerHTML = `<i class="fas fa-star"></i> ${favorite ? '已收藏' : '收藏'}`;
    favBtn.onclick = (e) => { e.stopPropagation(); handleToggleFavorite(tool.id, e); };

    // Update open button
    modal.querySelector('.detail-open-btn').onclick = (e) => { e.stopPropagation(); openTool(tool.id, tool.url, e); };

    // Initialize rating UI (v4.4.0)
    const starRating = modal.querySelector('#toolStarRating');
    const ratingText = modal.querySelector('#ratingText');
    if (starRating && ratingText) {
        starRating.dataset.toolId = tool.id;
        const currentRating = getToolRating(tool.id);

        // Update star display
        updateStarDisplay(starRating, currentRating);

        // Update text
        if (currentRating > 0) {
            const ratingLabels = ['', '很差', '较差', '一般', '很好', '极好'];
            ratingText.textContent = ratingLabels[currentRating] || `${currentRating}星`;
        } else {
            ratingText.textContent = '点击评分';
        }
    }

    // Show related tools
    modal.querySelector('.related-tools-list').innerHTML = relatedToolsHtml || '<p class="text-muted">暂无相关工具</p>';

    // Show modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

/**
 * Close tool detail modal
 */
function closeToolDetail() {
    const modal = document.getElementById('toolDetailModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

/**
 * Rate a tool (v4.4.0)
 * @param {number} rating - Rating value (1-5)
 */
function rateTool(rating) {
    const starRating = document.querySelector('#toolStarRating');
    if (!starRating) return;

    const toolId = parseInt(starRating.dataset.toolId);
    if (!toolId) return;

    // Save rating
    setToolRating(toolId, rating);

    // Update display
    updateStarDisplay(starRating, rating);

    // Update text
    const ratingText = document.querySelector('#ratingText');
    if (ratingText) {
        const ratingLabels = ['', '很差', '较差', '一般', '很好', '极好'];
        ratingText.textContent = ratingLabels[rating] || `${rating}星`;
    }

    // Show toast feedback
    showToast(`已评分 ${rating} 星 ⭐`);
}

/**
 * Update star rating display (v4.4.0)
 * @param {HTMLElement} container - Star rating container element
 * @param {number} rating - Current rating value (1-5)
 */
function updateStarDisplay(container, rating) {
    if (!container) return;

    const stars = container.querySelectorAll('.star-btn');
    stars.forEach((star, index) => {
        star.classList.toggle('active', index < rating);
    });
}

// Export functions
export { openTool, handleToggleFavorite as toggleFavorite, showToolDetail, closeToolDetail, rateTool };
