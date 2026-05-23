import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { LLMService } from '../services/llm.js';
import { quotaService } from '../services/quota.js';

const router = Router();
const llmService = new LLMService();

router.post('/optimize', authMiddleware, async (req, res) => {
    const { level, resumeText, jobDescription } = req.body;

    if (!level || !resumeText) {
        return res.status(400).json({ error: '缺少必要参数: level 和 resumeText' });
    }

    if (!['light', 'medium', 'deep'].includes(level)) {
        return res.status(400).json({ error: '无效的优化级别，可选: light, medium, deep' });
    }

    if (level !== 'light' && !jobDescription) {
        return res.status(400).json({ error: '中度和深度优化需要提供目标职位描述（JD）' });
    }

    const quota = quotaService.checkQuota(req.user.id);
    if (quota.remaining <= 0) {
        return res.status(429).json({
            error: '今日优化次数已用完',
            quota
        });
    }

    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no'
    });

    const sendSSE = (type, data) => {
        try {
            res.write(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`);
        } catch {
            // client disconnected
        }
    };

    try {
        const generator = llmService.streamOptimize(level, resumeText, jobDescription || '');

        for await (const event of generator) {
            if (res.writableEnded || res.destroyed) break;

            if (event.type === 'progress') {
                sendSSE('progress', event.data);
            } else if (event.type === 'token') {
                sendSSE('token', event.data);
            } else if (event.type === 'done') {
                const newQuota = quotaService.incrementUsage(req.user.id);
                sendSSE('done', {
                    ...event.data,
                    quotaRemaining: newQuota.remaining
                });
            }
        }
    } catch (error) {
        console.error('[Resume] Optimize error:', error);
        sendSSE('error', { message: error.message || 'AI优化服务暂时不可用，请稍后重试' });
    }

    if (!res.writableEnded) {
        res.end();
    }
});

router.post('/parse', authMiddleware, async (req, res) => {
    const { text } = req.body;

    if (!text || text.trim().length < 10) {
        return res.status(400).json({ error: '缺少简历文本或文本过短' });
    }

    const quota = quotaService.checkQuota(req.user.id);
    if (quota.remaining <= 0) {
        return res.status(429).json({
            error: '今日使用次数已用完',
            quota
        });
    }

    try {
        const result = await llmService.parseResumeText(text);
        quotaService.incrementUsage(req.user.id);
        res.json(result);
    } catch (error) {
        console.error('[Resume] Parse error:', error);
        // If API key missing or balance insufficient, return specific error
        if (error.message && (error.message.includes('not configured') || error.message.includes('Insufficient'))) {
            return res.status(503).json({ error: error.message, fallback: true });
        }
        res.status(500).json({ error: '简历解析失败，请稍后重试' });
    }
});

router.post('/analyze-jd', authMiddleware, async (req, res) => {
    const { jdText } = req.body;

    if (!jdText) {
        return res.status(400).json({ error: '缺少JD文本' });
    }

    const quota = quotaService.checkQuota(req.user.id);
    if (quota.remaining <= 0) {
        return res.status(429).json({
            error: '今日使用次数已用完',
            quota
        });
    }

    try {
        const result = await llmService.analyzeJD(jdText);
        quotaService.incrementUsage(req.user.id);
        res.json(result);
    } catch (error) {
        console.error('[Resume] JD analysis error:', error);
        res.status(500).json({ error: 'JD分析失败，请稍后重试' });
    }
});

export default router;