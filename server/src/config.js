import dotenv from 'dotenv';
dotenv.config();

const config = {
    PORT: parseInt(process.env.PORT, 10) || 3000,
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRES_IN: '7d',
    JWT_ISSUER: process.env.JWT_ISSUER || 'ai-tool-hub',
    JWT_AUDIENCE: process.env.JWT_AUDIENCE || 'ai-tool-hub-users',
    DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY || '',
    DEEPSEEK_BASE_URL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
    DEEPSEEK_MODEL: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
    DAILY_QUOTA: parseInt(process.env.DAILY_QUOTA, 10) || 10,
    CORS_ORIGIN: process.env.CORS_ORIGIN || 'https://weihub.cloud,http://localhost:3000',
    NODE_ENV: process.env.NODE_ENV || 'development'
};

export function validateConfig() {
    const warnings = [];
    const errors = [];

    if (!config.JWT_SECRET) {
        errors.push('[FATAL] JWT_SECRET must be set in environment variables!');
    }

    if (!config.DEEPSEEK_API_KEY) {
        warnings.push('[CONFIG WARNING] DEEPSEEK_API_KEY is not set. AI features will be unavailable.');
    }

    const isWildcard = config.CORS_ORIGIN === '*' || config.CORS_ORIGIN.includes('*');
    if (isWildcard && config.NODE_ENV === 'production') {
        warnings.push('[SECURITY WARNING] CORS_ORIGIN contains wildcard in production — restrict this to specific domains.');
    }

    errors.forEach(e => console.error(e));
    warnings.forEach(w => console.warn(w));

    if (errors.length > 0) {
        console.error('\nCannot start server due to configuration errors!');
        process.exit(1);
    }

    return warnings;
}

export default config;
