// 工具管理
import state from './state.js';
import { showToast, closeModal } from './ui.js';
import { syncToGist, toggleUserMenu } from './user.js';
import { debounce } from './utils.js';

export async function loadTools() {
    const loadingEl = document.getElementById('loadingState');
    const errorEl = document.getElementById('errorState');
    const gridEl = document.getElementById('toolsGrid');
    
    loadingEl.classList.remove('hidden');
    errorEl.classList.add('hidden');
    gridEl.classList.add('hidden');
    
    try {
        const response = await fetch('./tools.json');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        state.allTools = data.tools.map(t => ({...t, rating: state.ratings[t.id] || 0}));
        state.categories = data.categories;
        renderCategories();
        renderTools(state.allTools);
        updateNewToolsCount(data.tools);
        loadingEl.classList.add('hidden');
        gridEl.classList.remove('hidden');
    } catch (error) {
        console.error('Failed to load tools:', error);
        loadingEl.classList.add('hidden');
        errorEl.classList.remove('hidden');
    }
}

export function updateNewToolsCount(tools) {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const newTools = tools.filter(t => new Date(t.updateTime) > sevenDaysAgo);
    document.getElementById('newToolsCount').textContent = newTools.length;
}

export function renderCategories() {
    const container = document.getElementById('categoryFilter');
    const html = `
        <button class="category-btn active px-5 py-2 rounded-full glass text-sm font-medium transition-all" data-category="all" onclick="filterCategory('all')">全部</button>
        ${state.categories.map(cat => `
            <button class="category-btn px-5 py-2 rounded-full glass text-sm font-medium transition-all" data-category="${cat.id}" onclick="filterCategory('${cat.id}')">${cat.name}</button>
        `).join('')}
    `;
    container.innerHTML = html;
}

export function renderTools(tools) {
    const grid = document.getElementById('toolsGrid');
    const emptyEl = document.getElementById('emptyState');
    
    if (tools.length === 0) {
        grid.classList.add('hidden');
        emptyEl.classList.remove('hidden');
        return;
    }
    
    grid.classList.remove('hidden');
    emptyEl.classList.add('hidden');
    
    // 使用 DocumentFragment 优化 DOM 操作
    const fragment = document.createDocumentFragment();
    
    tools.forEach(tool => {
        const toolElement = document.createElement('div');
        toolElement.className = 'glass-card rounded-2xl p-5 group cursor-pointer hover:neon-border transition-all';
        toolElement.onclick = () => showToolDetail(tool.id);
        
        const compareButton = state.compareMode ? `
            <button onclick="event.stopPropagation(); toggleCompare(${tool.id})" class="w-8 h-8 rounded-full ${state.compareList.includes(tool.id) ? 'bg-indigo-500' : 'glass'} flex items-center justify-center">
                ${state.compareList.includes(tool.id) ? '<i class="fas fa-check text-white text-xs"></i>' : '<i class="fas fa-plus text-gray-400 text-xs"></i>'}
            </button>
        ` : `
            <button onclick="event.stopPropagation(); toggleFavorite(${tool.id})" class="text-gray-500 hover:text-red-500 transition-all">
                <i class="${state.favorites.includes(tool.id) ? 'fas text-red-500' : 'far'} fa-heart"></i>
            </button>
        `;
        
        toolElement.innerHTML = `
            <div class="flex items-start justify-between mb-3">
                <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 flex items-center justify-center">
                    <i class="fas ${tool.icon} text-xl text-indigo-400"></i>
                </div>
                ${compareButton}
            </div>
            <h3 class="font-semibold mb-1">${tool.name}</h3>
            <p class="text-sm text-gray-500 mb-3 line-clamp-2">${tool.desc}</p>
            <div class="flex items-center gap-2 flex-wrap">
                ${tool.tags.map(tag => `<span class="px-2 py-0.5 rounded-full text-xs glass">${tag}</span>`).join('')}
            </div>
        `;
        
        fragment.appendChild(toolElement);
    });
    
    // 清空网格并添加新内容
    grid.innerHTML = '';
    grid.appendChild(fragment);
}

