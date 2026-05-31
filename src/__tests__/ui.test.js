/**
 * ui.js 测试文件
 * Tests sortTools, highlightText, escapeRegex, createToolCard
 */
import { jest } from '@jest/globals';
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

import state from '../../js/state.js';

// Import pure rendering/sorting functions from ui.js
let createToolCard, highlightText, escapeRegex, sortTools;

beforeAll(async () => {
    const ui = await import('../../js/ui.js');
    createToolCard = ui.createToolCard;
    highlightText = ui.highlightText;
    escapeRegex = ui.escapeRegex;
    sortTools = ui.sortTools;
});

// Sample data
const sampleCategories = [
    { id: 'writing', name: '写作' },
    { id: 'image', name: '图像' },
    { id: 'code', name: '编程' }
];

const sampleTools = [
    { id: 1, name: 'AI 写作助手', category: 'writing', icon: 'fa-pen', desc: '一个AI写作工具', url: 'https://example.com/write', tags: ['free', 'hot'], difficulty: 'beginner', platform: ['web'], status: 'hot' },
    { id: 2, name: 'AI 绘图大师', category: 'image', icon: 'fa-paint-brush', desc: 'AI图像生成工具', url: 'https://example.com/draw', tags: ['vip'], difficulty: 'intermediate', platform: ['web', 'mobile'], toolTags: ['国产'] },
    { id: 3, name: '代码助手', category: 'code', icon: 'fa-code', desc: 'AI编程助手', url: 'https://example.com/code', tags: ['free'], difficulty: 'advanced', platform: ['desktop'] },
    { id: 4, name: '文案专家', category: 'writing', icon: 'fa-feather', desc: '文案创作工具', url: 'https://example.com/copy', tags: [], difficulty: 'beginner', platform: ['web'], toolTags: ['海外'] }
];

beforeEach(() => {
    state.tools = sampleTools;
    state.categories = sampleCategories;
    state.favorites = [];
});

// ---------------------------------------------------------------------------
// escapeRegex
// ---------------------------------------------------------------------------

describe('escapeRegex', () => {
    test('should escape special regex characters', () => {
        expect(escapeRegex('.')).toBe('\\.');
        expect(escapeRegex('*')).toBe('\\*');
        expect(escapeRegex('+')).toBe('\\+');
        expect(escapeRegex('?')).toBe('\\?');
        expect(escapeRegex('^')).toBe('\\^');
        expect(escapeRegex('$')).toBe('\\$');
        expect(escapeRegex('{')).toBe('\\{');
        expect(escapeRegex('}')).toBe('\\}');
        expect(escapeRegex('(')).toBe('\\(');
        expect(escapeRegex(')')).toBe('\\)');
        expect(escapeRegex('[')).toBe('\\[');
        expect(escapeRegex(']')).toBe('\\]');
        expect(escapeRegex('|')).toBe('\\|');
    });

    test('should not escape alphanumeric characters', () => {
        expect(escapeRegex('hello123')).toBe('hello123');
        expect(escapeRegex('ABC')).toBe('ABC');
        expect(escapeRegex('中文测试')).toBe('中文测试');
    });

    test('should handle empty string', () => {
        expect(escapeRegex('')).toBe('');
    });
});

// ---------------------------------------------------------------------------
// highlightText
// ---------------------------------------------------------------------------

describe('highlightText', () => {
    test('should highlight matching text', () => {
        const result = highlightText('Hello World', 'World');
        expect(result).toBe('Hello <mark class="search-highlight">World</mark>');
    });

    test('should highlight case-insensitively', () => {
        const result = highlightText('Hello World', 'world');
        expect(result).toContain('<mark class="search-highlight">World</mark>');
    });

    test('should highlight multiple occurrences', () => {
        const result = highlightText('test test test', 'test');
        const matches = result.match(/<mark class="search-highlight">/g);
        expect(matches).toHaveLength(3);
    });

    test('should return original text if search term is empty', () => {
        expect(highlightText('Hello', '')).toBe('Hello');
        expect(highlightText('Hello', null)).toBe('Hello');
    });

    test('should return empty string for empty input', () => {
        expect(highlightText('', 'test')).toBe('');
    });

    test('should handle special regex characters in search term', () => {
        const result = highlightText('price is $5.00', '$5.00');
        expect(result).toContain('<mark class="search-highlight">');
    });
});

