#!/usr/bin/env node
/**
 * 01-setup-wallets.mjs
 * 
 * Creates N burner Stellar wallets, funds them via Friendbot,
 * and sets up USDC trustlines so they're ready to receive from Circle faucet.
 * 
 * Usage: node 01-setup-wallets.mjs [count]
 * Example: node 01-setup-wallets.mjs 10
 */

import { createRequire } from 'module';
import { writeFileSync, existsSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const require = createRequire(import.meta.url);
const StellarSdk = require('../../backend/node_modules/@stellar/stellar-sdk');
const { Keypair, Asset, TransactionBuilder, Operation, Networks, BASE_FEE } = StellarSdk;
const Horizon = StellarSdk;

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Config ───────────────────────────────────────────────────────────────────
const COUNT = parseInt(process.argv[2] || '5', 10);
const WALLETS_FILE = join(__dirname, 'wallets.json');

const HORIZON_URL   = 'https://horizon-testnet.stellar.org';
const FRIENDBOT_URL = 'https://friendbot.stellar.org';
const NETWORK_PASSPHRASE = Networks.TESTNET;

// Circle testnet USDC issuer
const USDC_ISSUER = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';
const USDC = new Asset('USDC', USDC_ISSUER);

// ── Helpers ──────────────────────────────────────────────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function friendbot(publicKey) {
  const res = await fetch(`${FRIENDBOT_URL}?addr=${publicKey}`);
  if (!res.ok) throw new Error(`Friendbot failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function createTrustline(keypair, horizonServer) {
  const account = await horizonServer.loadAccount(keypair.publicKey());
  
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(Operation.changeTrust({ asset: USDC }))
    .setTimeout(30)
    .build();

  tx.sign(keypair);
  return horizonServer.submitTransaction(tx);
}

// ── Main ─────────────────────────────────────────────────────────────────────
const horizonServer = new StellarSdk.Horizon.Server(HORIZON_URL);

// Load existing wallets if file exists
let wallets = [];
if (existsSync(WALLETS_FILE)) {
  wallets = JSON.parse(readFileSync(WALLETS_FILE, 'utf8'));
  console.log(`📂 Loaded ${wallets.length} existing wallets from file`);
}

console.log(`\n🔑 Creating ${COUNT} new burner wallets...\n`);

for (let i = 0; i < COUNT; i++) {
  const keypair = Keypair.random();
  const publicKey = keypair.publicKey();
  const secretKey = keypair.secret();

  process.stdout.write(`[${i + 1}/${COUNT}] ${publicKey.slice(0, 16)}... `);

  try {
    // 1. Fund via Friendbot (gives 10,000 XLM)
    process.stdout.write('funding... ');
    await friendbot(publicKey);
    await sleep(2000); // wait for ledger

    // 2. Create USDC trustline
    process.stdout.write('trustline... ');
    await createTrustline(keypair, horizonServer);
    await sleep(1000);

    wallets.push({
      publicKey,
      secretKey,
      funded: true,
      trustline: true,
      faucetClaimed: false,
      swept: false,
      createdAt: new Date().toISOString(),
    });

    console.log('✅');
  } catch (err) {
    console.log(`❌ ${err.message}`);
    wallets.push({
      publicKey,
      secretKey,
      funded: false,
      trustline: false,
      faucetClaimed: false,
      swept: false,
      error: err.message,
      createdAt: new Date().toISOString(),
    });
  }

  // Save after each wallet in case of interruption
  writeFileSync(WALLETS_FILE, JSON.stringify(wallets, null, 2));
}

// Print summary for faucet claiming
const ready = wallets.filter(w => w.trustline && !w.faucetClaimed);
console.log(`\n${'─'.repeat(60)}`);
console.log(`✅ Done! ${ready.length} wallets ready for Circle faucet\n`);
console.log('📋 Paste these addresses into https://faucet.circle.com/');
console.log('   Network: Stellar Testnet\n');
ready.forEach((w, i) => {
  console.log(`  ${i + 1}. ${w.publicKey}`);
});
console.log(`\n${'─'.repeat(60)}`);
console.log('After claiming, run: node 02-sweep-usdc.mjs');
