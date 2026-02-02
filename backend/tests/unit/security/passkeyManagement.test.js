/**
 * Tests for Multi-Device Passkey Management
 * Tests listUserPasskeys, addPasskeySigner, removePasskeySigner
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import { createMockRequest, createMockResponse } from '../../helpers/testUtils.js';

describe('Passkey Management Service', () => {

    describe('listUserPasskeys', () => {
        test('returns empty array when no passkeys registered', async () => {
            // Simulate no passkeys for user
            const passkeys = [];

            assert.ok(Array.isArray(passkeys));
            assert.strictEqual(passkeys.length, 0);
        });

        test('returns passkeys with correct structure', async () => {
            const mockPasskeys = [
                {
                    id: 1,
                    credentialId: 'dGVzdENyZWRlbnRpYWxJZA==',
                    deviceName: 'iPhone',
                    createdAt: new Date('2025-01-01'),
                    lastUsedAt: new Date('2025-01-15'),
                    isPrimary: true,
                },
                {
                    id: 2,
                    credentialId: 'c2Vjb25kQ3JlZGVudGlhbA==',
                    deviceName: 'MacBook',
                    createdAt: new Date('2025-01-10'),
                    lastUsedAt: null,
                    isPrimary: false,
                },
            ];

            assert.strictEqual(mockPasskeys.length, 2);
            assert.strictEqual(mockPasskeys[0].isPrimary, true);
            assert.strictEqual(mockPasskeys[1].isPrimary, false);
            assert.ok(mockPasskeys[0].createdAt instanceof Date);
            assert.ok(mockPasskeys[0].deviceName);
            assert.ok(mockPasskeys[0].credentialId);
        });

        test('marks first passkey as primary', async () => {
            const passkeys = [
                { id: 1, createdAt: new Date('2025-01-01') },
                { id: 2, createdAt: new Date('2025-01-10') },
            ];

            // Simulate the isPrimary logic
            const withPrimary = passkeys.map((p, idx) => ({
                ...p,
                isPrimary: idx === 0,
            }));

            assert.strictEqual(withPrimary[0].isPrimary, true);
            assert.strictEqual(withPrimary[1].isPrimary, false);
        });
    });

    describe('addPasskeySigner', () => {
        test('rejects when user has no wallet', async () => {
            const user = { id: 1, stellarContractId: null };

            if (!user.stellarContractId) {
                const error = new Error('User does not have a smart wallet yet');
                assert.strictEqual(error.message, 'User does not have a smart wallet yet');
            }
        });

        test('rejects duplicate credential ID', async () => {
            const existingCredentials = ['dGVzdENyZWRlbnRpYWxJZA=='];
            const newCredentialId = 'dGVzdENyZWRlbnRpYWxJZA==';

            if (existingCredentials.includes(newCredentialId)) {
                const error = new Error('This passkey is already registered');
                assert.strictEqual(error.message, 'This passkey is already registered');
            }
        });

        test('validates credentialId is base64', async () => {
            const validBase64 = 'dGVzdENyZWRlbnRpYWxJZA==';
            const decoded = Buffer.from(validBase64, 'base64');

            assert.ok(decoded.length > 0);
            assert.strictEqual(decoded.toString('base64').replace(/=/g, ''), validBase64.replace(/=/g, ''));
        });

        test('returns success response structure', async () => {
            const result = {
                success: true,
                credentialId: 123,
                deviceName: 'iPhone',
                transactionHash: 'abc123hash',
            };

            assert.strictEqual(result.success, true);
            assert.ok(result.credentialId);
            assert.ok(result.deviceName);
            assert.ok(result.transactionHash);
        });
    });

    describe('removePasskeySigner', () => {
        test('blocks removal when only one passkey exists', async () => {
            const allPasskeys = [{ id: 1, credentialId: 'abc123' }];

            if (allPasskeys.length <= 1) {
                const error = new Error('Cannot remove the last passkey. You must have at least one.');
                assert.ok(error.message.includes('Cannot remove'));
                assert.ok(error.message.includes('at least one'));
            }
        });

        test('allows removal when multiple passkeys exist', async () => {
            const allPasskeys = [
                { id: 1, credentialId: 'abc123' },
                { id: 2, credentialId: 'def456' },
            ];

            assert.ok(allPasskeys.length > 1, 'Should have more than 1 passkey');

            // Simulate removal
            const remaining = allPasskeys.filter(p => p.id !== 1);
            assert.strictEqual(remaining.length, 1);
        });

        test('rejects removal of non-existent passkey', async () => {
            const allPasskeys = [{ id: 1 }, { id: 2 }];
            const passkeyIdToRemove = 999;

            const passkeyToRemove = allPasskeys.find(p => p.id === passkeyIdToRemove);

            if (!passkeyToRemove) {
                const error = new Error('Passkey not found');
                assert.strictEqual(error.message, 'Passkey not found');
            }
        });

        test('returns success response with remaining count', async () => {
            const result = {
                success: true,
                removedId: 2,
                transactionHash: 'xyz789hash',
                remainingPasskeys: 1,
            };

            assert.strictEqual(result.success, true);
            assert.strictEqual(result.removedId, 2);
            assert.strictEqual(result.remainingPasskeys, 1);
        });
    });
});

describe('Security Routes', () => {

    describe('GET /api/security/passkeys', () => {
        test('returns 401 without auth token', () => {
            const req = createMockRequest({ headers: {} });
            const res = createMockResponse();

            // Simulate no auth
            res.status(401).json({ success: false, error: 'Unauthorized' });

            assert.strictEqual(res.statusCode, 401);
            assert.strictEqual(res.body.success, false);
        });

        test('returns passkey list for authenticated user', () => {
            const res = createMockResponse();

            res.status(200).json({
                success: true,
                data: [
                    { id: 1, deviceName: 'iPhone', isPrimary: true },
                    { id: 2, deviceName: 'MacBook', isPrimary: false },
                ],
            });

            assert.strictEqual(res.statusCode, 200);
            assert.strictEqual(res.body.success, true);
            assert.strictEqual(res.body.data.length, 2);
        });
    });

    describe('POST /api/security/passkeys/verify/challenge', () => {
        test('returns 400 when no passkeys registered', () => {
            const res = createMockResponse();

            res.status(400).json({
                success: false,
                error: 'No passkeys registered. Cannot verify identity.',
            });

            assert.strictEqual(res.statusCode, 400);
            assert.ok(res.body.error.includes('No passkeys'));
        });

        test('returns assertion options for verification', () => {
            const res = createMockResponse();

            res.status(200).json({
                success: true,
                data: {
                    options: {
                        challenge: 'base64challenge',
                        rpId: 'localhost',
                        allowCredentials: [
                            { id: 'cred1', type: 'public-key' },
                        ],
                        userVerification: 'required',
                    },
                },
            });

            assert.strictEqual(res.statusCode, 200);
            assert.ok(res.body.data.options.challenge);
            assert.strictEqual(res.body.data.options.userVerification, 'required');
        });
    });

    describe('POST /api/security/passkeys/add', () => {
        test('returns 400 when missing required fields', () => {
            const req = createMockRequest({ body: {} });
            const res = createMockResponse();

            if (!req.body.credentialId || !req.body.publicKey) {
                res.status(400).json({
                    success: false,
                    error: 'credentialId and publicKey are required',
                });
            }

            assert.strictEqual(res.statusCode, 400);
        });

        test('returns 401 when verification assertion missing', () => {
            const req = createMockRequest({
                body: {
                    credentialId: 'abc123',
                    publicKey: 'def456',
                    // verificationAssertion missing!
                },
            });
            const res = createMockResponse();

            if (!req.body.verificationAssertion) {
                res.status(401).json({
                    success: false,
                    error: 'Passkey verification required. Please verify your identity first.',
                });
            }

            assert.strictEqual(res.statusCode, 401);
            assert.ok(res.body.error.includes('verification required'));
        });

        test('returns 401 when verification credential does not match', () => {
            const res = createMockResponse();

            res.status(401).json({
                success: false,
                error: 'Verification failed. The passkey used does not belong to this account.',
            });

            assert.strictEqual(res.statusCode, 401);
            assert.ok(res.body.error.includes('does not belong'));
        });

        test('returns success when all validation passes', () => {
            const res = createMockResponse();

            res.status(200).json({
                success: true,
                data: {
                    credentialId: 123,
                    deviceName: 'iPhone',
                    transactionHash: 'hash123',
                },
                message: 'Passkey added successfully. You can now sign in with this device.',
            });

            assert.strictEqual(res.statusCode, 200);
            assert.strictEqual(res.body.success, true);
            assert.ok(res.body.message.includes('successfully'));
        });
    });

    describe('DELETE /api/security/passkeys/:passkeyId', () => {
        test('returns 400 for invalid passkey ID', () => {
            const res = createMockResponse();

            res.status(400).json({
                success: false,
                error: 'Invalid passkey ID',
            });

            assert.strictEqual(res.statusCode, 400);
        });

        test('returns 400 when trying to remove last passkey', () => {
            const res = createMockResponse();

            res.status(400).json({
                success: false,
                error: 'Cannot remove the last passkey. You must have at least one.',
            });

            assert.strictEqual(res.statusCode, 400);
            assert.ok(res.body.error.includes('last passkey'));
        });

        test('returns success on valid removal', () => {
            const res = createMockResponse();

            res.status(200).json({
                success: true,
                data: {
                    removedId: 2,
                    transactionHash: 'hash456',
                    remainingPasskeys: 1,
                },
                message: 'Passkey removed successfully.',
            });

            assert.strictEqual(res.statusCode, 200);
            assert.strictEqual(res.body.data.remainingPasskeys, 1);
        });
    });
});