// ---------------------------------------------------------------------------
// sortTools
// ---------------------------------------------------------------------------

describe('sortTools', () => {
    test('should return unsorted for default sort', () => {
        const result = sortTools(sampleTools, 'default');
        expect(result).toHaveLength(4);
        expect(result[0].id).toBe(1);
    });

    test('should sort by name ascending', () => {
        const result = sortTools(sampleTools, 'name-asc');
        // zh-CN locale sorts CJK by Pinyin before ASCII
        expect(result[0].name).toBe('代码助手');
        expect(result[1].name).toBe('文案专家');
        expect(result[2].name).toBe('AI 绘图大师');
        expect(result[3].name).toBe('AI 写作助手');
    });

    test('should sort by name descending', () => {
        const result = sortTools(sampleTools, 'name-desc');
        expect(result[0].name).toBe('AI 写作助手');
        expect(result[3].name).toBe('代码助手');
    });

    test('should put hot tools first', () => {
        const result = sortTools(sampleTools, 'hot');
        expect(result[0].id).toBe(1); // tool with status='hot'
    });

    test('should put free tools first', () => {
        const result = sortTools(sampleTools, 'free-first');
        // Tools 1 and 3 have 'free' tag
        expect(result[0].tags).toContain('free');
        expect(result[1].tags).toContain('free');
    });

    test('should put domestic tools first', () => {
        const result = sortTools(sampleTools, 'domestic');
        expect(result[0].id).toBe(2); // tool with toolTags=['国产']
    });

    test('should not mutate the original array', () => {
        const original = [...sampleTools];
        sortTools(sampleTools, 'name-asc');
        expect(sampleTools).toEqual(original);
    });
});

// ---------------------------------------------------------------------------
// createToolCard
// ---------------------------------------------------------------------------

describe('createToolCard', () => {
    test('should render tool name and description', () => {
        const html = createToolCard(sampleTools[0]);
        expect(html).toContain('AI 写作助手');
        expect(html).toContain('一个AI写作工具');
    });

    test('should render tool-card class', () => {
        const html = createToolCard(sampleTools[0]);
        expect(html).toContain('class="tool-card"');
    });

    test('should render favorite button', () => {
        const html = createToolCard(sampleTools[0]);
        expect(html).toContain('data-action="toggle-favorite"');
        expect(html).toContain('data-tool-id="1"');
    });

    test('should render open-tool button with URL', () => {
        const html = createToolCard(sampleTools[0]);
        expect(html).toContain('data-action="open-tool"');
        expect(html).toContain('data-tool-url="https://example.com/write"');
    });

    test('should render free tag', () => {
        const html = createToolCard(sampleTools[0]);
        expect(html).toContain('tag-free');
    });

    test('should render difficulty badge', () => {
        const html = createToolCard(sampleTools[0]);
        expect(html).toContain('difficulty-beginner');
    });

    test('should render platform badges', () => {
        const html = createToolCard(sampleTools[1]);
        expect(html).toContain('fa-globe');
        expect(html).toContain('fa-mobile-alt');
    });

    test('should render status badge for hot tools', () => {
        const html = createToolCard(sampleTools[0]);
        expect(html).toContain('status-hot');
    });

    test('should render category name', () => {
        const html = createToolCard(sampleTools[0]);
        expect(html).toContain('写作');
    });

    test('should highlight favorited tools', () => {
        state.favorites = [1];
        const html = createToolCard(sampleTools[0]);
        expect(html).toContain('favorite-btn active');
    });

    test('should escape HTML in tool description', () => {
        const malicious = { ...sampleTools[0], desc: '<script>alert("xss")</script>' };
        const html = createToolCard(malicious);
        expect(html).not.toContain('<script>alert(');
        expect(html).toContain('&lt;script&gt;');
    });

    test('should escape HTML in tool name', () => {
        const malicious = { ...sampleTools[0], name: '<img onerror="alert(1)" src=x>' };
        const html = createToolCard(malicious);
        expect(html).not.toContain('<img onerror=');
    });
});

