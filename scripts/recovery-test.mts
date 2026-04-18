/**
 * RECOVERY TEST — Access smart wallet WITHOUT Radox
 * 
 * Run from frontend/ dir:
 *   npx tsx ../scripts/recovery-test.mts --secret S... --wallet C... --destination G... --amount 1
 */

import { SmartAccountKit } from 'smart-account-kit';
import { Keypair } from '@stellar/stellar-sdk';

const args = process.argv.slice(2);
const getArg = (name: string) => { const i = args.indexOf(`--${name}`); return i > -1 ? args[i + 1] : null; };

const SECRET = getArg('secret')!;
const WALLET_ID = getArg('wallet')!;
const DESTINATION = getArg('destination')!;
const AMOUNT = parseFloat(getArg('amount') || '0');
const USDC = 'CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA';

if (!SECRET || !WALLET_ID || !DESTINATION || !AMOUNT) {
  console.log('Usage: npx tsx ../scripts/recovery-test.mts --secret S... --wallet C... --destination G... --amount 1');
  process.exit(1);
}

const kp = Keypair.fromSecret(SECRET);

console.log('');
console.log('🚨 SIMULATING: Radox is DOWN. Using backup key only.');
console.log('');
console.log(`🔑 Backup signer: ${kp.publicKey()}`);
console.log(`📦 Wallet:         ${WALLET_ID}`);
console.log(`📤 Destination:    ${DESTINATION}`);
console.log(`💰 Amount:         ${AMOUNT} USDC`);
console.log(`🌐 Direct to:      https://soroban-testnet.stellar.org`);
console.log('');

const kit = new SmartAccountKit({
  rpcUrl: 'https://soroban-testnet.stellar.org',
  networkPassphrase: 'Test SDF Network ; September 2015',
  accountWasmHash: 'a12e8fa9621efd20315753bd4007d974390e31fbcb4a7ddc4dd0a0dec728bf2e',
  webauthnVerifierAddress: 'CBSHV66WG7UV6FQVUTB67P3DZUEJ2KJ5X6JKQH5MFRAAFNFJUAJVXJYV',
});

console.log('1️⃣  Loading backup key...');
kit.externalSigners.addFromSecret(SECRET);

console.log('2️⃣  Connecting to wallet contract...');
await kit.connectWallet({ contractId: WALLET_ID });
console.log(`   Connected: ${kit.contractId}`);

console.log('3️⃣  Transferring USDC...');
const result = await kit.transfer(USDC, DESTINATION, AMOUNT, { forceMethod: 'rpc' });

console.log('');
if (result.success) {
  console.log('✅ RECOVERY SUCCESSFUL');
  console.log(`   TX: ${result.hash}`);
  console.log('   Funds moved WITHOUT Radox servers.');
} else {
  console.log('❌ FAILED:', result.error);
}
