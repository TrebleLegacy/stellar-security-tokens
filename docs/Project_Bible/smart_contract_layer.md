# Smart Contract Layer — Full Deep Read

> **Soroban (Rust, `#[no_std]`)** | Read date: 2026-03-30
> File: `contracts/token_sale/src/lib.rs` — ~400 lines | 75 test snapshots

---

## Contract Overview

**TokenSale v6** — Atomic token sale contract on Soroban.

Two-role access control:
- **Admin** (cold/multisig): upgrade, withdraw, drain, freeze, admin transfer
- **Seller** (hot): pause/resume, price updates

## Offer Struct

```rust
pub struct Offer {
    admin: Address,           // High-privilege key
    seller: Address,          // Operational key
    sell_token: Address,      // Token being sold (SAC)
    buy_token: Address,       // Payment token (USDC SAC)
    treasury: Address,        // Fee destination
    company: Address,         // Investment destination (gets 100% of buy_token_amount)
    fixed_fee: i128,          // v6: additive flat fee in stroops. 0 = no fee.
    sell_price: u32,          // Price numerator
    buy_price: u32,           // Price denominator
    is_active: bool,          // Pause/resume flag
    deadline_ledger: u32,     // 0 = no deadline
    min_buy_amount: i128,     // 0 = no minimum
    max_buy_per_buyer: i128,  // 0 = no cap, cumulative per buyer
}
```

### v6 Migration Notes (2026-03-30)
- **Breaking change**: `trade()` fee model is now **additive** — investor pays `buy_amount + fee`
- **v5 (old)**: Fee was subtractive — `company = buy_amount - fee`, tokens on `buy_amount - fee`
- **v6 (new)**: Fee is additive — `company = buy_amount (100%)`, tokens on `buy_amount`, investor pays `buy_amount + fee`
- **Rationale**: Company receives full investment principal. Fee is transparent and separate.
- **WASM hash**: `1178db3fd6358552f9e1547ab0e104e3b5ec1c3111361b28e1b5012dd43fd5a0`
- **Strategy**: New contracts only — existing v5 contracts are immutable and continue operating with their original parameters.

### v5 Migration Notes (2026-03-30)
- **Removed**: `fee_bps: u32` (percentage-based fee from v4)
- **Added**: `fixed_fee: i128` (flat fee in stroops, e.g. 50_000_000 = $5 USDC)
- **Added**: `company: Address` and `treasury: Address` split (v4 had single treasury)

## Public Functions (15)

| Function | Auth | Risk | Purpose |
|----------|------|------|---------|
| `create` | Admin | Setup | Initialize offer (starts INACTIVE) |
| `trade` | Buyer | Core | Atomic USDC→token swap (additive fee: pulls buy_amount + fee) |
| `withdraw` | Admin | High | Withdraw any token from contract |
| `emergency_drain` | Admin | Critical | Pause + withdraw ALL sell_token |
| `set_active` | Seller | Medium | Pause/resume trading |
| `updt_price` | Seller | Medium | Update sell_price/buy_price |
| `propose_admin` | Admin | High | Step 1 of admin transfer |
| `accept_admin` | Pending | High | Step 2 of admin transfer |
| `freeze_buyer` | Admin | Medium | Block/unblock buyer address |
| `is_frozen` | Public | Read | Check buyer blocklist |
| `upgrade` | Admin | Critical | Replace contract WASM |
| `extend_ttl` | Public | Safe | Extend contract TTL (~30 days) |
| `get_offer` | Public | Read | Return offer state |
| `get_balance` | Public | Read | Contract's sell_token balance |
| `get_buyer_spent` | Public | Read | Buyer's cumulative spend |
| `version` | Public | Read | Returns 6 |

## Trade Flow (Atomic, v6 — Additive Fee)

```
buyer calls: trade(buyer, buy_token_amount)

contract computes:
  total_pull = buy_token_amount + fixed_fee

contract transfers:
  1. buyer → contract:  total_pull (buy_token_amount + fixed_fee)
  2. contract → buyer:  sell_token_amount (tokens)
  3. contract → company: buy_token_amount (100% of investment)
  4. contract → treasury: fixed_fee (if > 0)

Formula: sell_amount = buy_token_amount * sell_price / buy_price
         (fee is NOT subtracted — tokens calculated on full investment)
```

```
  ┌─────────┐   buy_token_amount + fee   ┌──────────┐
  │  BUYER  │ ──────────────────────────▶ │ CONTRACT │
  └─────────┘                             └────┬─────┘
       ▲                                       │
       │  sell_token_amount                    ├── buy_token_amount ─▶ COMPANY (100%)
       │  (tokens on full                      │
       │   buy_token_amount)                   └── fixed_fee ────────▶ TREASURY
       └───────────────────────────────────────┘
```

Checks: active, deadline, min amount, buyer not frozen, per-buyer cap, overflow.

## Storage Layout

