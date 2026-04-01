// Import all modules
import { loadTools } from './app.js';
import { renderCategories, renderTools, filterCategory, loadSavedFilters, setSearch, clearSearch, setupSearch } from './ui.js';
import { openTool, toggleFavorite, showToolDetail } from './tool.js';
import { showShareModal, closeShareModal, shareToWeChat, shareToQQ, copyShareLink, generateShareImage } from './share.js';
import { setupKeyboardShortcuts, setupPullToRefresh, toggleTheme, showToast, loadAnnouncement, closeAnnouncement, checkForUpdate, closeUpdateModal, registerServiceWorker } from './utils.js';

// Make functions globally available
window.loadTools = loadTools;
window.renderCategories = renderCategories;
window.renderTools = renderTools;
window.filterCategory = filterCategory;
window.loadSavedFilters = loadSavedFilters;
window.setSearch = setSearch;
window.clearSearch = clearSearch;
window.setupSearch = setupSearch;
window.openTool = openTool;
window.toggleFavorite = toggleFavorite;
window.showToolDetail = showToolDetail;
window.showShareModal = showShareModal;
window.closeShareModal = closeShareModal;
window.shareToWeChat = shareToWeChat;
window.shareToQQ = shareToQQ;
window.copyShareLink = copyShareLink;
window.generateShareImage = generateShareImage;
window.setupKeyboardShortcuts = setupKeyboardShortcuts;
window.setupPullToRefresh = setupPullToRefresh;
window.toggleTheme = toggleTheme;
window.showToast = showToast;
window.loadAnnouncement = loadAnnouncement;
window.closeAnnouncement = closeAnnouncement;
window.checkForUpdate = checkForUpdate;
window.closeUpdateModal = closeUpdateModal;
window.registerServiceWorker = registerServiceWorker;

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded event fired');
    loadTools();
});