// ---------------------------------------------------------------------------
// applyAdvancedFilters
// ---------------------------------------------------------------------------

describe('applyAdvancedFilters', () => {
    let applyAdvancedFilters;

    beforeAll(async () => {
        const ui = await import('../../js/ui.js');
        applyAdvancedFilters = ui.applyAdvancedFilters;
    });

    beforeEach(() => {
        // Reset advancedFilters state from centralized state module
        state.advancedFilters.price = [];
        state.advancedFilters.origin = [];
        state.advancedFilters.status = [];
    });

    test('should return all tools when no filters are set', () => {
        const result = applyAdvancedFilters(sampleTools);
        expect(result).toHaveLength(4);
        expect(result).toEqual(sampleTools);
    });

    test('should filter by price tag (free)', () => {
        state.advancedFilters.price = ['free'];
        const result = applyAdvancedFilters(sampleTools);
        expect(result).toHaveLength(2);
        expect(result.map(t => t.id)).toEqual([1, 3]); // tools with 'free' tag
    });

    test('should filter by price tag (vip)', () => {
        state.advancedFilters.price = ['vip'];
        const result = applyAdvancedFilters(sampleTools);
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe(2);
    });

    test('should filter by origin (国产)', () => {
        state.advancedFilters.origin = ['国产'];
        const result = applyAdvancedFilters(sampleTools);
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe(2);
    });

    test('should filter by origin (海外)', () => {
        state.advancedFilters.origin = ['海外'];
        const result = applyAdvancedFilters(sampleTools);
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe(4);
    });

    test('should filter by status (hot)', () => {
        state.advancedFilters.status = ['hot'];
        const result = applyAdvancedFilters(sampleTools);
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe(1);
    });

    test('should combine multiple filter categories (AND logic)', () => {
        state.advancedFilters.price = ['free'];
        state.advancedFilters.status = ['hot'];
        const result = applyAdvancedFilters(sampleTools);
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe(1); // tool 1 is both free and hot
    });

    test('should return empty array when no tools match', () => {
        state.advancedFilters.price = ['enterprise']; // no tool has this tag
        const result = applyAdvancedFilters(sampleTools);
        expect(result).toHaveLength(0);
    });

    test('should return original array (not mutate) when no filters match', () => {
        const original = [...sampleTools];
        state.advancedFilters.price = ['nonexistent'];
        const result = applyAdvancedFilters(sampleTools);
        expect(result).toHaveLength(0);
        // Original should not be mutated
        expect(sampleTools).toHaveLength(4);
    });

    test('should handle empty tools array', () => {
        state.advancedFilters.price = ['free'];
        const result = applyAdvancedFilters([]);
        expect(result).toHaveLength(0);
    });

    test('should filter by multiple price values (OR logic within category)', () => {
        state.advancedFilters.price = ['free', 'vip'];
        const result = applyAdvancedFilters(sampleTools);
        expect(result).toHaveLength(3); // tools with free OR vip
        expect(result.map(t => t.id)).toEqual([1, 2, 3]);
    });
});

// ---------------------------------------------------------------------------
// renderCategories
// ---------------------------------------------------------------------------