| Key | Storage Type | Purpose |
|-----|-------------|---------|
| `DataKey::Offer` | Instance | Main offer state |
| `DataKey::PendingAdmin` | Instance | 2-step admin transfer |
| `DataKey::BuyerSpent(addr)` | Persistent | Cumulative spend per buyer |
| `DataKey::BuyerBlocked(addr)` | Persistent | Buyer blocklist |

## Error Codes (13)

| Code | Name | Trigger |
|------|------|---------|
| 1 | AlreadyCreated | Double `create` |
| 2 | ZeroPrice | sell_price or buy_price = 0 |
| 3 | NotActive | Trade while paused |
| 4 | InvalidAmount | amount ≤ 0 |
| 5 | TradeTooSmall | sell_token_amount ≤ 0 after calc |
| 6 | Overflow | i128 arithmetic overflow |
| 7 | Expired | Past deadline_ledger |
| 8 | BelowMinimum | Below min_buy_amount |
| 9 | BuyerCapExceeded | Exceeds max_buy_per_buyer |
| 10 | BuyerBlocked | Buyer is frozen |
| 11 | NoPendingAdmin | No pending admin to accept |
| 12 | NotPendingAdmin | Wrong address accepting |
| 13 | InsufficientForFee | Overflow when computing buy_token_amount + fixed_fee |

## TTL Configuration
- Threshold: 518,400 ledgers (~30 days at 5s/ledger)
- Extended on: trade, create, price update, pause, admin transfer

## Backend Integration

### Stroops Conversion
```
DB: offer.processingFee = 5.0 (Decimal, USDC)
JS: fixedFee = BigInt(processingFee * 10_000_000) = 50_000_000n (stroops)
```

### Services Touched
- `sorobanSale.service.js` — `buildCreateSaleXdr()` accepts `fixedFee` param
- `multiSigTransaction.service.js` — Both `sale_create` paths use `fixedFee`
- `offer.service.js` — Reads `offer.processingFee`, converts to stroops
- `investmentController.js` — Logs processing fee for audit trail

### Fee Schedule API (`GET /api/investments/fee-schedule`)
```json
{
  "processingFee": 5.0,
  "yieldFee": "Spread-based (company rate - investor rate)",
  "description": "A fixed $5 processing fee is added per trade on-chain."
}
```

## Test Coverage (75 snapshots)
Happy path, edge cases (overflow, zero caps, double-create), buyer cap enforcement (independent per buyer), admin transfer chain, emergency drain, pause/resume, supply exhaustion, blocklist, deadline, **additive fixed fee** (5 tests: zero fee, non-zero fee, fee overflow, fee-only trade, fee treasury balance). All tests verify company receives 100% of `buy_token_amount` and treasury receives `fixed_fee`.

---

# YieldDistributor Contract v2

> **Soroban (Rust, `#[no_std]`)** | Added: 2026-04-15
> File: `contracts/yield_distributor/src/lib.rs` — ~350 lines | 35 test snapshots

## Overview

Batched yield distribution contract. Company calls `distribute()` to pay up to 30 investors in a single Soroban TX via `SAC.transfer()` sub-invocations. Platform fee sent to treasury in the same atomic TX.

**Stateful-minimal**: stores admin address + paused flag only. No token deposits. One passkey signature = one batch of transfers.

## Public Functions (7)

| Function | Auth | Risk | Purpose |
|----------|------|------|---------|
| `initialize` | Deployer | Setup | Set admin address (once) |
| `distribute` | Payer | Core | Batch SAC.transfer() to N recipients + fee |
| `pause` | Admin | Medium | Block distribute() calls |
| `resume` | Admin | Medium | Unblock distribute() calls |
| `set_admin` | Admin | High | Transfer admin to new address |
| `upgrade` | Admin | Critical | Replace contract WASM |
| `extend_ttl` | Public | Safe | Extend instance + code TTL |

## Error Codes (11)

| Code | Name | Trigger |
|------|------|---------|
| 1 | EmptyBatch | recipients array empty |
| 2 | BatchTooLarge | > 30 recipients |
| 3 | InvalidAmount | amount ≤ 0 |
| 4 | Overflow | i128 arithmetic overflow |
| 5 | MismatchedArrays | recipients.len() ≠ amounts.len() |
| 6 | FeeTooHigh | fee > 20% of total batch |
| 7 | AlreadyInitialized | initialize() called twice |
| 8 | NotInitialized | distribute() before initialize() |
| 9 | ContractPaused | distribute() while paused |
| 10 | DuplicateRecipient | same address appears twice in batch |
| 11 | SelfTransfer | payer pays themselves |

## Backend Integration

- `YieldDistributorService` — builds multi-batch XDRs, submits with retry, Redis locking
- `companyPayment.service.js` — routes Soroban (C...) wallets through YieldDistributor
- `YieldPaymentReconciler` — cron (5 min) fixes stuck jobs
- `MaintenanceService` — extends contract TTL daily
- `.env`: `YIELD_DISTRIBUTOR_CONTRACT_ID=CBEW2KJA...`

## Test Coverage (35 snapshots)
Happy path (single + multi-recipient), all error codes, admin operations (pause/resume/set_admin), upgrade flow, TTL extension, batch size boundary (30 = ok, 31 = error), duplicate recipient detection, self-transfer prevention, fee cap (20%), empty batch rejection.

