# 07 — Error Recovery Map

> How errors are caught, propagated, and recovered from at each layer
> Generated: 2026-03-10

---

## Error Propagation Chain

```
Smart Contract (SaleError enum) → Soroban RPC (TX failure) → Backend Service (try/catch)
  → Controller (catches, maps to HTTP) → Express error middleware (sanitizes, logs, Sentry)
    → Frontend Axios interceptor (401 refresh, toast) → UI (toast/inline error)
```

---

## Layer-by-Layer Error Handling

### Smart Contract (`lib.rs`)
| Error | Code | Recovery |
|-------|------|----------|
| AlreadyCreated | 1 | Client prevents double-create |
| ZeroPrice | 2 | Frontend validates before submit |
| NotActive | 3 | Frontend checks `is_active` before trade |
| InvalidAmount | 4 | Frontend validates > 0 |
| TradeTooSmall | 5 | Frontend checks against min |
| Overflow | 6 | `checked_mul`/`checked_div` — no recovery, user retries with smaller amount |
| Expired | 7 | Frontend shows "sale ended" |
| BelowMinimum | 8 | Frontend enforces `min_buy_amount` |
| BuyerCapExceeded | 9 | Frontend shows remaining cap |
| BuyerBlocked | 10 | Frontend hides trade button if frozen |
| NoPendingAdmin | 11 | Admin flow prevents orphan accept |
| NotPendingAdmin | 12 | Only pending admin can accept |

**Atomicity**: All Soroban TX transfers are atomic — if any `transfer()` fails, entire TX reverts.

### Backend Services
| Service | Error Pattern | Recovery |
|---------|--------------|----------|
| SorobanSaleService | `try/catch` → re-throw with context | Caller handles |
| StellarService | TX failure → retry with fee bump (limited) | 3 retries then fail |
| PasskeyWalletService | Channels failure → fee-bump fallback → throw | User retries |
| EmailService | `try/catch` → log warning, no throw | Silently degrades |
| DepositRelayService | Match failure → skip, log | Unmatched deposits queued |
| CompanyPaymentService | Overdue check → create penalty, no throw | Penalties are informational |
| BackupService | pg_dump failure → retry once | Log error, continue |
| MultiSigTransactionService | Expired TXs → mark as expired | Auto-resolved by cron |

### Backend Middleware
```
app.use((err, req, res, next) => {
  log.error(err.message);              // Always log full error
  Sentry.captureException(err);         // Report to Sentry
  
  if (NODE_ENV === 'production') {
    res.status(err.status || 500).json({
      success: false,
      error: 'Internal server error'    // Sanitized in production
    });
  } else {
    res.status(err.status || 500).json({
      success: false,
      error: err.message,               // Full detail in dev
      stack: err.stack
    });
  }
});
```

### Frontend (`client.ts` — Axios Interceptors)
| HTTP Status | Action |
|-------------|--------|
| 401 | Silent token refresh → retry original request |
| 401 (refresh fails) | Clear auth, redirect to `/login` |
| 403 | Redirect to `/login` |
| Network error | Toast: "Network error" |
| 4xx/5xx | Toast: server error message |

### Frontend (`lib/api.ts` — Fetch Client)
| HTTP Status | Action |
|-------------|--------|
| 401 | `getRefreshedToken()` → retry |
| 401 (retry fails) | `redirectToLogin()` |
| 403 | `redirectToLogin()` |
| Non-OK | `throw new Error(statusText)` |

---

## Graceful Shutdown

```
SIGTERM / SIGINT received
  → Stop accepting new requests
  → PaymentMonitor.stop() (close Stellar stream)
  → SorobanEventIndexer.stop()
  → SorobanReconciler.stop()
  → SorobanMetrics.stop()
  → Close DB connections (Prisma)
  → Close Redis connections
  → process.exit(0)
```

## Unhandled Errors

```javascript
process.on('unhandledRejection', (reason) => {
  log.error('Unhandled Rejection:', reason);
  Sentry.captureException(reason);
  // Does NOT exit — keeps server running
});

process.on('uncaughtException', (error) => {
  log.error('Uncaught Exception:', error);
  Sentry.captureException(error);
  process.exit(1); // EXIT — container restarts via Docker
});
```

---

## Known Recovery Gaps

| Gap | Impact | Recommendation |
|-----|--------|---------------|
| **No TX retry queue** | Failed Soroban TXs require user to manually retry | Add background retry with exponential backoff |
| **No dead letter queue for deposits** | Unmatched deposits are logged but not retried | Add periodic reconciliation |
| **Soroban simulation can go stale** | XDR built, user delays signing → TX may fail | Add expiration check before submit |
| **No circuit breaker** | All external calls (Horizon, Soroban RPC, Channels) have no circuit breaker | Add circuit breaker pattern |
| **In-memory challenge store** | Server restart loses all pending WebAuthn challenges | Move to Redis with 5-min TTL |
