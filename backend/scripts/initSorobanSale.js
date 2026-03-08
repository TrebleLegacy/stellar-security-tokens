#!/usr/bin/env node
/**
 * initSorobanSale.js — Initialize a Soroban token_sale contract for an offer
 *
 * Workflow:
 *   1. Lookup offer + token data from DB
 *   2. Call create() on the deployed contract
 *   3. (Optional) Deposit sell tokens into the contract
 *   4. (Optional) Set sale active
 *   5. Store contract ID in DB via Offer.setSorobanContractId()
 *
 * Usage:
 *   node scripts/initSorobanSale.js \
 *     --offer-id 42 \
 *     --contract-id CCFAC4GCDKFRBFWHA7H62YCQKRYXCS3HKXD23OBD45XQXG6DRIFA7QIY \
 *     [--dry-run] [--skip-deposit] [--skip-activate]
 *
 * Requires:
 *   - OPERATIONS_SECRET_KEY in .env
 *   - Deployed contract (via `stellar contract deploy`)
 *   - Offer with associated company and token in DB
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import {
    Keypair, TransactionBuilder, Contract, Address,
    nativeToScVal, rpc, BASE_FEE,
} from '@stellar/stellar-sdk';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import prisma from '../src/config/prisma.js';
import { StellarService } from '../src/services/stellar.service.js';
import {
    getNetworkPassphrase, getOperationsKeypair, getSorobanRpcUrl,
} from '../src/config/stellar.js';
import { Offer } from '../src/models/Offer.js';

// ─── CLI ARGS ───
const args = process.argv.slice(2);
function getArg(name) {
    const idx = args.indexOf(`--${name}`);
    return idx >= 0 ? args[idx + 1] : null;
}
const hasFlag = (name) => args.includes(`--${name}`);

const offerId = parseInt(getArg('offer-id'));
const contractId = getArg('contract-id');
const dryRun = hasFlag('dry-run');
const skipDeposit = hasFlag('skip-deposit');
const skipActivate = hasFlag('skip-activate');

if (!offerId || !contractId) {
    console.error('Usage: node scripts/initSorobanSale.js --offer-id <ID> --contract-id <C...> [--dry-run] [--skip-deposit] [--skip-activate]');
    process.exit(1);
}

async function main() {
    console.log('\n═══════════════════════════════════════');
    console.log('  Soroban Sale — Contract Initialization');
    console.log('═══════════════════════════════════════\n');

    // ─── 0. Validate contract exists ───
    console.log('🔍 Validating contract exists on network...');
    try {
        const { SorobanSaleService } = await import('../src/services/sorobanSale.service.js');
        const version = await SorobanSaleService.getVersion(contractId);
        console.log(`   ✅ Contract found, version: ${version}\n`);
    } catch (err) {
        console.error(`❌ Contract ${contractId} not found on network: ${err.message}`);
        console.error('   Deploy the contract first: stellar contract deploy ...');
        process.exit(1);
    }

    // ─── 1. Load Offer ───
    const offer = await Offer.findById(offerId);
    if (!offer) {
        console.error(`❌ Offer #${offerId} not found`);
        process.exit(1);
    }

    if (offer.sorobanContractId) {
        console.error(`⚠️  Offer #${offerId} already has contract ${offer.sorobanContractId}`);
        console.error('   Use --force to override (not implemented yet for safety)');
        process.exit(1);
    }

    const token = offer.tokens?.[0];
    if (!token) {
        console.error(`❌ Offer #${offerId} has no associated token`);
        process.exit(1);
    }

    const company = offer.company;
    if (!company) {
        console.error(`❌ Offer #${offerId} has no associated company`);
        process.exit(1);
    }

    const opsKeypair = getOperationsKeypair();
    const networkPassphrase = getNetworkPassphrase();
    const usdcSac = process.env.USDC_SAC_CONTRACT_ID;
    const sellTokenSac = token.sacContractId;
    const treasuryPub = process.env.TREASURY_PUBLIC_KEY;

    if (!usdcSac) { console.error('❌ USDC_SAC_CONTRACT_ID not set'); process.exit(1); }
    if (!sellTokenSac) { console.error(`❌ Token "${token.assetCode}" has no sacContractId`); process.exit(1); }
    if (!treasuryPub) { console.error('❌ TREASURY_PUBLIC_KEY not set'); process.exit(1); }

    console.log(`  Offer:      #${offerId} — ${offer.title || offer.assetCode}`);
    console.log(`  Company:    ${company.name} (ID: ${company.id})`);
    console.log(`  Token:      ${token.assetCode} (SAC: ${sellTokenSac})`);
    console.log(`  Contract:   ${contractId}`);
    console.log(`  USDC SAC:   ${usdcSac}`);
    console.log(`  Treasury:   ${treasuryPub}`);
    console.log(`  Price:      1 token = ${offer.unitPrice || 1} USDC`);
    console.log(`  Dry run:    ${dryRun}`);
    console.log('');

    const rpcServer = new rpc.Server(getSorobanRpcUrl());

    // ─── 2. Call create() ───
    console.log('📦 Step 1: Calling create()...');

    // Price ratio: sellPrice/buyPrice = token_price_in_usdc
    // If 1 token = 1 USDC: sellPrice=1, buyPrice=1
    // If 1 token = 0.5 USDC: sellPrice=1, buyPrice=2
    const pricePerToken = parseFloat(offer.unitPrice || 1);
    const sellPrice = Math.round(pricePerToken * 10_000_000); // 7 decimal precision
    const buyPrice = 10_000_000; // 1 USDC = 10^7 stroops

    // Deadline: 0 = no deadline for now
    const deadlineLedger = 0;

    // Caps from offer
    const minBuyAmount = offer.minimumInvestment
        ? BigInt(Math.floor(parseFloat(offer.minimumInvestment) * 10_000_000))
        : 0n;
    const maxBuyPerBuyer = offer.maximumInvestment
        ? BigInt(Math.floor(parseFloat(offer.maximumInvestment) * 10_000_000))
        : 0n;

    const contract = new Contract(contractId);
    const createOp = contract.call(
        'create',
        new Address(opsKeypair.publicKey()).toScVal(),  // admin
        new Address(opsKeypair.publicKey()).toScVal(),  // seller (platform-managed)
        new Address(sellTokenSac).toScVal(),            // sell_token
        new Address(usdcSac).toScVal(),                 // buy_token (USDC)
        new Address(treasuryPub).toScVal(),             // treasury
        nativeToScVal(sellPrice, { type: 'u32' }),
        nativeToScVal(buyPrice, { type: 'u32' }),
        nativeToScVal(deadlineLedger, { type: 'u32' }),
        nativeToScVal(minBuyAmount, { type: 'i128' }),
        nativeToScVal(maxBuyPerBuyer, { type: 'i128' }),
    );

    let tx = new TransactionBuilder(
        await rpcServer.getAccount(opsKeypair.publicKey()),
        { fee: BASE_FEE, networkPassphrase }
    )
        .addOperation(createOp)
        .setTimeout(300)
        .build();

    tx = await StellarService.prepareSorobanTransaction(tx);

    console.log(`   XDR built (${tx.toXDR().length} chars)`);
    console.log(`   Admin:     ${opsKeypair.publicKey()}`);
    console.log(`   SellPrice: ${sellPrice} (${pricePerToken} USDC/token)`);
    console.log(`   MinBuy:    ${minBuyAmount} stroops`);
    console.log(`   MaxBuyer:  ${maxBuyPerBuyer} stroops`);

    if (dryRun) {
        console.log('\n🔍 DRY RUN — not submitting. XDR:');
        console.log(tx.toXDR());
        console.log('\n✅ Dry run complete. Remove --dry-run to execute.');
        await prisma.$disconnect();
        process.exit(0);
    }

    tx.sign(opsKeypair);
    const createResult = await rpcServer.sendTransaction(tx);
    console.log(`   Submitted: ${createResult.hash}`);

    // Poll for result
    let result = await pollTransaction(rpcServer, createResult.hash);
    if (result.status !== 'SUCCESS') {
        console.error(`❌ create() failed: ${result.status}`);
        await prisma.$disconnect();
        process.exit(1);
    }
    console.log('   ✅ create() succeeded!\n');

    // ─── 3. Store contract ID in DB ───
    console.log('💾 Step 2: Storing contract ID in DB...');
    await Offer.setSorobanContractId(offerId, contractId);
    console.log(`   ✅ Offer #${offerId} → sorobanContractId = ${contractId}\n`);

    // ─── Audit Log ───
    try {
        await prisma.systemConfig.create({
            data: {
                key: `audit:init_sale:${offerId}:${Date.now()}`,
                value: JSON.stringify({
                    action: 'init_soroban_sale',
                    offerId,
                    contractId,
                    admin: opsKeypair.publicKey(),
                    txHash: createResult.hash,
                    assetCode: token.assetCode,
                    companyName: company.name,
                    timestamp: new Date().toISOString(),
                }),
            },
        });
        console.log('   📝 Audit log saved to DB\n');
    } catch (auditErr) {
        console.warn('   ⚠️  Audit log failed (non-blocking):', auditErr.message);
    }

    // ─── 4. Deposit sell tokens (optional) ───
    if (!skipDeposit) {
        console.log('📤 Step 3: Depositing sell tokens into contract...');
        console.log('   ⚠️  NOTE: Token deposit requires issuer authorization (AuthRequired flag).');
        console.log('   ⚠️  This step may need to be done manually or via the admin portal.');
        console.log('   Skipping automatic deposit — use admin portal to transfer tokens.\n');
    }

    // ─── 5. Set active (optional) ───
    if (!skipActivate) {
        console.log('▶️  Step 4: Activating sale...');
        console.log('   ⚠️  Activate only AFTER tokens are deposited!');
        console.log('   Run: stellar contract invoke --id ' + contractId + ' -- set_active --active true');
        console.log('');
    }

    console.log('═══════════════════════════════════════');
    console.log('  ✅ Contract initialization complete!');
    console.log(`  Contract: ${contractId}`);
    console.log(`  Offer:    #${offerId}`);
    console.log('═══════════════════════════════════════\n');

    await prisma.$disconnect();
}

async function pollTransaction(rpcServer, hash, maxWait = 60000) {
    const interval = 3000;
    let waited = 0;
    while (waited < maxWait) {
        await new Promise(r => setTimeout(r, interval));
        waited += interval;
        const result = await rpcServer.getTransaction(hash);
        if (result.status !== 'NOT_FOUND') return result;
        process.stdout.write('.');
    }
    return { status: 'TIMEOUT' };
}

main().catch(err => {
    console.error('Fatal:', err);
    process.exit(1);
});
