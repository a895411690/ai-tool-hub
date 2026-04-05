// Import all modules
import { loadTools } from './app.js';
import { renderCategories, renderTools, filterCategory, loadSavedFilters, setSearch, clearSearch, setupSearch } from './ui.js';
import { openTool, toggleFavorite, showToolDetail } from './tool.js';
import { showShareModal, closeShareModal, shareToWeChat, shareToQQ, copyShareLink, generateShareImage } from './share.js';
import { setupKeyboardShortcuts, setupPullToRefresh, toggleTheme, showToast, loadAnnouncement, closeAnnouncement, checkForUpdate, closeUpdateModal, registerServiceWorker } from './utils.js';

// Only expose functions that are used in inline event handlers (onclick attributes)
// This minimizes global namespace pollution
window.loadTools = loadTools;
window.filterCategory = filterCategory;
window.setSearch = setSearch;
window.clearSearch = clearSearch;
window.openTool = openTool;
window.toggleFavorite = toggleFavorite;
window.showToolDetail = showToolDetail;
window.showShareModal = showShareModal;
window.closeShareModal = closeShareModal;
window.toggleTheme = toggleTheme;
window.closeAnnouncement = closeAnnouncement;
window.closeUpdateModal = closeUpdateModal;

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    try {
        loadTools();
    } catch (e) {
        console.error('加载工具失败:', e);
    }
    // 这些应该始终执行
    setupSearch();
    setupKeyboardShortcuts();
    setupPullToRefresh();
    checkForUpdate();
    loadAnnouncement();
    loadSavedFilters();
    registerServiceWorker();
});
