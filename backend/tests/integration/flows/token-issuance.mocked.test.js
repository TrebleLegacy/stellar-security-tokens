import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import esmock from 'esmock';
import { TestData } from '../../helpers/testData.js';
import { TestDatabase } from '../../helpers/testDatabase.js';
import request from 'supertest';
import path from 'path';

// Import Mock
import { MockStellarService } from '../../mocks/StellarService.mock.js';

describe('Token Issuance Flow (Mocked)', () => {
    let companyUser;
    let companyToken;
    let adminToken;
    let app;
    let adminAccount;

    before(async () => {
        const srcPath = path.resolve(process.cwd(), 'src');
        const appPath = path.join(srcPath, 'app.js');
        const stellarServicePath = path.join(srcPath, 'services/stellar.service.js');

        // Initializes the app with mocked services using esmock
        // We use the 3rd argument (optMocks) for deep mocking to ensure 
        // StellarService is mocked everywhere in the app tree.
        const appModule = await esmock(appPath, {}, {
            [stellarServicePath]: {
                StellarService: MockStellarService
            }
        });
        app = appModule.default;

        await TestDatabase.setup();

        // Create company and user
        const companyData = await TestData.createCompany();
        companyUser = await TestData.createCompanyUser(companyData.id);
        companyToken = TestData.generateToken(companyUser.id, 'company_user', companyData.id);

        // Create admin
        adminAccount = await TestData.createPlatformAdmin();
        adminToken = TestData.generateToken(adminAccount.id, 'platform_admin');

        // Ensure env var for the test admin check
        process.env.STELLAR_ISSUER_PUBLIC_KEY = 'GBISSUERMOCK123456789012345678901234567890123456789012';
    });

    after(async () => {
        await TestDatabase.cleanup();
    });

    it('should issue a token from an approved offer', async () => {
        // 1. Create an offer
        const offerResponse = await request(app)
            .post('/api/companies/offers')
            .set('Authorization', `Bearer ${companyToken}`)
            .send({
                asset_code: 'ISSUE01',
                offer_name: 'Issue Test Offer',
                description: 'Testing token issuance',
                total_supply: '1000000',
                annual_interest_rate: 8.5,
                offer_type: 'collateral',
                payment_type: 'monthly'
            });

        assert.strictEqual(offerResponse.status, 201);
        const offerId = offerResponse.body.data.id;

        // 2. Approve the offer (Admin)
        const approveResponse = await request(app)
            .put(`/api/admin/offers/${offerId}/review`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                status: 'approved'
            });

        assert.strictEqual(approveResponse.status, 200);

        // 3. Issue the token
        const issueResponse = await request(app)
            .post(`/api/admin/offers/${offerId}/issue`)
            .set('Authorization', `Bearer ${adminToken}`);

        if (issueResponse.status !== 201) {
            console.error('Issuance failed:', issueResponse.body);
        }

        assert.strictEqual(issueResponse.status, 201, 'Should return 201 Created');
        assert.strictEqual(issueResponse.body.success, true);
        assert.ok(issueResponse.body.data.token, 'Should contain token data');
        assert.strictEqual(issueResponse.body.data.token.assetCode, 'ISSUE01');
        assert.ok(issueResponse.body.data.stellar_transaction, 'Should contain stellar transaction data');
    });

    it('should fail to issue if already issued', async () => {
        // Find existing offer for ISSUE01
        const offers = await request(app)
            .get('/api/admin/offers')
            .set('Authorization', `Bearer ${adminToken}`);

        const offer = offers.body.data.find(o => o.assetCode === 'ISSUE01');

        const secondIssueResponse = await request(app)
            .post(`/api/admin/offers/${offer.id}/issue`)
            .set('Authorization', `Bearer ${adminToken}`);

        assert.strictEqual(secondIssueResponse.status, 409);
        assert.strictEqual(secondIssueResponse.body.error, 'Token already issued for this offer');
    });
});