describe('renderCategories', () => {
    let renderCategories;

    beforeAll(async () => {
        const ui = await import('../../js/ui.js');
        renderCategories = ui.renderCategories;
    });

    beforeEach(() => {
        document.body.innerHTML = '<div id="categoryFilter"></div>';
        state.categories = sampleCategories;
    });

    test('should render "全部" button and category buttons', () => {
        renderCategories();
        const container = document.getElementById('categoryFilter');
        const buttons = container.querySelectorAll('.category-btn');
        expect(buttons.length).toBe(sampleCategories.length + 1); // +1 for '全部'
        expect(buttons[0].textContent).toBe('全部');
        expect(buttons[1].textContent).toBe(sampleCategories[0].name);
    });

    test('should set aria attributes', () => {
        renderCategories();
        const container = document.getElementById('categoryFilter');
        expect(container.getAttribute('role')).toBe('navigation');
        expect(container.getAttribute('aria-label')).toBe('工具分类');
    });

    test('should handle missing container', () => {
        document.body.innerHTML = '';
        expect(() => renderCategories()).not.toThrow();
    });
});

// ---------------------------------------------------------------------------
// renderHotTools
// ---------------------------------------------------------------------------

describe('renderHotTools', () => {
    let renderHotTools;

    beforeAll(async () => {
        const ui = await import('../../js/ui.js');
        renderHotTools = ui.renderHotTools;
    });

    beforeEach(() => {
        document.body.innerHTML = '<div id="hotToolsGrid"></div>';
    });

    test('should render hot tools when status=hot tools exist', () => {
        state.tools = [
            { id: 1, name: 'Hot Tool', category: 'writing', icon: 'fa-fire', desc: 'A hot tool', status: 'hot', tags: [] },
            { id: 2, name: 'Normal Tool', category: 'code', icon: 'fa-code', desc: 'Normal', tags: [] }
        ];
        renderHotTools();
        const grid = document.getElementById('hotToolsGrid');
        const cards = grid.querySelectorAll('.hot-tool-card');
        expect(cards.length).toBe(2);
        expect(cards[0].textContent).toContain('Hot Tool');
    });

    test('should supplement with other tools when less than 4 hot tools', () => {
        state.tools = [
            { id: 1, name: 'Hot Tool', category: 'writing', icon: 'fa-fire', desc: 'Hot', status: 'hot', tags: [] },
            { id: 2, name: 'Tool 2', category: 'code', icon: 'fa-code', desc: 'Desc 2', tags: [] },
            { id: 3, name: 'Tool 3', category: 'image', icon: 'fa-image', desc: 'Desc 3', tags: [] },
            { id: 4, name: 'Tool 4', category: 'writing', icon: 'fa-pen', desc: 'Desc 4', tags: [] }
        ];
        renderHotTools();
        const grid = document.getElementById('hotToolsGrid');
        const cards = grid.querySelectorAll('.hot-tool-card');
        expect(cards.length).toBe(4);
    });

    test('should limit to max 8 tools', () => {
        state.tools = Array.from({ length: 15 }, (_, i) => ({
            id: i + 1, name: `Tool ${i + 1}`, category: 'writing',
            icon: 'fa-tool', desc: `Desc ${i + 1}`, tags: []
        }));
        renderHotTools();
        const grid = document.getElementById('hotToolsGrid');
        const cards = grid.querySelectorAll('.hot-tool-card');
        expect(cards.length).toBeLessThanOrEqual(8);
    });

    test('should handle missing container', () => {
        document.body.innerHTML = '';
        expect(() => renderHotTools()).not.toThrow();
    });
});

// ---------------------------------------------------------------------------
// renderStatisticsDashboard
// ---------------------------------------------------------------------------

