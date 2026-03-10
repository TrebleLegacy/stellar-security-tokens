import { test, describe } from 'node:test';
import assert from 'node:assert';

describe('RateLimit Middleware - Structure Tests', () => {
    test('RateLimit exports correctly', async () => {
        const { globalLimiter, authLimiter, apiLimiter, strictLimiter } = await import('../../../src/middleware/rateLimit.js');

        assert.ok(globalLimiter, 'globalLimiter should be exported');
        assert.ok(authLimiter, 'authLimiter should be exported');
        assert.ok(apiLimiter, 'apiLimiter should be exported');
        assert.ok(strictLimiter, 'strictLimiter should be exported');
    });

    test('Limiters are functions (middleware)', async () => {
        const { globalLimiter, authLimiter, apiLimiter, strictLimiter } = await import('../../../src/middleware/rateLimit.js');

        assert.strictEqual(typeof globalLimiter, 'function', 'globalLimiter should be a function');
        assert.strictEqual(typeof authLimiter, 'function', 'authLimiter should be a function');
        assert.strictEqual(typeof apiLimiter, 'function', 'apiLimiter should be a function');
        assert.strictEqual(typeof strictLimiter, 'function', 'strictLimiter should be a function');
    });

    test('conditionalRateLimit and skipRateLimitForTrusted are exported', async () => {
        const { conditionalRateLimit, skipRateLimitForTrusted } = await import('../../../src/middleware/rateLimit.js');

        assert.strictEqual(typeof conditionalRateLimit, 'function', 'conditionalRateLimit should be a function');
        assert.strictEqual(typeof skipRateLimitForTrusted, 'function', 'skipRateLimitForTrusted should be a function');
    });

    test('skipRateLimitForTrusted skips health endpoint', async () => {
        const { skipRateLimitForTrusted } = await import('../../../src/middleware/rateLimit.js');

        const mockReq = { path: '/health', headers: {} };
        const shouldSkip = skipRateLimitForTrusted(mockReq);

        assert.strictEqual(shouldSkip, true, 'Should skip rate limiting for /health');
    });

    test('skipRateLimitForTrusted does not skip regular endpoints', async () => {
        const { skipRateLimitForTrusted } = await import('../../../src/middleware/rateLimit.js');

        const mockReq = { path: '/api/investors', headers: {} };
        const shouldSkip = skipRateLimitForTrusted(mockReq);

        assert.strictEqual(shouldSkip, false, 'Should not skip rate limiting for regular endpoints');
    });

    test('conditionalRateLimit wraps limiter correctly', async () => {
        const { conditionalRateLimit, globalLimiter } = await import('../../../src/middleware/rateLimit.js');

        const wrapped = conditionalRateLimit(globalLimiter);

        assert.strictEqual(typeof wrapped, 'function', 'Wrapped limiter should be a function');
    });
});