export function filterCategory(category) {
    state.currentCategory = category;
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.category === category);
    });
    const filtered = category === 'all' ? state.allTools : state.allTools.filter(t => t.category === category);
    renderTools(filtered);
}

// 使用防抖函数优化搜索性能
export const handleSearch = debounce((query) => {
    if (!query) {
        filterCategory(state.currentCategory);
        return;
    }
    const filtered = state.allTools.filter(t => 
        t.name.toLowerCase().includes(query.toLowerCase()) ||
        t.desc.toLowerCase().includes(query.toLowerCase())
    );
    renderTools(filtered);
}, 300);

export function clearSearch() {
    document.getElementById('searchInput').value = '';
    filterCategory(state.currentCategory);
}

export function sortTools(sortBy) {
    let sorted = [...state.allTools];
    switch(sortBy) {
    case 'rating':
        sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
    case 'new':
        sorted.sort((a, b) => new Date(b.updateTime) - new Date(a.updateTime));
        break;
    case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
    default:
        sorted.sort((a, b) => (b.visits || 0) - (a.visits || 0));
    }
    renderTools(sorted);
}

// 对比功能
export function toggleCompareMode() {
    state.compareMode = !state.compareMode;
    filterCategory(state.currentCategory);
    if (!state.compareMode) {
        clearCompare();
    }
}

export function toggleCompare(toolId) {
    if (state.compareList.includes(toolId)) {
        state.compareList = state.compareList.filter(id => id !== toolId);
    } else if (state.compareList.length < 3) {
        state.compareList.push(toolId);
    } else {
        showToast('最多对比3款工具');
        return;
    }
    updateCompareBar();
    renderTools(state.currentCategory === 'all' ? state.allTools : state.allTools.filter(t => t.category === state.currentCategory));
}

export function updateCompareBar() {
    const bar = document.getElementById('compareBar');
    const count = document.getElementById('compareCount');
    const items = document.getElementById('compareItems');
    
    if (state.compareList.length > 0) {
        bar.classList.add('show');
        count.textContent = state.compareList.length;
        items.innerHTML = state.compareList.map(id => {
            const tool = state.allTools.find(t => t.id === id);
            return `<span class="px-2 py-1 rounded-full glass text-xs">${tool?.name || ''}</span>`;
        }).join('');
    } else {
        bar.classList.remove('show');
    }
}

export function clearCompare() {
    state.compareList = [];
    updateCompareBar();
    renderTools(state.currentCategory === 'all' ? state.allTools : state.allTools.filter(t => t.category === state.currentCategory));
}

