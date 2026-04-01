// Import functions
import { clearSearch } from './ui.js';
import { closeShareModal } from './share.js';

// Keyboard Shortcuts
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

// Pull to Refresh (Mobile)
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

// Theme Toggle
function toggleTheme() {
    document.documentElement.classList.toggle('dark');
    const isDark = document.documentElement.classList.contains('dark');
    document.getElementById('themeIcon').className = `fas fa-${isDark ? 'moon' : 'sun'} ${isDark ? 'text-primary' : 'text-yellow-400'}`;
}

// Toast
function showToast(msg) {
    const toast = document.getElementById('toast');
    document.getElementById('toastMsg').textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
}

// Announcement
function loadAnnouncement() {
    const announcement = localStorage.getItem('ai-tool-hub-announcement');
    if (announcement && !localStorage.getItem('ai-tool-hub-announcement-closed')) {
        document.getElementById('announcementText').textContent = announcement;
        document.getElementById('announcementBar').style.display = 'block';
    }
}

function closeAnnouncement() {
    document.getElementById('announcementBar').style.display = 'none';
    localStorage.setItem('ai-tool-hub-announcement-closed', 'true');
}

// Update Check
function checkForUpdate() {
    if (!localStorage.getItem('ai-tool-hub-v2-5-shown')) {
        document.getElementById('updateModal').classList.add('active');
        localStorage.setItem('ai-tool-hub-v2-5-shown', 'true');
    }
}

function closeUpdateModal() {
    document.getElementById('updateModal').classList.remove('active');
}

// Service Worker
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(console.error);
    }
}

// Export functions
export { setupKeyboardShortcuts, setupPullToRefresh, toggleTheme, showToast, loadAnnouncement, closeAnnouncement, checkForUpdate, closeUpdateModal, registerServiceWorker };
