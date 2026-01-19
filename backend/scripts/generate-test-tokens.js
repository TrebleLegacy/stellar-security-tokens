#!/usr/bin/env node
/**
 * Generate Test Tokens
 * 
 * Generates JWT tokens for test accounts. Run this after seeding the database.
 * 
 * Usage:
 *   node backend/scripts/generate-test-tokens.js
 */

import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-change-in-production';

// Test account IDs (update these after running seed script)
const TEST_ACCOUNTS = {
    investor: {
        id: 1, // Update if different
        email: 'test-investor@stellar-tokens.local',
        userType: 'investor',
        role: 'investor',
        stellarPublicKey: process.env.TEST_INVESTOR_PUBLIC_KEY || 'GCZOSRIMOBMXGUPXELFXKDD6ZFQQQTVQYOVRWOHM4V645VOM7GIQDEIR',
    },
    company: {
        userId: 2, // CompanyUser ID from seed script output
        companyId: 1, // Company ID - update if different
        email: 'admin-test-company@stellar-tokens.local',
        userType: 'company',
        role: 'admin',
        stellarPublicKey: process.env.TEST_COMPANY_PUBLIC_KEY || 'GC6P4TEU23V24JK25P3NVPIHQOR3J7KC4Y5AD2RB6TR7H52DK7YRLC5W',
    },
};

function generateToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

console.log('═══════════════════════════════════════════════════════════');
console.log('              TEST TOKEN GENERATOR');
console.log('═══════════════════════════════════════════════════════════');
console.log('');

// Generate investor token
const investorToken = generateToken({
    userId: TEST_ACCOUNTS.investor.id,
    email: TEST_ACCOUNTS.investor.email,
    userType: TEST_ACCOUNTS.investor.userType,
    role: TEST_ACCOUNTS.investor.role,
});

// Generate company token
const companyToken = generateToken({
    userId: TEST_ACCOUNTS.company.userId,
    email: TEST_ACCOUNTS.company.email,
    userType: TEST_ACCOUNTS.company.userType,
    role: TEST_ACCOUNTS.company.role,
    companyId: TEST_ACCOUNTS.company.companyId,
});

console.log('📊 Test Accounts:');
console.log('─────────────────────────────────────────────────────────────');
console.log(`Investor: ${TEST_ACCOUNTS.investor.email}`);
console.log(`  ID: ${TEST_ACCOUNTS.investor.id}`);
console.log(`  Stellar: ${TEST_ACCOUNTS.investor.stellarPublicKey}`);
console.log('');
console.log(`Company User: ${TEST_ACCOUNTS.company.email}`);
console.log(`  User ID: ${TEST_ACCOUNTS.company.userId}`);
console.log(`  Company ID: ${TEST_ACCOUNTS.company.companyId}`);
console.log(`  Stellar: ${TEST_ACCOUNTS.company.stellarPublicKey}`);
console.log('');

console.log('🎫 JWT Tokens (valid for 30 days):');
console.log('─────────────────────────────────────────────────────────────');
console.log('');
console.log('INVESTOR_TOKEN:');
console.log(investorToken);
console.log('');
console.log('COMPANY_TOKEN:');
console.log(companyToken);
console.log('');

// Save to file
const tokensPath = path.join(__dirname, 'test-tokens.json');
const tokensData = {
    generatedAt: new Date().toISOString(),
    expiresIn: '30 days',
    investor: {
        ...TEST_ACCOUNTS.investor,
        token: investorToken,
    },
    company: {
        ...TEST_ACCOUNTS.company,
        token: companyToken,
    },
};

fs.writeFileSync(tokensPath, JSON.stringify(tokensData, null, 2));
console.log(`✓ Tokens saved to: ${tokensPath}`);
console.log('');

console.log('💡 Usage:');
console.log('─────────────────────────────────────────────────────────────');
console.log('curl -H "Authorization: Bearer $INVESTOR_TOKEN" http://localhost:3000/api/investors/me');
console.log('');
