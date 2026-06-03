// Import state from centralized state module
import state from './state.js';
import { showToast } from './utils.js';
import { renderTools } from './renderer.js';

/**
 * Filter/Sort functions
 */
function filterCategory(category) {
    state.currentCategory = category;
    localStorage.setItem('ai-tool-hub-filter-category', category);

    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.category === category) btn.classList.add('active');
    });

    // Apply current sort and filter
    applyFiltersAndSort();
}

function setCurrentSort(sortBy) {
    state.currentSort = sortBy;
}

// Advanced Filters State (v4.3.0)
function sortTools(tools, sortBy) {

    const sorted = [...tools];
    switch (sortBy) {
    case 'name-asc':
        return sorted.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
    case 'name-desc':
        return sorted.sort((a, b) => b.name.localeCompare(a.name, 'zh-CN'));
    case 'hot':
        return sorted.sort((a, b) => {
            if (a.status === 'hot' && b.status !== 'hot') return -1;
            if (b.status === 'hot' && a.status !== 'hot') return 1;
            return 0;
        });
    case 'free-first':
        return sorted.sort((a, b) => {
            const aFree = a.tags?.includes('free') ? 0 : 1;
            const bFree = b.tags?.includes('free') ? 0 : 1;
            return aFree - bFree;
        });
    case 'domestic':
        return sorted.sort((a, b) => {
            const aDomestic = a.toolTags?.includes('国产') ? 0 : 1;
            const bDomestic = b.toolTags?.includes('国产') ? 0 : 1;
            return aDomestic - bDomestic;
        });
    default:
        return tools;
    }
}

function applyAdvancedFilters(tools) {
    let filtered = [...tools];

    // Apply price filter
    if (state.advancedFilters.price.length > 0) {
        filtered = filtered.filter(tool =>
            state.advancedFilters.price.some(price =>
                tool.tags?.includes(price)
            )
        );
    }

    // Apply origin filter
    if (state.advancedFilters.origin.length > 0) {
        filtered = filtered.filter(tool =>
            state.advancedFilters.origin.some(origin =>
                tool.toolTags?.includes(origin)
            )
        );
    }

    // Apply status filter
    if (state.advancedFilters.status.length > 0) {
        filtered = filtered.filter(tool =>
            state.advancedFilters.status.some(status =>
                tool.status === status
            )
        );
    }

    return filtered;
}

function applyFiltersAndSort() {
    let filtered = state.currentCategory === 'all'
        ? [...state.tools]
        : state.tools.filter(t => t.category === state.currentCategory);

    // Apply search if active
    const searchTerm = document.getElementById('mainSearch')?.value.toLowerCase() || '';
    if (searchTerm) {
        filtered = filtered.filter(tool =>
            tool.name.toLowerCase().includes(searchTerm) ||
            tool.desc.toLowerCase().includes(searchTerm)
        );
    }

    // Apply advanced filters
    filtered = applyAdvancedFilters(filtered);

    // Apply sorting
    filtered = sortTools(filtered, state.currentSort);

    renderTools(filtered);
}

/**
 * Load saved filter preferences from localStorage
 */
function loadSavedFilters() {
    const savedCategory = localStorage.getItem('ai-tool-hub-filter-category');
    if (!savedCategory || savedCategory === 'all') return;
    
    // If tools are already loaded, apply filter immediately.
    // Otherwise wait for the tools:loaded event from app.js.
    if (state.tools.length > 0) {
        filterCategory(savedCategory);
        return;
    }
    
    document.addEventListener('tools:loaded', function onReady() {
        document.removeEventListener('tools:loaded', onReady);
        filterCategory(savedCategory);
    }, { once: true });
}

/**
 * Toggle advanced filters panel visibility (v4.3.0)
 */
function toggleAdvancedFilters() {
    const container = document.querySelector('.advanced-filters');
    if (container) {
        container.classList.toggle('expanded');
    }
}

/**
 * Toggle a specific advanced filter option (v4.3.0)
 * @param {string} category - Filter category (price, origin, status)
 * @param {string} value - Filter value
 * @param {boolean} checked - Whether the filter is checked
 */
function toggleAdvancedFilter(category, value, checked) {
    // Guard against unknown categories
    if (!state.advancedFilters[category]) return;
    if (checked) {
        if (!state.advancedFilters[category].includes(value)) {
            state.advancedFilters[category].push(value);
        }
    } else {
        state.advancedFilters[category] = state.advancedFilters[category].filter(v => v !== value);
    }

    // Apply filters immediately
    applyFiltersAndSort();

    // Show toast with active filter count
    const totalActive = state.advancedFilters.price.length + state.advancedFilters.origin.length + state.advancedFilters.status.length;
    if (totalActive > 0) {
        showToast(`已启用 ${totalActive} 个筛选条件`);
    }
}

/**
 * Clear all advanced filters and reset display (v4.3.0)
 */
function clearAllFilters() {
    state.advancedFilters.price = [];
    state.advancedFilters.origin = [];
    state.advancedFilters.status = [];

    // Uncheck all checkboxes
    document.querySelectorAll('.advanced-filters input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
    });

    // Re-apply filters
    applyFiltersAndSort();

    showToast('已清除所有筛选条件');
}

export { filterCategory, setCurrentSort, sortTools, applyAdvancedFilters, applyFiltersAndSort, loadSavedFilters, toggleAdvancedFilters, toggleAdvancedFilter, clearAllFilters };
