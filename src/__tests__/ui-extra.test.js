/**
 * ui.js 补充测试
 * Covers: filterCategory, loadSavedFilters, clearSearch, setSearch,
 * toggleAdvancedFilters, toggleAdvancedFilter, clearAllFilters,
 * sortTools, applyAdvancedFilters, applyFiltersAndSort, setupSearch
 */
import { jest, describe, test, expect, beforeAll, beforeEach, afterEach } from '@jest/globals';
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

import state from '../../js/state.js';

let mod;
let setupSearch, clearSearch, setSearch, filterCategory;
let toggleAdvancedFilters, toggleAdvancedFilter, clearAllFilters;
let loadSavedFilters, applyAdvancedFilters, sortTools;

beforeAll(async () => {
    mod = await import('../../js/ui.js');
    setupSearch = mod.setupSearch;
    clearSearch = mod.clearSearch;
    setSearch = mod.setSearch;
    filterCategory = mod.filterCategory;
    toggleAdvancedFilters = mod.toggleAdvancedFilters;
    toggleAdvancedFilter = mod.toggleAdvancedFilter;
    clearAllFilters = mod.clearAllFilters;
    loadSavedFilters = mod.loadSavedFilters;
    applyAdvancedFilters = mod.applyAdvancedFilters;
    sortTools = mod.sortTools;
});

beforeEach(() => {
    state.searchHistory = [];
    state.advancedFilters = { price: [], origin: [], status: [] };
    state.currentCategory = 'all';
    state.currentSort = 'default';
    state.tools = [
        { id: 1, name: 'ChatGPT', desc: 'AI聊天', category: 'ai-chat', tags: ['free'], status: 'hot', toolTags: ['海外'] },
        { id: 2, name: 'Midjourney', desc: 'AI绘画', category: 'ai-image', tags: ['vip'], status: 'stable', toolTags: ['海外'] },
        { id: 3, name: '文心一言', desc: '百度AI', category: 'ai-chat', tags: ['free'], status: 'hot', toolTags: ['国产'] },
    ];
    state.categories = [
        { id: 'ai-chat', name: 'AI聊天' },
        { id: 'ai-image', name: 'AI图像' },
    ];
    state.favorites = [];

    document.body.innerHTML = `
        <div id="app">
            <input id="mainSearch" type="text" />
            <button id="clearSearchBtn" class="hidden" />
            <div id="searchHistory" />
            <div id="searchSuggestions" />
            <div class="advanced-filters">
                <label><input type="checkbox" data-filter-category="price" value="free" /> 免费</label>
                <label><input type="checkbox" data-filter-category="price" value="vip" /> VIP</label>
            </div>
            <div class="results-counter hidden">
                <span class="count-number">0</span> 个工具匹配
            </div>
            <div id="toolsGrid"><div class="tool-card" /></div>
            <div id="categoryFilter" />
        </div>
    `;
});

afterEach(() => {
    document.body.innerHTML = '';
});

// ── clearSearch ──────────────────────────────────────────────

describe('clearSearch', () => {
    test('should clear search input and hide panels', () => {
        const input = document.getElementById('mainSearch');
        input.value = 'test';
        document.getElementById('clearSearchBtn').classList.remove('hidden');
        clearSearch();
        expect(input.value).toBe('');
        expect(document.getElementById('clearSearchBtn').classList.contains('hidden')).toBe(true);
    });

    test('should not throw when search input is missing', () => {
        document.getElementById('mainSearch').remove();
        expect(() => clearSearch()).not.toThrow();
    });
});

// ── setSearch ────────────────────────────────────────────────

describe('setSearch', () => {
    test('should set search input value', () => {
        setSearch('ChatGPT');
        expect(document.getElementById('mainSearch').value).toBe('ChatGPT');
    });

    test('should hide search history', () => {
        document.getElementById('searchHistory').classList.add('show');
        setSearch('test');
        expect(document.getElementById('searchHistory').classList.contains('show')).toBe(false);
    });
});

// ── toggleAdvancedFilters ────────────────────────────────────

describe('toggleAdvancedFilters', () => {
    test('should toggle expanded class', () => {
        const c = document.querySelector('.advanced-filters');
        expect(c.classList.contains('expanded')).toBe(false);
        toggleAdvancedFilters();
        expect(c.classList.contains('expanded')).toBe(true);
        toggleAdvancedFilters();
        expect(c.classList.contains('expanded')).toBe(false);
    });

    test('should not throw when container missing', () => {
        document.querySelector('.advanced-filters').remove();
        expect(() => toggleAdvancedFilters()).not.toThrow();
    });
});

// ── toggleAdvancedFilter ─────────────────────────────────────

describe('toggleAdvancedFilter', () => {
    test('should add filter when checked', () => {
        toggleAdvancedFilter('price', 'free', true);
        expect(state.advancedFilters.price).toContain('free');
    });

    test('should remove filter when unchecked', () => {
        state.advancedFilters.price = ['free', 'vip'];
        toggleAdvancedFilter('price', 'free', false);
        expect(state.advancedFilters.price).not.toContain('free');
        expect(state.advancedFilters.price).toContain('vip');
    });

    test('should return early for unknown category', () => {
        toggleAdvancedFilter('nonexistent', 'val', true);
        expect(state.advancedFilters.nonexistent).toBeUndefined();
    });
});

// ── clearAllFilters ──────────────────────────────────────────

