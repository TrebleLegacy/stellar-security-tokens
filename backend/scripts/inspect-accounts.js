#!/usr/bin/env node
/**
 * Stellar Account Configuration Report
 * 
 * This script inspects Stellar accounts and reports their multisig configuration.
 * Useful for auditing account security before and after multisig setup.
 * 
 * Usage:
 *   node scripts/inspect-accounts.js
 *   node scripts/inspect-accounts.js --account GABC...
 */

import { Server, Networks } from '@stellar/stellar-sdk';
import dotenv from 'dotenv';

dotenv.config();

// Configuration
const NETWORK = process.env.STELLAR_NETWORK || 'testnet';
const HORIZON_URL = NETWORK === 'mainnet'
    ? 'https://horizon.stellar.org'
    : 'https://horizon-testnet.stellar.org';

const server = new Server(HORIZON_URL);

// Account public keys from environment
const ACCOUNTS = {
    issuer: process.env.ISSUER_PUBLIC_KEY,
    distributor: process.env.DISTRIBUTOR_PUBLIC_KEY,
    treasury: process.env.TREASURY_PUBLIC_KEY,
    operations: process.env.OPERATIONS_PUBLIC_KEY,
};

// Flag descriptions
const FLAGS = {
    1: 'AUTH_REQUIRED',
    2: 'AUTH_REVOCABLE',
    4: 'AUTH_IMMUTABLE',
    8: 'AUTH_CLAWBACK_ENABLED',
};

function log(message, indent = 0) {
    console.log(' '.repeat(indent) + message);
}

function formatPublicKey(key) {
    if (!key) return 'N/A';
    return `${key.slice(0, 4)}...${key.slice(-4)}`;
}

function parseFlags(flags) {
    const result = [];
    for (const [bit, name] of Object.entries(FLAGS)) {
        if (flags & parseInt(bit)) {
            result.push(name);
        }
    }
    return result.length > 0 ? result : ['NONE'];
}

async function inspectAccount(name, publicKey) {
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`  ${name.toUpperCase()} ACCOUNT`);
    console.log(`${'═'.repeat(60)}`);

    if (!publicKey) {
        log('⚠️  Public key not configured in environment', 2);
        return null;
    }

    log(`Public Key: ${publicKey}`, 2);
    log(`Explorer: https://stellar.expert/explorer/${NETWORK}/account/${publicKey}`, 2);

    try {
        const account = await server.loadAccount(publicKey);

        // Basic info
        log('\n📊 Account Status:', 2);
        log(`Sequence: ${account.sequence}`, 4);
        log(`Subentry Count: ${account.subentry_count}`, 4);

        // Balances
        log('\n💰 Balances:', 2);
        for (const balance of account.balances) {
            if (balance.asset_type === 'native') {
                log(`XLM: ${balance.balance}`, 4);
            } else {
                log(`${balance.asset_code}: ${balance.balance}`, 4);
            }
        }

        // Thresholds
        log('\n🔐 Thresholds:', 2);
        log(`Low: ${account.thresholds.low_threshold}`, 4);
        log(`Medium: ${account.thresholds.med_threshold}`, 4);
        log(`High: ${account.thresholds.high_threshold}`, 4);

        // Signers
        log('\n✍️  Signers:', 2);
        const masterKey = account.signers.find(s => s.key === publicKey);
        const additionalSigners = account.signers.filter(s => s.key !== publicKey);

        if (masterKey) {
            const status = masterKey.weight === 0 ? '⛔ DISABLED' : `✅ weight=${masterKey.weight}`;
            log(`Master Key: ${status}`, 4);
        }

        for (const signer of additionalSigners) {
            log(`${formatPublicKey(signer.key)}: weight=${signer.weight} (${signer.type})`, 4);
        }

        // Flags
        log('\n🚩 Flags:', 2);
        const flags = parseFlags(account.flags);
        for (const flag of flags) {
            log(`${flag}`, 4);
        }

        // Security assessment
        log('\n🛡️  Security Assessment:', 2);

        const issues = [];
        const goods = [];

        // Check master key
        if (masterKey && masterKey.weight > 0) {
            if (name === 'issuer') {
                issues.push('Issuer master key should be disabled (weight=0) after setup');
            } else if (name === 'treasury') {
                issues.push('Treasury master key should be disabled for production');
            }
        } else if (masterKey && masterKey.weight === 0) {
            goods.push('Master key is disabled (secure)');
        }

        // Check multisig
        if (additionalSigners.length === 0 && name !== 'issuer') {
            issues.push('No additional signers configured');
        } else if (additionalSigners.length >= 2) {
            goods.push(`${additionalSigners.length} signers configured`);
        }

        // Check thresholds
        if (account.thresholds.med_threshold === 0) {
            issues.push('Medium threshold is 0 (any single signer can transact)');
        }

        // Check flags for issuer
        if (name === 'issuer') {
            if (!(account.flags & 1)) {
                issues.push('AUTH_REQUIRED not set (anyone can hold tokens)');
            } else {
                goods.push('AUTH_REQUIRED enabled');
            }
            if (!(account.flags & 2)) {
                issues.push('AUTH_REVOCABLE not set (cannot freeze accounts)');
            } else {
                goods.push('AUTH_REVOCABLE enabled');
            }
            if (!(account.flags & 8)) {
                issues.push('AUTH_CLAWBACK_ENABLED not set');
            } else {
                goods.push('AUTH_CLAWBACK_ENABLED enabled');
            }
        }

        for (const good of goods) {
            log(`✅ ${good}`, 4);
        }
        for (const issue of issues) {
            log(`⚠️  ${issue}`, 4);
        }

        if (issues.length === 0 && goods.length > 0) {
            log(`\n✅ Account appears to be properly configured`, 2);
        } else if (issues.length > 0) {
            log(`\n⚠️  ${issues.length} issue(s) found - review recommended`, 2);
        }

        return { account, issues, goods };

    } catch (error) {
        if (error.response?.status === 404) {
            log('❌ Account not found on network', 2);
            log('This account needs to be created and funded first.', 4);
        } else {
            log(`❌ Error loading account: ${error.message}`, 2);
        }
        return null;
    }
}

async function main() {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║           STELLAR ACCOUNT CONFIGURATION REPORT               ║
║══════════════════════════════════════════════════════════════║
║  Network: ${NETWORK.padEnd(49)}║
║  Horizon: ${HORIZON_URL.padEnd(49)}║
╚══════════════════════════════════════════════════════════════╝
`);

    const args = process.argv.slice(2);

    // Single account inspection
    if (args.includes('--account') || args.includes('-a')) {
        const idx = args.indexOf('--account') !== -1 ? args.indexOf('--account') : args.indexOf('-a');
        const publicKey = args[idx + 1];
        await inspectAccount('Custom', publicKey);
        return;
    }

    // Inspect all configured accounts
    let totalIssues = 0;

    for (const [name, publicKey] of Object.entries(ACCOUNTS)) {
        const result = await inspectAccount(name, publicKey);
        if (result?.issues) {
            totalIssues += result.issues.length;
        }
    }

    console.log(`\n${'═'.repeat(60)}`);
    console.log(`  SUMMARY`);
    console.log(`${'═'.repeat(60)}`);

    if (totalIssues === 0) {
        console.log('  ✅ All accounts appear to be properly configured.\n');
    } else {
        console.log(`  ⚠️  Found ${totalIssues} total issue(s) across all accounts.\n`);
        console.log('  Run setup-multisig.js to configure accounts for production.\n');
    }
}

main().catch(console.error);
