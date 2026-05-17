/**
 * One-shot: transfer YieldDistributor admin from OPERATIONS → ISSUER.
 *
 * Runs INSIDE the backend container so the operations key never leaves the
 * server. After this, all 3 platform contracts (token_sale, maturity_settlement,
 * yield_distributor) share the same admin = ISSUER for uniform key management.
 *
 * Required env (already set in backend container):
 *   SOROBAN_RPC_URL
 *   STELLAR_NETWORK
 *   ISSUER_PUBLIC_KEY                ← new admin target
 *   YIELD_DISTRIBUTOR_CONTRACT_ID    ← contract to modify
 *
 * Files:
 *   /run/secrets/operations_key      ← current admin signer
 */

import { readFileSync } from 'node:fs';
import {
  Keypair,
  Networks,
  TransactionBuilder,
  Operation,
  BASE_FEE,
  rpc,
  Address,
  Contract,
  scValToNative,
} from '@stellar/stellar-sdk';

const RPC_URL = process.env.SOROBAN_RPC_URL;
const NETWORK = process.env.STELLAR_NETWORK || 'testnet';
const PASSPHRASE = NETWORK === 'public' ? Networks.PUBLIC : Networks.TESTNET;
const ISSUER_PK = process.env.ISSUER_PUBLIC_KEY;
const CONTRACT_ID = process.env.YIELD_DISTRIBUTOR_CONTRACT_ID;

if (!ISSUER_PK) throw new Error('ISSUER_PUBLIC_KEY not set');
if (!CONTRACT_ID) throw new Error('YIELD_DISTRIBUTOR_CONTRACT_ID not set');

const opsSecret = readFileSync('/run/secrets/operations_key', 'utf8').trim();
const operations = Keypair.fromSecret(opsSecret);
const server = new rpc.Server(RPC_URL);

console.error(`[set-admin] network=${NETWORK}`);
console.error(`[set-admin] contract=${CONTRACT_ID}`);
console.error(`[set-admin] current admin signer=${operations.publicKey()}`);
console.error(`[set-admin] new admin target=${ISSUER_PK}`);

async function submit(opBuilder) {
  const account = await server.getAccount(operations.publicKey());
  let tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: PASSPHRASE,
  })
    .addOperation(opBuilder)
    .setTimeout(300)
    .build();
  tx = await server.prepareTransaction(tx);
  tx.sign(operations);
  const send = await server.sendTransaction(tx);
  if (send.status !== 'PENDING') {
    throw new Error(`sendTransaction status=${send.status}: ${JSON.stringify(send)}`);
  }
  let result;
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    result = await server.getTransaction(send.hash);
    if (result.status === 'SUCCESS') return result;
    if (result.status === 'FAILED') {
      throw new Error(`tx FAILED: ${JSON.stringify(result, null, 2)}`);
    }
  }
  throw new Error(`tx timeout: ${send.hash}`);
}

async function simRead(contract, fnName) {
  const account = await server.getAccount(operations.publicKey());
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: PASSPHRASE,
  })
    .addOperation(contract.call(fnName))
    .setTimeout(60)
    .build();
  const sim = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(sim)) throw new Error(`sim ${fnName}: ${sim.error}`);
  return scValToNative(sim.result.retval);
}

(async () => {
  const contract = new Contract(CONTRACT_ID);

  // Sanity: confirm current admin is operations
  const adminBefore = await simRead(contract, 'get_admin');
  console.error(`[set-admin] adminBefore=${adminBefore}`);
  if (adminBefore !== operations.publicKey()) {
    throw new Error(`current admin mismatch — got ${adminBefore}, expected ${operations.publicKey()}`);
  }

  // Call set_admin(ISSUER)
  console.error('[set-admin] calling set_admin…');
  await submit(contract.call('set_admin', new Address(ISSUER_PK).toScVal()));

  // Verify
  const adminAfter = await simRead(contract, 'get_admin');
  console.error(`[set-admin] adminAfter=${adminAfter}`);
  if (adminAfter !== ISSUER_PK) {
    throw new Error(`admin transfer failed — got ${adminAfter}, expected ${ISSUER_PK}`);
  }

  console.log(`OK new_admin=${adminAfter}`);
})().catch((e) => {
  console.error('[set-admin] FAILED:', e.message);
  if (e.stack) console.error(e.stack);
  process.exit(1);
});
