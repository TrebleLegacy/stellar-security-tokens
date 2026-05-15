#!/usr/bin/env node
/**
 * EtherFuse Sandbox Probe
 * ───────────────────────
 * Answers the open architectural question for Radox's EtherFuse integration:
 * does EtherFuse accept a Soroban C-address as `publicKey` for a registered
 * wallet on Stellar — and if so, does an on-ramp actually deliver TESOURO
 * to that contract address?
 *
 *   Path A (probe passes): register `investor.stellarContractId` directly,
 *           EtherFuse SAC-transfers TESOURO to the contract. Zero forwarder.
 *
 *   Path C (probe fails):  provision a per-investor classic G-keypair,
 *           encrypt key at rest, EtherFuse delivers to the G-address,
 *           Radox forwards to the C-address via SAC transfer.
 *
 * Reads ETHERFUSE_API_KEY from the worktree-root .env (same convention as
 * scripts/bootstrap-admins.js).
 *
 * Usage:
 *   node scripts/etherfuse-sandbox-probe.mjs auth
 *   node scripts/etherfuse-sandbox-probe.mjs assets [g-or-c-address-for-fee-quote]
 *   node scripts/etherfuse-sandbox-probe.mjs register-c-address <c-address>
 *   node scripts/etherfuse-sandbox-probe.mjs all <c-address>
 *
 * Each mode is idempotent in terms of side-effects on Radox; it ONLY touches
 * EtherFuse sandbox state. It creates ephemeral child organizations on
 * EtherFuse — those linger but are harmless.
 */

import dotenv from 'dotenv';
import path from 'path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const API_BASE = process.env.ETHERFUSE_API_BASE_URL || 'https://api.sand.etherfuse.com';
const API_KEY = process.env.ETHERFUSE_API_KEY;

if (!API_KEY) {
  console.error('❌ ETHERFUSE_API_KEY not set. Add it to .env at the worktree root.');
  process.exit(1);
}

const HEADERS = {
  // EtherFuse docs: "Use Authorization: <api_key> with no Bearer prefix"
  Authorization: API_KEY,
  'Content-Type': 'application/json',
};

const TRUNCATE = 2000;

/**
 * Make a JSON HTTP call against EtherFuse. Verbose by design — every probe
 * call prints request + response so failures are inspectable post-hoc.
 */
async function call(method, urlPath, body) {
  const url = `${API_BASE}${urlPath}`;
  const opts = { method, headers: HEADERS };
  if (body !== undefined) opts.body = JSON.stringify(body);

  console.log(`\n→ ${method} ${url}`);
  if (body) console.log(`  body: ${JSON.stringify(body)}`);

  const res = await fetch(url, opts);
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }

  console.log(`← ${res.status} ${res.statusText}`);
  const printable = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  console.log(printable.length > TRUNCATE
    ? `  ${printable.slice(0, TRUNCATE)}\n  …(truncated ${printable.length - TRUNCATE} more chars)`
    : printable.split('\n').map(l => `  ${l}`).join('\n'));

  return { status: res.status, ok: res.ok, data };
}

