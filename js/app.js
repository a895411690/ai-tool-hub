// Import functions
import { showToast, escapeHtml, escapeAttr } from './utils.js';
import { renderCategories, renderTools } from './ui.js';

/**
 * 安全解析 localStorage 中的 JSON 数据
 * @param {string} key - localStorage 键名
 * @param {*} defaultValue - 解析失败时的默认值
 * @returns {*} 解析后的值或默认值
 */
function safeJsonParse(key, defaultValue) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : defaultValue;
    } catch (e) {
        console.warn(`解析 localStorage key "${key}" 失败:`, e);
        return defaultValue;
    }
}

// Global State
let allTools = [];
let categories = [];
let currentCategory = 'all';
let searchHistory = safeJsonParse('ai-tool-hub-search-history', []);
let favorites = safeJsonParse('ai-tool-hub-favorites', []);

// Initialize
// Note: loadTools is called from main.js


// Load Tools
async function loadTools() {
    try {
        const response = await fetch('tools.json');
        
        if (!response.ok) {
            throw new Error(`网络请求失败: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data || !Array.isArray(data.tools) || !Array.isArray(data.categories)) {
            throw new Error('工具数据结构不正确');
        }
        
        allTools = data.tools;
        categories = data.categories;
        
        // Render categories using ui.js function
        renderCategories();
        
        // Render tools using ui.js function (with XSS protection)
        renderTools(allTools);
        
        // Hide loading state
        const loadingState = document.getElementById('loadingState');
        if (loadingState) {
            loadingState.classList.add('hidden');
        }
    } catch (error) {
        console.error('加载工具失败:', error);
        showToast(`加载失败: ${error.message}`);
        
        // Show error state
        const loadingState = document.getElementById('loadingState');
        if (loadingState) {
            loadingState.innerHTML = `
                <div class="text-center">
                    <i class="fas fa-exclamation-circle text-red-500 text-4xl mb-4"></i>
                    <h3 class="text-xl font-bold mb-2">加载失败</h3>
                    <p class="text-gray-400 mb-4">${escapeHtml(error.message)}</p>
                    <button onclick="loadTools()" class="px-6 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:shadow-lg transition-all">
                        重试
                    </button>
                </div>
            `;
        }
    }
}

// Export state and functions
export { allTools, categories, currentCategory, searchHistory, favorites, loadTools };
