// UI 工具函数
export function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) {
        // 如果没有找到toast元素，创建一个临时的
        const tempToast = document.createElement('div');
        tempToast.id = 'toast';
        tempToast.className = 'fixed bottom-4 left-1/2 -translate-x-1/2 px-6 py-3 bg-gray-800 text-white rounded-lg shadow-lg z-50 show';
        tempToast.textContent = message;
        document.body.appendChild(tempToast);
        setTimeout(() => {
            tempToast.remove();
        }, 3000);
        return;
    }
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

export function closeModal(event, modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    if (!event || event.target === modal) {
        modal.classList.remove('active');
    }
}

export function updateUI() {
    // 这里可以添加其他 UI 更新逻辑
}

// 从 tools.js 导入
let closeDetail;
let clearSearch;

export function setExternalFunctions(closeDetailFn, clearSearchFn) {
    closeDetail = closeDetailFn;
    clearSearch = clearSearchFn;
}

// 关闭用户菜单（点击外部时）
document.addEventListener('click', (e) => {
    if (!e.target.closest('#userBtn') && !e.target.closest('#userMenu')) {
        document.getElementById('userMenu').classList.remove('show');
    }
});

// 键盘快捷键
document.addEventListener('keydown', (e) => {
    // / or S to focus search
    if ((e.key === '/' || e.key === 's' || e.key === 'S') && !e.metaKey && !e.ctrlKey) {
        const activeElement = document.activeElement;
        if (activeElement.tagName !== 'INPUT' && activeElement.tagName !== 'TEXTAREA') {
            e.preventDefault();
            document.getElementById('searchInput').focus();
        }
    }
    
    // ESC to close modals and clear search
    if (e.key === 'Escape') {
        if (document.getElementById('detailPage').classList.contains('show') && closeDetail) {
            closeDetail();
        } else if (document.querySelector('.modal.active')) {
            document.querySelectorAll('.modal.active').forEach(m => m.classList.remove('active'));
        } else if (clearSearch) {
            clearSearch();
        }
    }
    
    // Ctrl/Cmd + K for command palette (future feature)
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        showToast('快捷键：/ 搜索 | ESC 关闭 | C 对比模式');
    }
});

// 全局错误处理
window.addEventListener('error', (e) => {
    console.error('Global error:', e);
    showToast('页面出现错误，请刷新重试');
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled rejection:', e);
    showToast('网络请求失败，请检查连接');
});