export function startCompare() {
    if (state.compareList.length < 2) {
        showToast('请至少选择2款工具');
        return;
    }
    
    const tools = state.compareList.map(id => state.allTools.find(t => t.id === id));
    const content = document.getElementById('compareContent');
    
    content.innerHTML = `
        <div class="overflow-x-auto">
            <table class="w-full">
                <thead>
                    <tr>
                        <th class="text-left p-4 text-gray-400 font-medium">对比项</th>
                        ${tools.map(tool => `
                            <th class="p-4 text-center min-w-[200px]">
                                <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 flex items-center justify-center mx-auto mb-3">
                                    <i class="fas ${tool.icon} text-3xl text-indigo-400"></i>
                                </div>
                                <h4 class="font-semibold">${tool.name}</h4>
                            </th>
                        `).join('')}
                    </tr>
                </thead>
                <tbody class="text-sm">
                    <tr class="border-t border-gray-700">
                        <td class="p-4 text-gray-400">简介</td>
                        ${tools.map(tool => `<td class="p-4 text-center text-gray-300">${tool.desc}</td>`).join('')}
                    </tr>
                    <tr class="border-t border-gray-700">
                        <td class="p-4 text-gray-400">分类</td>
                        ${tools.map(tool => {
        const cat = state.categories.find(c => c.id === tool.category);
        return `<td class="p-4 text-center">${cat?.name || tool.category}</td>`;
    }).join('')}
                    </tr>
                    <tr class="border-t border-gray-700">
                        <td class="p-4 text-gray-400">标签</td>
                        ${tools.map(tool => `
                            <td class="p-4 text-center">
                                <div class="flex flex-wrap justify-center gap-1">
                                    ${tool.tags.map(tag => `<span class="px-2 py-0.5 rounded-full glass text-xs">${tag}</span>`).join('')}
                                </div>
                            </td>
                        `).join('')}
                    </tr>
                    <tr class="border-t border-gray-700">
                        <td class="p-4 text-gray-400">状态</td>
                        ${tools.map(tool => `<td class="p-4 text-center">${tool.status || '稳定'}</td>`).join('')}
                    </tr>
                    <tr class="border-t border-gray-700">
                        <td class="p-4 text-gray-400">难度</td>
                        ${tools.map(tool => `<td class="p-4 text-center">${tool.difficulty || '简单'}</td>`).join('')}
                    </tr>
                    <tr class="border-t border-gray-700">
                        <td class="p-4 text-gray-400">更新时间</td>
                        ${tools.map(tool => `<td class="p-4 text-center">${tool.updateTime || '2024'}</td>`).join('')}
                    </tr>
                    <tr class="border-t border-gray-700">
                        <td class="p-4 text-gray-400">操作</td>
                        ${tools.map(tool => `
                            <td class="p-4 text-center">
                                <a href="${tool.url}" target="_blank" class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-sm hover:opacity-90 transition-all">
                                    <i class="fas fa-external-link-alt"></i> 访问
                                </a>
                            </td>
                        `).join('')}
                    </tr>
                </tbody>
            </table>
        </div>
    `;
    
    document.getElementById('compareModal').classList.add('active');
}

// 工具提交
export function handleSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    
    const submission = {
        id: Date.now(),
        name: formData.get('name'),
        url: formData.get('url'),
        category: formData.get('category'),
        difficulty: formData.get('difficulty'),
        desc: formData.get('desc'),
        tags: formData.get('tags')?.split(',').map(t => t.trim()).filter(Boolean) || [],
        submitTime: new Date().toISOString(),
        status: 'pending'
    };
    
    // 数据验证
    if (!submission.name || !submission.url || !submission.category) {
        showToast('请填写必填字段');
        return;
    }
    
    // 验证 URL 格式
    try {
        new URL(submission.url);
    } catch {
        showToast('请输入有效的 URL');
        return;
    }
    
    // Save to localStorage
    const submissions = JSON.parse(localStorage.getItem('toolSubmissions') || '[]');
    submissions.push(submission);
    localStorage.setItem('toolSubmissions', JSON.stringify(submissions));
    
    showToast('工具提交成功，等待审核！');
    closeModal(null, 'submitModal');
    form.reset();
}

export function showSubmitModal() {
    document.getElementById('submitModal').classList.add('active');
}

// 收藏功能
export function toggleFavorite(toolId) {
    if (state.favorites.includes(toolId)) {
        state.favorites = state.favorites.filter(id => id !== toolId);
        showToast('已取消收藏');
    } else {
        state.favorites.push(toolId);
        showToast('已收藏');
    }
    localStorage.setItem('favorites', JSON.stringify(state.favorites));
    renderTools(state.currentCategory === 'all' ? state.allTools : state.allTools.filter(t => t.category === state.currentCategory));
    if (state.user) syncToGist();
}

