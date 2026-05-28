import { randomUUID } from 'crypto';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function requestIdMiddleware(req, res, next) {
    const clientRequestId = req.headers['x-request-id'];
    const requestId = (clientRequestId && UUID_REGEX.test(clientRequestId))
        ? clientRequestId
        : randomUUID();
    req.requestId = requestId;
    res.setHeader('X-Request-Id', requestId);
    next();
}

export function getRequestId(req) {
    return req.requestId || 'unknown';
}
