/**
 * Investment Flow Integration Test (Database-focused)
 * 
 * Tests the complete business logic flow without HTTP layer.
 * More reliable than API tests with mocked services.
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import prisma from '../../../src/config/prisma.js';
import { TestDatabase } from '../../helpers/testDatabase.js';

describe('Investment Flow Integration (DB-focused)', () => {
    let company;
    let companyUser;
    let investor;
    let admin;
    let offer;
    let investment;

    const timestamp = Date.now();
    const assetCode = `FLO${timestamp.toString().slice(-7)}`;

    before(async () => {
        await TestDatabase.setup();
    });

    after(async () => {
        await TestDatabase.cleanup();
        await prisma.$disconnect();
    });

    // ===== PHASE 1: Setup Entities =====
    it('should create company with approved status', async () => {
        company = await prisma.company.create({
            data: {
                name: 'Flow Test Company',
                cnpj: `${timestamp % 100000000000000}`.padStart(14, '0'),
                email: `flow.company.${timestamp}@test.com`,
                legalRepresentative: 'Flow Test CEO',
                status: 'approved'
            }
        });

        assert.ok(company.id, 'Company should have an ID');
        assert.strictEqual(company.status, 'approved');
    });

    it('should create company user', async () => {
        companyUser = await prisma.companyUser.create({
            data: {
                companyId: company.id,
                name: 'Flow Company Admin',
                email: `flow.admin.${timestamp}@test.com`,
                passwordHash: 'hash',
                role: 'admin'
            }
        });

        assert.ok(companyUser.id, 'Company user should have an ID');
    });

    it('should create approved investor with smart wallet', async () => {
        investor = await prisma.investor.create({
            data: {
                name: 'Flow Test Investor',
                email: `flow.investor.${timestamp}@test.com`,
                document: `${timestamp % 100000000000}`.padStart(11, '0'),
                stellarContractId: 'C' + 'FLOWINVESTOR'.padEnd(55, '0'),
                passkeyCredentialId: `flow-credential-${timestamp}`,
                passkeyPublicKey: Buffer.from('flow-public-key'),
                kycStatus: 'approved',
                emailVerified: true
            }
        });

        assert.ok(investor.id, 'Investor should have an ID');
        assert.strictEqual(investor.kycStatus, 'approved');
    });

    // ===== PHASE 2: Offer Lifecycle =====
    it('should create offer in pending_review status', async () => {
        offer = await prisma.offer.create({
            data: {
                companyId: company.id,
                requestedBy: companyUser.id,
                assetCode: assetCode,
                offerName: 'Flow Test Token',
                description: 'Integration test security token',
                totalSupply: 100000,
                annualInterestRate: 12.0,
                offerType: 'sale',
                status: 'pending_review',
                paymentType: 'bullet',
                paymentFrequency: 12,
                maturityDate: new Date(Date.now() + 365 * 86400000),
                offerRules: {
                    price: 1.0,
                    availableQuantity: 100000,
                    minInvestment: 100,
                    maxInvestment: 10000,
                    startDate: new Date().toISOString(),
                    endDate: new Date(Date.now() + 30 * 86400000).toISOString()
                }
            }
        });

        assert.ok(offer.id, 'Offer should have an ID');
        assert.strictEqual(offer.status, 'pending_review');
        assert.strictEqual(offer.assetCode, assetCode);
    });

    it('should transition offer to active after admin approval', async () => {
        // First create an admin for the FK constraint
        admin = await prisma.platformAdmin.create({
            data: {
                name: 'Flow Test Admin',
                email: `flow.admin.${timestamp}@platform.com`,
                passwordHash: 'hash',
                role: 'admin'
            }
        });

        // Create token for the offer
        await prisma.token.create({
            data: {
                assetCode: assetCode,
                issuerPublicKey: 'G' + 'ISSUER'.padEnd(55, '0'),
                totalSupply: 100000,
                description: 'Flow test token'
            }
        });

        // Simulate admin approval
        const updatedOffer = await prisma.offer.update({
            where: { id: offer.id },
            data: {
                status: 'active',
                reviewedBy: admin.id, // Use the created admin's ID
                reviewedAt: new Date()
            }
        });

        offer = updatedOffer;
        assert.strictEqual(updatedOffer.status, 'active');
    });

    // ===== PHASE 3: Investment Flow =====
    it('should create investment with pending_payment status', async () => {
        const investmentAmount = 1000;
        const price = 1.0;

        investment = await prisma.investment.create({
            data: {
                investorId: investor.id,
                offerId: offer.id,
                assetCode: assetCode,
                usdcAmount: investmentAmount,
                tokenAmount: investmentAmount / price,
                status: 'pending_payment',
                memo: `FLOW-${Date.now()}`
            }
        });

        assert.ok(investment.id, 'Investment should have an ID');
        assert.strictEqual(investment.status, 'pending_payment');
        assert.strictEqual(parseFloat(investment.usdcAmount), investmentAmount);
    });

    it('should update investment to distributed after payment detection', async () => {
        const paymentHash = `flow_payment_${Date.now()}`;
        const distTxHash = `flow_distribution_${Date.now()}`;

        // Simulate PaymentMonitor detecting USDC payment
        const updatedInvestment = await prisma.investment.update({
            where: { id: investment.id },
            data: {
                status: 'distributed',
                usdcPaymentHash: paymentHash,
                distributionTxHash: distTxHash
            }
        });

        investment = updatedInvestment;
        assert.strictEqual(updatedInvestment.status, 'distributed');
        assert.strictEqual(updatedInvestment.usdcPaymentHash, paymentHash);
    });

    it('should create token distribution record', async () => {
        const distribution = await prisma.tokenDistribution.create({
            data: {
                investorId: investor.id,
                offerId: offer.id,
                assetCode: assetCode,
                amount: parseFloat(investment.tokenAmount),
                transactionHash: investment.distributionTxHash,
                usdcPaymentHash: investment.usdcPaymentHash,
                approvalStatus: 'approved'
            }
        });

        assert.ok(distribution.id, 'Distribution should have an ID');
        assert.strictEqual(distribution.approvalStatus, 'approved');
    });

    // ===== PHASE 4: Verification =====
    it('should find investment with all relationships', async () => {
        const fullInvestment = await prisma.investment.findUnique({
            where: { id: investment.id },
            include: {
                investor: true,
                offer: {
                    include: { company: true }
                }
            }
        });

        assert.ok(fullInvestment, 'Investment should exist');
        assert.strictEqual(fullInvestment.investor.id, investor.id);
        assert.strictEqual(fullInvestment.offer.id, offer.id);
        assert.strictEqual(fullInvestment.offer.company.id, company.id);
    });

    it('should find all distributions for investor', async () => {
        const distributions = await prisma.tokenDistribution.findMany({
            where: { investorId: investor.id }
        });

        assert.ok(distributions.length > 0, 'Should have distributions');
        assert.strictEqual(distributions[0].assetCode, assetCode);
    });

    it('should calculate offer investment metrics', async () => {
        const offerWithInvestments = await prisma.offer.findUnique({
            where: { id: offer.id },
            include: {
                investments: {
                    where: { status: 'distributed' }
                }
            }
        });

        const totalInvested = offerWithInvestments.investments.reduce(
            (sum, inv) => sum + parseFloat(inv.usdcAmount),
            0
        );

        assert.strictEqual(totalInvested, 1000, 'Should have 1000 USDC invested');
        assert.strictEqual(offerWithInvestments.investments.length, 1);
    });

    it('should get investor portfolio summary', async () => {
        // Get all distributions for investor
        const distributions = await prisma.tokenDistribution.findMany({
            where: { investorId: investor.id },
            include: {
                offer: {
                    include: { company: true }
                }
            }
        });

        // Calculate portfolio value
        const portfolio = distributions.map(d => ({
            assetCode: d.assetCode,
            amount: parseFloat(d.amount),
            companyName: d.offer.company.name,
            offerName: d.offer.offerName
        }));

        assert.ok(portfolio.length > 0, 'Portfolio should have holdings');
        assert.strictEqual(portfolio[0].assetCode, assetCode);
        assert.strictEqual(portfolio[0].amount, 1000);
    });
});
