/**
 * Global State Management Module
 * Centralized state to avoid circular dependencies between modules
 */

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

// Global Application State
const state = {
    tools: [],           // All tools data from tools.json
    categories: [],      // Category definitions
    currentCategory: 'all', // Currently selected category filter
    searchHistory: safeJsonParse('ai-tool-hub-search-history', []),
    favorites: safeJsonParse('ai-tool-hub-favorites', []),
    clickStats: safeJsonParse('ai-tool-hub-click-stats', {})  // Tool click statistics {toolId: count}
};

/**
 * Update the global tools and categories data
 * @param {Array} tools - Array of tool objects
 * @param {Array} categories - Array of category objects
 */
function updateData(tools, categories) {
    state.tools = tools;
    state.categories = categories;
}

/**
 * Get current tools data (optionally filtered by category)
 * @param {string} [category] - Optional category ID to filter by
 * @returns {Array} Filtered or all tools
 */
function getTools(category) {
    if (!category || category === 'all') {
        return state.tools;
    }
    return state.tools.filter(t => t.category === category);
}

/**
 * Get category name by ID
 * @param {string} categoryId - Category ID
 * @returns {string} Category name or empty string
 */
function getCategoryName(categoryId) {
    const cat = state.categories.find(c => c.id === categoryId);
    return cat ? cat.name : '';
}

/**
 * Check if a tool is in favorites
 * @param {number} toolId - Tool ID to check
 * @returns {boolean} True if favorited
 */
function isFavorite(toolId) {
    return state.favorites.includes(toolId);
}

/**
 * Toggle favorite status for a tool
 * @param {number} toolId - Tool ID to toggle
 * @returns {boolean} New favorite status
 */
function toggleFavorite(toolId) {
    const index = state.favorites.indexOf(toolId);
    if (index > -1) {
        state.favorites.splice(index, 1);
    } else {
        state.favorites.push(toolId);
    }
    
    // Save to localStorage immediately for critical user action
    localStorage.setItem('ai-tool-hub-favorites', JSON.stringify(state.favorites));
    
    return state.favorites.includes(toolId);
}

/**
 * Add search term to history
 * @param {string} term - Search term to add
 */
function addToSearchHistory(term) {
    if (term && !state.searchHistory.includes(term)) {
        state.searchHistory.unshift(term);
        if (state.searchHistory.length > 10) {
            state.searchHistory.splice(10);
        }
        localStorage.setItem('ai-tool-hub-search-history', JSON.stringify(state.searchHistory));
    }
}

/**
 * Record a tool click for statistics
 * @param {number} toolId - Tool ID that was clicked
 */
function recordToolClick(toolId) {
    if (!state.clickStats[toolId]) {
        state.clickStats[toolId] = 0;
    }
    state.clickStats[toolId]++;

    // Debounce save to localStorage (save every 5 clicks or use setTimeout)
    if (state.clickStats[toolId] % 5 === 0) {
        localStorage.setItem('ai-tool-hub-click-stats', JSON.stringify(state.clickStats));
    } else {
        // Use debounced save for better performance
        clearTimeout(state._clickSaveTimeout);
        state._clickSaveTimeout = setTimeout(() => {
            localStorage.setItem('ai-tool-hub-click-stats', JSON.stringify(state.clickStats));
        }, 2000);
    }
}

/**
 * Get click count for a specific tool
 * @param {number} toolId - Tool ID
 * @returns {number} Click count
 */
function getToolClickCount(toolId) {
    return state.clickStats[toolId] || 0;
}

/**
 * Get tools sorted by popularity (most clicked first)
 * @returns {Array} Tools sorted by click count descending
 */
function getPopularTools() {
    return [...state.tools].sort((a, b) => {
        return (state.clickStats[b.id] || 0) - (state.clickStats[a.id] || 0);
    });
}

// Export state object and management functions
export default state;
export {
    updateData,
    getTools,
    getCategoryName,
    isFavorite,
    toggleFavorite,
    addToSearchHistory,
    recordToolClick,
    getToolClickCount,
    getPopularTools,
    safeJsonParse
};
