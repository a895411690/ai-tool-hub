// Import all modules
import { loadTools } from './app.js';
import { renderCategories, renderTools, filterCategory, loadSavedFilters, setSearch, clearSearch, setupSearch, sortTools, applyFiltersAndSort } from './ui.js';
import { openTool, toggleFavorite, showToolDetail } from './tool.js';
import { showShareModal, closeShareModal, shareToWeChat, shareToQQ, copyShareLink, generateShareImage } from './share.js';
import { setupKeyboardShortcuts, setupPullToRefresh, toggleTheme, showToast, loadAnnouncement, closeAnnouncement, checkForUpdate, closeUpdateModal, registerServiceWorker, showThemeModal, closeThemeModal, setTheme, loadSavedTheme } from './utils.js';
import state from './state.js';

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.querySelectorAll('.bottom-nav button').forEach(b => b.classList.remove('active'));
    document.querySelector('.bottom-nav button[onclick="scrollToTop()"]')?.classList.add('active');
    showToast('已返回首页');
}

function showAllTools() {
    filterCategory('all');
    clearSearch();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.querySelectorAll('.bottom-nav button').forEach(b => b.classList.remove('active'));
    document.querySelector('.bottom-nav button[onclick="showAllTools()"]')?.classList.add('active');
    showToast('显示所有工具');
}

function changeSort(sortBy) {
    document.querySelectorAll('.sort-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.sort === sortBy) btn.classList.add('active');
    });

    const sortLabels = {
        'default': '默认排序',
        'hot': '热门优先',
        'free-first': '免费优先',
        'domestic': '国产优先',
        'name-asc': '名称 A-Z',
        'name-desc': '名称 Z-A'
    };

    applyFiltersAndSort();
    showToast(`排序方式：${sortLabels[sortBy] || sortBy}`);
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
window.changeSort = changeSort;

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
