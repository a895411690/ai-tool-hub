// Import state and functions
import { allTools, favorites } from './app.js';
import { renderTools } from './ui.js';
import { showToast } from './utils.js';

/**
 * 验证 URL 安全性，仅允许 http 和 https 协议
 * @param {string} url - 待验证的 URL
 * @returns {string} 安全的 URL，不安全则返回 '#'
 */
function sanitizeUrl(url) {
    if (typeof url !== 'string') return '#';
    try {
        const parsed = new URL(url);
        if (['http:', 'https:'].includes(parsed.protocol)) return url;
    } catch (e) {
        // 相对路径视为安全
        if (url.startsWith('/') || url.startsWith('./')) return url;
    }
    return '#';
}

/**
 * Open tool URL in new tab
 * @param {number} id - Tool ID
 * @param {string} url - Tool URL to open
 * @param {Event} event - Click event object
 */
function openTool(id, url, event) {
    if (event) event.stopPropagation();
    const safeUrl = sanitizeUrl(url);
    if (safeUrl === '#') {
        showToast('无效的链接地址');
        return;
    }
    window.open(safeUrl, '_blank', 'noopener,noreferrer');
}

/**
 * Toggle tool favorite status
 * @param {number} id - Tool ID to toggle
 * @param {Event} event - Click event object
 */
function toggleFavorite(id, event) {
    event.stopPropagation();
    const index = favorites.indexOf(id);
    if (index > -1) {
        favorites.splice(index, 1);
        showToast('已取消收藏');
    } else {
        favorites.push(id);
        showToast('已收藏');
    }
    
    // Save to localStorage immediately for critical user action
    localStorage.setItem('ai-tool-hub-favorites', JSON.stringify(favorites));
    
    // Re-render tools to update UI
    const currentCategory = window.currentCategory || 'all';
    const filtered = currentCategory === 'all' ? allTools : allTools.filter(t => t.category === currentCategory);
    renderTools(filtered);
}

/**
 * Show tool detail page (opens URL)
 * @param {number} id - Tool ID to show details for
 */
function showToolDetail(id) {
    const tool = allTools.find(t => t.id === id);
    if (tool) {
        const safeUrl = sanitizeUrl(tool.url);
        if (safeUrl !== '#') {
            window.open(safeUrl, '_blank', 'noopener,noreferrer');
        }
    }
}

// Export functions
export { openTool, toggleFavorite, showToolDetail };
