# 03 — Data Flow

> How data moves through the system: user → frontend → backend → blockchain/DB
> Generated: 2026-03-10

---

## Core Data Flow Patterns

### Pattern 1: Soroban Transaction Flow (Investment, Withdrawal, Payment)
```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ Frontend │    │ Backend  │    │ Soroban  │    │ Frontend │    │ Backend  │
│ (React)  │    │ (Node)   │    │ (RPC)    │    │ (React)  │    │ (Node)   │
└────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘
     │               │               │               │               │
     │ POST /purchase │               │               │               │
     │───────────────>│               │               │               │
     │               │ simulate TX   │               │               │
     │               │──────────────>│               │               │
     │               │ assembled XDR │               │               │
     │               │<──────────────│               │               │
     │  { xdr }      │               │               │               │
     │<───────────────│               │               │               │
     │               │               │               │               │
     │ Passkey sign  │               │               │               │
     │──(WebAuthn)──>│               │               │               │
     │               │               │               │               │
     │ POST /submit  │               │               │               │
     │───────────────>│               │               │               │
     │               │ sendTransaction│              │               │
     │               │──────────────>│               │               │
     │               │ poll result   │               │               │
     │               │──────────────>│               │               │
     │               │ SUCCESS       │               │               │
     │               │<──────────────│               │               │
     │  { txHash }   │               │               │               │
     │<───────────────│               │               │               │
```

### Pattern 2: Multisig Admin Flow
```
Admin A                Backend              Stellar           Admin B
  │                      │                    │                  │
  │ Create proposal      │                    │                  │
  │─────────────────────>│                    │                  │
  │                      │ Store XDR in DB    │                  │
  │                      │                    │                  │
  │                      │ GET /pending ──────│──────────────────│
  │                      │                    │                  │
  │                      │                    │  GET /xdr        │
  │                      │<───────────────────│──────────────────│
  │                      │ rebuild (Soroban)  │                  │
  │                      │───────────────────>│                  │
  │                      │  fresh XDR         │                  │
  │                      │<───────────────────│                  │
  │                      │                    │    { xdr }       │
  │                      │────────────────────│─────────────────>│
  │                      │                    │                  │
  │                      │                    │ Sign (Freighter) │
  │                      │<───────────────────│──────────────────│
  │                      │ POST /submit       │                  │
  │                      │                    │                  │
  │                      │ submitTransaction  │                  │
  │                      │───────────────────>│                  │
  │                      │                    │                  │
  │                      │ Execute post-hooks │                  │
  │                      │ (chain: issue →    │                  │
  │                      │  SAC → deploy →    │                  │
  │                      │  activate)         │                  │
```

### Pattern 3: Deposit Relay (CEX → Smart Wallet)
```
Investor              CEX/Exchange         Treasury         Backend          Smart Wallet
  │                      │                    │               │                 │
  │ Initiate deposit     │                    │               │                 │
  │──────────────────────│────────────────────│──────────────>│                 │
  │ { address, memo }    │                    │               │                 │
  │<─────────────────────│────────────────────│───────────────│                 │
  │                      │                    │               │                 │
  │ Send USDC with memo  │                    │               │                 │
  │─────────────────────>│                    │               │                 │
  │                      │ Payment arrives    │               │                 │
  │                      │───────────────────>│               │                 │
  │                      │                    │  Stream event │                 │
  │                      │                    │──────────────>│                 │
  │                      │                    │               │ SAC transfer    │
  │                      │                    │               │────────────────>│
  │                      │                    │               │                 │
  │                      │                    │               │ Update DB       │
  │                      │                    │               │ + Notify        │
```

---

## Data Persistence Map

| Data | Primary Store | Secondary Store | On-Chain |
|------|--------------|----------------|----------|
| Investor profile | PostgreSQL `investor` | — | Smart wallet address |
| Company profile | PostgreSQL `company` | — | Smart wallet address |
| Offer details | PostgreSQL `offer` | IPFS (legal docs) | Soroban sale contract |
| Token metadata | PostgreSQL `token` | — | Stellar asset + SAC |
| Investment records | PostgreSQL `investment` | — | Soroban trade events |
| Interest payments | PostgreSQL `interestPayment` | — | USDC transfer TX |
| Fee logs | PostgreSQL `feeLog` | — | ❌ Not on-chain |
| Passkey credentials | PostgreSQL `InvestorWebauthnCredential`, `CompanyUserWebauthnCredential`, `PlatformAdminWebauthnCredential` (3 separate models) | — | Smart wallet signers per user type |
| Notifications | PostgreSQL `notification` | Pusher (backend `config/pusher.js` — optional, used by multiSigTransaction.service.js for governance events; frontend pusher-js **deleted**) | — |
| Multisig proposals | PostgreSQL `multiSigTransaction` | — | Stellar TX (when submitted) |
| Deposits | PostgreSQL `deposit` | — | Stellar payment + SAC transfer |
| System config | PostgreSQL `systemConfig` | — | — |
| Sessions/JWT | In-memory + httpOnly cookie | Redis (blocklist) | — |
| Rate limits | In-memory + Redis | — | — |
| WebAuthn challenges | ~~⚠️ In-memory Map~~ **Redis** (`storeChallenge` TTL) | — | — |
| Legal documents | IPFS (Pinata) | PostgreSQL (hash + URL) | — |
| Soroban metrics | PostgreSQL `sorobanMetric` | In-memory cache | — |

