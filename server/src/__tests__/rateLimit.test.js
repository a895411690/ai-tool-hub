/**
 * Rate limit middleware tests
 */
import { jest } from '@jest/globals';
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock logger with shared reference for assertions
const mockLogger = {
    default: {
        warn: jest.fn(),
        debug: jest.fn(),
        info: jest.fn(),
        error: jest.fn(),
        http: jest.fn()
    }
};

jest.unstable_mockModule('../utils/logger.js', () => mockLogger);

let rateLimitMiddleware;

beforeAll(async () => {
    const middleware = await import('../middleware/rateLimit.js');
    rateLimitMiddleware = middleware.rateLimitMiddleware;
});

beforeEach(() => {
    jest.clearAllMocks();
});

function mockReqRes() {
    const req = {
        ip: '192.168.1.1',
        connection: { remoteAddress: '192.168.1.1' },
        requestId: 'test-req-id'
    };
    const res = {
        setHeader: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
    };
    const next = jest.fn();
    return { req, res, next };
}

// ---------------------------------------------------------------------------
// Rate limit headers
// ---------------------------------------------------------------------------

describe('rateLimitMiddleware', () => {
    test('should set rate limit headers on first request', () => {
        const { req, res, next } = mockReqRes();
        rateLimitMiddleware(req, res, next);

        expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 30);
        expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', 30);
        expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Reset', expect.any(Number));
        expect(next).toHaveBeenCalled();
    });

    test('should decrement remaining on each request', () => {
        const req = { ip: '10.0.0.100', connection: { remoteAddress: '10.0.0.100' }, requestId: 'r' };
        const res = { setHeader: jest.fn(), status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
        const next = jest.fn();
        rateLimitMiddleware(req, res, next);
        expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', 30);

        jest.clearAllMocks();
        rateLimitMiddleware(req, res, next);
        expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', 29);
    });

    test('should track different IPs independently', () => {
        const req1 = { ip: '10.0.0.1', connection: { remoteAddress: '10.0.0.1' }, requestId: 'r1' };
        const req2 = { ip: '10.0.0.2', connection: { remoteAddress: '10.0.0.2' }, requestId: 'r2' };
        const res1 = { setHeader: jest.fn(), status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
        const res2 = { setHeader: jest.fn(), status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
        const next1 = jest.fn();
        const next2 = jest.fn();

        rateLimitMiddleware(req1, res1, next1);
        rateLimitMiddleware(req2, res2, next2);

        expect(res1.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', 30);
        expect(res2.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', 30);
    });
});

// ---------------------------------------------------------------------------
// Rate limit exceeded
// ---------------------------------------------------------------------------

describe('rateLimitMiddleware — limit exceeded', () => {
    test('should return 429 when rate limit is exceeded', () => {
        const req = { ip: '10.0.0.200', connection: { remoteAddress: '10.0.0.200' }, requestId: 'r' };
        const res = { setHeader: jest.fn(), status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
        const next = jest.fn();

        for (let i = 0; i < 30; i++) {
            jest.clearAllMocks();
            rateLimitMiddleware(req, res, next);
        }

        jest.clearAllMocks();
        rateLimitMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(429);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            error: expect.stringContaining('频繁')
        }));
        expect(next).not.toHaveBeenCalled();
    });

    test('should include retryAfter in 429 response', () => {
        const req = { ip: '10.0.0.201', connection: { remoteAddress: '10.0.0.201' }, requestId: 'r' };
        const res = { setHeader: jest.fn(), status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
        const next = jest.fn();

        for (let i = 0; i < 30; i++) {
            jest.clearAllMocks();
            rateLimitMiddleware(req, res, next);
        }

        jest.clearAllMocks();
        rateLimitMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(429);
        expect(res.setHeader).toHaveBeenCalledWith('Retry-After', expect.any(Number));
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            retryAfter: expect.any(Number)
        }));
    });

    test('should log warning when rate limit exceeded', () => {
        const req = { ip: '10.0.0.202', connection: { remoteAddress: '10.0.0.202' }, requestId: 'r' };
        const res = { setHeader: jest.fn(), status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
        const next = jest.fn();

        for (let i = 0; i < 30; i++) {
            jest.clearAllMocks();
            rateLimitMiddleware(req, res, next);
        }

        jest.clearAllMocks();
        rateLimitMiddleware(req, res, next);

        expect(mockLogger.default.warn).toHaveBeenCalledWith(
            expect.stringContaining('Rate limit exceeded')
        );
    });

    test('should include requestId in warning log', () => {
        const req = { ip: '10.0.0.203', connection: { remoteAddress: '10.0.0.203' }, requestId: 'custom-test-id' };
        const res = { setHeader: jest.fn(), status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
        const next = jest.fn();
        req.requestId = 'custom-test-id';

        for (let i = 0; i < 30; i++) {
            jest.clearAllMocks();
            rateLimitMiddleware(req, res, next);
        }

        jest.clearAllMocks();
        rateLimitMiddleware(req, res, next);

        expect(mockLogger.default.warn).toHaveBeenCalledWith(
            expect.stringContaining('custom-test-id')
        );
    });
});
