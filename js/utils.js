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
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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
        if (e.key === '/' || e.key === 's' || e.key === 'S') {
            if (document.activeElement !== document.getElementById('mainSearch')) {
                e.preventDefault();
                document.getElementById('mainSearch').focus();
            }
        }
        if (e.key === 'Escape') {
            clearSearch();
            document.getElementById('searchHistory').classList.remove('show');
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
        if (diff > 80) {
            document.getElementById('pullRefresh').classList.add('visible');
        }
    }, { passive: true });
    
    document.addEventListener('touchend', () => {
        if (document.getElementById('pullRefresh').classList.contains('visible')) {
            refreshing = true;
            setTimeout(() => {
                location.reload();
            }, 500);
        }
    });
}

/**
 * Toggle between light and dark theme
 * Updates theme icon and stores preference in DOM
 */
function toggleTheme() {
    document.documentElement.classList.toggle('dark');
    const isDark = document.documentElement.classList.contains('dark');
    document.getElementById('themeIcon').className = `fas fa-${isDark ? 'moon' : 'sun'} ${isDark ? 'text-primary' : 'text-yellow-400'}`;
}

/**
 * Display a toast notification message
 * @param {string} msg - Message to display in toast
 * Toast automatically disappears after TOAST_DISPLAY_TIME ms
 */
function showToast(msg) {
    const toast = document.getElementById('toast');
    document.getElementById('toastMsg').textContent = msg;
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
        document.getElementById('announcementText').textContent = announcement;
        document.getElementById('announcementBar').style.display = 'block';
    }
}

/**
 * Close announcement bar and remember user's choice
 */
function closeAnnouncement() {
    document.getElementById('announcementBar').style.display = 'none';
    localStorage.setItem('ai-tool-hub-announcement-closed', 'true');
}

/**
 * Check if update notification should be shown
 * Shows update modal on first visit after version update
 */
function checkForUpdate() {
    if (!localStorage.getItem('ai-tool-hub-v2-5-shown')) {
        document.getElementById('updateModal').classList.add('active');
        localStorage.setItem('ai-tool-hub-v2-5-shown', 'true');
    }
}

/**
 * Close the update modal dialog
 */
function closeUpdateModal() {
    document.getElementById('updateModal').classList.remove('active');
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
    showToast, 
    loadAnnouncement, 
    closeAnnouncement, 
    checkForUpdate, 
    closeUpdateModal, 
    registerServiceWorker,
    escapeHtml,
    escapeAttr,
    MAX_SEARCH_HISTORY,
    TOAST_DISPLAY_TIME,
    SEARCH_DEBOUNCE_TIME
};
