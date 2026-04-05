/**
 * AI Resume Optimizer - Main Application
 * Entry point for the resume optimizer tool
 */

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 AI Resume Optimizer initialized');

    // 组件由各自的脚本自动初始化
    // - resumeForm
    // - resumePreview
    // - store（自动从 localStorage 加载）

    setupKeyboardShortcuts();
    setupAutoSaveIndicator();
    showWelcomeMessage();
});

// 键盘快捷键
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + S 保存
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            store.save();
            showNotification('已保存到本地', 'success');
        }

        // Ctrl/Cmd + P 预览 PDF
        if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
            e.preventDefault();
            pdfGenerator.preview();
        }

        // Esc 关闭 AI 面板
        if (e.key === 'Escape') {
            aiOptimizer.closePanel();
        }
    });
}

// 自动保存指示器
function setupAutoSaveIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'autoSaveIndicator';
    indicator.className = 'fixed bottom-4 left-4 px-3 py-1.5 bg-gray-800 text-gray-400 text-xs rounded-lg opacity-0 transition-opacity';
    indicator.innerHTML = '<i class="fas fa-check-circle text-green-500 mr-1"></i> 已自动保存';
    document.body.appendChild(indicator);

    let saveTimeout;
    store.subscribe(() => {
        indicator.style.opacity = '1';
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            indicator.style.opacity = '0';
        }, 2000);
    });
}

// 欢迎消息
function showWelcomeMessage() {
    const hasVisited = localStorage.getItem('resumeOptimizerVisited');
    if (!hasVisited) {
        setTimeout(() => {
            showNotification('欢迎使用 AI 简历优化工具！填写左侧表单，右侧实时预览', 'info');
            localStorage.setItem('resumeOptimizerVisited', 'true');
        }, 1000);
    }
}

// 显示通知（使用 DOM API + textContent 防止 XSS）
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 fade-in ${
        type === 'success' ? 'bg-green-500' :
        type === 'error' ? 'bg-red-500' : 'bg-indigo-500'
    } text-white`;

    const wrapper = document.createElement('div');
    wrapper.className = 'flex items-center gap-2';

    const icon = document.createElement('i');
    icon.className = `fas ${
        type === 'success' ? 'fa-check-circle' :
        type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'
    }`;
    wrapper.appendChild(icon);

    const textSpan = document.createElement('span');
    textSpan.textContent = message; // 安全：使用 textContent
    wrapper.appendChild(textSpan);

    notification.appendChild(wrapper);
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(10px)';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// 导出为全局访问
window.showNotification = showNotification;