function header(title) {
  const bar = '═'.repeat(72);
  console.log(`\n${bar}\n  ${title}\n${bar}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Stages
// ─────────────────────────────────────────────────────────────────────────────

/** Stage A — auth smoke test */
async function stageAuth() {
  header('STAGE A: auth smoke test (GET /ramp/me)');
  const me = await call('GET', '/ramp/me');
  if (!me.ok) {
    console.error('\n❌ Auth failed. Verify ETHERFUSE_API_KEY is a valid sandbox key for a business account.');
    process.exit(1);
  }
  const orgId = me.data?.organizationId ?? me.data?.id ?? '(not found in response)';
  console.log(`\n✅ Auth OK. Org: ${orgId}`);
  return me.data;
}

/** Stage B — list BRL-rampable Stellar assets, look for TESOURO */
async function stageAssets(walletForFeeQuote) {
  header('STAGE B: BRL-rampable Stellar assets (GET /ramp/assets)');
  // Per the OpenAPI: blockchain, currency, wallet are all required query params.
  // The `wallet` field is used for trustline/account-existence fee calculation.
  const qs = new URLSearchParams({
    blockchain: 'stellar',
    currency: 'brl',
    wallet: walletForFeeQuote,
  });
  const res = await call('GET', `/ramp/assets?${qs}`);
  if (!res.ok) {
    console.error('\n⚠ Asset listing failed. The /ramp/assets endpoint may have stricter validation than the OpenAPI spec suggests.');
    return null;
  }
  const assets = Array.isArray(res.data) ? res.data : (res.data?.assets ?? []);
  const tesouro = assets.find(a => (a.symbol ?? '').toUpperCase() === 'TESOURO');
  if (tesouro) {
    console.log(`\n✅ TESOURO found:`);
    console.log(`   symbol:     ${tesouro.symbol}`);
    console.log(`   identifier: ${tesouro.identifier}`);
    console.log(`   currency:   ${tesouro.currency}`);
    console.log(`   name:       ${tesouro.name}`);
    return tesouro;
  }
  console.warn('\n⚠ TESOURO not in returned list. Available symbols:');
  console.warn('  ' + assets.map(a => a.symbol).join(', '));
  return null;
}

/**
 * Stage C — the real test: try to register a C-address as wallet by creating
 * a fresh sandbox child organization with that wallet attached.
 *
 * Decision rule:
 *   - 2xx with wallet echoed back  → Path A is viable at the API level.
 *                                     Still needs end-to-end delivery test.
 *   - 4xx with format error        → Path C required.
 *   - Other 4xx (e.g. missing user info) → ambiguous; report and re-run after fix.
 */
async function stageRegisterCAddress(cAddress) {
  header(`STAGE C: register C-address as wallet (POST /ramp/organization with embedded wallet)`);

  if (!/^C[A-Z0-9]{55}$/.test(cAddress)) {
    console.warn(`\n⚠ "${cAddress}" doesn't look like a Stellar Soroban contract ID (56-char base32 starting with C). Continuing anyway — EtherFuse may have different validation.`);
  }

  const customerId = crypto.randomUUID();
  const payload = {
    id: customerId,
    displayName: `radox-probe-${Date.now().toString(36)}`,
    accountType: 'personal',
    wallets: [{ publicKey: cAddress, blockchain: 'stellar' }],
    userInfo: {
      email: `probe+${customerId.slice(0, 8)}@radox.test`,
      displayName: 'Radox Probe',
    },
  };

  const res = await call('POST', '/ramp/organization', payload);

  if (res.ok) {
    console.log('\n✅ EtherFuse ACCEPTED the C-address at the API layer.');
    console.log('   → Path A is viable so far. Next: run a full on-ramp to verify delivery actually lands on the contract.');
    console.log(`   → Probe customer ID (linger in sandbox, harmless): ${customerId}`);
    return { viable: true, customerId, walletEchoed: res.data?.wallets ?? res.data };
  }

  const errStr = (typeof res.data === 'string' ? res.data : JSON.stringify(res.data)).toLowerCase();
  if (
    res.status === 400 &&
    (errStr.includes('publickey') || errStr.includes('wallet') || errStr.includes('invalid') || errStr.includes('format'))
  ) {
    console.error('\n❌ EtherFuse rejected the C-address with a wallet/format error.');
    console.error('   → Path A is NOT viable. Fall back to Path C (per-investor G-address ramp).');
    return { viable: false, reason: 'format-rejected', error: res.data };
  }

  console.error('\n⚠ Inconclusive. Non-format error; could be a different validation issue.');
  console.error('   → Inspect the error above. Common causes: missing required fields, sandbox quirk, RFC/CURP not applicable for BR customer.');
  return { viable: null, reason: 'inconclusive', error: res.data };
}

// ─────────────────────────────────────────────────────────────────────────────
// CLI
// ─────────────────────────────────────────────────────────────────────────────

const mode = process.argv[2];
const arg = process.argv[3];

(async () => {
  console.log(`EtherFuse sandbox probe → ${API_BASE}\n`);

  switch (mode) {
    case 'auth': {
      await stageAuth();
      break;
    }
    case 'assets': {
      const wallet = arg || 'GAIH3ULLFQ4DGSECF2AR555KZ4KNDGEKN4AFI4SU2M7B43MGK3QJZNSR';
      console.log(`Using ${wallet} as the fee-quote wallet (BR investor wallet you actually own works best).\n`);
      await stageAuth();
      await stageAssets(wallet);
      break;
    }
    case 'register-c-address': {
      if (!arg) {
        console.error('Pass the C-address as the second arg.\n  e.g. node scripts/etherfuse-sandbox-probe.mjs register-c-address C...');
        process.exit(1);
      }
      await stageAuth();
      await stageRegisterCAddress(arg);
      break;
    }
    case 'all': {
      if (!arg) {
        console.error('Pass the C-address as the second arg.\n  e.g. node scripts/etherfuse-sandbox-probe.mjs all C...');
        process.exit(1);
      }
      await stageAuth();
      await stageAssets(arg);
      const result = await stageRegisterCAddress(arg);
      header('SUMMARY');
      if (result.viable === true) {
        console.log('Path A is API-viable. Next test: full on-ramp end-to-end (separate script).');
      } else if (result.viable === false) {
        console.log('Path A is not viable. Implement Path C (per-investor G-address custodial ramp).');
      } else {
        console.log('Inconclusive. Investigate the error above and re-run.');
      }
      break;
    }
    default:
      console.log('Usage:');
      console.log('  node scripts/etherfuse-sandbox-probe.mjs auth');
      console.log('  node scripts/etherfuse-sandbox-probe.mjs assets [wallet-for-fee-quote]');
      console.log('  node scripts/etherfuse-sandbox-probe.mjs register-c-address <c-address>');
      console.log('  node scripts/etherfuse-sandbox-probe.mjs all <c-address>');
      process.exit(1);
  }
})().catch(err => {
  console.error('\n💥 Probe crashed:', err);
  process.exit(1);
});
