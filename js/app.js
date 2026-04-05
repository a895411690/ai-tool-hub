// Import functions
import { showToast, escapeHtml, escapeAttr } from './utils.js';
import state, { updateData } from './state.js';

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
        
        // Update global state
        updateData(data.tools, data.categories);
        
        // Import render functions dynamically to avoid circular dependencies
        const { renderCategories, renderTools } = await import('./ui.js');
        
        // Render UI using imported functions
        renderCategories();
        renderTools(state.tools);
        
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

// Export functions
export { loadTools };
