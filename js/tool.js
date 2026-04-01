// Import state and functions
import { allTools, favorites } from './app.js';
import { renderTools } from './ui.js';
import { showToast } from './utils.js';

// Tool Actions
function openTool(id, url, event) {
    event.stopPropagation();
    window.open(url, '_blank');
}

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
    localStorage.setItem('ai-tool-hub-favorites', JSON.stringify(favorites));
    // Re-render tools
    const currentCategory = window.currentCategory || 'all';
    const filtered = currentCategory === 'all' ? allTools : allTools.filter(t => t.category === currentCategory);
    renderTools(filtered);
}

function showToolDetail(id) {
    const tool = allTools.find(t => t.id === id);
    if (tool) {
        window.open(tool.url, '_blank');
    }
}

// Export functions
export { openTool, toggleFavorite, showToolDetail };
