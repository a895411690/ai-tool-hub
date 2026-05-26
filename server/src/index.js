import express from 'express';
import cors from 'cors';
import config, { validateConfig } from './config.js';
import authRoutes from './routes/auth.js';
import resumeRoutes from './routes/resume.js';
import { rateLimitMiddleware } from './middleware/rateLimit.js';

validateConfig();

const app = express();

app.use(cors({
    origin: config.CORS_ORIGIN,
    credentials: true
}));
app.use(express.json({ limit: '100kb' }));
app.use(rateLimitMiddleware);

app.use('/api/auth', authRoutes);
app.use('/api/resume', resumeRoutes);

app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        version: '1.0.0',
        deepseek: !!config.DEEPSEEK_API_KEY,
        timestamp: new Date().toISOString()
    });
});

app.use((err, req, res, _next) => {
    console.error('[Server] Unhandled error:', err);
    if (res.headersSent) return;
    res.status(err.status || 500).json({ error: '服务器内部错误' });
});

const server = app.listen(config.PORT, () => {
    console.log(`[Server] AI Tool Hub API running on port ${config.PORT}`);
    console.log(`[Server] DeepSeek API: ${config.DEEPSEEK_API_KEY ? 'configured' : 'NOT configured'}`);
    console.log(`[Server] Daily quota per user: ${config.DAILY_QUOTA}`);
    console.log(`[Server] CORS origin: ${config.CORS_ORIGIN}`);
});

function gracefulShutdown(signal) {
    console.log(`[Server] Received ${signal}. Shutting down gracefully...`);
    server.close(() => {
        console.log('[Server] HTTP server closed.');
        process.exit(0);
    });
    setTimeout(() => {
        console.error('[Server] Forced shutdown after timeout.');
        process.exit(1);
    }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
    console.error('[Server] Unhandled Promise Rejection:', reason);
});