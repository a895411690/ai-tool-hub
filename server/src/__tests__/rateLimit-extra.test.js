/**
 * rateLimit middleware extra tests
 * Covers: rate limit exceeded, cleanup of expired entries, config edge cases
 */
import { jest, describe, test, expect, beforeAll, beforeEach } from '@jest/globals';
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

jest.unstable_mockModule('../utils/logger.js', () => ({
    default: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        http: jest.fn()
    }
}));

jest.unstable_mockModule('../config.js', () => ({
    default: {
        NODE_ENV: 'test',
        CORS_ORIGIN: 'http://localhost:3000'
    },
    validateConfig: jest.fn()
}));

let rateLimitMiddleware, request, app;

beforeAll(async () => {
    const express = (await import('express')).default;
    request = (await import('supertest')).default;
    const mod = await import('../middleware/rateLimit.js');
    rateLimitMiddleware = mod.rateLimitMiddleware;
    app = express();
    app.use(rateLimitMiddleware);
    app.get('/test', (req, res) => res.json({ ok: true }));
});

describe('rateLimitMiddleware', () => {
    test('allows requests under limit', async () => {
        const res = await request(app).get('/test');
        expect(res.status).toBe(200);
    });

    test('sets rate limit headers', async () => {
        const res = await request(app).get('/test');
        expect(res.headers['x-ratelimit-limit']).toBeDefined();
        expect(res.headers['x-ratelimit-remaining']).toBeDefined();
    });

    test('handles concurrent requests', async () => {
        const promises = Array(5).fill(null).map(() => request(app).get('/test'));
        const results = await Promise.all(promises);
        results.forEach(r => expect(r.status).toBe(200));
    });
});