---

# MaturitySettlement Contract

> **Soroban (Rust, `#[no_std]`)** | Added: 2026-04-29
> Wrapper service: `services/sorobanSettlement.service.js` (579L)
> WASM hash: configured via `SETTLEMENT_WASM_HASH` env var (no testnet default)

## Overview

Handles bullet-maturity debt payments. On maturity, the company deposits USDC into the contract; the admin then calls `settle_batch()` which atomically pays each investor their principal + accrued interest and **burns all their tokens**. Multi-batch: up to 30 investors per TX.

**Stateful with deposits**: unlike YieldDistributor, this contract holds USDC between deploy and settlement.

## Lifecycle (5 steps)

```
1. Admin:   deploy_settlement   → contract deployed, contractId saved to DB
2. Admin:   initialize()        → sets token SAC, USDC SAC, treasury, max_fee_bps
3. Company: deposit USDC        → company signs TX moving USDC into contract
4. Admin:   settle_batch() × N  → contract pays investors + burns tokens (≤30/batch)
5. Admin:   withdraw()          → recover any leftover USDC after all batches
```

> ⚠️ `initialize()` must be called AFTER the deploy TX is **confirmed on-chain**. The simulate step requires the contract to exist.

## Public Functions (9)

| Function | Auth | Risk | Purpose |
|----------|------|------|---------|
| `initialize` | Deployer (issuer key) | Setup | Set token SAC, USDC SAC, treasury, max_fee_bps (once) |
| `deposit` | Company wallet | Core | Transfer USDC from company into contract |
| `settle_batch` | Admin (issuer key) | Critical | Pay ≤30 investors + burn ALL their tokens atomically |
| `withdraw` | Admin | High | Recover leftover USDC after settlement completes |
| `get_balance` | Public | Read | Current USDC balance held by contract |
| `get_offer_token` | Public | Read | Token SAC address |
| `extend_ttl` | Public | Safe | Extend contract TTL |
| `version` | Public | Read | Contract version |
| `emergency_withdraw` | Admin | Critical | Emergency drain (all USDC out, no burns) |

## Error Codes (8)

| Code | Name | Trigger |
|------|------|---------|
| 1 | AlreadyInitialized | `initialize()` called twice |
| 2 | NotInitialized | `settle_batch()` before `initialize()` |
| 3 | InsufficientDeposit | `settle_batch()` before `deposit()` |
| 5 | EmptyBatch | Investor array empty |
| 6 | AlreadySettled | Investor already paid in previous batch |
| 7 | BatchTooLarge | > 30 investors per batch |
| 8 | NoDeposit | No USDC in contract when `settle_batch()` called |
| 10 | PhantomInvestor | Investor address not in offer's investor list |

## Storage Layout

| Key | Storage Type | Purpose |
|-----|-------------|---------|
| `DataKey::Config` | Instance | token_sac, usdc_sac, treasury, max_fee_bps |
| `DataKey::Settled(addr)` | Persistent | Per-investor settled flag (prevents double-pay) |

## Backend Integration

### Service: `SorobanSettlementService` (10 static methods)

| Method | Returns | Purpose |
|--------|---------|---------|
| `deployForOffer(offerId)` | `{ contractId, deployXdr }` | Build deploy TX, save contractId to DB |
| `buildInitializeXdr(offerId, maxFeeBps)` | `{ xdr }` | Build initialize TX |
| `buildDepositXdr(offerId, amount)` | `{ xdr }` | Company-side deposit TX |
| `buildSettleBatchXdr(offerId, investors, totalFee)` | `{ xdr }` | Single batch TX |
| `executeFullSettlement(offerId)` | `{ batches[], totalInvestors }` | Splits all investors into batches of 30, returns all XDRs |
| `buildWithdrawXdr(offerId, token, amount, dest)` | `{ xdr }` | Post-settlement leftover recovery |
| `getContractBalance(offerId)` | `{ balance }` | Read USDC balance |
| `getSettlementWasmHash()` | `string` | Read `SETTLEMENT_WASM_HASH` env (throws if unset) |
| `parseContractError(error)` | `{ code, message }` | Map Soroban error codes to human messages |
| `_precomputeContractId(issuer, salt)` | `string` | Deterministic contract address before deploy TX confirms |

### offerType constraint
Only available for `offerType: 'collateral'` (Prisma enum value for debt/fixed-income offers) with a `maturityDate` set. Equity offers (`offerType: 'sale'`) cannot use MaturitySettlement.

### Env vars
- `SETTLEMENT_WASM_HASH` — **required** before any debt offer is approved. Lazy validation — missing value does NOT fail at startup. *(See `05_config_env_map.md` for kill chain.)*
- `USDC_SAC_CONTRACT_ID` — shared with YieldDistributor

### Cron integration
`payment.service.js:processBulletPayments()` (daily 01:00) marks offers as `status: 'matured'` and notifies company users. The actual on-chain settlement is triggered manually by admin via the settlement endpoints — it does NOT run automatically on maturity date.
