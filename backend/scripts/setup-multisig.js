#!/usr/bin/env node
/**
 * Stellar Multisig Account Setup Script
 * 
 * This script configures Stellar accounts for multisig operation with Ledger hardware wallets.
 * It adds signers and sets thresholds according to production security requirements.
 * 
 * Usage:
 *   node scripts/setup-multisig.js --account treasury --signers 3 --threshold 2
 *   node scripts/setup-multisig.js --account issuer --lock
 *   node scripts/setup-multisig.js --help
 * 
 * Environment Variables Required:
 *   STELLAR_NETWORK - 'testnet' or 'mainnet'
 *   TREASURY_SECRET_KEY - Current secret key (only needed during initial setup)
 *   ISSUER_SECRET_KEY - Current secret key (only needed during initial setup)
 * 
 * Reference: docs/Stellar Docs (.../learn/fundamentals/transactions/signatures-multisig.md
 */

import {
    Keypair,
    Server,
    TransactionBuilder,
    Operation,
    Networks,
    Asset
} from '@stellar/stellar-sdk';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();

// Configuration
const NETWORK = process.env.STELLAR_NETWORK || 'testnet';
const HORIZON_URL = NETWORK === 'mainnet'
    ? 'https://horizon.stellar.org'
    : 'https://horizon-testnet.stellar.org';
const NETWORK_PASSPHRASE = NETWORK === 'mainnet'
    ? Networks.PUBLIC
    : Networks.TESTNET;

const server = new Server(HORIZON_URL);

// Account configurations
const ACCOUNT_CONFIGS = {
    treasury: {
        description: 'Treasury account for holding and distributing funds',
        defaultSigners: 3,
        defaultThreshold: 2,
        disableMasterKey: true,
    },
    issuer: {
        description: 'Asset issuing account (should be locked after setup)',
        defaultSigners: 1,
        defaultThreshold: 1,
        disableMasterKey: true,
        setFlags: true, // AUTH_REQUIRED, AUTH_REVOCABLE, AUTH_CLAWBACK_ENABLED
    },
    distributor: {
        description: 'Distribution account for token sales',
        defaultSigners: 2,
        defaultThreshold: 2,
        disableMasterKey: false, // Keep master for automation
    },
    operations: {
        description: 'Operations account for daily transactions',
        defaultSigners: 2,
        defaultThreshold: 1,
        disableMasterKey: false,
    },
};

// Helpers
function log(message, type = 'info') {
    const colors = {
        info: '\x1b[36m',    // Cyan
        success: '\x1b[32m', // Green
        warning: '\x1b[33m', // Yellow
        error: '\x1b[31m',   // Red
        reset: '\x1b[0m',
    };
    console.log(`${colors[type]}[${type.toUpperCase()}]${colors.reset} ${message}`);
}

function parseArgs() {
    const args = process.argv.slice(2);
    const config = {
        account: null,
        signers: [],
        threshold: null,
        lock: false,
        dryRun: false,
        help: false,
    };

    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--account':
            case '-a':
                config.account = args[++i];
                break;
            case '--signer':
            case '-s':
                config.signers.push(args[++i]);
                break;
            case '--threshold':
            case '-t':
                config.threshold = parseInt(args[++i], 10);
                break;
            case '--lock':
                config.lock = true;
                break;
            case '--dry-run':
                config.dryRun = true;
                break;
            case '--help':
            case '-h':
                config.help = true;
                break;
        }
    }

    return config;
}

function showHelp() {
    console.log(`
Stellar Multisig Account Setup Script

USAGE:
  node scripts/setup-multisig.js [OPTIONS]

OPTIONS:
  --account, -a <name>     Account to configure (treasury, issuer, distributor, operations)
  --signer, -s <pubkey>    Add a signer public key (can be specified multiple times)
  --threshold, -t <num>    Signature threshold required for transactions
  --lock                   Lock the account (set master weight to 0)
  --dry-run                Show what would be done without executing
  --help, -h               Show this help message

EXAMPLES:
  # Add 3 Ledger signers to treasury, require 2-of-3 for transactions
  node scripts/setup-multisig.js -a treasury \\
    -s GABC... -s GDEF... -s GHIJ... \\
    -t 2

  # Lock the issuer account after initial setup
  node scripts/setup-multisig.js -a issuer --lock

  # Dry run to see what would happen
  node scripts/setup-multisig.js -a treasury -s GABC... -t 1 --dry-run

ACCOUNT TYPES:
  treasury     - Main funds storage (recommended: 2-of-3 multisig)
  issuer       - Asset issuing account (should be locked after setup)
  distributor  - Token distribution (recommended: 2-of-2 multisig)
  operations   - Daily operations (recommended: 1-of-2 multisig)

ENVIRONMENT VARIABLES:
  STELLAR_NETWORK          - 'testnet' or 'mainnet' (default: testnet)
  TREASURY_SECRET_KEY      - Secret key for treasury account
  ISSUER_SECRET_KEY        - Secret key for issuer account
  DISTRIBUTOR_SECRET_KEY   - Secret key for distributor account
  OPERATIONS_SECRET_KEY    - Secret key for operations account
`);
}

async function prompt(question) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer);
        });
    });
}

async function getAccountKeypair(accountName) {
    const envKey = `${accountName.toUpperCase()}_SECRET_KEY`;
    const secretKey = process.env[envKey];

    if (!secretKey) {
        throw new Error(`Missing ${envKey} environment variable`);
    }

    return Keypair.fromSecret(secretKey);
}

