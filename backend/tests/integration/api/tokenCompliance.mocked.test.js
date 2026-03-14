/**
 * Token Compliance — Unit Tests (Mocked)
 *
 * Tests freeze, unfreeze, clawback, disable-clawback, list holders directly
 * at the controller function level with esmock.
 * No app.js import, no DB, no Stellar network calls.
 */
import { test, describe, before } from 'node:test';
import assert from 'node:assert';
import esmock from 'esmock';
import { MockStellarService } from '../../mocks/StellarService.mock.js';

const VALID_KEY = 'GINVESTOR234567890123456789012345678901234567890123456789';

// ── Helpers ─────────────────────────────────────────────

function mockReq(overrides = {}) {
    return {
        params: {},
        body: {},
        headers: {},
        user: { userId: 1, role: 'platform_admin', userType: 'platform_admin' },
        ...overrides,
    };
}

function mockRes() {
    const res = {
        _status: 200,
        _json: null,
        status(code) { res._status = code; return res; },
        json(data) { res._json = data; return res; },
    };
    return res;
}

function mockNext() {
    let _err = null;
    const fn = (e) => { _err = e; };
    fn.getError = () => _err;
    return fn;
}

// ── Mock keyManager ─────────────────────────────────────

const mockKeyManager = {
    requiresMultisigApproval: () => false,
    getIssuerPublicKey: () => 'GBISSUERMOCK123456789012345678901234567890123456789012',
    getRequiredSigners: () => [],
    getSignatureThreshold: () => 1,
};

// ── Load controllers ────────────────────────────────────

let freezeAccount, unfreezeAccount, clawbackTokens, disableClawback, listAssetHolders;

describe('Token Compliance — Unit Tests (Mocked)', () => {

    before(async () => {
        const mod = await esmock('../../../src/controllers/tokenController.js', {
            '../../../src/services/stellar.service.js': {
                StellarService: MockStellarService,
            },
            '../../../src/services/KeyManager.js': {
                keyManager: mockKeyManager,
            },
            '../../../src/config/stellar.js': {
                buildUnsignedTransaction: async () => 'mock_xdr',
            },
            '../../../src/services/multiSigTransaction.service.js': {
                MultiSigTransactionService: {
                    create: async (params) => ({ id: 99, ...params }),
                },
            },
        });
        freezeAccount = mod.freezeAccount;
        unfreezeAccount = mod.unfreezeAccount;
        clawbackTokens = mod.clawbackTokens;
        disableClawback = mod.disableClawback;
        listAssetHolders = mod.listAssetHolders;
    });

    // ═══════════════════════════════════════
    // FREEZE
    // ═══════════════════════════════════════

    test('freezeAccount — success', async () => {
        const req = mockReq({ body: { investorPublicKey: VALID_KEY, assetCode: 'TEST01' } });
        const res = mockRes();
        const next = mockNext();
        await freezeAccount(req, res, next);
        assert.strictEqual(res._status, 200);
        assert.strictEqual(res._json.success, true);
        assert.ok(res._json.data.transactionHash);
    });

    test('freezeAccount — 400 on missing investorPublicKey', async () => {
        const req = mockReq({ body: { assetCode: 'TEST01' } });
        const res = mockRes();
        const next = mockNext();
        await freezeAccount(req, res, next);
        assert.strictEqual(res._status, 400);
    });

    test('freezeAccount — 400 on missing assetCode', async () => {
        const req = mockReq({ body: { investorPublicKey: VALID_KEY } });
        const res = mockRes();
        const next = mockNext();
        await freezeAccount(req, res, next);
        assert.strictEqual(res._status, 400);
    });

    // ═══════════════════════════════════════
    // UNFREEZE
    // ═══════════════════════════════════════

    test('unfreezeAccount — success', async () => {
        const req = mockReq({ body: { investorPublicKey: VALID_KEY, assetCode: 'TEST01' } });
        const res = mockRes();
        const next = mockNext();
        await unfreezeAccount(req, res, next);
        assert.strictEqual(res._status, 200);
        assert.strictEqual(res._json.success, true);
    });

    test('unfreezeAccount — 400 on empty body', async () => {
        const req = mockReq({ body: {} });
        const res = mockRes();
        const next = mockNext();
        await unfreezeAccount(req, res, next);
        assert.strictEqual(res._status, 400);
    });

    // ═══════════════════════════════════════
    // CLAWBACK
    // ═══════════════════════════════════════

    test('clawbackTokens — success', async () => {
        const req = mockReq({
            body: { investorPublicKey: VALID_KEY, assetCode: 'TEST01', amount: 100 },
        });
        const res = mockRes();
        const next = mockNext();
        await clawbackTokens(req, res, next);
        assert.strictEqual(res._status, 200);
        assert.strictEqual(res._json.success, true);
        assert.ok(res._json.data.transactionHash);
    });

    test('clawbackTokens — 400 on missing amount', async () => {
        const req = mockReq({
            body: { investorPublicKey: VALID_KEY, assetCode: 'TEST01' },
        });
        const res = mockRes();
        const next = mockNext();
        await clawbackTokens(req, res, next);
        assert.strictEqual(res._status, 400);
    });

    // ═══════════════════════════════════════
    // DISABLE CLAWBACK
    // ═══════════════════════════════════════

    test('disableClawback — success (direct mode)', async () => {
        const req = mockReq({
            body: { investorPublicKey: VALID_KEY, assetCode: 'TEST01' },
        });
        const res = mockRes();
        const next = mockNext();
        await disableClawback(req, res, next);
        assert.strictEqual(res._status, 200);
        assert.strictEqual(res._json.success, true);
    });

    test('disableClawback — 400 on missing fields', async () => {
        const req = mockReq({ body: {} });
        const res = mockRes();
        const next = mockNext();
        await disableClawback(req, res, next);
        assert.strictEqual(res._status, 400);
    });

    // ═══════════════════════════════════════
    // LIST HOLDERS
    // ═══════════════════════════════════════

    test('listAssetHolders — returns array', async () => {
        const req = mockReq({ params: { assetCode: 'TEST01' } });
        const res = mockRes();
        const next = mockNext();
        await listAssetHolders(req, res, next);
        assert.strictEqual(res._status, 200);
        assert.strictEqual(res._json.success, true);
        assert.ok(Array.isArray(res._json.data));
    });

    test('listAssetHolders — 400 on missing assetCode', async () => {
        const req = mockReq({ params: {} });
        const res = mockRes();
        const next = mockNext();
        await listAssetHolders(req, res, next);
        assert.strictEqual(res._status, 400);
    });
});
