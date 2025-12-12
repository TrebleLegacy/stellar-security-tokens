import { describe, it } from 'node:test';
import assert from 'node:assert';
import * as investorController from '../../../src/controllers/investorController.js';

// Nota: Estes testes requerem refatoração para dependency injection ou PostgreSQL rodando

describe('InvestorController', () => {
  it('exports all required functions', () => {
    // Core passkey registration flow
    assert.ok(investorController.registerInvestorWithPasskey, 'registerInvestorWithPasskey should be exported');
    assert.ok(investorController.verifyEmail, 'verifyEmail should be exported');


    // assert.ok(investorController.deleteInvestor, 'deleteInvestor should be exported'); // Not implemented yet
    assert.ok(investorController.getInvestorPortfolio, 'getInvestorPortfolio should be exported');
  });
});