async function loadAccount(publicKey) {
    try {
        return await server.loadAccount(publicKey);
    } catch (error) {
        if (error.response?.status === 404) {
            throw new Error(`Account ${publicKey.slice(0, 8)}... not found on ${NETWORK}`);
        }
        throw error;
    }
}

async function buildSetupTransaction(account, options) {
    const { signers, threshold, lock, setFlags } = options;

    let builder = new TransactionBuilder(account, {
        fee: '100',
        networkPassphrase: NETWORK_PASSPHRASE,
    });

    // Step 1: Add signers first (CRITICAL: do this before disabling master key)
    for (const signerPubKey of signers) {
        log(`Adding signer: ${signerPubKey.slice(0, 8)}...`);
        builder = builder.addOperation(
            Operation.setOptions({
                signer: {
                    ed25519PublicKey: signerPubKey,
                    weight: 1,
                },
            })
        );
    }

    // Step 2: Set asset flags if this is an issuer account
    if (setFlags) {
        log('Setting asset flags: AUTH_REQUIRED, AUTH_REVOCABLE, AUTH_CLAWBACK_ENABLED');
        builder = builder.addOperation(
            Operation.setOptions({
                setFlags:
                    1 | // AUTH_REQUIRED
                    2 | // AUTH_REVOCABLE
                    8,  // AUTH_CLAWBACK_ENABLED
            })
        );
    }

    // Step 3: Set thresholds
    if (threshold) {
        log(`Setting thresholds: low=${threshold}, med=${threshold}, high=${signers.length}`);
        builder = builder.addOperation(
            Operation.setOptions({
                lowThreshold: threshold,
                medThreshold: threshold,
                highThreshold: signers.length, // Require all signers for high-security ops
            })
        );
    }

    // Step 4: Disable master key last (CRITICAL: must be last operation)
    if (lock) {
        log('Disabling master key (weight=0) - THIS IS IRREVERSIBLE!', 'warning');
        builder = builder.addOperation(
            Operation.setOptions({
                masterWeight: 0,
            })
        );
    }

    return builder.setTimeout(300).build();
}

async function executeSetup(config) {
    const { account, signers, threshold, lock, dryRun } = config;

    // Validate account type
    if (!ACCOUNT_CONFIGS[account]) {
        throw new Error(`Unknown account type: ${account}. Valid types: ${Object.keys(ACCOUNT_CONFIGS).join(', ')}`);
    }

    const accountConfig = ACCOUNT_CONFIGS[account];

    log(`\n========================================`);
    log(`Configuring ${account.toUpperCase()} Account`);
    log(`----------------------------------------`);
    log(`Network: ${NETWORK}`);
    log(`Horizon: ${HORIZON_URL}`);
    log(`Description: ${accountConfig.description}`);
    log(`========================================\n`);

    // Get keypair and load account
    const keypair = await getAccountKeypair(account);
    const stellarAccount = await loadAccount(keypair.publicKey());

    log(`Account: ${keypair.publicKey()}`);
    log(`Current signers: ${stellarAccount.signers.length}`);

    // Validate signers
    if (signers.length === 0 && !lock) {
        throw new Error('No signers provided. Use --signer <pubkey> to add signers.');
    }

    // Validate each signer is a valid public key
    for (const signer of signers) {
        try {
            Keypair.fromPublicKey(signer);
        } catch {
            throw new Error(`Invalid public key: ${signer}`);
        }
    }

    // Determine final threshold
    const finalThreshold = threshold || accountConfig.defaultThreshold;
    const shouldLock = lock || accountConfig.disableMasterKey;

    // Build transaction
    const transaction = await buildSetupTransaction(stellarAccount, {
        signers,
        threshold: finalThreshold,
        lock: shouldLock,
        setFlags: accountConfig.setFlags,
    });

    log(`\nTransaction XDR (base64):`);
    console.log(transaction.toXDR());

    if (dryRun) {
        log('\n[DRY RUN] Transaction was NOT submitted.', 'warning');
        log('Remove --dry-run flag to execute.', 'warning');
        return;
    }

    // Confirm before executing
    log('\n⚠️  IMPORTANT: This operation may be IRREVERSIBLE!', 'warning');
    log('Once the master key is disabled, you will need the new signers to make any changes.', 'warning');

    const confirm = await prompt('\nType "CONFIRM" to proceed: ');
    if (confirm !== 'CONFIRM') {
        log('Aborted.', 'error');
        process.exit(1);
    }

    // Sign and submit
    transaction.sign(keypair);

    try {
        const result = await server.submitTransaction(transaction);
        log(`\n✅ Transaction successful!`, 'success');
        log(`Hash: ${result.hash}`, 'success');
        log(`Ledger: ${result.ledger}`, 'success');
    } catch (error) {
        log(`\n❌ Transaction failed!`, 'error');
        if (error.response?.data?.extras?.result_codes) {
            log(`Error codes: ${JSON.stringify(error.response.data.extras.result_codes)}`, 'error');
        }
        throw error;
    }
}

async function main() {
    const config = parseArgs();

    if (config.help) {
        showHelp();
        process.exit(0);
    }

    if (!config.account) {
        log('Error: --account is required', 'error');
        showHelp();
        process.exit(1);
    }

    try {
        await executeSetup(config);
    } catch (error) {
        log(`Error: ${error.message}`, 'error');
        process.exit(1);
    }
}

main();
