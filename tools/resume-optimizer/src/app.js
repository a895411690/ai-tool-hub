/**
 * AI Resume Optimizer - Main Application
 * Entry point for the resume optimizer tool
 */

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 AI Resume Optimizer initialized');
    
    // Components are auto-initialized by their respective scripts
    // - resumeForm
    // - resumePreview
    // - store (with auto-load from localStorage)
    
    // Setup keyboard shortcuts
    setupKeyboardShortcuts();
    
    // Setup auto-save indicator
    setupAutoSaveIndicator();
    
    // Welcome message for first-time users
    showWelcomeMessage();
});

// Keyboard shortcuts
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + S to save
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            store.save();
            showNotification('已保存到本地', 'success');
        }
        
        // Ctrl/Cmd + P to preview PDF
        if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
            e.preventDefault();
            pdfGenerator.preview();
        }
        
        // Esc to close AI panel
        if (e.key === 'Escape') {
            aiOptimizer.closePanel();
        }
    });
}

// Auto-save indicator
function setupAutoSaveIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'autoSaveIndicator';
    indicator.className = 'fixed bottom-4 left-4 px-3 py-1.5 bg-gray-800 text-gray-400 text-xs rounded-lg opacity-0 transition-opacity';
    indicator.innerHTML = '<i class="fas fa-check-circle text-green-500 mr-1"></i> 已自动保存';
    document.body.appendChild(indicator);
    
    // Show indicator when state changes
    let saveTimeout;
    store.subscribe(() => {
        indicator.style.opacity = '1';
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            indicator.style.opacity = '0';
        }, 2000);
    });
}

// Welcome message
function showWelcomeMessage() {
    const hasVisited = localStorage.getItem('resumeOptimizerVisited');
    if (!hasVisited) {
        setTimeout(() => {
            showNotification('欢迎使用 AI 简历优化工具！填写左侧表单，右侧实时预览', 'info');
            localStorage.setItem('resumeOptimizerVisited', 'true');
        }, 1000);
    }
}

// Notification helper
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 fade-in ${
        type === 'success' ? 'bg-green-500' : 
        type === 'error' ? 'bg-red-500' : 'bg-indigo-500'
    } text-white`;
    notification.innerHTML = `
        <div class="flex items-center gap-2">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(10px)';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Export for global access
window.showNotification = showNotification;
