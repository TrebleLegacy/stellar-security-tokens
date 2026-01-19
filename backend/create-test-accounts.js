import { PrismaClient } from './prisma/generated/prisma/client.ts';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';
dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function createTestAccounts() {
    console.log('Creating test accounts...');

    // Get keys from environment
    const investorPublicKey = process.env.TEST_INVESTOR_PUBLIC_KEY || 'GCZOSRIMOBMXGUPXELFXKDD6ZFQQQTVQYOVRWOHM4V645VOM7GIQDEIR';
    const companyPublicKey = process.env.TEST_COMPANY_PUBLIC_KEY || 'GC6P4TEU23V24JK25P3NVPIHQOR3J7KC4Y5AD2RB6TR7H52DK7YRLC5W';

    console.log('Using Investor Key:', investorPublicKey);
    console.log('Using Company Key:', companyPublicKey);

    try {
        // 1. Create test platform admin
        const existingAdmin = await prisma.platformAdmin.findUnique({
            where: { email: 'admin@stellar-tokens.local' }
        });

        if (!existingAdmin) {
            const admin = await prisma.platformAdmin.create({
                data: {
                    name: 'Test Admin',
                    email: 'admin@stellar-tokens.local',
                    passwordHash: 'not-used-for-passkey-auth',
                    role: 'super_admin',
                    isActive: true,
                }
            });
            console.log('✓ Created platform admin:', admin.email);
        } else {
            console.log('- Platform admin already exists:', existingAdmin.email);
        }

        // 2. Create test company (matching actual database schema - NOT NULL fields)
        let company = await prisma.company.findUnique({
            where: { email: 'test-company@stellar-tokens.local' }
        });

        if (!company) {
            company = await prisma.company.create({
                data: {
                    name: 'Test Company',
                    email: 'test-company@stellar-tokens.local',
                    cnpj: '12345678000199',
                    legalRepresentative: 'Test Representative',
                    status: 'approved',
                }
            });
            console.log('✓ Created company:', company.email);
        } else {
            console.log('- Company already exists:', company.email);
        }

        // 3. Create test company user with .env key
        const existingCompanyUser = await prisma.companyUser.findUnique({
            where: { email: 'admin-test-company@stellar-tokens.local' }
        });

        if (!existingCompanyUser) {
            const companyUser = await prisma.companyUser.create({
                data: {
                    name: 'Company Admin',
                    email: 'admin-test-company@stellar-tokens.local',
                    role: 'admin',
                    companyId: company.id,
                    stellarContractId: companyPublicKey,
                    passkeyCredentialId: 'test-passkey-credential',
                }
            });
            console.log('✓ Created company user:', companyUser.email);
        } else {
            // Update with correct key if it exists
            await prisma.companyUser.update({
                where: { email: 'admin-test-company@stellar-tokens.local' },
                data: { stellarContractId: companyPublicKey }
            });
            console.log('- Company user already exists (updated key):', existingCompanyUser.email);
        }

        // 4. Create test investor with .env key
        const existingInvestor = await prisma.investor.findUnique({
            where: { email: 'test-investor@stellar-tokens.local' }
        });

        if (!existingInvestor) {
            const investor = await prisma.investor.create({
                data: {
                    name: 'Test Investor',
                    email: 'test-investor@stellar-tokens.local',
                    document: '12345678900',
                    kycStatus: 'approved',
                    stellarContractId: investorPublicKey,
                    passkeyCredentialId: 'test-passkey-credential',
                }
            });
            console.log('✓ Created investor:', investor.email);
        } else {
            // Update with correct key if it exists
            await prisma.investor.update({
                where: { email: 'test-investor@stellar-tokens.local' },
                data: { stellarContractId: investorPublicKey }
            });
            console.log('- Investor already exists (updated key):', existingInvestor.email);
        }

        console.log('\n✅ All test accounts created successfully!');
    } catch (error) {
        console.error('Error creating test accounts:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createTestAccounts();
