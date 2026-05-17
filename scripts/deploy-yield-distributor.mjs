/**
 * One-shot deployment of the YieldDistributor Soroban contract.
 *
 * Runs INSIDE the backend container so it can read the operations key
 * from Docker secrets without the key ever leaving the server.
 *
 * Required env (already set in backend container):
 *   SOROBAN_RPC_URL
 *   STELLAR_NETWORK (testnet | public)
 *
 * Files expected:
 *   /run/secrets/operations_key      ← Docker secret
 *   /tmp/yield_distributor.wasm      ← docker cp'd in by the runner
 *
 * Prints (last 2 lines, machine-parseable):
 *   WASM_HASH=<hex>
 *   YIELD_DISTRIBUTOR_CONTRACT_ID=<C-address>
 */

import { readFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
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

const RPC_URL = process.env.SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org';
const NETWORK = process.env.STELLAR_NETWORK || 'testnet';
const PASSPHRASE = NETWORK === 'public' ? Networks.PUBLIC : Networks.TESTNET;

const opsSecret = readFileSync('/run/secrets/operations_key', 'utf8').trim();
const operations = Keypair.fromSecret(opsSecret);
const wasm = readFileSync('/tmp/yield_distributor.wasm');

const server = new rpc.Server(RPC_URL);

console.error(`[deploy] network=${NETWORK}, rpc=${RPC_URL}`);
console.error(`[deploy] operations=${operations.publicKey()}`);
console.error(`[deploy] wasm size=${wasm.length} bytes`);

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
  throw new Error(`tx timeout after 120s: ${send.hash}`);
}

async function simulateRead(contract, fnName) {
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
  // ── Step A: Upload WASM ─────────────────────────────────────
  console.error('[deploy] A) uploading WASM…');
  const upRes = await submit(Operation.uploadContractWasm({ wasm }));
  const wasmHash = upRes.returnValue.bytes().toString('hex');
  console.error(`[deploy]    wasmHash=${wasmHash}`);

  // ── Step B: Deploy contract instance ────────────────────────
  console.error('[deploy] B) deploying instance…');
  const salt = randomBytes(32);
  const deployRes = await submit(
    Operation.createCustomContract({
      wasmHash: Buffer.from(wasmHash, 'hex'),
      address: Address.fromString(operations.publicKey()),
      salt,
    })
  );
  const contractAddr = Address.fromScAddress(deployRes.returnValue.address()).toString();
  console.error(`[deploy]    contractId=${contractAddr}`);

  // ── Step C: Initialize ─────────────────────────────────────
  console.error('[deploy] C) initialize(admin=operations)…');
  const contract = new Contract(contractAddr);
  await submit(contract.call('initialize', new Address(operations.publicKey()).toScVal()));
  console.error('[deploy]    initialized ✓');

  // ── Step D: Verify reads ───────────────────────────────────
  console.error('[deploy] D) verify…');
  const adminBack = await simulateRead(contract, 'get_admin');
  const version = await simulateRead(contract, 'version');
  const paused = await simulateRead(contract, 'get_paused');
  console.error(`[deploy]    get_admin=${adminBack}`);
  console.error(`[deploy]    version=${version}`);
  console.error(`[deploy]    get_paused=${paused}`);

  if (adminBack !== operations.publicKey()) {
    throw new Error(`admin mismatch: got ${adminBack}, expected ${operations.publicKey()}`);
  }

  // Machine-parseable output on stdout (last 2 lines)
  console.log(`WASM_HASH=${wasmHash}`);
  console.log(`YIELD_DISTRIBUTOR_CONTRACT_ID=${contractAddr}`);
})().catch((e) => {
  console.error('[deploy] FAILED:', e.message);
  if (e.stack) console.error(e.stack);
  process.exit(1);
});