// 工具详情
export function showToolDetail(toolId) {
    const tool = state.allTools.find(t => t.id === toolId);
    if (!tool) return;
    
    // Add to history
    if (!state.history.includes(toolId)) {
        state.history.unshift(toolId);
        state.history = state.history.slice(0, 50);
        localStorage.setItem('history', JSON.stringify(state.history));
    }
    
    const page = document.getElementById('detailPage');
    const content = document.getElementById('detailContent');
    
    content.innerHTML = `
        <div class="mb-6">
            <div class="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 flex items-center justify-center mb-4">
                <i class="fas ${tool.icon} text-4xl text-indigo-400"></i>
            </div>
            <h1 class="text-3xl font-bold mb-2">${tool.name}</h1>
            <p class="text-gray-400">${tool.desc}</p>
        </div>
        
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div class="glass-card rounded-xl p-4 text-center">
                <i class="fas fa-star text-yellow-500 mb-2"></i>
                <p class="text-lg font-semibold">${tool.rating || '暂无'}</p>
                <p class="text-xs text-gray-500">评分</p>
            </div>
            <div class="glass-card rounded-xl p-4 text-center">
                <i class="fas fa-tag text-green-500 mb-2"></i>
                <p class="text-lg font-semibold">${tool.status || '稳定'}</p>
                <p class="text-xs text-gray-500">状态</p>
            </div>
            <div class="glass-card rounded-xl p-4 text-center">
                <i class="fas fa-layer-group text-blue-500 mb-2"></i>
                <p class="text-lg font-semibold">${tool.difficulty || '简单'}</p>
                <p class="text-xs text-gray-500">难度</p>
            </div>
            <div class="glass-card rounded-xl p-4 text-center">
                <i class="fas fa-calendar text-purple-500 mb-2"></i>
                <p class="text-lg font-semibold">${tool.updateTime || '2024'}</p>
                <p class="text-xs text-gray-500">更新</p>
            </div>
        </div>
        
        <div class="space-y-4 mb-6">
            <div class="glass-card rounded-xl p-4">
                <h3 class="font-semibold mb-2">功能标签</h3>
                <div class="flex flex-wrap gap-2">
                    ${tool.tags.map(tag => `<span class="px-3 py-1 rounded-full glass text-sm">${tag}</span>`).join('')}
                    ${(tool.toolTags || []).map(tag => `<span class="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-sm">${tag}</span>`).join('')}
                </div>
            </div>
            
            <div class="glass-card rounded-xl p-4">
                <h3 class="font-semibold mb-2">使用小贴士</h3>
                <ul class="text-sm text-gray-400 space-y-1">
                    <li>• 点击访问官网开始体验</li>
                    <li>• 部分工具需要注册账号</li>
                    <li>• 建议收藏方便下次使用</li>
                </ul>
            </div>
        </div>
        
        <div class="space-y-4 mb-6">
            <div class="glass-card rounded-xl p-4">
                <h3 class="font-semibold mb-3">用户评分</h3>
                <div class="flex items-center gap-4">
                    <div class="flex items-center gap-1" id="ratingStars">
                        ${Array(5).fill(0).map((_, i) => `
                            <button onclick="rateTool(${tool.id}, ${i + 1})" class="text-2xl hover:scale-110 transition-all ${i < (state.ratings[tool.id] || 0) ? 'text-yellow-500' : 'text-gray-600'}">
                                <i class="fas fa-star"></i>
                            </button>
                        `).join('')}
                    </div>
                    <span class="text-sm text-gray-500" id="ratingText">${state.ratings[tool.id] ? `你的评分: ${state.ratings[tool.id]}星` : '点击星星评分'}</span>
                </div>
            </div>
            
            <div class="glass-card rounded-xl p-4">
                <h3 class="font-semibold mb-3">私人笔记</h3>
                <textarea id="toolNote" rows="3" class="w-full px-4 py-3 rounded-xl glass bg-transparent text-sm resize-none focus:border-primary outline-none" placeholder="记录使用心得...">${state.notes[tool.id] || ''}</textarea>
                <button onclick="saveNote(${tool.id})" class="mt-3 w-full py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-sm font-medium hover:opacity-90 transition-all">
                    保存笔记
                </button>
            </div>
        </div>
        
        ${tool.relatedTools && tool.relatedTools.length > 0 ? `
            <div class="mb-6">
                <h3 class="font-semibold mb-4">同类推荐</h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    ${tool.relatedTools.map(id => {
        const related = state.allTools.find(t => t.id === id);
        return related ? `
                            <div class="glass-card rounded-xl p-3 cursor-pointer hover:border-primary transition-all" onclick="closeDetail(); showToolDetail(${related.id});">
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-600/20 flex items-center justify-center">
                                        <i class="fas ${related.icon} text-lg text-indigo-400"></i>
                                    </div>
                                    <div class="flex-1 min-w-0">
                                        <h4 class="font-medium text-sm truncate">${related.name}</h4>
                                        <p class="text-xs text-gray-500 truncate">${related.desc}</p>
                                    </div>
                                </div>
                            </div>
                        ` : '';
    }).join('')}
                </div>
            </div>
        ` : ''}
        
        <a href="${tool.url}" target="_blank" class="block w-full py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-center font-semibold hover:opacity-90 transition-all">
            <i class="fas fa-external-link-alt mr-2"></i>访问官网
        </a>
    `;
    
    page.classList.add('show');
    updateDetailFavIcon(toolId);
}

