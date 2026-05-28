import logger from '../utils/logger.js';

const requestsPerMinute = new Map();
const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 30;

export function rateLimitMiddleware(req, res, next) {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();

    if (!requestsPerMinute.has(ip)) {
        requestsPerMinute.set(ip, []);
    }

    const userRequests = requestsPerMinute.get(ip);
    const recentRequests = userRequests.filter(t => now - t < WINDOW_MS);
    requestsPerMinute.set(ip, recentRequests);

    const remaining = MAX_REQUESTS - recentRequests.length;
    const resetTime = Math.ceil((WINDOW_MS - (now - (recentRequests[0] || now))) / 1000);

    res.setHeader('X-RateLimit-Limit', MAX_REQUESTS);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', resetTime);

    if (recentRequests.length >= MAX_REQUESTS) {
        logger.warn(`[${req.requestId}] Rate limit exceeded: ip=${ip}, requests=${recentRequests.length}`);
        res.setHeader('Retry-After', resetTime);
        return res.status(429).json({ 
            error: '请求过于频繁，请稍后再试',
            retryAfter: resetTime 
        });
    }

    recentRequests.push(now);
    next();
}

setInterval(() => {
    const now = Date.now();
    let cleanedCount = 0;
    for (const [ip, requests] of requestsPerMinute) {
        const recent = requests.filter(t => now - t < WINDOW_MS);
        if (recent.length === 0) {
            requestsPerMinute.delete(ip);
            cleanedCount++;
        } else {
            requestsPerMinute.set(ip, recent);
        }
    }
    if (cleanedCount > 0) {
        logger.debug(`Rate limit cleanup: removed ${cleanedCount} IPs`);
    }
}, WINDOW_MS);
