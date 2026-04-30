# Routes Layer — Full Deep Read

> **15 files · 6,888 lines** | Read date: 2026-03-10 | Line counts updated 2026-04-29
> Path: `backend/src/routes/`

---

## File Inventory

| # | File | Lines | Mounts At | Auth Used |
|---|------|-------|-----------|-----------|
| 1 | `investorRoutes.js` | 463 | `/api/investors` | public (reg), `authenticateToken`, `requireInvestor`, `requireOwnData` |
| 2 | `investmentRoutes.js` | 117 | `/api/investments` | `authenticateToken` |
| 3 | `offerRoutes.js` | 794 | mixed: `/api/companies/offers`, `/api/offers`, `/api/admin/offers` | `requireCompanyUser`, `requirePlatformAdmin`, `optionalAuth`, `requireRole` |
| 4 | `companyRoutes.js` | 413 | `/api/companies` | public (reg), `requireCompanyUser`, `requirePlatformAdmin` |
| 5 | `companyUserRoutes.js` | 273 | `/api/company-users` | public (reg), `requireCompanyUser` |
| 6 | `authRoutes.js` | 366 | `/api/auth` | public (login), `authenticateToken` (logout) |
| 7 | `platformAdminRoutes.js` | 2,067 | `/api/platform-admins` | public (login), `authenticateToken` + `requirePlatformAdmin`, `requireAdminRole` |
| 8 | `tokenRoutes.js` | 282 | `/api/tokens` | `requirePlatformAdmin`, `optionalAuth` (list), public (detail) |
| 9 | `walletRoutes.js` | 272 | `/api/wallets` | public (`submit-tx`), `authenticateToken` + `requirePlatformAdmin` |
| 10 | `webauthnRoutes.js` | 192 | `/api/webauthn` | public (all) |
| 11 | `contractRoutes.js` | 207 | `/api/admin/contracts` | `requirePlatformAdmin` (global `router.use`) |
| 12 | `notificationRoutes.js` | 25 | `/api/notifications` | `authenticateToken` (global `router.use`) |
| 13 | `securityRoutes.js` | 222 | `/api/security` | `authenticateToken`, public (`passkey-config`) |
| 14 | `adminTransactionRoutes.js` | 634 | `/api/admin/transactions` | `authenticatePlatformAdmin` |
| 15 | `companyPaymentRoutes.js` | 561 | `/api/company/payments` | `authenticateToken` + `requireCompanyUser` |

---

## Complete HTTP Endpoint Map

### Public (No Auth)

| Method | Path | Handler/Source | Purpose |
|--------|------|----------------|---------|
| POST | `/api/investors/initiate-registration` | investorRoutes | Start email-first reg |
| POST | `/api/investors/verify-email-code` | investorRoutes | Verify 6-digit code |
| POST | `/api/investors/resend-code` | investorRoutes | Resend code |
| POST | `/api/investors/register` | investorRoutes | Complete reg with passkey |
| GET | `/api/investors/passkey/config` | investorRoutes | SmartAccountKit client config |
| GET | `/api/investments/fee-schedule` | investmentRoutes | Current fee schedule |
| POST | `/api/companies/initiate-registration` | companyRoutes | Company reg step 1 |
| POST | `/api/companies/verify-email-code` | companyRoutes | Company reg step 2 |
| POST | `/api/companies/resend-code` | companyRoutes | Company resend |
| POST | `/api/companies/register` | companyRoutes | Company reg step 3 |
| PUT | `/api/companies/debug/:id/approve` | companyRoutes | ⚠️ Debug approve (dev only) |
| POST | `/api/company-users/register-passkey` | companyUserRoutes | Company user reg |
| POST | `/api/company-users/verify-email` | companyUserRoutes | Verify email |
| POST | `/api/company-users/resend-verification` | companyUserRoutes | Resend |
| POST | `/api/company-users/create-wallet` | companyUserRoutes | Create smart wallet |
| GET | `/api/company-users/:userId/wallet-status` | companyUserRoutes | Wallet status |
| GET | `/api/company-users/passkey/config` | companyUserRoutes | Passkey config |
| GET | `/api/auth/config` | authRoutes | Passkey config |
| GET | `/api/auth/passkey-login/discover` | authRoutes | Discoverable login challenge |
| POST | `/api/auth/passkey-login/discover` | authRoutes | Discoverable login verify |
| POST | `/api/auth/refresh` | authRoutes | Refresh JWT |
| POST | `/api/platform-admins/freighter/challenge` | platformAdminRoutes | Freighter SEP-10 challenge |
| POST | `/api/platform-admins/freighter/verify` | platformAdminRoutes | Freighter verify |
| POST | `/api/platform-admins/passkey/login/options` | platformAdminRoutes | Admin passkey login options |
| POST | `/api/platform-admins/passkey/login/verify` | platformAdminRoutes | Admin passkey login verify |
| GET | `/api/platform-admins/passkey-login` | platformAdminRoutes | Admin discoverable challenge |
| POST | `/api/platform-admins/passkey-login` | platformAdminRoutes | Admin discoverable login |
| GET | `/api/tokens` | tokenRoutes | Token list (optionalAuth) |
| GET | `/api/tokens/:assetCode` | tokenRoutes | Token detail |
| GET | `/api/offers/active` | offerRoutes | Public active offers (optionalAuth) |
| GET | `/api/offers/:id` | offerRoutes | Public offer detail (optionalAuth) |
| POST | `/api/wallets/submit-tx` | walletRoutes | Submit signed XDR (passkey deployment) |
| POST/GET | `/api/webauthn/:userType/register/start` | webauthnRoutes | WebAuthn reg start |
| POST | `/api/webauthn/:userType/register/complete` | webauthnRoutes | WebAuthn reg complete |
| POST | `/api/webauthn/:userType/login/start` | webauthnRoutes | WebAuthn login start |
| POST | `/api/webauthn/:userType/login/complete` | webauthnRoutes | WebAuthn login complete |
| GET | `/api/security/passkey-config` | securityRoutes | Passkey config |