describe('renderStatisticsDashboard', () => {
    let renderStatisticsDashboard;

    beforeAll(async () => {
        const ui = await import('../../js/ui.js');
        renderStatisticsDashboard = ui.renderStatisticsDashboard;
    });

    beforeEach(() => {
        document.body.innerHTML = `
            <div id="totalToolsCount"></div>
            <div id="categoriesCount"></div>
            <div id="favoritesCount"></div>
            <div id="totalClicksCount"></div>
            <div id="categoryBars"></div>
            <div id="topToolsList"></div>
        `;
        state.tools = sampleTools;
        state.categories = sampleCategories;
        state.favorites = [1, 3];
        state.clickStats = { 1: 10, 2: 5, 3: 0 };
    });

    test('should update stat counts', () => {
        renderStatisticsDashboard();
        expect(document.getElementById('totalToolsCount').textContent).toBe('4');
        expect(document.getElementById('categoriesCount').textContent).toBe('3');
        expect(document.getElementById('favoritesCount').textContent).toBe('2');
        expect(document.getElementById('totalClicksCount').textContent).toBe('15');
    });

    test('should render category bars', () => {
        renderStatisticsDashboard();
        const bars = document.getElementById('categoryBars');
        const items = bars.querySelectorAll('.category-bar-item');
        expect(items.length).toBe(sampleCategories.length);
    });

    test('should render top tools list sorted by clicks', () => {
        renderStatisticsDashboard();
        const list = document.getElementById('topToolsList');
        const items = list.querySelectorAll('.top-tool-item');
        expect(items.length).toBe(4); // 4 tools, all of them
        // First item should have most clicks (id=1 has 10 clicks)
        expect(items[0].textContent).toContain('AI 写作助手');
    });

    test('should handle missing elements gracefully', () => {
        document.body.innerHTML = '';
        expect(() => renderStatisticsDashboard()).not.toThrow();
    });
});

// ---------------------------------------------------------------------------
// renderTools
// ---------------------------------------------------------------------------

describe('renderTools', () => {
    let renderTools;

    beforeAll(async () => {
        const ui = await import('../../js/ui.js');
        renderTools = ui.renderTools;
    });

    beforeEach(() => {
        document.body.innerHTML = '<div id="toolsGrid"></div><input id="mainSearch" />';
        state.categories = sampleCategories;
        state.favorites = [];
    });

    test('should render tool cards into the grid', () => {
        renderTools(sampleTools);
        const grid = document.getElementById('toolsGrid');
        const cards = grid.querySelectorAll('.tool-card');
        expect(cards.length).toBe(sampleTools.length);
    });

    test('should render empty state when no tools match search', () => {
        // Set search term to trigger empty state
        const searchInput = document.getElementById('mainSearch');
        searchInput.value = 'nonexistent';
        renderTools([]);
        const grid = document.getElementById('toolsGrid');
        expect(grid.innerHTML).toContain('未找到相关工具');
        expect(grid.innerHTML).toContain('nonexistent');
    });

    test('should render empty grid without search term', () => {
        renderTools([]);
        const grid = document.getElementById('toolsGrid');
        const cards = grid.querySelectorAll('.tool-card');
        expect(cards.length).toBe(0);
    });

    test('should handle missing grid element', () => {
        document.body.innerHTML = '';
        expect(() => renderTools(sampleTools)).not.toThrow();
    });
});

// ---------------------------------------------------------------------------
// filterCategory
// ---------------------------------------------------------------------------

describe('filterCategory', () => {
    let filterCategory;

    beforeAll(async () => {
        const ui = await import('../../js/ui.js');
        filterCategory = ui.filterCategory;
    });

    beforeEach(() => {
        document.body.innerHTML = `
            <div id="categoryFilter">
                <button class="category-btn" data-category="all">全部</button>
                <button class="category-btn" data-category="writing">写作</button>
                <button class="category-btn" data-category="image">图像</button>
            </div>
        `;
        state.currentCategory = 'all';
        localStorage.clear();
    });

    test('should update currentCategory in state', () => {
        filterCategory('writing');
        expect(state.currentCategory).toBe('writing');
    });

    test('should persist category to localStorage', () => {
        filterCategory('writing');
        expect(localStorage.getItem('ai-tool-hub-filter-category')).toBe('writing');
    });

    test('should update active class on buttons', () => {
        filterCategory('writing');
        const buttons = document.querySelectorAll('.category-btn');
        expect(buttons[0].classList.contains('active')).toBe(false); // 'all'
        expect(buttons[1].classList.contains('active')).toBe(true);  // 'writing'
        expect(buttons[2].classList.contains('active')).toBe(false); // 'image'
    });
});

