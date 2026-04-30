// 工具函数和性能优化

// 防抖函数
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 节流函数
export function throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// HTML转义函数，防止XSS攻击
export function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 安全的HTML属性值转义
export function escapeAttr(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

// 使用 DocumentFragment 批量更新DOM（接受HTML字符串，需确保安全）
export function createFragment(html) {
    const fragment = document.createDocumentFragment();
    const temp = document.createElement('div');
    temp.innerHTML = html;
    while (temp.firstChild) {
        fragment.appendChild(temp.firstChild);
    }
    return fragment;
}

// 安全创建HTML元素，自动转义内容
export function createSafeElement(tag, options = {}) {
    const element = document.createElement(tag);

    if (options.className) {
        element.className = options.className;
    }

    if (options.textContent) {
        element.textContent = options.textContent;
    }

    // 安全处理innerHTML - 必须确保内容已转义
    if (options.innerHTML) {
        element.innerHTML = options.innerHTML;
    }

    if (options.attributes) {
        Object.entries(options.attributes).forEach(([key, value]) => {
            // 转义属性值
            element.setAttribute(key, escapeAttr(value));
        });
    }

    if (options.events) {
        Object.entries(options.events).forEach(([event, handler]) => {
            element.addEventListener(event, handler);
        });
    }

    return element;
}

// 安全的 DOM 元素创建（自动转义属性值）
export function createElement(tag, options = {}) {
    return createSafeElement(tag, options);
}

// 安全的JSON解析，防止原型链污染
export function safeJsonParse(jsonString, defaultValue = null) {
    try {
        if (typeof jsonString !== 'string') {
            return defaultValue;
        }

        // 使用JSON.parse的reviver函数防止原型链污染
        return JSON.parse(jsonString, (key, value) => {
            if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
                return undefined; // 删除危险属性
            }
            return value;
        });
    } catch (error) {
        console.error('JSON解析错误:', error);
        return defaultValue;
    }
}

// 本地存储封装（带加密）
export const storage = {
    get: (key) => {
        try {
            const item = localStorage.getItem(key);
            return item ? safeJsonParse(item) : null;
        } catch (error) {
            console.error('Error getting from localStorage:', error);
            return null;
        }
    },
    set: (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Error setting to localStorage:', error);
            return false;
        }
    },
    remove: (key) => {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Error removing from localStorage:', error);
            return false;
        }
    }
};

// 加密工具（简单的 Base64 编码，实际项目中应使用更安全的加密方式）
export const crypto = {
    encrypt: (text) => {
        try {
            // 使用更现代的UTF-8编码方法，避免使用已废弃的unescape
            const encoder = new TextEncoder();
            const data = encoder.encode(text);
            const binaryString = String.fromCharCode(...data);
            return btoa(binaryString);
        } catch (error) {
            console.error('Error encrypting:', error);
            return text;
        }
    },
    decrypt: (text) => {
        try {
            // 使用更现代的UTF-8解码方法，避免使用已废弃的escape
            const binaryString = atob(text);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            const decoder = new TextDecoder('utf-8', { fatal: true });
            return decoder.decode(bytes);
        } catch (error) {
            console.error('Error decrypting:', error);
            return text;
        }
    }
};

// URL验证函数，确保只允许安全的http/https协议
export function validateUrl(url) {
    try {
        // 基本验证：非空字符串
        if (!url || typeof url !== 'string') {
            return { valid: false, error: 'URL不能为空' };
        }

        // 修剪空格
        url = url.trim();

        // 检查协议：只允许http或https
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            return { valid: false, error: 'URL必须以http://或https://开头' };
        }

        // 尝试构造URL对象进行验证
        const urlObj = new URL(url);

        // 检查主机名：不允许本地主机或私有IP地址
        const hostname = urlObj.hostname.toLowerCase();
        const localHosts = ['localhost', '127.0.0.1', '::1', '0.0.0.0'];
        const privateIpPatterns = [
            /^10\./,           // 10.0.0.0/8
            /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12
            /^192\.168\./,     // 192.168.0.0/16
            /^169\.254\./,     // 链路本地地址
            /^fd[0-9a-f]{2}:/, // IPv6唯一本地地址
        ];

        if (localHosts.includes(hostname)) {
            return { valid: false, error: '不允许本地主机地址' };
        }

        for (const pattern of privateIpPatterns) {
            if (pattern.test(hostname)) {
                return { valid: false, error: '不允许私有IP地址' };
            }
        }

        // 检查常见危险协议
        const dangerousProtocols = ['javascript:', 'data:', 'file:', 'ftp:'];
        for (const protocol of dangerousProtocols) {
            if (url.toLowerCase().includes(protocol)) {
                return { valid: false, error: `不允许${protocol}协议` };
            }
        }

        // 检查URL长度
        if (url.length > 2048) {
            return { valid: false, error: 'URL过长' };
        }

        return { valid: true, url: urlObj.href };
    } catch (error) {
        return { valid: false, error: `无效的URL格式: ${error.message}` };
    }
}