---

## Token Flow (Lifecycle)

```
1. ISSUE:     Issuer ──(totalSupply)──> Distributor
2. SAC:       Deploy Stellar Asset Contract (tokenizes the classic asset)
3. CONTRACT:  Deploy Soroban sale contract
4. DEPOSIT:   Distributor ──(totalSupply via SAC)──> Sale Contract
5. ACTIVATE:  set_active(true)
6. TRADE:     Buyer ──(USDC)──> Contract ──(tokens)──> Buyer
                                Contract ──(USDC)──> Treasury
7. WITHDRAW:  Company requests USDC withdrawal from treasury
8. PAYMENTS:  Company ──(USDC interest)──> Each Investor (per offer terms)
```

## USDC Flow
```
                    ┌─────────────┐
                    │  Investor   │
                    │ Smart Wallet│
                    └──────┬──────┘
                           │
              deposit ↓    │ ↑ withdrawal
                           │ │
                    ┌──────▼──────┐         ┌─────────────┐
       CEX ──USDC──>│  Treasury   │──USDC──>│   Company   │
                    │  (Hot Wallet)│<──USDC──│ Smart Wallet│
                    └──────┬──────┘         └─────────────┘
                           │
                    invest ↓
                           │
                    ┌──────▼──────┐
                    │ Sale Contract│
                    │ (holds tokens)│
                    └─────────────┘
```

## Yield Payment Flow (YieldDistributor)

```
 ┌─────────┐  1. GET /payments/:offerId    ┌─────────┐
 │ Company │ ────────────────────────────> │ Backend │
 │ Portal  │                               │         │
 │         │  2. POST /payments/:offerId/  │         │
 │         │     prepare                   │         │
 │         │ ────────────────────────────> │         │ ── buildMultiBatchXdrs()
 │         │ <──── batchXDRs[] + jobId     │         │ ── YieldPaymentJob.create()
 │         │                               │         │
 │  3. Sign each XDR (passkey)             │         │
 │     Sequential: batch 1 → 2 → N         │         │
 │         │                               │         │
 │         │  4. POST /payments/:offerId/  │         │
 │         │     submit { signedXDRs[] }   │         │
 │         │ ────────────────────────────> │         │ ── acquireLock(offerId)
 │         │                               │         │ ── submitBatches() [3x retry]
 │         │                               │         │ ── _recordPayments() [DB]
 │         │                               │         │ ── releaseLock()
 │         │ <──── { success | partial }   │         │ ── YieldPaymentJob.update()
 └─────────┘                               └────┬────┘
                                                │
                                    ┌───────────▼──────────┐
                                    │ YieldDistributor     │
                                    │ Contract (Soroban)   │
                                    │                      │
                                    │ distribute(          │
                                    │   payer,             │
                                    │   token,             │
                                    │   recipients[],      │
                                    │   amounts[],         │
                                    │   fee_recipient,     │
                                    │   fee_amount         │
                                    │ )                    │
                                    │                      │
                                    │ SAC.transfer() ×N    │
                                    │ + 1 fee transfer     │
                                    └──────────────────────┘
```

### Failure Recovery

| Failure Point | What Happens |
|---|---|
| User closes tab mid-signing | `beforeunload` warning. Signed XDRs lost — re-prepare is safe (new sequence numbers) |
| Network error during submit | 3x retry with exponential backoff. If still fails → `partial_failure` |
| TX confirmed, DB record fails | `PAYMENT_RECORD_FAILURE` alert. `YieldPaymentReconciler` catches in 5-min sweep |
| Server crash mid-submit | `YieldPaymentJob` stays in `submitting`. Reconciler fixes after 10 min |
| Admin retry needed | `POST /admin/yield-jobs/:id/retry` → re-prepare only failed investors |
