import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { apiClient, setAuthToken, clearAuthToken } from '../../helpers/apiClient.js';
import prisma from '../../../src/config/prisma.js';
import { setupTestDatabase, cleanDatabase } from '../../helpers/testDatabase.js';
import { createTestAdmin } from '../../helpers/authHelper.js';

describe('KYC Lifecycle Flow', () => {
    let adminToken;
    let adminId;

    before(async () => {
        await setupTestDatabase();
        const admin = await createTestAdmin();
        adminToken = admin.token;
        adminId = admin.id;
    });

    after(async () => {
        await cleanDatabase();
        await prisma.$disconnect();
    });

    it('should complete the full KYC lifecycle', async () => {
        // 1. Register new investor
        const investorData = {
            name: 'John Doe KYC',
            email: `john.kyc.${Date.now()}@example.com`,
            document: '12345678901',
            password: 'password123'
        };

        const registerRes = await apiClient.post('/api/investors/register', {
            body: investorData
        });

        assert.strictEqual(registerRes.status, 201);
        assert.ok(registerRes.data.success);
        const investorId = registerRes.data.data.id;
        assert.ok(investorId);

        // 2. Verify initial status is pending
        const investorBefore = await prisma.investor.findUnique({
            where: { id: investorId }
        });
        assert.strictEqual(investorBefore.kycStatus, 'pending');

        // 3. Admin approves investor (via direct DB update, simulating admin action)
        const approvedInvestor = await prisma.investor.update({
            where: { id: investorId },
            data: { kycStatus: 'approved' }
        });

        assert.strictEqual(approvedInvestor.kycStatus, 'approved');

        // 4. Verify DB status is approved
        const investorAfter = await prisma.investor.findUnique({
            where: { id: investorId }
        });
        assert.strictEqual(investorAfter.kycStatus, 'approved');

        // 5. Investor login (should succeed and show approved status)
        clearAuthToken();

        const loginRes = await apiClient.post('/api/investors/login', {
            body: {
                email: investorData.email,
                password: investorData.password
            }
        });

        assert.strictEqual(loginRes.status, 200);
        assert.ok(loginRes.data.success);
        assert.ok(loginRes.data.data.token);
        assert.strictEqual(loginRes.data.data.investor.kycStatus, 'approved');
    });
});
