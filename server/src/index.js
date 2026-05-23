import express from 'express';
import cors from 'cors';
import config from './config.js';
import authRoutes from './routes/auth.js';
import resumeRoutes from './routes/resume.js';
import { rateLimitMiddleware } from './middleware/rateLimit.js';

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

app.use((err, req, res, next) => {
    console.error('[Server] Unhandled error:', err);
    if (res.headersSent) return;
    res.status(500).json({ error: '服务器内部错误' });
});

app.listen(config.PORT, () => {
    console.log(`[Server] AI Tool Hub API running on port ${config.PORT}`);
    console.log(`[Server] DeepSeek API: ${config.DEEPSEEK_API_KEY ? 'configured' : 'NOT configured'}`);
    console.log(`[Server] Daily quota per user: ${config.DAILY_QUOTA}`);
    console.log(`[Server] CORS origin: ${config.CORS_ORIGIN}`);
});