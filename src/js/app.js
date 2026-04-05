// 主应用文件
import { initUser, loginWithGitHub, logout, syncData, exportData } from './user.js';
import { showToast, closeModal, setExternalFunctions } from './ui.js';
import { loadTools, filterCategory, handleSearch, clearSearch, sortTools, toggleCompareMode, toggleCompare, startCompare, showSubmitModal, handleSubmit, showToolDetail, closeDetail, toggleFavorite, rateTool, saveNote, showProfile, showSection, clearHistory, renderRecommendations, showRandomTool } from './tools.js';
import { loadPrompts, showPromptsPage, closePromptsPage, filterPromptCategory, togglePromptFavorite, copyPrompt, showPromptDetail } from './prompts.js';

// 设置外部函数
setExternalFunctions(closeDetail, clearSearch);

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    loadTools();
    loadPrompts();
    initUser();
    
    // 延迟渲染推荐，确保数据已加载
    setTimeout(() => {
        renderRecommendations();
    }, 1000);
});

// 配置系统
function applyConfig(config) {
    if (config.title) document.title = config.title;
    if (config.announcement) {
        // Show announcement
    }
}

async function loadConfig() {
    try {
        const response = await fetch('../config.json');
        const config = await response.json();
        localStorage.setItem('siteConfig', JSON.stringify(config));
        applyConfig(config);
    } catch (e) {
        // No config file found, using defaults
    }
}

// 加载配置
loadConfig();

// 暴露全局函数，供 HTML 调用
window.loginWithGitHub = loginWithGitHub;
window.logout = logout;
window.syncData = syncData;
window.exportData = exportData;
window.showToast = showToast;
window.closeModal = closeModal;
window.filterCategory = filterCategory;
window.handleSearch = handleSearch;
window.clearSearch = clearSearch;
window.sortTools = sortTools;
window.toggleCompareMode = toggleCompareMode;
window.toggleCompare = toggleCompare;
window.startCompare = startCompare;
window.showSubmitModal = showSubmitModal;
window.handleSubmit = handleSubmit;
window.showToolDetail = showToolDetail;
window.closeDetail = closeDetail;
window.toggleFavorite = toggleFavorite;
window.rateTool = rateTool;
window.saveNote = saveNote;
window.showProfile = showProfile;
window.showSection = showSection;
window.clearHistory = clearHistory;
window.showRandomTool = showRandomTool;
window.showPromptsPage = showPromptsPage;
window.closePromptsPage = closePromptsPage;
window.filterPromptCategory = filterPromptCategory;
window.togglePromptFavorite = togglePromptFavorite;
window.copyPrompt = copyPrompt;
window.showPromptDetail = showPromptDetail;
