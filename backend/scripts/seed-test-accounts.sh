#!/bin/bash
# Test Account Setup Script
# Creates test accounts in the database with known Stellar keypairs
# 
# Usage: bash backend/scripts/seed-test-accounts.sh

set -e

# Get test account keys from .env or use defaults
TEST_INVESTOR_PUBLIC="${TEST_INVESTOR_PUBLIC_KEY:-GCZOSRIMOBMXGUPXELFXKDD6ZFQQQTVQYOVRWOHM4V645VOM7GIQDEIR}"
TEST_COMPANY_PUBLIC="${TEST_COMPANY_PUBLIC_KEY:-GC6P4TEU23V24JK25P3NVPIHQOR3J7KC4Y5AD2RB6TR7H52DK7YRLC5W}"

echo "═══════════════════════════════════════════════════════════"
echo "              SEEDING TEST ACCOUNTS"
echo "═══════════════════════════════════════════════════════════"
echo "Test Investor: $TEST_INVESTOR_PUBLIC"
echo "Test Company:  $TEST_COMPANY_PUBLIC"
echo ""

# Run SQL inside the postgres container
docker compose exec -T postgres psql -U postgres -d stellar_tokens << EOF

-- Create test investor
INSERT INTO investors (
    name, email, document, kyc_status,
    stellar_contract_id, passkey_credential_id,
    email_verified, created_at, updated_at
) VALUES (
    'Test Investor',
    'test-investor@stellar-tokens.local',
    '000.000.000-00',
    'approved',
    '${TEST_INVESTOR_PUBLIC}',
    'test-investor-credential',
    true,
    NOW(), NOW()
)
ON CONFLICT (email) DO UPDATE SET
    stellar_contract_id = EXCLUDED.stellar_contract_id,
    kyc_status = 'approved',
    updated_at = NOW();

-- Create test company (no email_verified column in this table)
INSERT INTO companies (
    name, email, cnpj, legal_representative,
    status, kyc_status,
    stellar_public_key, stellar_contract_id, passkey_credential_id,
    created_at, updated_at
) VALUES (
    'Test Company Ltd',
    'test-company@stellar-tokens.local',
    '00.000.000/0001-00',
    'Test Legal Rep',
    'approved',
    'approved',
    '${TEST_COMPANY_PUBLIC}',
    '${TEST_COMPANY_PUBLIC}',
    'test-company-credential',
    NOW(), NOW()
)
ON CONFLICT (email) DO UPDATE SET
    stellar_public_key = EXCLUDED.stellar_public_key,
    stellar_contract_id = EXCLUDED.stellar_contract_id,
    status = 'approved',
    kyc_status = 'approved',
    updated_at = NOW();

-- Create test company user using company ID from above
WITH company_data AS (
    SELECT id FROM companies WHERE email = 'test-company@stellar-tokens.local'
)
INSERT INTO company_users (
    company_id, name, email, role,
    stellar_public_key, stellar_contract_id, passkey_credential_id,
    email_verified, is_active, created_at
)
SELECT 
    cd.id,
    'Test Company Admin',
    'admin-test-company@stellar-tokens.local',
    'admin',
    '${TEST_COMPANY_PUBLIC}',
    '${TEST_COMPANY_PUBLIC}',
    'test-company-user-credential',
    true,
    true,
    NOW()
FROM company_data cd
ON CONFLICT (email) DO UPDATE SET
    stellar_public_key = EXCLUDED.stellar_public_key,
    stellar_contract_id = EXCLUDED.stellar_contract_id,
    email_verified = true;

-- Show results
\\echo ''
\\echo 'Created Test Accounts:'
\\echo '─────────────────────────────────────────────────────────────'

SELECT 'Investor' as type, id, name, email, stellar_contract_id as stellar_address FROM investors WHERE email = 'test-investor@stellar-tokens.local';

SELECT 'Company' as type, id, name, email, stellar_public_key as stellar_address FROM companies WHERE email = 'test-company@stellar-tokens.local';

SELECT 'CompanyUser' as type, id, name, email, stellar_public_key as stellar_address FROM company_users WHERE email = 'admin-test-company@stellar-tokens.local';

EOF

echo ""
echo "✓ Test accounts seeded successfully"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "Now run: node backend/scripts/generate-test-tokens.js"
echo "═══════════════════════════════════════════════════════════"
