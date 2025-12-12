import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import supertest from 'supertest';
import app from '../../../src/app.js';
import { setupTestDatabase, teardownTestDatabase } from '../../helpers/testDatabase.js';
import { getInvestorToken } from '../../helpers/authHelper.js';

const request = supertest(app);

describe('Investment Metrics API Integration Tests', () => {
  let investor;
  let authToken;

  before(async () => {
    const data = await setupTestDatabase();
    investor = data.investor;
    authToken = getInvestorToken(investor);
  });

  after(async () => {
    await teardownTestDatabase();
  });

  test('GET /api/investors/:id/metrics - should return metrics', async () => {
    const res = await request
      .get(`/api/investors/${investor.id}/metrics`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.metrics);
    assert.strictEqual(res.body.data.metrics.totalInvested, 0); // No investments yet
  });
});