### Investor (requireInvestor / authenticateToken)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/investors` | List investors |
| GET | `/api/investors/:id` | Investor detail |
| GET | `/api/investors/:id/portfolio` | Portfolio (requireOwnData) |
| GET | `/api/investors/:id/investments` | Investments (requireOwnData) |
| GET | `/api/investors/:investorId/payments` | Payment history |
| GET | `/api/investors/:investorId/wallet-status` | Wallet status |
| POST | `/api/investors/:investorId/withdraw/propose` | Build withdrawal TX |
| POST | `/api/investors/withdraw/submit` | Submit signed withdrawal |
| POST | `/api/investors/:id/deposit/initiate` | Initiate USDC deposit (requireOwnData) |
| GET | `/api/investors/:id/deposits` | List deposits (requireOwnData) |
| POST | `/api/investments/purchase` | Buy tokens (Soroban) |
| POST | `/api/investments/submit-tx` | Submit signed investment TX |
| GET | `/api/investments/:id/status` | Investment status |

### Company (requireCompanyUser)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/companies/profile` | Company profile |
| PUT | `/api/companies/profile` | Update profile |
| GET | `/api/companies/offers` | Company's offers |
| POST | `/api/companies/offers` | Create offer (multer upload) |
| GET | `/api/companies/offers/:id` | Offer detail |
| PUT | `/api/companies/offers/:id` | Update offer |
| POST | `/api/companies/offers/:id/activate` | Activate offer (admin_verified req.) |
| GET | `/api/companies/offers/:id/investors` | Cap table (requireRole company/admin) |
| GET | `/api/companies/:companyId/wallet-status` | Wallet status |
| POST | `/api/companies/:companyId/withdraw/propose` | Withdrawal proposal |
| POST | `/api/companies/withdraw/submit` | Submit withdrawal |
| GET/POST | `/api/company-users/*` | Company user CRUD, wallet, withdraw |
| GET | `/api/company/payments/:offerId/history` | Payment history |
| GET | `/api/company/payments/:offerId/upcoming` | Upcoming payments |
| POST | `/api/company/payments/:offerId/prepare` | Prepare payment TX (returns XDR for signing) |
| GET | `/api/company/payments/:offerId/yield-status` | Yield job status (for UI progress tracking) |
| POST | `/api/company/payments/:offerId/submit` | Submit signed payment XDR — **polymorphic:** single `signedXDR` → classic or Soroban path; `signedXDRs[]` → multi-batch YieldDistributor |
| POST | `/api/company/payments/:offerId/prepare-deposit` ⭐ | Build maturity deposit XDR (SorobanSettlement) |
| POST | `/api/company/payments/:offerId/submit-deposit` ⭐ | Submit signed deposit TX (notifies admins) |
| GET | `/api/company/payments/:offerId/settlement-status` ⭐ | Check settlement contract balance |

