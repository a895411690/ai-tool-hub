import config from '../config.js';
import logger from '../utils/logger.js';

const requestsPerMinute = new Map();

export function rateLimitMiddleware(req, res, next) {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowMs = 60 * 1000;
    const maxRequests = 30;

    if (!requestsPerMinute.has(ip)) {
        requestsPerMinute.set(ip, []);
    }

    const userRequests = requestsPerMinute.get(ip);
    const recentRequests = userRequests.filter(t => now - t < windowMs);
    requestsPerMinute.set(ip, recentRequests);

    if (recentRequests.length >= maxRequests) {
        logger.warn(`Rate limit exceeded: ip=${ip}, requests=${recentRequests.length}`);
        return res.status(429).json({ error: '请求过于频繁，请稍后再试' });
    }

    recentRequests.push(now);
    next();
}

setInterval(() => {
    const now = Date.now();
    let cleanedCount = 0;
    for (const [ip, requests] of requestsPerMinute) {
        const recent = requests.filter(t => now - t < 60 * 1000);
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
}, 60 * 1000);

export function QuotaTracker(db) {
    return {
        checkQuota(userId) {
            const today = new Date().toISOString().split('T')[0];
            const row = db.prepare(
                'SELECT count FROM usage WHERE user_id = ? AND date = ?'
            ).get(userId, today);
            const used = row ? row.count : 0;
            return {
                used,
                remaining: Math.max(0, config.DAILY_QUOTA - used),
                total: config.DAILY_QUOTA,
                resetAt: new Date(new Date().setHours(24, 0, 0, 0)).toISOString()
            };
        },

        incrementUsage(userId) {
            const today = new Date().toISOString().split('T')[0];
            const existing = db.prepare(
                'SELECT count FROM usage WHERE user_id = ? AND date = ?'
            ).get(userId, today);

            if (existing) {
                db.prepare(
                    'UPDATE usage SET count = count + 1 WHERE user_id = ? AND date = ?'
                ).run(userId, today);
            } else {
                db.prepare(
                    'INSERT INTO usage (user_id, date, count) VALUES (?, ?, 1)'
                ).run(userId, today);
            }

            return this.checkQuota(userId);
        }
    };
}
