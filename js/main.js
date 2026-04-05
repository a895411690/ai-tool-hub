// Import all modules
import { loadTools } from './app.js';
import { renderCategories, renderTools, filterCategory, loadSavedFilters, setSearch, clearSearch, setupSearch } from './ui.js';
import { openTool, toggleFavorite, showToolDetail } from './tool.js';
import { showShareModal, closeShareModal, shareToWeChat, shareToQQ, copyShareLink, generateShareImage } from './share.js';
import { setupKeyboardShortcuts, setupPullToRefresh, toggleTheme, showToast, loadAnnouncement, closeAnnouncement, checkForUpdate, closeUpdateModal, registerServiceWorker, showThemeModal, closeThemeModal, setTheme, loadSavedTheme } from './utils.js';
import state from './state.js';

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.querySelectorAll('.bottom-nav a').forEach(a => a.classList.remove('active'));
    document.querySelector('.bottom-nav a[href="#home"]')?.classList.add('active');
    showToast('已返回首页');
}

function showAllTools() {
    filterCategory('all');
    clearSearch();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.querySelectorAll('.bottom-nav a').forEach(a => a.classList.remove('active'));
    document.querySelector('.bottom-nav a[href="#tools"]')?.classList.add('active');
    showToast('显示所有工具');
}

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
window.setTheme = setTheme;
window.scrollToTop = scrollToTop;
window.showAllTools = showAllTools;

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    loadSavedTheme();  // Load saved theme first
    loadTools();
    setupSearch();
    setupKeyboardShortcuts();
    setupPullToRefresh();
    checkForUpdate();
    loadAnnouncement();
    loadSavedFilters();
    registerServiceWorker();
});
