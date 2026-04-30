// 配置文件
// 支持从环境变量读取配置（Vite格式：import.meta.env.VITE_*）
export const CONFIG = {
    // GitHub OAuth 配置
    GITHUB_CLIENT_ID: import.meta.env?.VITE_GITHUB_CLIENT_ID || 'YOUR_GITHUB_CLIENT_ID',

    // 存储配置
    STORAGE_KEY: import.meta.env?.VITE_STORAGE_KEY || 'ai-tool-hub-v3',
    GIST_FILENAME: import.meta.env?.VITE_GIST_FILENAME || 'ai-tool-hub-data.json',

    // 应用信息
    APP_NAME: import.meta.env?.VITE_APP_NAME || 'AI Tool Hub',
    APP_VERSION: import.meta.env?.VITE_APP_VERSION || '3.0.0',

    // 调试模式
    DEBUG: import.meta.env?.VITE_DEBUG === 'true' || false
};

// CSP报告URI（可选）
export const CSP_REPORT_URI = import.meta.env?.VITE_CSP_REPORT_URI || '';