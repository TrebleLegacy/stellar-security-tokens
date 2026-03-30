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