### Platform Admin (requirePlatformAdmin)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/platform-admins` | Create admin (super_admin only) |
| GET | `/api/platform-admins` | List admins |
| PUT | `/api/platform-admins/:id` | Update admin |
| GET/PUT | `/api/platform-admins/system-config` | System config CRUD |
| GET | `/api/platform-admins/fee-logs` | Platform fee logs |
| GET | `/api/platform-admins/investments/metrics` | General metrics |
| GET | `/api/platform-admins/investments/statistics` | Period stats |
| GET | `/api/platform-admins/investments/pending` | Pending investments |
| GET | `/api/platform-admins/investments/fundraising` | Fundraising progress |
| GET | `/api/platform-admins/investments/revenue-breakdown` | Revenue analysis |
| GET | `/api/platform-admins/investments/cohorts` | Cohort analysis |
| GET/PUT | `/api/platform-admins/investors` | Investor list |
| GET | `/api/platform-admins/investors/:id/details` | Investor detail + balances |
| PUT | `/api/platform-admins/investors/:id/approve` | KYC approve (+ auto-whitelist) |
| PUT | `/api/platform-admins/investors/:id/reject` | KYC reject (+ email) |
| POST | `/api/platform-admins/investors/:id/sponsor` | Sponsor investor wallet (XLM SAC) |
| GET | `/api/platform-admins/companies` | Company list |
| GET | `/api/platform-admins/companies/:id/details` | Company detail + balances |
| POST | `/api/platform-admins/companies/:id/approve` | Approve company (+ email) |
| POST | `/api/platform-admins/companies/:id/reject` | Reject company (+ email) |
| POST | `/api/platform-admins/companies/:id/sponsor` | Sponsor company wallet (XLM SAC) |
| GET | `/api/platform-admins/treasury/balances` | Treasury balances |
| GET | `/api/platform-admins/maintenance/ttl-stats` | TTL stats |
| GET | `/api/platform-admins/defaults` | Defaulted offers list |
| GET | `/api/platform-admins/defaults/:offerId` | Default details |
| POST | `/api/platform-admins/defaults/:offerId/prepare` | Prepare collateral distribution |
| POST | `/api/platform-admins/defaults/:offerId/distribute` | Execute collateral distribution |
| POST | `/api/platform-admins/offers/:offerId/unlock-token` | Unlock token for DEX (irreversible, confirm=true) |
| GET | `/api/platform-admins/yield-jobs` | YieldPaymentJob list |
| GET | `/api/platform-admins/yield-jobs/:jobId` | Single job detail |
| POST | `/api/platform-admins/yield-jobs/:jobId/retry` | Retry failed yield job |
| GET | `/api/platform-admins/soroban/dashboard` | Soroban contract dashboard (on-chain + reconciler) |
| POST | `/api/platform-admins/passkey/register/options` | Admin passkey reg options |
| POST | `/api/platform-admins/passkey/register` | Admin passkey reg complete |
| *Tokens* | `/api/tokens/issue`, `/api/tokens/sync`, `/api/tokens/freeze`, etc. | Token lifecycle |
| *Wallets* | `/api/wallets`, `/api/wallets/transactions/*` | System wallet + multisig |
| *Contracts* | `/api/admin/contracts/*` | Full Soroban sale admin |
| *Admin TX* | `/api/admin/transactions/*` | Multisig lifecycle — GET /pending, GET /:id, GET /:id/xdr, POST /:id/sign, POST /:id/submit, POST /:id/reject, GET /stats, POST /deposits/:depositId/retry, POST /deposits/retry-all, POST /setup-thresholds |
| POST | `/api/wallets/relay` | walletRoutes — relay signed XDR via internal relay pattern |
| GET | `/api/company/payments/history/all` | All payment history across offers |
| GET | `/api/company/payments/penalties/all` | All penalties across offers |
| POST | `/api/admin/offers/:id/reconcile-chain` | On-chain → DB reconciliation (maturity) |
| POST | `/api/admin/offers/:id/deploy-settlement` ⭐ | Deploy MaturitySettlement contract for debt offer |
| POST | `/api/admin/offers/:id/init-settlement` ⭐ | Initialize deployed settlement contract |
| POST | `/api/admin/offers/:id/settlement-deposit` ⭐ | Admin builds deposit XDR (alternative to company-side) |
| POST | `/api/admin/offers/:id/settle` ⭐ | Execute multi-batch settlement (pays investors, burns tokens) |
| GET | `/api/admin/offers/:id/settlement-status` ⭐ | Settlement contract balance + state |

