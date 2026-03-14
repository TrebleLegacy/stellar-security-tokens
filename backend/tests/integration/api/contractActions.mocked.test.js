/**
 * Contract Actions — Unit Tests (Mocked)
 *
 * Tests each ContractController method directly with esmock at the controller
 * level (NOT app.js). Bypasses Express startup chain entirely.
 *
 * Covers: pause, resume, deposit, price, ttl, withdraw, freeze, drain,
 *         upgrade, propose-admin, accept-admin, buyer-info.
 */
import { test, describe, before, beforeEach } from 'node:test';
import assert from 'node:assert';
import esmock from 'esmock';
import { MockSorobanSaleService } from '../../mocks/SorobanSaleService.mock.js';
import { MockTransactionManager } from '../../mocks/TransactionManager.mock.js';
import { MockStellarService } from '../../mocks/StellarService.mock.js';

const MOCK_CONTRACT_ID = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG6R7WZ7GVMERCPAGWQ2';
const MOCK_SAC_ID = 'CCJZ2RFBR7DG5QRP463MBB2H4KFYG4XTATMQCSLB5ZWTDP3MSF4OTYQE';
// Valid 56-char Stellar address starting with G
const MOCK_BUYER = 'GBUYERABCDEF1234567890123456789012345678901234567890ABCD';
const MOCK_WASM_HASH = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2';

// ── Helpers: mock Express req/res/next ──────────────────

function mockReq(overrides = {}) {
    return {
        params: {},
        body: {},
        headers: {},
        get: function(header) { return this.headers[header.toLowerCase()]; },
        user: { userId: 1, id: 1, role: 'platform_admin', userType: 'platform_admin' },
        ...overrides,
    };
}

function mockRes() {
    const res = {
        _status: 200,
        _json: null,
        _sent: false,
        status(code) { res._status = code; return res; },
        json(data) { res._json = data; res._sent = true; return res; },
    };
    return res;
}

function mockNext() {
    let _error = null;
    const next = (err) => { _error = err; };
    next.getError = () => _error;
    return next;
}

// ── Mock Prisma ─────────────────────────────────────────
// resolveContract calls prisma.offer.findUnique with include: { tokens: true }
// and also include: { company, _count } for detail()

const mockToken = {
    id: 10,
    assetCode: 'TEST01',
    sacContractId: MOCK_SAC_ID,
    issuerPublicKey: 'GBISSUERMOCK123456789012345678901234567890123456789012',
    totalSupply: 10000,
    issuanceTransactionHash: null,
};

const mockOffer = {
    id: 42,
    assetCode: 'TEST01',
    offerName: 'Test Offer',
    sorobanContractId: MOCK_CONTRACT_ID,
    sorobanInitStatus: 'created',
    sorobanInitError: null,
    status: 'active',
    totalSupply: 10000,
    unitPrice: 1.0,
    companyId: 1,
    offerType: 'sale',
    paymentType: 'one_time',
    annualInterestRate: null,
    maturityDate: null,
    description: 'Test offer',
    isTokenLocked: false,
    createdAt: new Date(),
    tokens: [mockToken],
    company: { id: 1, name: 'Test Co', cnpj: '12345678901234', stellarContractId: null },
    _count: { investments: 3 },
};

const mockPrisma = {
    offer: {
        findUnique: async ({ where }) => {
            if (where.id === 42) return { ...mockOffer };
            return null;
        },
        findMany: async () => [mockOffer],
    },
};

// ── Load controller with mocks ──────────────────────────

let ContractController;

