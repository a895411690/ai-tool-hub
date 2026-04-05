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
    clickStats: safeJsonParse('ai-tool-hub-click-stats', {}),  // Tool click statistics {toolId: count}
    ratings: safeJsonParse('ai-tool-hub-ratings', {})          // User ratings {toolId: rating (1-5)}
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

/**
 * Set user rating for a tool (v4.4.0)
 * @param {number} toolId - Tool ID to rate
 * @param {number} rating - Rating value (1-5)
 * @returns {number} The rating that was set
 */
function setToolRating(toolId, rating) {
    // Validate rating is between 1 and 5
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        console.warn('Invalid rating value:', rating);
        rating = Math.max(1, Math.min(5, Math.round(rating)));
    }

    state.ratings[toolId] = rating;

    // Debounce save to localStorage
    clearTimeout(state._ratingSaveTimeout);
    state._ratingSaveTimeout = setTimeout(() => {
        localStorage.setItem('ai-tool-hub-ratings', JSON.stringify(state.ratings));
    }, 500);

    return rating;
}

/**
 * Get user rating for a specific tool (v4.4.0)
 * @param {number} toolId - Tool ID
 * @returns {number} Rating (1-5) or 0 if not rated
 */
function getToolRating(toolId) {
    return state.ratings[toolId] || 0;
}

/**
 * Get average rating across all rated tools (v4.4.0)
 * @returns {number} Average rating (1-5) or 0 if no ratings
 */
function getAverageRating() {
    const values = Object.values(state.ratings);
    if (values.length === 0) return 0;

    const sum = values.reduce((acc, val) => acc + val, 0);
    return (sum / values.length).toFixed(1);
}

/**
 * Get total number of rated tools (v4.4.0)
 * @returns {number} Count of tools with ratings
 */
function getRatedToolsCount() {
    return Object.keys(state.ratings).length;
}

/**
 * Export user data (favorites, ratings, stats) as JSON (v4.4.0)
 * @returns {string} JSON string of all user data
 */
function exportUserData() {
    const userData = {
        version: '2.0',
        exportDate: new Date().toISOString(),
        favorites: state.favorites,
        ratings: state.ratings,
        clickStats: state.clickStats,
        searchHistory: state.searchHistory
    };

    return JSON.stringify(userData, null, 2);
}

/**
 * Import user data from JSON string (v4.4.0)
 * @param {string} jsonString - JSON string to import
 * @returns {Object} Import result with success status and message
 */
function importUserData(jsonString) {
    try {
        const data = JSON.parse(jsonString);

        // Validate structure
        if (!data.version || !Array.isArray(data.favorites)) {
            throw new Error('无效的数据格式');
        }

        // Merge data (preserve existing + add imported)
        if (Array.isArray(data.favorites)) {
            state.favorites = [...new Set([...state.favorites, ...data.favorites])];
            localStorage.setItem('ai-tool-hub-favorites', JSON.stringify(state.favorites));
        }

        if (data.ratings && typeof data.ratings === 'object') {
            state.ratings = { ...state.ratings, ...data.ratings };
            localStorage.setItem('ai-tool-hub-ratings', JSON.stringify(state.ratings));
        }

        if (data.clickStats && typeof data.clickStats === 'object') {
            state.clickStats = { ...state.clickStats, ...data.clickStats };
            localStorage.setItem('ai-tool-hub-click-stats', JSON.stringify(state.clickStats));
        }

        return {
            success: true,
            message: `成功导入数据：${data.favorites.length} 个收藏，${Object.keys(data.ratings || {}).length} 个评分`
        };
    } catch (error) {
        console.error('Import failed:', error);
        return {
            success: false,
            message: `导入失败：${error.message}`
        };
    }
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
    setToolRating,
    getToolRating,
    getAverageRating,
    getRatedToolsCount,
    exportUserData,
    importUserData,
    safeJsonParse
};
