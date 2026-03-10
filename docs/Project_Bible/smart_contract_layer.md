# Smart Contract Layer — Full Deep Read

> **Soroban (Rust, `#[no_std]`)** | Read date: 2026-03-10
> File: `contracts/token_sale/src/lib.rs` — 383 lines | 47 test snapshots

---

## Contract Overview

**TokenSale v3** — Atomic token sale contract on Soroban.

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
    treasury: Address,        // USDC auto-forwarded here on trade
    sell_price: u32,          // Price numerator
    buy_price: u32,           // Price denominator
    is_active: bool,          // Pause/resume flag
    deadline_ledger: u32,     // 0 = no deadline
    min_buy_amount: i128,     // 0 = no minimum
    max_buy_per_buyer: i128,  // 0 = no cap, cumulative per buyer
}
```

## Public Functions (15)

| Function | Auth | Risk | Purpose |
|----------|------|------|---------|
| `create` | Admin | Setup | Initialize offer (starts INACTIVE) |
| `trade` | Buyer | Core | Atomic USDC→token swap (3 transfers) |
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
| `version` | Public | Read | Returns 3 |

## Trade Flow (Atomic)

```
buyer → buy_token_amount (USDC) → contract
contract → sell_token_amount (tokens) → buyer
contract → buy_token_amount (USDC) → treasury
```

Checks: active, deadline, min amount, buyer not frozen, per-buyer cap, overflow.
Formula: `sell_amount = buy_amount * sell_price / buy_price`

## Storage Layout

| Key | Storage Type | Purpose |
|-----|-------------|---------|
| `DataKey::Offer` | Instance | Main offer state |
| `DataKey::PendingAdmin` | Instance | 2-step admin transfer |
| `DataKey::BuyerSpent(addr)` | Persistent | Cumulative spend per buyer |
| `DataKey::BuyerBlocked(addr)` | Persistent | Buyer blocklist |

## Error Codes (12)

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

## TTL Configuration
- Threshold: 518,400 ledgers (~30 days at 5s/ledger)
- Extended on: trade, create, price update, pause, admin transfer

## Test Coverage (47 snapshots)
Happy path, edge cases (overflow, zero caps, double-create), buyer cap enforcement (independent per buyer), admin transfer chain, emergency drain, pause/resume, supply exhaustion, blocklist, deadline.
