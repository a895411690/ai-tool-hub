/**
 * AI Tool Hub API Client
 * Handles authentication and resume optimization via backend API
 */

class ApiClient {
    constructor(baseURL = '/api') {
        this.baseURL = baseURL;
        this.tokenKey = 'ai_tool_hub_token';
        this.userKey = 'ai_tool_hub_user';
    }

    isAuthenticated() {
        return !!localStorage.getItem(this.tokenKey);
    }

    getToken() {
        return localStorage.getItem(this.tokenKey);
    }

    getUser() {
        try {
            const data = localStorage.getItem(this.userKey);
            return data ? JSON.parse(data) : null;
        } catch {
            return null;
        }
    }

    async register(email, password) {
        const response = await fetch(`${this.baseURL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || '注册失败');
        }

        localStorage.setItem(this.tokenKey, data.token);
        localStorage.setItem(this.userKey, JSON.stringify(data.user));
        return data;
    }

    async login(email, password) {
        const response = await fetch(`${this.baseURL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || '登录失败');
        }

        localStorage.setItem(this.tokenKey, data.token);
        localStorage.setItem(this.userKey, JSON.stringify(data.user));
        return data;
    }

    logout() {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.userKey);
        this._notifyAuthChange();
    }

    async getProfile() {
        const response = await fetch(`${this.baseURL}/auth/me`, {
            headers: this._getHeaders()
        });

        if (response.status === 401) {
            this.logout();
            throw new Error('登录已过期，请重新登录');
        }

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || '获取用户信息失败');
        }

        return data;
    }

    async optimize(level, resumeText, jobDescription, callbacks = {}) {
        const { onProgress, onToken, onDone, onError } = callbacks;

        const response = await fetch(`${this.baseURL}/resume/optimize`, {
            method: 'POST',
            headers: {
                ...this._getHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ level, resumeText, jobDescription })
        });

        if (response.status === 401) {
            this.logout();
            throw new Error('登录已过期，请重新登录');
        }

        if (response.status === 429) {
            const data = await response.json();
            throw new Error(data.error || '今日优化次数已用完');
        }

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.error || 'AI优化服务暂时不可用');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let finalResult = null;
        let currentEventType = '';

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('event: ')) {
                        currentEventType = line.substring(7).trim();
                        continue;
                    }
                    if (line.startsWith('data: ')) {
                        const data = line.substring(6).trim();
                        try {
                            const parsed = JSON.parse(data);

                            if (currentEventType === 'error') {
                                const error = new Error(parsed.message || parsed.error || 'AI优化服务出现错误');
                                if (onError) onError(error);
                                throw error;
                            }

                            if (parsed.status && onProgress) {
                                onProgress(parsed);
                            } else if (parsed.content && onToken) {
                                onToken(parsed);
                            } else if (parsed.quotaRemaining !== undefined) {
                                finalResult = parsed;
                                if (onDone) onDone(parsed);
                            }
                        } catch (e) {
                            if (currentEventType === 'error') throw e;
                            // skip malformed JSON for non-error events
                        }
                        currentEventType = '';
                    }
                }
            }

            // Process any remaining buffer
            if (buffer.trim()) {
                const remainingLines = buffer.split('\n');
                for (const line of remainingLines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const parsed = JSON.parse(line.substring(6));
                            if (parsed.quotaRemaining !== undefined && onDone) {
                                onDone(parsed);
                            }
                        } catch {
                            // skip
                        }
                    }
                }
            }
        } catch (error) {
            if (onError) {
                onError(error);
            }
            throw error;
        }

        return finalResult;
    }

    async analyzeJD(jdText) {
        const response = await fetch(`${this.baseURL}/resume/analyze-jd`, {
            method: 'POST',
            headers: {
                ...this._getHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ jdText })
        });

        if (response.status === 401) {
            this.logout();
            throw new Error('登录已过期，请重新登录');
        }

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'JD分析失败');
        }

        return data;
    }

    async parseResume(text) {
        const response = await fetch(`${this.baseURL}/resume/parse`, {
            method: 'POST',
            headers: {
                ...this._getHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text })
        });

        if (response.status === 401) {
            this.logout();
            throw new Error('登录已过期，请重新登录');
        }

        if (response.status === 503) {
            const data = await response.json();
            throw new Error(data.error || 'AI服务暂不可用');
        }

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || '简历解析失败');
        }

        return data;
    }

    _getHeaders() {
        const token = this.getToken();
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    }

    _notifyAuthChange() {
        window.dispatchEvent(new CustomEvent('auth-change', {
            detail: { authenticated: this.isAuthenticated() }
        }));
    }
}

const apiClient = new ApiClient();

export { ApiClient, apiClient };
window.apiClient = apiClient;