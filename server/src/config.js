import dotenv from 'dotenv';
dotenv.config();

export default {
    PORT: parseInt(process.env.PORT) || 3000,
    JWT_SECRET: process.env.JWT_SECRET || 'change-me-in-production-use-a-long-random-string',
    JWT_EXPIRES_IN: '7d',
    DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY || '',
    DEEPSEEK_BASE_URL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
    DEEPSEEK_MODEL: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
    DAILY_QUOTA: parseInt(process.env.DAILY_QUOTA) || 10,
    DB_PATH: process.env.DB_PATH || './data/quota.db',
    CORS_ORIGIN: process.env.CORS_ORIGIN || '*'
};