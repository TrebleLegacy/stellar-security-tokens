import { test, describe } from 'node:test';
import assert from 'node:assert';

describe('Investors API Integration Tests', () => {
  test.skip('DEPRECATED: Traditional registration removed - use passkey flow', async () => {
    // Old tests for POST /api/investors/register with password
    // Replaced by passkey registration flow
    assert.ok(true);
  });

  test.skip('DEPRECATED: Traditional login removed - use passkey authentication', async () => {
    // Old tests for email/password login
    // Replaced by WebAuthn passkey flow
    assert.ok(true);
  });

  // TODO: Add new tests for:
  // - POST /api/investors/register (passkey flow with email verification)
  // - POST /api/investors/verify-email
  // - POST /api/investors/create-wallet
  // - GET /api/investors (with mocked JWT token)
  // - GET /api/investors/:id (with mocked JWT token)
});