export function closeDetail() {
    document.getElementById('detailPage').classList.remove('show');
}

export function updateDetailFavIcon(toolId) {
    const icon = document.getElementById('detailFavIcon');
    if (icon) {
        icon.className = state.favorites.includes(toolId) ? 'fas fa-heart text-red-500' : 'far fa-heart';
    }
}

export function toggleFavoriteCurrent() {
    // Get current tool ID from detail page
    const detailContent = document.getElementById('detailContent');
    const toolName = detailContent.querySelector('h1')?.textContent;
    if (toolName) {
        const tool = state.allTools.find(t => t.name === toolName);
        if (tool) {
            toggleFavorite(tool.id);
            updateDetailFavIcon(tool.id);
        }
    }
}

export function shareCurrentTool() {
    const detailContent = document.getElementById('detailContent');
    const toolName = detailContent.querySelector('h1')?.textContent;
    if (toolName) {
        const tool = state.allTools.find(t => t.name === toolName);
        if (tool) {
            const shareText = `推荐一个超棒的AI工具：${tool.name} - ${tool.desc}`;
            if (navigator.share) {
                navigator.share({
                    title: tool.name,
                    text: shareText,
                    url: tool.url
                });
            } else {
                navigator.clipboard.writeText(`${shareText}\n${tool.url}`);
                showToast('链接已复制到剪贴板');
            }
        }
    }
}

export function rateTool(toolId, rating) {
    state.ratings[toolId] = rating;
    localStorage.setItem('ratings', JSON.stringify(state.ratings));
    
    // Update UI
    const stars = document.querySelectorAll('#ratingStars button');
    stars.forEach((btn, idx) => {
        btn.className = `text-2xl hover:scale-110 transition-all ${idx < rating ? 'text-yellow-500' : 'text-gray-600'}`;
    });
    document.getElementById('ratingText').textContent = `你的评分: ${rating}星`;
    
    showToast(`已评分: ${rating}星`);
    if (state.user) syncToGist();
}

export function saveNote(toolId) {
    const note = document.getElementById('toolNote').value.trim();
    if (note) {
        state.notes[toolId] = note;
        showToast('笔记已保存');
    } else {
        delete state.notes[toolId];
        showToast('笔记已删除');
    }
    localStorage.setItem('notes', JSON.stringify(state.notes));
    if (state.user) syncToGist();
}

// 个人资料
export function showProfile() {
    updateProfileStats();
    document.getElementById('profileModal').classList.add('active');
    toggleUserMenu();
}

export function updateProfileStats() {
    document.getElementById('statFavorites').textContent = state.favorites.length;
    document.getElementById('statVisited').textContent = state.history.length;
    document.getElementById('statRated').textContent = Object.keys(state.ratings).length;
    document.getElementById('statNotes').textContent = Object.keys(state.notes).length;
    
    if (state.user) {
        document.getElementById('profileAvatar').src = state.user.avatar_url;
        document.getElementById('profileName').textContent = state.user.login;
        document.getElementById('profileEmail').textContent = state.user.email || 'GitHub用户';
    }
}

