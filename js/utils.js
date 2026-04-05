// Import functions
import { clearSearch } from './ui.js';
import { closeShareModal } from './share.js';

/** @constant {number} Maximum number of search history items to store */
const MAX_SEARCH_HISTORY = 10;

/** @constant {number} Time in milliseconds to display toast messages */
const TOAST_DISPLAY_TIME = 2000;

/** @constant {number} Debounce time in milliseconds for search input */
const SEARCH_DEBOUNCE_TIME = 300;

/**
 * Escape HTML special characters to prevent XSS attacks
 * @param {*} text - Text to escape (will be converted to string)
 * @returns {string} Escaped HTML-safe string
 * @example
 * escapeHtml('<script>alert("xss")</script>')
 * // returns: '&lt;script&gt;alert("xss")&lt;/script&gt;'
 */
function escapeHtml(text) {
    if (typeof text !== 'string') return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Escape HTML attribute special characters
 * @param {*} text - Text to escape for use in HTML attributes
 * @returns {string} Escaped attribute-safe string
 * @example
 * escapeAttr('value"with\'quotes')
 * // returns: 'value&quot;with&#39;quotes'
 */
function escapeAttr(text) {
    if (typeof text !== 'string') return '';
    return text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Setup global keyboard shortcuts
 * Supports:
 * - '/' or 'S' or 's': Focus search input
 * - 'Escape': Clear search, close modals
 */
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        const searchInput = document.getElementById('mainSearch');
        const searchHistory = document.getElementById('searchHistory');
        
        if (e.key === '/' || e.key === 's' || e.key === 'S') {
            if (searchInput && document.activeElement !== searchInput) {
                e.preventDefault();
                searchInput.focus();
            }
        }
        if (e.key === 'Escape') {
            clearSearch();
            if (searchHistory) searchHistory.classList.remove('show');
            closeShareModal();
        }
    });
}

/**
 * Setup pull-to-refresh gesture for mobile devices
 * Triggers page reload when user pulls down at the top of the page
 */
function setupPullToRefresh() {
    let startY = 0;
    let refreshing = false;
    
    document.addEventListener('touchstart', (e) => {
        if (window.scrollY === 0) startY = e.touches[0].clientY;
    }, { passive: true });
    
    document.addEventListener('touchmove', (e) => {
        if (refreshing || window.scrollY > 0) return;
        const diff = e.touches[0].clientY - startY;
        const pullRefresh = document.getElementById('pullRefresh');
        if (diff > 80 && pullRefresh) {
            pullRefresh.classList.add('visible');
        }
    }, { passive: true });
    
    document.addEventListener('touchend', () => {
        const pullRefresh = document.getElementById('pullRefresh');
        if (pullRefresh && pullRefresh.classList.contains('visible')) {
            refreshing = true;
            setTimeout(() => {
                location.reload();
            }, 500);
        }
    });
}

/**
 * Theme configuration with all available themes
 */
const THEMES = {
    default: { name: '默认紫蓝', icon: 'fa-palette' },
    midnight: { name: '深夜模式', icon: 'fa-moon' },
    lavender: { name: '薰衣草紫', icon: 'fa-spa' },
    ocean: { name: '海洋蓝', icon: 'fa-water' },
    sakura: { name: '樱花粉', icon: 'fa-heart' },
    forest: { name: '森林绿', icon: 'fa-leaf' },
    sunset: { name: '日落橙', icon: 'fa-sun' }
};

let currentTheme = localStorage.getItem('ai-tool-hub-theme') || 'default';

/**
 * Toggle between light and dark themes (quick switch)
 * Opens theme modal for full selection
 */
function toggleTheme() {
    showThemeModal();
}

/**
 * Show the theme selector modal
 */
function showThemeModal() {
    const modal = document.getElementById('themeModal');
    if (modal) {
        modal.classList.add('active');
        updateThemeSelectionUI();
    }
}

/**
 * Close the theme selector modal
 * @param {Event} [event] - Click event (optional)
 */