describe('ContractController — Unit Tests (Mocked)', () => {

    before(async () => {
        const mod = await esmock('../../../src/controllers/contractController.js', {
            '../../../src/config/prisma.js': { default: mockPrisma },
            '../../../src/services/sorobanSale.service.js': {
                SorobanSaleService: MockSorobanSaleService,
            },
            '../../../src/services/stellar.service.js': {
                StellarService: MockStellarService,
            },
            '../../../src/services/transactionManager.service.js': {
                TransactionManager: MockTransactionManager,
                default: MockTransactionManager,
            },
        });
        ContractController = mod.ContractController;
    });

    beforeEach(() => {
        MockTransactionManager.reset();
    });

    // ═══════════════════════════════════════
    // LIST & DETAIL
    // ═══════════════════════════════════════

    test('list() — returns contracts array', async () => {
        const req = mockReq();
        const res = mockRes();
        const next = mockNext();
        await ContractController.list(req, res, next);
        assert.strictEqual(next.getError(), null, 'should not error');
        assert.ok(Array.isArray(res._json.contracts));
    });

    test('detail() — returns offer + on-chain data', async () => {
        const req = mockReq({ params: { offerId: '42' } });
        const res = mockRes();
        const next = mockNext();
        await ContractController.detail(req, res, next);
        assert.strictEqual(next.getError(), null, `should not error: ${next.getError()?.message}`);
        assert.ok(res._json.offer);
        assert.ok(res._json.onChain);
        assert.strictEqual(typeof res._json.onChain.balance, 'string');
    });

    test('detail() — 404 for non-existent offer (error via next)', async () => {
        const req = mockReq({ params: { offerId: '99999' } });
        const res = mockRes();
        const next = mockNext();
        await ContractController.detail(req, res, next);
        const err = next.getError();
        assert.ok(err, 'should pass error to next()');
        assert.strictEqual(err.status, 404);
    });

    // ═══════════════════════════════════════
    // DAY-TO-DAY OPS
    // ═══════════════════════════════════════

    test('pause() — queues set_active=false via TransactionManager', async () => {
        const req = mockReq({ params: { offerId: '42' } });
        const res = mockRes();
        const next = mockNext();
        await ContractController.pause(req, res, next);
        assert.strictEqual(next.getError(), null);
        assert.strictEqual(res._status, 202);
        assert.strictEqual(res._json.status, 'pending_multisig');
        const sub = MockTransactionManager.getLastSubmission();
        assert.strictEqual(sub.operationType, 'contract_pause');
    });

    test('resume() — queues set_active=true via TransactionManager', async () => {
        const req = mockReq({ params: { offerId: '42' } });
        const res = mockRes();
        const next = mockNext();
        await ContractController.resume(req, res, next);
        assert.strictEqual(next.getError(), null);
        assert.strictEqual(res._status, 202);
        const sub = MockTransactionManager.getLastSubmission();
        assert.strictEqual(sub.operationType, 'contract_resume');
    });

    test('deposit() — queues SAC authorize step', async () => {
        const req = mockReq({ params: { offerId: '42' }, body: { amount: 100 } });
        const res = mockRes();
        const next = mockNext();
        await ContractController.deposit(req, res, next);
        assert.strictEqual(next.getError(), null, `should not error: ${next.getError()?.message}`);
        assert.strictEqual(res._status, 202);
        assert.strictEqual(res._json.status, 'pending_multisig');
        assert.ok(res._json.note); // "Step 1 of 2" note
    });

    test('deposit() — error on missing amount (via next)', async () => {
        const req = mockReq({ params: { offerId: '42' }, body: {} });
        const res = mockRes();
        const next = mockNext();
        await ContractController.deposit(req, res, next);
        const err = next.getError();
        assert.ok(err, 'should pass error to next()');
        assert.strictEqual(err.status, 400);
    });

    test('updatePrice() — queues price update', async () => {
        const req = mockReq({ params: { offerId: '42' }, body: { sellPrice: 150, buyPrice: 150 } });
        const res = mockRes();
        const next = mockNext();
        await ContractController.updatePrice(req, res, next);
        assert.strictEqual(next.getError(), null);
        assert.strictEqual(res._status, 202);
        const sub = MockTransactionManager.getLastSubmission();
        assert.strictEqual(sub.operationType, 'contract_price');
    });

    test('updatePrice() — 400 on missing prices', async () => {
        const req = mockReq({ params: { offerId: '42' }, body: { sellPrice: 100 } });
        const res = mockRes();
        const next = mockNext();
        await ContractController.updatePrice(req, res, next);
        assert.strictEqual(res._status, 400);
    });

    test('extendTtl() — extends TTL via StellarService', async () => {
        const req = mockReq({ params: { offerId: '42' } });
        const res = mockRes();
        const next = mockNext();
        await ContractController.extendTtl(req, res, next);
        assert.strictEqual(next.getError(), null);
        assert.ok(res._json.success);
    });

    // ═══════════════════════════════════════
    // SENSITIVE OPS
    // ═══════════════════════════════════════

    test('withdraw() — queues token withdrawal', async () => {
        const req = mockReq({ params: { offerId: '42' }, body: { amount: 50 } });
        const res = mockRes();
        const next = mockNext();
        await ContractController.withdraw(req, res, next);
        assert.strictEqual(next.getError(), null, `should not error: ${next.getError()?.message}`);
        assert.strictEqual(res._status, 202);
        const sub = MockTransactionManager.getLastSubmission();
        assert.strictEqual(sub.operationType, 'contract_withdraw');
    });

    test('freeze() — queues buyer freeze', async () => {
        const req = mockReq({
            params: { offerId: '42' },
            body: { buyerAddress: MOCK_BUYER, frozen: true },
        });
        const res = mockRes();
        const next = mockNext();
        await ContractController.freeze(req, res, next);
        assert.strictEqual(next.getError(), null, `should not error: ${next.getError()?.message}`);
        assert.strictEqual(res._status, 202);
        const sub = MockTransactionManager.getLastSubmission();
        assert.strictEqual(sub.operationType, 'contract_freeze');
        assert.strictEqual(sub.metadata.frozen, true);
    });

    test('freeze() — error on missing buyerAddress (via next)', async () => {
        const req = mockReq({ params: { offerId: '42' }, body: { frozen: true } });
        const res = mockRes();
        const next = mockNext();
        await ContractController.freeze(req, res, next);
        const err = next.getError();
        assert.ok(err, 'should pass error to next()');
        assert.strictEqual(err.status, 400);
    });

    // ═══════════════════════════════════════
    // DESTRUCTIVE OPS
    // ═══════════════════════════════════════

    test('drain() — queues emergency drain with X-Confirm', async () => {
        const req = mockReq({
            params: { offerId: '42' },
            headers: { 'x-confirm': 'true' },
        });
        const res = mockRes();
        const next = mockNext();
        await ContractController.drain(req, res, next);
        assert.strictEqual(next.getError(), null);
        assert.strictEqual(res._status, 202);
        const sub = MockTransactionManager.getLastSubmission();
        assert.strictEqual(sub.operationType, 'contract_drain');
    });

    test('drain() — error without X-Confirm (via next)', async () => {
        const req = mockReq({ params: { offerId: '42' }, headers: {} });
        const res = mockRes();
        const next = mockNext();
        await ContractController.drain(req, res, next);
        const err = next.getError();
        assert.ok(err, 'should pass error to next()');
        assert.strictEqual(err.status, 400);
    });

    test('upgrade() — queues WASM upgrade', async () => {
        const req = mockReq({
            params: { offerId: '42' },
            body: { wasmHash: MOCK_WASM_HASH },
            headers: { 'x-confirm': 'true' },
        });
        const res = mockRes();
        const next = mockNext();
        await ContractController.upgrade(req, res, next);
        assert.strictEqual(next.getError(), null);
        assert.strictEqual(res._status, 202);
        const sub = MockTransactionManager.getLastSubmission();
        assert.strictEqual(sub.operationType, 'contract_upgrade');
    });

    test('upgrade() — 400 on missing wasmHash', async () => {
        const req = mockReq({
            params: { offerId: '42' },
            body: {},
            headers: { 'x-confirm': 'true' },
        });
        const res = mockRes();
        const next = mockNext();
        await ContractController.upgrade(req, res, next);
        assert.strictEqual(res._status, 400);
    });

    // ═══════════════════════════════════════
    // ADMIN TRANSFER
    // ═══════════════════════════════════════

    test('proposeAdmin() — queues admin proposal', async () => {
        const newAdmin = 'GNEWADMINBCDEF12345678901234567890123456789012345678WXYZ';
        const req = mockReq({
            params: { offerId: '42' },
            body: { newAdmin },
        });
        const res = mockRes();
        const next = mockNext();
        await ContractController.proposeAdmin(req, res, next);
        assert.strictEqual(next.getError(), null, `should not error: ${next.getError()?.message}`);
        assert.strictEqual(res._status, 202);
    });

    test('acceptAdmin() — queues admin acceptance', async () => {
        const req = mockReq({ params: { offerId: '42' } });
        const res = mockRes();
        const next = mockNext();
        await ContractController.acceptAdmin(req, res, next);
        assert.strictEqual(next.getError(), null);
        assert.strictEqual(res._status, 202);
    });

    // ═══════════════════════════════════════
    // BUYER QUERIES
    // ═══════════════════════════════════════

    test('buyerInfo() — returns spent + frozen status', async () => {
        const req = mockReq({
            params: { offerId: '42', addr: MOCK_BUYER },
        });
        const res = mockRes();
        const next = mockNext();
        await ContractController.buyerInfo(req, res, next);
        assert.strictEqual(next.getError(), null, `should not error: ${next.getError()?.message}`);
        assert.strictEqual(res._json.buyerAddress, MOCK_BUYER);
        assert.strictEqual(typeof res._json.totalSpent, 'string');
        assert.strictEqual(typeof res._json.isFrozen, 'boolean');
    });

    // ═══════════════════════════════════════
    // EDGE CASES
    // ═══════════════════════════════════════

    test('Any action on non-existent offer → error 404 via next', async () => {
        const req = mockReq({ params: { offerId: '99999' } });
        const res = mockRes();
        const next = mockNext();
        await ContractController.pause(req, res, next);
        const err = next.getError();
        assert.ok(err, 'should pass error to next()');
        assert.strictEqual(err.status, 404);
    });
});
