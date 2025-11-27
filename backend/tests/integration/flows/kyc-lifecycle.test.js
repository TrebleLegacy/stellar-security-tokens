import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from '../../../src/index.js';
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
            name: 'John Doe',
            email: 'john.doe.kyc@example.com',
            document: '12345678901',
            password: 'password123'
        };

        const registerRes = await request(app)
            .post('/api/investors/register')
            .send(investorData)
            .expect(201);

        assert.ok(registerRes.body.success);
        const investorId = registerRes.body.data.investor.id;
        assert.ok(investorId);

        // 2. Verify initial status is pending
        const investorBefore = await prisma.investor.findUnique({
            where: { id: investorId }
        });
        assert.strictEqual(investorBefore.kycStatus, 'pending');

        // 3. Admin approves investor
        const approveRes = await request(app)
            .put(`/api/platform-admins/investors/${investorId}/approve`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                notes: 'Documents verified manually'
            })
            .expect(200);

        assert.ok(approveRes.body.success);
        assert.strictEqual(approveRes.body.data.investor.kycStatus, 'approved');

        // 4. Verify DB status is approved
        const investorAfter = await prisma.investor.findUnique({
            where: { id: investorId }
        });
        assert.strictEqual(investorAfter.kycStatus, 'approved');

        // 5. Investor login (should succeed and show approved status)
        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({
                email: investorData.email,
                password: investorData.password
            })
            .expect(200);

        assert.ok(loginRes.body.success);
        assert.ok(loginRes.body.data.token);
        assert.strictEqual(loginRes.body.data.investor.kycStatus, 'approved');
    });
});
