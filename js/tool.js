// Import state and functions
import state, { toggleFavorite } from './state.js';
import { renderTools } from './ui.js';
import { showToast, isValidUrl } from './utils.js';

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
        console.error('Invalid URL:', url);
        showToast('无效的工具链接');
        return;
    }
    
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
}

/**
 * Show tool detail page (opens URL)
 * @param {number} id - Tool ID to show details for
 */
function showToolDetail(id) {
    const tool = state.tools.find(t => t.id === id);
    if (tool && isValidUrl(tool.url)) {
        window.open(tool.url, '_blank');
    }
}

// Export functions
export { openTool, handleToggleFavorite as toggleFavorite, showToolDetail };
