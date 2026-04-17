/**
 * Simple State Management Store
 * Inspired by Redux but lightweight for vanilla JS
 */

class Store {
    // 默认状态常量，避免硬编码重复
    static DEFAULT_STATE = {
        profile: {
            name: '',
            title: '',
            email: '',
            phone: '',
            location: '',
            summary: ''
        },
        experience: [],
        education: [],
        skills: [],
        projects: []
    };

    constructor(initialState = {}) {
        this.state = {
            ...Store.DEFAULT_STATE,
            ...initialState
        };
        this.listeners = [];
    }

    // 获取当前状态的深拷贝，防止外部意外修改内部状态
    getState() {
        return structuredClone(this.state);
    }

    // 更新状态
    setState(updater) {
        const newState = typeof updater === 'function'
            ? updater(this.state)
            : { ...this.state, ...updater };

        this.state = newState;
        this.notify();
    }

    // 更新特定路径
    updatePath(path, value) {
        const keys = path.split('.');
        const newState = { ...this.state };
        let current = newState;

        for (let i = 0; i < keys.length - 1; i++) {
            current[keys[i]] = { ...current[keys[i]] };
            current = current[keys[i]];
        }

        current[keys[keys.length - 1]] = value;
        this.state = newState;
        this.notify();
    }

    // 订阅状态变更
    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    // 通知所有监听器（隔离错误，防止一个监听器的异常影响其他监听器）
    notify() {
        for (const listener of this.listeners) {
            try {
                listener(this.state);
            } catch (error) {
                console.error('Store 监听器执行出错:', error);
            }
        }
    }

    // 重置为初始状态
    reset() {
        this.state = structuredClone(Store.DEFAULT_STATE);
        this.notify();
    }

    // 从 localStorage 加载状态（含数据验证和默认值合并）
    load() {
        try {
            const saved = localStorage.getItem('resumeOptimizerState');
            if (saved) {
                const parsed = JSON.parse(saved);
                // 使用默认值合并，确保结构完整
                this.state = {
                    profile: {
                        ...Store.DEFAULT_STATE.profile,
                        ...(parsed.profile || {})
                    },
                    experience: Array.isArray(parsed.experience) ? parsed.experience : [],
                    education: Array.isArray(parsed.education) ? parsed.education : [],
                    skills: Array.isArray(parsed.skills) ? parsed.skills : [],
                    projects: Array.isArray(parsed.projects) ? parsed.projects : []
                };
                this.notify();
            }
        } catch (e) {
            console.error('加载状态失败:', e);
            // 加载失败时保持默认状态
        }
    }

    // 保存到 localStorage
    save() {
        try {
            localStorage.setItem('resumeOptimizerState', JSON.stringify(this.state));
        } catch (e) {
            console.error('保存状态失败:', e);
        }
    }

    // 添加数组项
    addArrayItem(path, item) {
        const current = this.getState()[path] || [];
        this.updatePath(path, [...current, { id: Date.now(), ...item }]);
    }

    // 删除数组项
    removeArrayItem(path, id) {
        const current = this.getState()[path] || [];
        this.updatePath(path, current.filter(item => item.id !== id));
    }

    // 更新数组项
    updateArrayItem(path, id, updates) {
        const current = this.getState()[path] || [];
        this.updatePath(path, current.map(item =>
            item.id === id ? { ...item, ...updates } : item
        ));
    }
}

// 创建全局 store 实例
const store = new Store();

// 防抖自动保存（避免快速输入时频繁写入 localStorage）
let autoSaveTimer = null;
store.subscribe(() => {
    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => {
        store.save();
    }, 500);
});

// 加载已保存的状态
store.load();

// 导出 store 实例供其他模块使用
export { store };
window.store = store;  // 保持向后兼容