### Security (authenticateToken)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/security/passkeys` | List user's passkeys |
| POST | `/api/security/passkeys/verify/challenge` | Get verification challenge |
| POST | `/api/security/passkeys/add/options` | Reg options for new passkey |
| GET | `/api/security/passkey-config` | Passkey config (public) |
| GET | `/api/security/recovery-signers` | List Ed25519 recovery signers |

> ⚠️ **Ghost routes (documented but not in source):** `POST /passkeys/add`, `DELETE /passkeys/:passkeyId`, `POST /recovery-signers/add`, `DELETE /recovery-signers/:signerId` — these do not exist in `securityRoutes.js`.

---

## Architecture Observations

### 1. Route Mounting Pattern
Routes are **not self-mounting** — they use `express.Router()` and are mounted in `app.js`. Three different mounting patterns exist:
- **Standard prefix:** `/api/investors` → investorRoutes
- **Multi-prefix routes:** offerRoutes is mounted once but handles `/companies/offers`, `/offers`, and `/admin/offers` internally
- **Global middleware:** contractRoutes and notificationRoutes apply auth via `router.use()`

### 2. The `platformAdminRoutes.js` Problem (1,877 lines)
This file is a **mega-route** that has grown into a mini-application:
- Contains **30+ inline handler functions** (not delegated to controllers)
- Has **~300 lines of duplicated** Soroban SAC transfer code (sponsor investor vs sponsor company)
- Imports business services directly instead of routing to controllers
- Mixes concerns: auth login, CRUD, blockchain ops, metrics, collateral distribution, Soroban dashboard

**Recommendation:** Refactor into sub-routes or delegate to existing controllers.

### 3. Auth Method Diversity
Five different auth methods coexist:
1. **Passkey (discoverable)** — investor + company login (authRoutes)
2. **Freighter (SEP-10)** — admin login (platformAdminRoutes)
3. **WebAuthn (credential-specific)** — generic 3-type auth (webauthnRoutes)
4. **Admin passkey** — separate flow in platformAdminRoutes
5. **Email OTP** — investor/company registration

### 4. Swagger Coverage
~70% of endpoints have Swagger docs. Notable gaps:
- `adminTransactionRoutes.js` — partial coverage
- `companyPaymentRoutes.js` — no swagger annotations
- `securityRoutes.js` — full swagger coverage

### 5. Validation Patterns
Two patterns used:
- **express-validator** chains in route definitions (majority)
- **Manual validation** in inline handlers (platformAdminRoutes)

### 6. Rate Limiting
Only `walletRoutes.js:submit-tx` uses `strictLimiter` middleware. All other endpoints rely on global rate limiting (if configured in app.js).

---

## Key Issues Found

| Issue | Severity | Location |
|-------|----------|----------|
| `platformAdminRoutes.js` = 1877L mega-file with inline handlers | 🟡 Tech debt | platformAdminRoutes.js |
| Duplicated SAC sponsor code (~300L) | 🟡 Tech debt | platformAdminRoutes.js L1055-1207 vs L1403-1555 |
| `wallet-status` and `passkey/config` endpoints exist in 4 different route files | 🟡 Redundancy | investor, company, companyUser, auth, security |
| `debug/:id/approve` has NODE_ENV guard (✅ fixed since controllers read) | 🟢 OK | companyRoutes.js L175 |
| `stats` route position conflicts with `/:id` param route | 🟠 Potential bug | adminTransactionRoutes.js (GET `/stats` registered AFTER `/:id`) |
| `log` variable re-declared in platformAdminRoutes (L1559-1560) | 🔴 Will crash | platformAdminRoutes.js |
| In-memory challenge stores in platformAdminRoutes AND webauthnController | 🟡 Scale issue | Both files |
| Validator placed AFTER authenticateToken in `/purchase` | 🟡 Wrong order | investmentRoutes.js L72 |
