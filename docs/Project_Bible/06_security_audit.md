# 06 — Security Audit

> Comprehensive security posture assessment from codebase read
> Generated: 2026-03-10

---

## Authentication & Authorization

### Strengths ✅
| Control | Implementation | Location |
|---------|---------------|----------|
| Passkey/WebAuthn | Phishing-resistant, no passwords stored | `lib/passkey.ts`, `webauthnController.js` |
| JWT + httpOnly refresh | Tokens not accessible to JS, auto-refresh | `auth.middleware.js`, `client.ts` |
| Role-based auth | `isAdmin`, `isCompanyUser`, `isInvestor` middleware | `middleware/` |
| Multisig for admin ops | Critical ops require N-of-M signatures | `MultiSigTransactionService` |
| 2-step admin transfer | On-chain admin change requires new admin to accept | Smart contract |
| Ledger support | Hardware wallet for recovery signers | `lib/ledger.ts` |

### Weaknesses 🔴
| Issue | Risk | Location | Recommendation |
|-------|------|----------|---------------|
| ~~**In-memory WebAuthn challenges**~~ | ~~Lost on restart, won't scale horizontally~~ **RESOLVED**: `webauthnController`, `authRoutes`, and `platformAdminRoutes` all use `storeChallenge()`/`getChallenge()` from `redis.js` with TTL. Challenge persistence and horizontal scale are no longer concerns. | ~~`authRoutes`, `platformAdminRoutes`~~ | No action required |
| **In-memory rate limiting** | Per-instance only, reset on restart | `platformAdminRoutes` (Freighter) | Use Redis-backed rate limiter |
| **JWT_SECRET defaults to string** | `change_this_in_production` is insecure if unchanged | `docker-compose.yml` | Use `?` guard in prod compose |
| `approveCompanyDebug` endpoint | Exists behind `NODE_ENV` guard — risky if misconfigured | `companyRoutes.js` | Remove entirely or add API key |

---

## Network & Transport Security

### Strengths ✅
| Control | Implementation |
|---------|---------------|
| Helmet CSP | Strict Content-Security-Policy headers |
| HPP protection | HTTP Parameter Pollution prevention |
| CORS whitelist | Multi-origin support, credentials enabled |
| No external DB port (prod) | PostgreSQL only on Docker network |
| No external Redis port | Redis internal only |
| Caddy auto-HTTPS | Let's Encrypt with HTTP/3 |
| Docker Secrets | Operations key on tmpfs, never on disk |

### Weaknesses 🔴
| Issue | Risk | Location |
|-------|------|----------|
| DB port exposed in dev | `127.0.0.1:5432` — only localhost, acceptable | `docker-compose.yml` |

---

## Stellar / On-Chain Security

### Strengths ✅
| Control | Implementation |
|---------|---------------|
| Issuer account flags | `AUTH_REQUIRED + AUTH_REVOCABLE + AUTH_CLAWBACK_ENABLED` |
| Token freeze/clawback | Admin can freeze accounts, clawback tokens |
| Contract buyer freeze | Per-buyer blocklist on smart contract |
| Emergency drain | Atomic pause + withdraw all tokens |
| Atomic trades | All-or-nothing (Soroban guarantee) |
| TTL management | Automatic TTL extension on trades + cron maintenance |
| Two-role access | Admin (cold) vs Seller (hot) separation |

### Weaknesses 🔴
| Issue | Risk | Location | Recommendation |
|-------|------|----------|---------------|
| **No fee collection on-chain** | ~~Platform loses revenue~~ **RESOLVED Apr 2026**: (1) TokenSale v6 `fixed_fee` is additive — platform fee is split in `trade()` to treasury on-chain; (2) YieldDistributor `distribute()` sends `fee_amount` to treasury atomically. Legacy `feeLog` DB record is now an audit trail, not the only collection mechanism. | ~~`FeeService`~~ | No action required |
| **No contract reentrancy guard** | Low risk (Soroban model prevents this), but no explicit guard | `lib.rs` | Soroban model is safe, document this |
| Contract admin is single key | If admin key compromised, contract is fully controlled | `lib.rs` | Admin should be a Soroban multisig account |

---

## Input Validation

### Strengths ✅
| Control | Implementation |
|---------|---------------|
| `express-validator` | Parameter validation on routes |
| Zod schemas | Frontend form validation |
| Prisma parameterized queries | SQL injection prevention |
| FormData + multer | File upload size/type limits |

### Weaknesses 🔴
| Issue | Risk | Location |
|-------|------|----------|
| **Validator after auth** in `/purchase` | Validator runs after `authenticateToken` — should be before | `investmentRoutes.js` |
| No file type validation | Multer accepts any file — should restrict to PDF/images | `offerRoutes.js` |

---

## Rate Limiting

| Tier | Limit | Applied To |
|------|-------|-----------|
| `authLimiter` | 5/min | Login, registration |
| `strictLimiter` | 10/min | Sensitive operations |
| `apiLimiter` | 30/min | Standard API calls |
| `globalLimiter` | 100/min | Catch-all |
| Custom (in-memory) | 3 attempts | Freighter login (⚠️ per-instance only) |

---

## Data Protection

| Data Type | Protection | Status |
|-----------|-----------|--------|
| Passwords | Removed (passkey-only) | ✅ Eliminated attack surface |
| JWT tokens | httpOnly cookie + Bearer header | ✅ |
| Refresh tokens | httpOnly, Secure, SameSite=Lax | ✅ |
| Passkey credentials | Public key only in DB | ✅ |
| Secret keys (ops only) | Docker Secrets (tmpfs) / `.env` | ✅ Only OPERATIONS stored server-side |
| Secret keys (prod) | Docker Secrets (tmpfs) | ✅ |
| Error details | Stripped in production responses | ✅ |
| Sentry data | PII scrubbed (tokens, URLs) | ✅ |
| Console logs | Secrets partially present in dev | ⚠️ Review `console.log` statements |

---

## Summary Risk Rating

| Category | Rating | Notes |
|----------|--------|-------|
| Authentication | 🟢 Strong | Passkey eliminates phishing; multisig for admin |
| Authorization | 🟢 Strong | Role-based middleware, on-chain two-role model |
| Transport | 🟢 Strong | Caddy HTTPS, Helmet, CORS |
| Input validation | 🟡 Good | Needs file type restriction, validator ordering fix |
| Session management | 🟢 Strong | In-memory challenge weakness **resolved** (all challenge stores migrated to Redis with TTL) |
| On-chain security | 🟢 Strong | Fee gap **resolved Apr 2026** (TokenSale v6 fixed_fee + YieldDistributor fee_amount); MaturitySettlement adds deposit-hold model |
| Key management | 🟢 Strong | Docker Secrets, Freighter/Ledger separation |
