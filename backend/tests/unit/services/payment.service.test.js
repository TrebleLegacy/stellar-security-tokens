import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import esmock from 'esmock';

describe('PaymentService Unit Tests', async () => {
  let PaymentService;

  beforeEach(async () => {
    // Mock all dependencies to ensure clean load of PaymentService
    const module = await esmock('../../../src/services/payment.service.js', {
      '../../../src/config/prisma.js': { default: {} },
      '../../../src/models/Investor.js': { Investor: {} },
      '../../../src/models/Token.js': { Token: {} },
      '../../../src/models/Offer.js': { Offer: {} },
      '../../../src/services/stellar.service.js': { StellarService: { getAccountRPC: async () => ({}) } }, // Mock the new dependency
      '../../../src/services/email.service.js': { EmailService: {} },
      '../../../src/services/config.service.js': { ConfigService: {} },
      '../../../src/config/stellar.js': {
        stellarServer: {},
        getDistributorKeypair: () => { },
        buildTransaction: () => { },
        buildTransactionWithAccount: () => { }, // Mock the new import
        getSorobanRpcUrl: () => { },
        getIssuerKeypair: () => { },
      },
      '../../../src/services/transactionManager.service.js': { TransactionManager: {} }
    });
    PaymentService = module.PaymentService;
  });

  describe('Structure & Exports', () => {
    test('PaymentService exports correctly', () => {
      assert.ok(PaymentService);
    });

    test('PaymentService has required methods', () => {
      const requiredMethods = [
        'getInvestorsWithBalances',
        'calculateMonthlyInterest',
        'createBatchUSDCPayment',
        'recordInterestPayments',
        'processMonthlyInterestPayments'
      ];
      requiredMethods.forEach(method => {
        assert.strictEqual(typeof PaymentService[method], 'function', `${method} should be a function`);
      });
    });
  });

  describe('Interest Calculations', () => {
    test('calculateMonthlyInterest (10% a.a.)', () => {
      // 10% a.a. implies ~0.833% per month
      // 100 * (10/100/12) = 0.8333333...
      const result = PaymentService.calculateMonthlyInterest(100);
      assert.ok(Math.abs(result - 0.8333333) < 0.000001);
    });

    test('calculateMonthlyInterest returns 0 for non-positive', () => {
      assert.strictEqual(PaymentService.calculateMonthlyInterest(0), 0);
      assert.strictEqual(PaymentService.calculateMonthlyInterest(-50), 0);
    });

    test('calculateMonthlyInterest handles decimals', () => {
      // 50.5 * (10/100/12) = 0.4208333...
      const result = PaymentService.calculateMonthlyInterest(50.5);
      assert.ok(Math.abs(result - 0.4208333) < 0.000001);
    });
  });
});
