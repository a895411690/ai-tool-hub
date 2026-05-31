// Import state and functions
import state, { toggleFavorite, recordToolClick, getToolClickCount, setToolRating, getToolRating } from './state.js';
import { renderTools } from './ui.js';
import { showToast, isValidUrl, escapeHtml, escapeAttr, generateTagsHtml, generateStatusBadgeHtml, RATING_LABELS } from './utils.js';

/**
 * Open tool URL in new tab with security validation
 * @param {number} id - Tool ID
 * @param {string} url - Tool URL to open
 * @param {Event} event - Click event object
 */
function openTool(id, url, event) {
    event.stopPropagation();

    // Handle internal tool navigation
    if (url.startsWith("#")) {
        recordToolClick(id);
        if (url === "#research" && typeof window.showResearchPage === "function") {
            window.showResearchPage();
        }
        return;
    }

    if (!isValidUrl(url)) {
        showToast("无效的工具链接");
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
    const tagsHtml = generateTagsHtml(tool);

    // Generate platform badges
    const platformBadges = tool.platform?.map(p =>
        `<span class="platform-badge"><i class="fas ${{web:'fa-globe',local:'fa-server',mobile:'fa-mobile-alt',desktop:'fa-desktop'}[p] || 'fa-cog'}"></i> ${escapeHtml(p)}</span>`
    ).join('') || '';

    // Generate difficulty display
    const difficultyLabels = { beginner: '入门级', intermediate: '进阶级', advanced: '高级' };
    const difficultyDisplay = tool.difficulty ? difficultyLabels[tool.difficulty] : '';

    // Generate status badge
    const statusBadge = generateStatusBadgeHtml(tool.status);

    // Find related tools (same category)
    const relatedTools = state.tools
        .filter(t => t.category === tool.category && t.id !== tool.id)
        .slice(0, 3);
    const relatedToolsHtml = relatedTools.map(t => `
        <div class="related-tool-item" data-tool-id="${t.id}">
            <i class="fas ${escapeAttr(t.icon)}"></i>
            <span>${escapeHtml(t.name)}</span>
        </div>
    `).join('');

    // Populate modal content
    const modal = document.getElementById('toolDetailModal');
    if (!modal) return;

    // Helper to safely set text content
    const safeSetText = (selector, text) => {
        const el = modal.querySelector(selector);
        if (el) el.textContent = text;
    };

    // Helper to safely set innerHTML
    const safeSetHTML = (selector, html) => {
        const el = modal.querySelector(selector);
        if (el) el.innerHTML = html;
    };

    // Helper to safely set href
    const safeSetHref = (selector, href) => {
        const el = modal.querySelector(selector);
        if (el) el.href = href;
    };

    safeSetHTML('.detail-header-icon', `<i class="fas ${escapeAttr(tool.icon)}"></i>`);
    safeSetText('.detail-title', tool.name);
    safeSetText('.detail-desc', tool.desc);
    safeSetText('.detail-category', categoryName);
    safeSetHTML('.detail-tags', tagsHtml + statusBadge);
    safeSetHTML('.detail-platform', platformBadges);
    safeSetText('.detail-difficulty', difficultyDisplay);
    safeSetText('.detail-update-time', tool.updateTime || '未知');
    safeSetHref('.detail-open-btn', tool.url);
    safeSetText('.detail-click-count', clickCount);

    // Update favorite button
    const favBtn = modal.querySelector('.detail-favorite-btn');
    if (favBtn) {
        favBtn.classList.toggle('active', favorite);
        favBtn.innerHTML = `<i class="fas fa-star"></i> ${favorite ? '已收藏' : '收藏'}`;
        favBtn.addEventListener('click', (e) => { e.stopPropagation(); handleToggleFavorite(tool.id, e); });
    }

    // Update open button
    const openBtn = modal.querySelector('.detail-open-btn');
    if (openBtn) {
        openBtn.addEventListener('click', (e) => { e.stopPropagation(); openTool(tool.id, tool.url, e); });
    }

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
            ratingText.textContent = RATING_LABELS[currentRating] || `${currentRating}星`;
        } else {
            ratingText.textContent = '点击评分';
        }
    }

    // Show related tools
    const relatedList = modal.querySelector('.related-tools-list');
    if (relatedList) {
        relatedList.innerHTML = relatedToolsHtml || '<p class="text-muted">暂无相关工具</p>';
    }

    // Show modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    const closeBtn = modal.querySelector('.modal-close-btn-modern');
    if (closeBtn) {
        closeBtn.addEventListener('click', (e) => { e.stopPropagation(); closeToolDetail(); });
    }
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
    const backdrop = document.querySelector('.modal-backdrop');
    if (backdrop) backdrop.remove();
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
        ratingText.textContent = RATING_LABELS[rating] || `${rating}星`;
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
