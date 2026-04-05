// 用户系统
import { CONFIG } from './config.js';
import state from './state.js';
import { showToast } from './ui.js';
import { storage, crypto } from './utils.js';

export function initUser() {
    // 检查 URL 中是否有 GitHub OAuth 回调参数
    handleGitHubCallback();
    
    const token = storage.get('github_token');
    const user = storage.get('github_user');
    
    if (token && user) {
        try {
            // 解密数据
            const decryptedUser = JSON.parse(crypto.decrypt(user));
            state.user = decryptedUser;
            updateUserUI();
            syncFromGist();
        } catch (error) {
            // Error decrypting user data
            logout();
        }
    }
}

export function loginWithGitHub() {
    // GitHub OAuth flow
    const redirectUri = window.location.origin + window.location.pathname;
    const scope = 'gist';
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${CONFIG.GITHUB_CLIENT_ID}&redirect_uri=${redirectUri}&scope=${scope}`;
    window.location.href = authUrl;
}

// 处理 GitHub OAuth 回调
export async function handleGitHubCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
        try {
            // 这里应该向服务器发送请求，交换 code 为 token
            // 由于是前端项目，这里模拟获取 token
            // 实际项目中应该在后端处理
            const mockToken = 'mock_github_token_' + Date.now();
            const mockUser = {
                login: 'test_user',
                avatar_url: 'https://github.com/images/error/octocat_happy.gif',
                email: 'test@example.com'
            };
            
            // 加密存储
            storage.set('github_token', crypto.encrypt(mockToken));
            storage.set('github_user', crypto.encrypt(JSON.stringify(mockUser)));
            
            state.user = mockUser;
            updateUserUI();
            syncFromGist();
            showToast('登录成功！');
            
            // 清除 URL 中的参数
            window.history.pushState({}, document.title, window.location.pathname);
        } catch (error) {
            console.error('GitHub login failed:', error);
            showToast('登录失败，请重试');
        }
    }
}

export function logout() {
    storage.remove('github_token');
    storage.remove('github_user');
    state.user = null;
    updateUserUI();
    showToast('已退出登录');
}

export function updateUserUI() {
    const avatar = document.getElementById('userAvatar');
    const icon = document.getElementById('userIcon');
    const name = document.getElementById('userName');
    const menuName = document.getElementById('menuUserName');
    const menuEmail = document.getElementById('menuUserEmail');
    const authSection = document.getElementById('authSection');

    if (state.user) {
        avatar.src = state.user.avatar_url;
        avatar.classList.remove('hidden');
        icon.classList.add('hidden');
        name.textContent = state.user.login;
        menuName.textContent = state.user.login;
        menuEmail.textContent = state.user.email || 'GitHub用户';
        authSection.innerHTML = '<button onclick="logout()" class="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 text-sm text-left text-red-400"><i class="fas fa-sign-out-alt"></i> 退出登录</button>';
    } else {
        avatar.classList.add('hidden');
        icon.classList.remove('hidden');
        name.textContent = '游客';
        menuName.textContent = '游客';
        menuEmail.textContent = '未登录';
        authSection.innerHTML = '<button onclick="loginWithGitHub()" class="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 text-sm text-left"><i class="fab fa-github text-gray-400"></i> GitHub登录</button>';
    }
}

export function toggleUserMenu() {
    document.getElementById('userMenu').classList.toggle('show');
}

// 数据同步
export async function syncToGist() {
    if (!state.user) return;
    const token = storage.get('github_token');
    if (!token) return;
    
    try {
        const decryptedToken = crypto.decrypt(token);
        const data = {
            favorites: state.favorites,
            history: state.history,
            ratings: state.ratings,
            notes: state.notes,
            lastSync: Date.now()
        };
        
        // 检查是否已有gist
        const gistsResponse = await fetch('https://api.github.com/gists', {
            headers: {
                'Authorization': `token ${decryptedToken}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (!gistsResponse.ok) throw new Error('Failed to fetch gists');
        
        const gists = await gistsResponse.json();
        let targetGist = gists.find(gist => gist.files[CONFIG.GIST_FILENAME]);
        
        if (targetGist) {
            // 更新现有gist
            const updateResponse = await fetch(`https://api.github.com/gists/${targetGist.id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `token ${decryptedToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    files: {
                        [CONFIG.GIST_FILENAME]: {
                            content: JSON.stringify(data, null, 2)
                        }
                    }
                })
            });
            
            if (!updateResponse.ok) throw new Error('Failed to update gist');
        } else {
            // 创建新gist
            const createResponse = await fetch('https://api.github.com/gists', {
                method: 'POST',
                headers: {
                    'Authorization': `token ${decryptedToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    description: 'AI Tool Hub Data Backup',
                    public: false,
                    files: {
                        [CONFIG.GIST_FILENAME]: {
                            content: JSON.stringify(data, null, 2)
                        }
                    }
                })
            });
            
            if (!createResponse.ok) throw new Error('Failed to create gist');
        }
        
        showToast('数据同步成功');
    } catch (error) {
        console.error('Sync to gist failed:', error);
        showToast('数据同步失败');
    }
}

export async function syncFromGist() {
    if (!state.user) return;
    showToast('正在拉取云端数据...');
    
    try {
        const token = storage.get('github_token');
        if (!token) return;
        
        const decryptedToken = crypto.decrypt(token);
        const gistsResponse = await fetch('https://api.github.com/gists', {
            headers: {
                'Authorization': `token ${decryptedToken}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (!gistsResponse.ok) throw new Error('Failed to fetch gists');
        
        const gists = await gistsResponse.json();
        const targetGist = gists.find(gist => gist.files[CONFIG.GIST_FILENAME]);
        
        if (targetGist) {
            const fileUrl = targetGist.files[CONFIG.GIST_FILENAME].raw_url;
            const dataResponse = await fetch(fileUrl);
            
            if (!dataResponse.ok) throw new Error('Failed to fetch gist data');
            
            const data = await dataResponse.json();
            
            // 更新本地数据
            if (data.favorites) {
                state.favorites = data.favorites;
                localStorage.setItem('favorites', JSON.stringify(data.favorites));
            }
            if (data.history) {
                state.history = data.history;
                localStorage.setItem('history', JSON.stringify(data.history));
            }
            if (data.ratings) {
                state.ratings = data.ratings;
                localStorage.setItem('ratings', JSON.stringify(data.ratings));
            }
            if (data.notes) {
                state.notes = data.notes;
                localStorage.setItem('notes', JSON.stringify(data.notes));
            }
            
            showToast('数据同步成功');
        } else {
            showToast('暂无云端数据');
        }
    } catch (error) {
        console.error('Sync from gist failed:', error);
        showToast('数据拉取失败');
    }
}

export function exportData() {
    const data = {
        favorites: state.favorites,
        history: state.history,
        ratings: state.ratings,
        notes: state.notes,
        exportTime: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-tool-hub-backup-${Date.now()}.json`;
    a.click();
    showToast('数据已导出');
}

export function syncData() {
    if (!state.user) {
        showToast('请先登录');
        return;
    }
    syncToGist();
    toggleUserMenu();
}
