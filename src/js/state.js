// 状态管理
let state = {
    allTools: [],
    categories: [],
    user: null,
    favorites: JSON.parse(localStorage.getItem('favorites') || '[]'),
    history: JSON.parse(localStorage.getItem('history') || '[]'),
    ratings: JSON.parse(localStorage.getItem('ratings') || '{}'),
    notes: JSON.parse(localStorage.getItem('notes') || '{}'),
    compareList: [],
    compareMode: false,
    currentCategory: 'all',
    // Prompts state
    allPrompts: [],
    promptCategories: [],
    promptFavorites: JSON.parse(localStorage.getItem('promptFavorites') || '[]'),
    currentPromptCategory: 'all'
};

export default state;