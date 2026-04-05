// Import state and functions
import { allTools, favorites } from './app.js';
import { renderTools } from './ui.js';
import { showToast } from './utils.js';

/**
 * Open tool URL in new tab
 * @param {number} id - Tool ID
 * @param {string} url - Tool URL to open
 * @param {Event} event - Click event object
 */
function openTool(id, url, event) {
    event.stopPropagation();
    window.open(url, '_blank');
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
        window.open(tool.url, '_blank');
    }
}

// Export functions
export { openTool, toggleFavorite, showToolDetail };