export function showSection(section) {
    const content = document.getElementById('detailContent');
    const page = document.getElementById('detailPage');
    
    let html = '';
    switch(section) {
    case 'favorites': {
        const favTools = state.favorites.map(id => state.allTools.find(t => t.id === id)).filter(Boolean);
        html = `
                <div class="mb-6">
                    <h2 class="text-2xl font-bold mb-4">我的收藏</h2>
                    ${favTools.length === 0 ? '<p class="text-gray-500 text-center py-8">暂无收藏工具</p>' : `
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            ${favTools.map(tool => `
                                <div class="glass-card rounded-xl p-4 cursor-pointer" onclick="closeDetail(); showToolDetail(${tool.id});">
                                    <div class="flex items-center gap-3">
                                        <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 flex items-center justify-center">
                                            <i class="fas ${tool.icon} text-xl text-indigo-400"></i>
                                        </div>
                                        <div class="flex-1">
                                            <h4 class="font-semibold">${tool.name}</h4>
                                            <p class="text-xs text-gray-500 line-clamp-1">${tool.desc}</p>
                                        </div>
                                        <button onclick="event.stopPropagation(); toggleFavorite(${tool.id}); showSection('favorites');" class="text-red-500">
                                            <i class="fas fa-heart"></i>
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>
            `;
        break;
    }
    case 'history': {
        const histTools = state.history.map(id => state.allTools.find(t => t.id === id)).filter(Boolean);
        html = `
                <div class="mb-6">
                    <h2 class="text-2xl font-bold mb-4">浏览足迹</h2>
                    ${histTools.length === 0 ? '<p class="text-gray-500 text-center py-8">暂无浏览记录</p>' : `
                        <div class="space-y-3">
                            ${histTools.map((tool, idx) => `
                                <div class="glass-card rounded-xl p-4 flex items-center gap-3 cursor-pointer" onclick="closeDetail(); showToolDetail(${tool.id});">
                                    <span class="text-2xl font-bold text-gray-700">${idx + 1}</span>
                                    <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-600/20 flex items-center justify-center">
                                        <i class="fas ${tool.icon} text-lg text-indigo-400"></i>
                                    </div>
                                    <div class="flex-1">
                                        <h4 class="font-medium">${tool.name}</h4>
                                        <p class="text-xs text-gray-500">${tool.desc}</p>
                                    </div>
                                    <i class="fas fa-chevron-right text-gray-500"></i>
                                </div>
                            `).join('')}
                        </div>
                    `}
                    ${histTools.length > 0 ? '<button onclick="clearHistory()" class="mt-4 w-full py-3 rounded-xl glass text-red-400 hover:bg-red-500/10 transition-all">清空足迹</button>' : ''}
                </div>
            `;
        break;
    }
    case 'ratings': {
        const ratedTools = Object.entries(state.ratings).map(([id, rating]) => {
            const tool = state.allTools.find(t => t.id === parseInt(id));
            return tool ? { ...tool, userRating: rating } : null;
        }).filter(Boolean);
        html = `
                <div class="mb-6">
                    <h2 class="text-2xl font-bold mb-4">我的评分</h2>
                    ${ratedTools.length === 0 ? '<p class="text-gray-500 text-center py-8">暂无评分记录</p>' : `
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            ${ratedTools.map(tool => `
                                <div class="glass-card rounded-xl p-4 cursor-pointer" onclick="closeDetail(); showToolDetail(${tool.id});">
                                    <div class="flex items-center gap-3">
                                        <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 flex items-center justify-center">
                                            <i class="fas ${tool.icon} text-xl text-indigo-400"></i>
                                        </div>
                                        <div class="flex-1">
                                            <h4 class="font-semibold">${tool.name}</h4>
                                            <div class="flex items-center gap-1 mt-1">
                                                ${Array(5).fill(0).map((_, i) => `<i class="fas fa-star ${i < tool.userRating ? 'text-yellow-500' : 'text-gray-600'} text-xs"></i>`).join('')}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>
            `;
        break;
    }
    case 'notes': {
        const notesTools = Object.entries(state.notes).map(([id, note]) => {
            const tool = state.allTools.find(t => t.id === parseInt(id));
            return tool ? { ...tool, note } : null;
        }).filter(Boolean);
        html = `
                <div class="mb-6">
                    <h2 class="text-2xl font-bold mb-4">私人笔记</h2>
                    ${notesTools.length === 0 ? '<p class="text-gray-500 text-center py-8">暂无笔记</p>' : `
                        <div class="space-y-4">
                            ${notesTools.map(tool => `
                                <div class="glass-card rounded-xl p-4">
                                    <div class="flex items-center gap-3 mb-3">
                                        <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-600/20 flex items-center justify-center">
                                            <i class="fas ${tool.icon} text-lg text-indigo-400"></i>
                                        </div>
                                        <h4 class="font-semibold">${tool.name}</h4>
                                    </div>
                                    <p class="text-sm text-gray-400 bg-black/20 rounded-lg p-3">${tool.note}</p>
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>
            `;
        break;
    }
    }
    
    content.innerHTML = html;
    page.classList.add('show');
    closeModal(null, 'profileModal');
}

export function clearHistory() {
    state.history = [];
    localStorage.setItem('history', JSON.stringify(state.history));
    showSection('history');
    showToast('足迹已清空');
}

// 推荐功能
export function generateRecommendations() {
    if (state.allTools.length === 0) return;
    
    let recs = [];
    
    // Based on favorites
    if (state.favorites.length > 0) {
        const favCategories = state.favorites.map(id => {
            const tool = state.allTools.find(t => t.id === id);
            return tool?.category;
        }).filter(Boolean);
        
        const categoryCount = {};
        favCategories.forEach(cat => categoryCount[cat] = (categoryCount[cat] || 0) + 1);
        const topCategory = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0]?.[0];
        
        if (topCategory) {
            const similarTools = state.allTools.filter(t => 
                t.category === topCategory && !state.favorites.includes(t.id)
            ).slice(0, 3);
            recs.push(...similarTools.map(t => ({ ...t, reason: '根据收藏推荐' })));
        }
    }
    
    // Based on history
    if (state.history.length > 0 && recs.length < 4) {
        const recentTools = state.history.slice(0, 3).map(id => {
            return state.allTools.find(t => t.id === id);
        }).filter(Boolean);
        
        recentTools.forEach(tool => {
            if (!recs.find(r => r.id === tool.id)) {
                recs.push({ ...tool, reason: '最近浏览' });
            }
        });
    }
    
    // Popular tools
    if (recs.length < 4) {
        const popular = state.allTools
            .filter(t => !state.favorites.includes(t.id) && !recs.find(r => r.id === t.id))
            .sort((a, b) => (b.visits || 0) - (a.visits || 0))
            .slice(0, 4 - recs.length)
            .map(t => ({ ...t, reason: '热门工具' }));
        recs.push(...popular);
    }
    
    return recs.slice(0, 4);
}

export function renderRecommendations() {
    const recs = generateRecommendations();
    const container = document.getElementById('personalizedRecs');
    const tagsContainer = document.getElementById('recTags');
    
    if (recs.length === 0) {
        container.classList.add('hidden');
        return;
    }
    
    container.classList.remove('hidden');
    tagsContainer.innerHTML = recs.map(tool => `
        <button onclick="showToolDetail(${tool.id})" class="flex items-center gap-2 px-4 py-2 rounded-full glass hover:border-primary transition-all text-sm">
            <i class="fas ${tool.icon} text-indigo-400"></i>
            <span>${tool.name}</span>
            <span class="text-xs text-gray-500">${tool.reason}</span>
        </button>
    `).join('');
}

export function showRandomTool() {
    if (state.allTools.length === 0) return;
    const randomTool = state.allTools[Math.floor(Math.random() * state.allTools.length)];
    showToolDetail(randomTool.id);
    showToast(`随机推荐：${randomTool.name}`);
}
