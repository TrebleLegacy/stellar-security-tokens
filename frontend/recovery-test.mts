/**
 * SMART WALLET RECOVERY — Using Smart Account Kit multiSigners
 * 
 * Bypasses passkey auth by force-setting connected state,
 * then uses multiSigners.transfer() with only the ed25519 backup key.
 * 
 * Build: npx esbuild recovery-test.mts --bundle --platform=node --outfile=recovery-bundled.mjs --format=esm --target=node22 '--external:@stellar/stellar-sdk' '--external:@stellar/stellar-sdk/*'
 * Run:   node recovery-bundled.mjs --secret S... --wallet C... --destination G... --amount 1
 */

import { SmartAccountKit } from 'smart-account-kit';
import { Keypair } from '@stellar/stellar-sdk';

const args = process.argv.slice(2);
const getArg = (n: string) => { const i = args.indexOf(`--${n}`); return i > -1 ? args[i + 1] : null; };

const SECRET      = getArg('secret')!;
const WALLET_ID   = getArg('wallet')!;
const DESTINATION = getArg('destination')!;
const AMOUNT      = parseFloat(getArg('amount') || '0');

const USDC_SAC = 'CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA';

if (!SECRET || !WALLET_ID || !DESTINATION || !AMOUNT) {
  console.log('Usage: node recovery-bundled.mjs --secret S... --wallet C... --destination G... --amount 1');
  process.exit(1);
}

const backupKeypair = Keypair.fromSecret(SECRET);

console.log('');
console.log('🚨 RADOX IS DOWN — Recovery mode (multiSigners path)');
console.log('');
console.log(`🔑 Signer:      ${backupKeypair.publicKey()}`);
console.log(`📦 Wallet:      ${WALLET_ID}`);
console.log(`📤 To:          ${DESTINATION}`);
console.log(`💰 Amount:      ${AMOUNT} USDC`);
console.log('');

// Step 0: Fund the backup key so it can pay network fees
console.log('0️⃣  Ensuring submitter is funded...');
try {
  const res = await fetch(`https://friendbot.stellar.org?addr=${backupKeypair.publicKey()}`);
  const text = await res.text();
  console.log(text.includes('createAccountAlreadyExist') ? '   Already funded.' : '   Funded.');
} catch { console.log('   Friendbot skipped.'); }

// Step 1: Create kit
console.log('1️⃣  Initializing SmartAccountKit...');
const kit = new SmartAccountKit({
  rpcUrl: 'https://soroban-testnet.stellar.org',
  networkPassphrase: 'Test SDF Network ; September 2015',
  accountWasmHash: 'a12e8fa9621efd20315753bd4007d974390e31fbcb4a7ddc4dd0a0dec728bf2e',
  webauthnVerifierAddress: 'CBSHV66WG7UV6FQVUTB67P3DZUEJ2KJ5X6JKQH5MFRAAFNFJUAJVXJYV',
  indexerUrl: false as any, // No indexer needed for recovery
});

// Step 2: Force-connect without passkey
console.log('2️⃣  Force-connecting to wallet contract...');
(kit as any).setConnectedState(WALLET_ID, 'recovery-mode-no-passkey');
console.log(`   Connected: ${kit.contractId}`);

// Step 3: Load ed25519 backup key
console.log('3️⃣  Loading backup key...');
kit.externalSigners.addFromSecret(SECRET);

// Step 4: Transfer using multiSigners (Delegated signer only, no passkeys)
console.log('4️⃣  Executing multiSigners.transfer()...');
const selectedSigners = [
  {
    type: 'wallet' as const,
    walletAddress: backupKeypair.publicKey(),
    label: 'Backup Recovery Key',
  },
];

const result = await kit.multiSigners.transfer(
  USDC_SAC,
  DESTINATION,
  AMOUNT,
  selectedSigners,
  {
    forceMethod: 'rpc',
    onLog: (msg: string) => console.log(`   [SDK] ${msg}`),
  },
);

console.log('');
if (result.success) {
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║  ✅ RECOVERY SUCCESSFUL                              ║');
  console.log('║  Funds moved WITHOUT Radox servers.                  ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log(`   TX: ${result.hash}`);
} else {
  console.log('❌ FAILED:', result.error);
}
