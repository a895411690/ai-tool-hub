/**
 * Request ID middleware tests
 */
import { jest } from '@jest/globals';

let requestIdMiddleware, getRequestId;

beforeAll(async () => {
    const middleware = await import('../middleware/requestId.js');
    requestIdMiddleware = middleware.requestIdMiddleware;
    getRequestId = middleware.getRequestId;
});

beforeEach(() => {
    jest.clearAllMocks();
});

function mockReqRes() {
    const req = { headers: {} };
    const res = { setHeader: jest.fn() };
    const next = jest.fn();
    return { req, res, next };
}

// ---------------------------------------------------------------------------
// requestIdMiddleware
// ---------------------------------------------------------------------------

describe('requestIdMiddleware', () => {
    test('should generate a UUID when no x-request-id header is present', () => {
        const { req, res, next } = mockReqRes();

        requestIdMiddleware(req, res, next);

        expect(req.requestId).toBeDefined();
        expect(req.requestId).toMatch(
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        );
        expect(next).toHaveBeenCalled();
    });

    test('should set X-Request-Id response header', () => {
        const { req, res, next } = mockReqRes();

        requestIdMiddleware(req, res, next);

        expect(res.setHeader).toHaveBeenCalledWith('X-Request-Id', req.requestId);
    });

    test('should accept a valid UUID from x-request-id header', () => {
        const clientId = '550e8400-e29b-41d4-a716-446655440000';
        const { req, res, next } = mockReqRes();
        req.headers['x-request-id'] = clientId;

        requestIdMiddleware(req, res, next);

        expect(req.requestId).toBe(clientId);
        expect(res.setHeader).toHaveBeenCalledWith('X-Request-Id', clientId);
    });

    test('should reject invalid UUID from x-request-id header and generate new one', () => {
        const { req, res, next } = mockReqRes();
        req.headers['x-request-id'] = 'not-a-uuid';

        requestIdMiddleware(req, res, next);

        expect(req.requestId).not.toBe('not-a-uuid');
        expect(req.requestId).toMatch(
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        );
    });

    test('should reject malformed UUID (wrong format)', () => {
        const { req, res, next } = mockReqRes();
        req.headers['x-request-id'] = 'zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz'; // not hex

        requestIdMiddleware(req, res, next);

        expect(req.requestId).not.toBe('zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz');
        expect(req.requestId).toMatch(
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        );
    });

    test('should generate unique IDs for consecutive requests', () => {
        const { req: req1, res: res1, next: next1 } = mockReqRes();
        const { req: req2, res: res2, next: next2 } = mockReqRes();

        requestIdMiddleware(req1, res1, next1);
        requestIdMiddleware(req2, res2, next2);

        expect(req1.requestId).not.toBe(req2.requestId);
    });
});

// ---------------------------------------------------------------------------
// getRequestId
// ---------------------------------------------------------------------------

describe('getRequestId', () => {
    test('should return requestId when present', () => {
        const req = { requestId: 'abc-123' };
        expect(getRequestId(req)).toBe('abc-123');
    });

    test('should return "unknown" when requestId is not set', () => {
        const req = {};
        expect(getRequestId(req)).toBe('unknown');
    });

    test('should return "unknown" when req has no requestId', () => {
        expect(getRequestId({})).toBe('unknown');
    });
});
