import dotenv from 'dotenv';
dotenv.config();

const DEFAULT_JWT_SECRET = 'INSECURE-DEFAULT-CHANGE-ME-NOW-!@#$%';

const config = {
    PORT: parseInt(process.env.PORT) || 3000,
    JWT_SECRET: process.env.JWT_SECRET || DEFAULT_JWT_SECRET,
    JWT_EXPIRES_IN: '7d',
    DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY || '',
    DEEPSEEK_BASE_URL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
    DEEPSEEK_MODEL: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
    DAILY_QUOTA: parseInt(process.env.DAILY_QUOTA) || 10,
    DB_PATH: process.env.DB_PATH || './data/quota.db',
    CORS_ORIGIN: process.env.CORS_ORIGIN || '*'
};

export function validateConfig() {
    const warnings = [];

    if (config.JWT_SECRET === DEFAULT_JWT_SECRET) {
        warnings.push('[SECURITY WARNING] JWT_SECRET is using the default insecure value. Set JWT_SECRET in your environment!');
    }

    if (!config.DEEPSEEK_API_KEY) {
        warnings.push('[CONFIG WARNING] DEEPSEEK_API_KEY is not set. AI features will be unavailable.');
    }

    if (config.CORS_ORIGIN === '*') {
        warnings.push('[SECURITY WARNING] CORS_ORIGIN is "*" — any origin can access the API. Restrict this in production.');
    }

    warnings.forEach(w => console.warn(w));

    return warnings;
}

export default config;