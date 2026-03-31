#!/usr/bin/env node
/**
 * 02-sweep-usdc.mjs
 *
 * Sweeps USDC from all claimed burner wallets to the ops wallet.
 * Run AFTER you've claimed from the Circle faucet for each address.
 *
 * Usage: node 02-sweep-usdc.mjs
 */

import { createRequire } from 'module';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const require = createRequire(import.meta.url);
const StellarSdk = require('../../backend/node_modules/@stellar/stellar-sdk');
const { Keypair, Asset, TransactionBuilder, Operation, Networks, BASE_FEE } = StellarSdk;

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Config ───────────────────────────────────────────────────────────────────
const WALLETS_FILE   = join(__dirname, 'wallets.json');
const HORIZON_URL    = 'https://horizon-testnet.stellar.org';
const NETWORK_PASSPHRASE = Networks.TESTNET;

// Circle testnet USDC
const USDC_ISSUER = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';
const USDC = new Asset('USDC', USDC_ISSUER);

// Destination: ops wallet
const OPS_PUBLIC_KEY = 'GCM4G4PS2L325FG2RDTPFWBBX6QL6FN6BTU6YNNQ6GNQVS67NFJFMZ3C';

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── Main ─────────────────────────────────────────────────────────────────────
const horizonServer = new StellarSdk.Horizon.Server(HORIZON_URL);
const wallets = JSON.parse(readFileSync(WALLETS_FILE, 'utf8'));

const sweepable = wallets.filter(w => w.trustline && !w.swept);

if (sweepable.length === 0) {
  console.log('⚠️  No wallets to sweep. Make sure wallets have trustlines and are not already swept.');
  process.exit(0);
}

console.log(`\n💸 Sweeping USDC from ${sweepable.length} wallets → ${OPS_PUBLIC_KEY.slice(0, 16)}...\n`);

let totalSwept = 0;
let skipped = 0;

for (let i = 0; i < sweepable.length; i++) {
  const wallet = sweepable[i];
  const keypair = Keypair.fromSecret(wallet.secretKey);

  process.stdout.write(`[${i + 1}/${sweepable.length}] ${wallet.publicKey.slice(0, 16)}... `);

  try {
    // Load account to check balance
    const account = await horizonServer.loadAccount(wallet.publicKey);
    const usdcBalance = account.balances.find(b =>
      b.asset_code === 'USDC' && b.asset_issuer === USDC_ISSUER
    );

    const balance = parseFloat(usdcBalance?.balance || '0');

    if (balance <= 0) {
      console.log(`⏭️  skipped (0 USDC — faucet not yet claimed?)`);
      skipped++;
      continue;
    }

    // Sweep all USDC (leave 0)
    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(Operation.payment({
        destination: OPS_PUBLIC_KEY,
        asset: USDC,
        amount: balance.toFixed(7),
      }))
      .setTimeout(30)
      .build();

    tx.sign(keypair);
    const result = await horizonServer.submitTransaction(tx);

    totalSwept += balance;
    console.log(`✅ ${balance.toFixed(2)} USDC → hash: ${result.hash.slice(0, 12)}...`);

    // Mark as swept
    wallet.swept = true;
    wallet.sweptAmount = balance;
    wallet.sweptAt = new Date().toISOString();
    wallet.sweptTx = result.hash;

    // Update wallets file
    const allWallets = JSON.parse(readFileSync(WALLETS_FILE, 'utf8'));
    const idx = allWallets.findIndex(w => w.publicKey === wallet.publicKey);
    if (idx !== -1) allWallets[idx] = wallet;
    writeFileSync(WALLETS_FILE, JSON.stringify(allWallets, null, 2));

    await sleep(500);
  } catch (err) {
    const detail = err?.response?.data?.extras?.result_codes || err.message;
    console.log(`❌ ${JSON.stringify(detail)}`);
  }
}

console.log(`\n${'─'.repeat(60)}`);
console.log(`💰 Total swept: ${totalSwept.toFixed(2)} USDC`);
if (skipped > 0) {
  console.log(`⏭️  Skipped ${skipped} wallets (no USDC yet — run sweep again after faucet claims)`);
}
console.log(`\nVerify ops balance:`);
console.log(`  https://stellar.expert/explorer/testnet/account/${OPS_PUBLIC_KEY}`);