function closeThemeModal(event) {
    if (!event || event.target === document.getElementById('themeModal')) {
        const modal = document.getElementById('themeModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }
}

/**
 * Set active theme and apply it to the document
 * @param {string} themeName - Theme identifier (default, midnight, lavender, etc.)
 */
function setTheme(themeName) {
    // Validate theme name
    if (!THEMES[themeName]) {
        console.warn(`Unknown theme: ${themeName}, falling back to default`);
        themeName = 'default';
    }

    // Remove existing theme attribute
    document.documentElement.removeAttribute('data-theme');

    // Apply new theme (default theme doesn't need data-theme attribute)
    if (themeName !== 'default') {
        document.documentElement.setAttribute('data-theme', themeName);
    }

    // Update current theme state
    currentTheme = themeName;

    // Save to localStorage
    localStorage.setItem('ai-tool-hub-theme', themeName);

    // Update UI icons
    updateThemeIcons(themeName);

    // Update modal selection UI
    updateThemeSelectionUI();

    // Show toast notification
    const themeInfo = THEMES[themeName];
    showToast(`已切换到「${themeInfo.name}」主题`);

    // Close modal after short delay
    setTimeout(() => {
        closeThemeModal();
    }, 300);
}

/**
 * Update theme icons (sun/moon/palette) based on current theme
 * @param {string} themeName - Current theme name
 */
function updateThemeIcons(themeName) {
    const icons = ['themeIcon', 'themeIconNav'];
    
    icons.forEach(iconId => {
        const icon = document.getElementById(iconId);
        if (icon) {
            let iconClass, colorClass;
            
            if (themeName === 'midnight') {
                iconClass = 'fas fa-sun';
                colorClass = 'text-yellow-400';
            } else if (['lavender', 'sakura'].includes(themeName)) {
                iconClass = 'fas fa-heart';
                colorClass = 'text-pink-400';
            } else if (['ocean', 'forest'].includes(themeName)) {
                iconClass = 'fas fa-leaf';
                colorClass = 'text-green-400';
            } else if (themeName === 'sunset') {
                iconClass = 'fas fa-sun';
                colorClass = 'text-orange-400';
            } else {
                iconClass = 'fas fa-moon';
                colorClass = 'text-primary';
            }
            
            icon.className = `${iconClass} ${colorClass}`;
        }
    });
}

/**
 * Update the visual selection state in theme modal
 */
function updateThemeSelectionUI() {
    const options = document.querySelectorAll('.theme-option');
    options.forEach(option => {
        const value = option.getAttribute('data-theme-value');
        if (value === currentTheme) {
            option.classList.add('active');
        } else {
            option.classList.remove('active');
        }
    });
}

/**
 * Load saved theme on page initialization
 */
function loadSavedTheme() {
    const savedTheme = localStorage.getItem('ai-tool-hub-theme') || 'default';
    if (savedTheme && THEMES[savedTheme]) {
        setTheme(savedTheme);
    }
}

/**
 * Display a toast notification message
 * @param {string} msg - Message to display in toast
 * Toast automatically disappears after TOAST_DISPLAY_TIME ms
 */
function showToast(msg) {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMsg');
    if (!toast || !toastMsg) return;
    toastMsg.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), TOAST_DISPLAY_TIME);
}

/**
 * Load and display announcement bar from localStorage
 * Only shows if announcement exists and user hasn't dismissed it
 */
function loadAnnouncement() {
    const announcement = localStorage.getItem('ai-tool-hub-announcement');
    if (announcement && !localStorage.getItem('ai-tool-hub-announcement-closed')) {
        const textEl = document.getElementById('announcementText');
        const bar = document.getElementById('announcementBar');
        if (textEl) textEl.textContent = announcement;
        if (bar) bar.style.display = 'block';
    }
}

/**
 * Close announcement bar and remember user's choice
 */
function closeAnnouncement() {
    const bar = document.getElementById('announcementBar');
    if (bar) bar.style.display = 'none';
    localStorage.setItem('ai-tool-hub-announcement-closed', 'true');
}

/**
 * Check if update notification should be shown
 * Shows update modal on first visit after version update
 */
function checkForUpdate() {
    if (!localStorage.getItem('ai-tool-hub-v2-5-shown')) {
        const modal = document.getElementById('updateModal');
        if (modal) modal.classList.add('active');
        localStorage.setItem('ai-tool-hub-v2-5-shown', 'true');
    }
}

/**
 * Close the update modal dialog
 */
function closeUpdateModal() {
    const modal = document.getElementById('updateModal');
    if (modal) modal.classList.remove('active');
}

/**
 * Validate URL security - only allow http/https protocols
 * Prevents javascript: protocol injection attacks
 * @param {string} url - URL to validate
 * @returns {boolean} True if URL is safe (http or https)
 */
function isValidUrl(url) {
    if (typeof url !== 'string') return false;
    try {
        const parsed = new URL(url);
        return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
        return false;
    }
}

/**
 * Register Service Worker for PWA support
 * Enables offline caching and improved performance
 */
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(console.error);
    }
}

// Export functions, constants, and utilities
export { 
    setupKeyboardShortcuts, 
    setupPullToRefresh, 
    toggleTheme, 
    showThemeModal,
    closeThemeModal,
    setTheme,
    loadSavedTheme,
    showToast, 
    loadAnnouncement, 
    closeAnnouncement, 
    checkForUpdate, 
    closeUpdateModal, 
    registerServiceWorker,
    escapeHtml,
    escapeAttr,
    isValidUrl,
    MAX_SEARCH_HISTORY,
    TOAST_DISPLAY_TIME,
    SEARCH_DEBOUNCE_TIME
};
