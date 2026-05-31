import { loadTools } from './app.js';
import { renderTools, filterCategory, loadSavedFilters, clearSearch, setupSearch, setCurrentSort, applyFiltersAndSort, toggleAdvancedFilters, clearAllFilters } from './ui.js';
import { openTool, toggleFavorite, showToolDetail, closeToolDetail, rateTool } from './tool.js';
import { showShareModal, closeShareModal, shareToWeChat, shareToQQ, copyShareLink, generateShareImage } from './share.js';
import { setupKeyboardShortcuts, setupPullToRefresh, toggleTheme, showToast, loadAnnouncement, closeAnnouncement, checkForUpdate, closeUpdateModal, registerServiceWorker, closeThemeModal, setTheme, loadSavedTheme } from './utils.js';
import state, { exportUserData, importUserData } from './state.js';

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.querySelectorAll('.bottom-nav button').forEach(b => b.classList.remove('active'));
    document.querySelector('.bottom-nav button[data-action="scroll-to-top"]')?.classList.add('active');
    showToast('已返回首页');
}

function showAllTools() {
    filterCategory('all');
    clearSearch();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.querySelectorAll('.bottom-nav button').forEach(b => b.classList.remove('active'));
    document.querySelector('.bottom-nav button[data-action="show-all-tools"]')?.classList.add('active');
    showToast('显示所有工具');
}

function changeSort(sortBy) {
    setCurrentSort(sortBy);
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
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (event) => {
            const result = importUserData(event.target.result);
            showToast(result.message);
            renderTools(state.tools);
        };
        reader.readAsText(file);
    };
    input.click();
}

const actionHandlers = {
    'open-tool': (e, el) => {
        openTool(parseInt(el.dataset.toolId), el.dataset.toolUrl, e);
    },
    'toggle-favorite': (e, el) => {
        toggleFavorite(parseInt(el.dataset.toolId), e);
    },
    'filter-category': (e, el) => {
        filterCategory(el.dataset.category || 'all');
    },
    'change-sort': (e, el) => {
        changeSort(el.dataset.sort);
    },
    'set-theme': (e, el) => {
        setTheme(el.dataset.themeValue);
    },
    'rate-tool': (e, el) => {
        rateTool(parseInt(el.dataset.rating));
    },
    'close-announcement': () => closeAnnouncement(),
    'show-share-modal': () => showShareModal(),
    'toggle-theme': () => toggleTheme(),
    'scroll-to-top': () => scrollToTop(),
    'show-all-tools': () => showAllTools(),
    'close-tool-detail': () => closeToolDetail(),
    'close-share-modal': (e) => closeShareModal(e),
    'close-update-modal': () => closeUpdateModal(),
    'close-theme-modal': (e) => closeThemeModal(e),
    'clear-all-filters': () => { clearAllFilters(); clearSearch(); },
    'toggle-advanced-filters': () => toggleAdvancedFilters(),
    'export-favorites': () => exportFavorites(),
    'import-favorites': () => importFavorites(),
    'share-to-wechat': () => shareToWeChat(),
    'share-to-qq': () => shareToQQ(),
    'copy-share-link': () => copyShareLink(),
    'generate-share-image': () => generateShareImage(),
};

document.addEventListener('click', function globalClickHandler(e) {
    const path = e.composedPath ? e.composedPath() : [e.target];
    for (const el of path) {
        if (!el?.getAttribute) continue;
        const action = el.dataset?.action;
        if (action && actionHandlers[action]) {
            actionHandlers[action](e, el);
            return;
        }
        const toolId = el.dataset?.toolId;
        if (toolId && !e.target.closest('button,[data-action],#searchSuggestions,#searchHistory')) {
            showToolDetail(parseInt(toolId));
            return;
        }
    }
});

function setupBackToTopButton() {
    const btn = document.getElementById('backToTopBtn');
    if (!btn) return;
    window.addEventListener('scroll', () => {
        if (window.scrollY > 400) btn.classList.add('visible');
        else btn.classList.remove('visible');
    }, { passive: true });
}

document.addEventListener('DOMContentLoaded', () => {
    window.addEventListener('error', () => {
        showToast('出现错误，请刷新页面重试');
    });
    window.addEventListener('unhandledrejection', (e) => {
        console.warn('Unhandled promise rejection:', e.reason);
    });
    loadSavedTheme();
    loadTools();
    setupSearch();
    setupKeyboardShortcuts({
        onEscape: () => {
            clearSearch();
            const searchHistory = document.getElementById('searchHistory');
            if (searchHistory) searchHistory.classList.remove('show');
            closeShareModal();
        }
    });
    setupPullToRefresh();
    checkForUpdate();
    loadAnnouncement();
    loadSavedFilters();
    registerServiceWorker();
    setupBackToTopButton();

    // Close user menu when clicking outside
    document.addEventListener('click', (e) => {
        const menu = document.getElementById('userMenu');
        const btn = document.getElementById('userBtn');
        if (menu && menu.classList.contains('show') && menu !== e.target && !menu.contains(e.target) && btn !== e.target && !btn.contains(e.target)) {
            menu.classList.remove('show');
        }
    });
});

// ---------------------------------------------------------------------------
// Global functions for inline onclick handlers in index.html
// These wire the UI elements that were part of the removed src/js/ codebase.
window.showPromptsPage = function() {
    showToast("提示词功能即将上线");
};

window.showResearchPage = async function() {
    var mod = await import('./research.js');
    mod.initResearchPage();
};

window.toggleUserMenu = function() {
    const menu = document.getElementById('userMenu');
    if (menu) menu.classList.toggle('show');
};

window.showProfile = function() {
    showToast('个人中心功能即将上线');
};

window.syncData = function() {
    showToast('同步功能即将上线');
};

window.exportData = function() {
    exportFavorites();
};

window.loginWithGitHub = function() {
    showToast('GitHub OAuth 需后端服务器支持，当前为前端演示模式');
};

// Expose commonly-used close functions on window for inline onclick handlers
window.closeAnnouncement = closeAnnouncement;
window.closeToolDetail = closeToolDetail;
window.closeShareModal = closeShareModal;
window.closeThemeModal = closeThemeModal;
window.closeUpdateModal = closeUpdateModal;