describe('clearAllFilters', () => {
    test('should clear all filter arrays', () => {
        state.advancedFilters.price = ['free'];
        state.advancedFilters.origin = ['国产'];
        state.advancedFilters.status = ['hot'];
        clearAllFilters();
        expect(state.advancedFilters.price).toEqual([]);
        expect(state.advancedFilters.origin).toEqual([]);
        expect(state.advancedFilters.status).toEqual([]);
    });

    test('should uncheck all checkboxes', () => {
        document.querySelectorAll('.advanced-filters input[type="checkbox"]').forEach(cb => { cb.checked = true; });
        clearAllFilters();
        document.querySelectorAll('.advanced-filters input[type="checkbox"]').forEach(cb => {
            expect(cb.checked).toBe(false);
        });
    });
});

// ── applyAdvancedFilters ─────────────────────────────────────

describe('applyAdvancedFilters', () => {
    test('returns all tools when no filters', () => {
        expect(applyAdvancedFilters(state.tools)).toHaveLength(3);
    });

    test('filters by price tags', () => {
        state.advancedFilters.price = ['free'];
        const r = applyAdvancedFilters(state.tools);
        expect(r).toHaveLength(2);
        expect(r.every(t => t.tags.includes('free'))).toBe(true);
    });

    test('filters by origin toolTags', () => {
        state.advancedFilters.origin = ['国产'];
        const r = applyAdvancedFilters(state.tools);
        expect(r).toHaveLength(1);
        expect(r[0].name).toBe('文心一言');
    });

    test('filters by status', () => {
        state.advancedFilters.status = ['stable'];
        const r = applyAdvancedFilters(state.tools);
        expect(r).toHaveLength(1);
        expect(r[0].name).toBe('Midjourney');
    });

    test('combines multiple filters', () => {
        state.advancedFilters.price = ['free'];
        state.advancedFilters.origin = ['海外'];
        const r = applyAdvancedFilters(state.tools);
        expect(r).toHaveLength(1);
        expect(r[0].name).toBe('ChatGPT');
    });
});

// ── loadSavedFilters ─────────────────────────────────────────

describe('loadSavedFilters', () => {
    beforeEach(() => { localStorage.clear(); state.currentCategory = 'all'; });

    test('does nothing when no saved filter', () => {
        expect(() => loadSavedFilters()).not.toThrow();
    });

    test('applies saved filter when tools loaded', () => {
        localStorage.setItem('ai-tool-hub-filter-category', 'ai-image');
        state.tools = [{ id: 2, name: 'M', category: 'ai-image', desc: '' }];
        loadSavedFilters();
        expect(state.currentCategory).toBe('ai-image');
    });

    test('does nothing when saved category is "all"', () => {
        localStorage.setItem('ai-tool-hub-filter-category', 'all');
        loadSavedFilters();
        expect(state.currentCategory).toBe('all');
    });
});

// ── filterCategory ───────────────────────────────────────────

describe('filterCategory', () => {
    beforeEach(() => { localStorage.removeItem('ai-tool-hub-filter-category'); });

    test('updates category and persists', () => {
        filterCategory('ai-image');
        expect(state.currentCategory).toBe('ai-image');
        expect(localStorage.getItem('ai-tool-hub-filter-category')).toBe('ai-image');
    });

    test('updates active class on category buttons', () => {
        document.body.innerHTML = `
            <button class="category-btn active" data-category="all">全部</button>
            <button class="category-btn" data-category="ai-chat">AI聊天</button>
            <button class="category-btn" data-category="ai-image">AI图像</button>
            <div id="toolsGrid"></div>
        `;
        filterCategory('ai-chat');
        expect(document.querySelector('[data-category="all"]').classList.contains('active')).toBe(false);
        expect(document.querySelector('[data-category="ai-chat"]').classList.contains('active')).toBe(true);
    });

    test('does not throw for nonexistent category', () => {
        expect(() => filterCategory('nonexistent')).not.toThrow();
    });
});

// ── sortTools ────────────────────────────────────────────────

describe('sortTools', () => {
    test('name-asc: sorts alphabetically', () => {
        const r = sortTools(state.tools, 'name-asc');
        // zh-CN locale puts Chinese chars first
        expect(r[0].name).toBe('文心一言');
        expect(r[1].name).toBe('ChatGPT');
        expect(r[2].name).toBe('Midjourney');
    });

    test('name-desc: sorts reverse alphabetically', () => {
        const r = sortTools(state.tools, 'name-desc');
        expect(r[0].name).toBe('Midjourney');
        expect(r[2].name).toBe('文心一言');
    });

    test('hot: hot status tools first', () => {
        const r = sortTools(state.tools, 'hot');
        expect(r[0].status).toBe('hot');
        expect(r[1].status).toBe('hot');
    });

    test('free-first: free tagged tools first', () => {
        const r = sortTools(state.tools, 'free-first');
        expect(r[0].tags).toContain('free');
        expect(r[1].tags).toContain('free');
    });

    test('domestic-first: domestic tools first', () => {
        const r = sortTools(state.tools, 'domestic');
        expect(r[0].name).toBe('文心一言');
    });

    test('default: returns original order', () => {
        const r = sortTools(state.tools, 'default');
        expect(r).toEqual(state.tools);
    });
});

// ── setupSearch (basic) ──────────────────────────────────────

describe('setupSearch', () => {
    test('does not throw when setting up', () => {
        expect(() => setupSearch()).not.toThrow();
    });

    test('handles input events without error', () => {
        setupSearch();
        const input = document.getElementById('mainSearch');
        expect(() => {
            input.value = 'test';
            input.dispatchEvent(new Event('input', { bubbles: true }));
        }).not.toThrow();
    });

    test('handles clear button click', () => {
        setupSearch();
        const btn = document.getElementById('clearSearchBtn');
        expect(() => btn.dispatchEvent(new Event('click', { bubbles: true }))).not.toThrow();
    });

    test('handles Enter key without error', () => {
        setupSearch();
        const input = document.getElementById('mainSearch');
        input.value = 'ChatGPT';
        expect(() => {
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
        }).not.toThrow();
    });
});
