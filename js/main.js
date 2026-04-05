// Import all modules
import { loadTools } from './app.js';
import { renderCategories, renderHotTools, renderTools, filterCategory, loadSavedFilters, setSearch, clearSearch, setupSearch, sortTools, applyFiltersAndSort, toggleAdvancedFilters, toggleAdvancedFilter, clearAllFilters } from './ui.js';
import { openTool, toggleFavorite, showToolDetail, closeToolDetail, rateTool } from './tool.js';
import { showShareModal, closeShareModal, shareToWeChat, shareToQQ, copyShareLink, generateShareImage } from './share.js';
import { setupKeyboardShortcuts, setupPullToRefresh, toggleTheme, showToast, loadAnnouncement, closeAnnouncement, checkForUpdate, closeUpdateModal, registerServiceWorker, showThemeModal, closeThemeModal, setTheme, loadSavedTheme } from './utils.js';
import state, { exportUserData, importUserData } from './state.js';

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
window.closeToolDetail = closeToolDetail;
window.rateTool = rateTool;
window.showShareModal = showShareModal;
window.closeShareModal = closeShareModal;
window.toggleTheme = toggleTheme;
window.closeAnnouncement = closeAnnouncement;
window.closeUpdateModal = closeUpdateModal;
window.setTheme = setTheme;
window.scrollToTop = scrollToTop;
window.showAllTools = showAllTools;
window.changeSort = changeSort;
window.toggleAdvancedFilters = toggleAdvancedFunctions;
window.toggleAdvancedFilter = toggleAdvancedFilter;
window.clearAllFilters = clearAllFilters;

// Data Management Functions (v4.4.0)
function exportFavorites() {
    const data = exportUserData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-tool-hub-data-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('数据导出成功！已下载JSON文件 📥');
}

function importFavorites() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const result = importUserData(event.target.result);
            showToast(result.message);

            // Re-render to show imported data
            const { renderTools } = await import('./ui.js');
            renderTools(state.tools);
        };
        reader.readAsText(file);
    };
    input.click();
}

window.exportFavorites = exportFavorites;
window.importFavorites = importFavorites;

// Back to Top Button Visibility
function setupBackToTopButton() {
    const btn = document.getElementById('backToTopBtn');
    if (!btn) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 400) {
            btn.classList.add('visible');
        } else {
            btn.classList.remove('visible');
        }
    }, { passive: true });
}

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
    setupBackToTopButton();  // v4.3.0: Back to top button
});