// ---------------------------------------------------------------------------
// setCurrentSort
// ---------------------------------------------------------------------------

describe('setCurrentSort', () => {
    let setCurrentSort;

    beforeAll(async () => {
        const ui = await import('../../js/ui.js');
        setCurrentSort = ui.setCurrentSort;
    });

    test('should update currentSort', () => {
        setCurrentSort('hot');
        // currentSort is internal to ui.js, test via side effects
        // We can verify it doesn't throw
        expect(() => setCurrentSort('default')).not.toThrow();
        expect(() => setCurrentSort('name-asc')).not.toThrow();
    });
});

// ---------------------------------------------------------------------------
// loadSavedFilters
// ---------------------------------------------------------------------------

describe('loadSavedFilters', () => {
    let loadSavedFilters;

    beforeAll(async () => {
        const ui = await import('../../js/ui.js');
        loadSavedFilters = ui.loadSavedFilters;
    });

    beforeEach(() => {
        localStorage.clear();
        document.body.innerHTML = '<input id="mainSearch" />';
    });

    test('should load saved category from localStorage', () => {
        jest.useFakeTimers();
        localStorage.setItem('ai-tool-hub-filter-category', 'writing');
        state.currentCategory = 'all';
        loadSavedFilters();
        jest.advanceTimersByTime(1000);
        expect(state.currentCategory).toBe('writing');
        jest.useRealTimers();
    });

    test('should handle missing saved category gracefully', () => {
        state.currentCategory = 'all';
        expect(() => loadSavedFilters()).not.toThrow();
    });
});

// ---------------------------------------------------------------------------
// clearSearch
// ---------------------------------------------------------------------------

describe('clearSearch', () => {
    let clearSearch;

    beforeAll(async () => {
        const ui = await import('../../js/ui.js');
        clearSearch = ui.clearSearch;
    });

    beforeEach(() => {
        document.body.innerHTML = '<input id="mainSearch" value="test search" />';
    });

    test('should clear search input value', () => {
        clearSearch();
        const input = document.getElementById('mainSearch');
        expect(input.value).toBe('');
    });
});

// ---------------------------------------------------------------------------
// toggleAdvancedFilter
// ---------------------------------------------------------------------------

describe('toggleAdvancedFilter', () => {
    let toggleAdvancedFilter;

    beforeAll(async () => {
        const ui = await import('../../js/ui.js');
        toggleAdvancedFilter = ui.toggleAdvancedFilter;
    });

    beforeEach(() => {
        state.advancedFilters.price = [];
        state.advancedFilters.origin = [];
        state.advancedFilters.status = [];
    });

    test('should add value when checked is true', () => {
        toggleAdvancedFilter('price', 'free', true);
        expect(state.advancedFilters.price).toContain('free');
    });

    test('should remove value when checked is false', () => {
        state.advancedFilters.price = ['free', 'vip'];
        toggleAdvancedFilter('price', 'free', false);
        expect(state.advancedFilters.price).not.toContain('free');
        expect(state.advancedFilters.price).toContain('vip');
    });

    test('should handle origin and status filters', () => {
        toggleAdvancedFilter('origin', '国产', true);
        toggleAdvancedFilter('status', 'hot', true);
        expect(state.advancedFilters.origin).toContain('国产');
        expect(state.advancedFilters.status).toContain('hot');
    });
});
