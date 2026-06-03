// Import functions
import { showToast, escapeHtml } from './utils.js';
import state, { updateData } from './state.js';
import { renderCategories, renderHotTools, renderStatisticsDashboard, renderTools, loadSavedFilters } from './ui.js';

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
        
        // Update global tool count for share image

        // Update "上新 N 款" badge — count tools with 'new' tag
        const newToolsCount = data.tools.filter(t => t.tags?.includes('new')).length;
        const newToolsEl = document.getElementById('newToolsCount');
        if (newToolsEl) {
            newToolsEl.textContent = newToolsCount;
            const badge = newToolsEl.closest('.new-tools-badge');
            if (badge) {
                badge.style.display = newToolsCount > 0 ? '' : 'none';
            }
        }
        window.__AI_TOOL_HUB_COUNT__ = data.tools.length;

        // Update global state
        updateData(data.tools, data.categories);
        
        // Render UI using imported functions
        renderCategories();
        renderHotTools();
        renderStatisticsDashboard();
        renderTools(state.tools);
        
        // Hide loading state
        const loadingState = document.getElementById('loadingState');
        if (loadingState) {
            loadingState.classList.add('hidden');
        }

        // Notify dependent modules that tools are ready
        document.dispatchEvent(new CustomEvent('tools:loaded'));
    } catch (error) {
        showToast(`加载失败: ${error.message}`);
        
        const loadingState = document.getElementById('loadingState');
        if (loadingState) {
            loadingState.innerHTML = `
                <div class="text-center">
                    <i class="fas fa-exclamation-circle text-red-500 text-4xl mb-4"></i>
                    <h3 class="text-xl font-bold mb-2">加载失败</h3>
                    <p class="text-gray-400 mb-4">${escapeHtml(error.message)}</p>
                    <button id="retryLoadBtn" class="px-6 py-2 text-white rounded-lg hover:shadow-lg transition-all" style="background: var(--ant-primary);">
                        重试
                    </button>
                </div>
            `;
            const retryBtn = document.getElementById('retryLoadBtn');
            if (retryBtn) {
                retryBtn.addEventListener('click', () => loadTools());
            }
        }
    }
}

// Export functions
export { loadTools };
