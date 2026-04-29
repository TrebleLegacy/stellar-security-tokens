# Frontend Layer — Full Deep Read

> **React + TypeScript + Vite** | Read date: 2026-03-10
> Files: 13 API + 7 lib + 2 types + 15 hooks + 37 pages + 21 components + 3 layouts + 3 root = **~101 files**

---

## Architecture Summary

```
main.tsx → App.tsx → BrowserRouter
  ├── /login, /register, /company/register    (public auth pages)
  ├── / (DashboardLayout)                     (investor portal, 6 pages)
  ├── /company (CompanyLayout)                (company portal, 13 pages)
  └── /admin (AdminLayout)                    (admin portal, 13 pages)
```

### Data Flow
```
Pages → Hooks (useOffer, usePasskey, ...) → API modules (offersApi, ...) → client.ts (Axios) → Backend REST
                                                                          ↕
                                                                    lib/api.ts (fetch) ← used by passkey.ts only
```

---

## Core Infrastructure

### API Client (`api/client.ts` — Axios)
- Base URL: `VITE_API_URL` or `http://localhost:3000/api`
- Auto-attaches JWT via request interceptor
- **Silent 401 refresh**: subscriber pattern for parallel requests hitting 401
- FormData detection: auto-removes Content-Type header for file uploads
- Redirect: `/admin/*` → `/admin/login`, else → `/login`

### API Client (`lib/api.ts` — fetch)
- ⚠️ **Duplicate client** — fetch-based, used only by `lib/passkey.ts`
- Same refresh logic, same redirect behavior
- Class-based (`ApiClient` with get/post/put/delete)

### Authentication Libraries
| Library | File | Used By | Purpose |
|---------|------|---------|---------|
| SmartAccountKit | `lib/passkey.ts` | Investor + Company | Discoverable login, wallet deploy, TX signing |
| Freighter API | `lib/freighter.ts` (209L) | Admin | Browser extension wallet, SEP-10 challenge signing |
| Ledger WebUSB | `lib/ledger.ts` (277L) | Admin (recovery) | Hardware wallet TX signing via BIP44 |
| ~~Pusher~~ | ~~`lib/pusher.ts`~~ | — | **DELETED** (commit 7aad8c3) — WebSocket plan abandoned; `pusher-js` dep also removed |
| Sentry | `lib/sentry.ts` (159L) | All | Error monitoring, PII scrubbing, production-only |

---

## API Modules (9 modules + 1 client = 10 files in `api/`)

All modules export typed object literals wrapping Axios calls.

| Module | Methods | Key Operations |
|--------|---------|----------------|
| ~~`auth.ts`~~ | — | **DELETED** (commit 696f300) — Legacy email/password login, removed with passkey migration |
| `investors.ts` | 8 | CRUD, portfolio, deposits, KYC status |
| `companies.ts` | 10 | CRUD, profile, wallet status, offers |
| `offers.ts` | 16 | Full lifecycle: create (FormData), review, issue, activate, unlock token for DEX |
| `investments.ts` | 10 | Purchase, status, metrics, statistics, pending |
| `tokens.ts` | 7 | List, detail, freeze, unfreeze, clawback, disable-clawback, sync |
| `platformAdmins.ts` | 18 | Freighter auth, admin CRUD, investor mgmt, sponsor wallet, analytics (6 endpoints) |
| `wallets.ts` | 3 | System wallet statuses, TX proposals, submit signed TX |
| ~~`companyUsers.ts`~~ | — | **DELETED** (commit 7aad8c3) — Password-based registration removed |
| `companyPayments.ts` | 9+ | Upcoming, yield-status, prepare XDR, submit (polymorphic: single/batch), history, penalties, prepare-deposit, submit-deposit, settlement-status |
| `notifications.ts` | 3 | List, mark read, mark all read |
| `adminDefaults.ts` | 4 | List defaulted offers, details, prepare distribution, distribute collateral |

---

## Type System (`types/index.ts` — 217L)

12 domain interfaces: `Investor`, `Company`, `CompanyUser`, `PlatformAdmin`, `Offer`, `Token`, `Investment`, `TokenDistribution`, `InterestPayment`, `ApiResponse<T>`, `LoginResponse`, plus form types (`RegisterInvestorForm`, `RegisterCompanyForm`, `CreateOfferForm`, `InvestmentForm`).

> ⚠️ **Issue**: Types use `snake_case` (DB field names) but some backend responses send `camelCase`. Partial mismatch exists.

---

## Hooks (13 files)

| Hook | Purpose |
|------|---------|
| `usePasskey` | Init SmartAccountKit, discoverable login, register wallet |
| ~~`usePasskeys`~~ | **DELETED** — passkey management merged into `securityRoutes` page logic |
| `useFreighter` | Connect Freighter, sign transactions |
| `useLedger` | Connect Ledger, sign transactions |
| `useInvestment` | Purchase flow orchestration |
| `useInvestmentFees` | Fee schedule fetching |
| `useOffer` | Single offer data + actions |
| `useOffers` | Offer list with filtering |
| ~~`usePortfolio`~~ | **DELETED** (commit 7aad8c3) — replaced by direct API calls in Portfolio page |
| `useWalletBalance` | Wallet balance polling |
| `useCompany` | Company profile + state |
| `useApprovalQueue` | Admin approval workflow state |
| `useAuthRefresh` | Auto-refresh JWT on mount |
| `usePendingInvestments` | Admin pending investments |
| ~~`useRecoverySigners`~~ | **DELETED** — recovery signer management moved inline |
| `useAdminNavigation` ⭐ | Admin tab navigation state (not previously documented) |

---

## Pages Inventory (37 pages)

### Auth (5 pages)
| Page | Route | Purpose |
|------|-------|---------|
| `Login` | `/login` | Discoverable passkey login |
| `Register` | `/register` | Email-first investor registration |
| `CompanyRegister` | `/company/register` | Email-first company registration |
| `CompanyPendingApproval` | `/company/pending-approval` | Company waiting screen |
| `RegistrationSuccess` | `/registration-success` | Post-registration confirmation |

### Investor Portal (6 pages)
| Page | Route | Purpose |
|------|-------|---------|
| `Marketplace` | `/market` | Browse active offers |
| `OfferDetails` | `/market/:id` | Offer detail + invest dialog |
| `Portfolio` | `/portfolio` | Holdings + investment history |
| `Transactions` | `/transactions` | Transaction history |
| `Wallet` | `/wallet` | USDC balance, deposit, withdraw |
| `Settings` | `/settings` | Profile + passkey management |

### Company Portal (13 pages)
| Page | Route | Purpose |
|------|-------|---------|
| `Dashboard` | `/company/dashboard` | Company overview |
| `Offers` | `/company/offers` | Offer list |
| `SelectOfferType` | `/company/offers/new` | Collateral (Debt) vs Sale (Equity) selection |
| `CreateOffer` | `/company/offers/create` | Multi-step form (conditional fields for Debt vs Equity) |
| `OfferDetails` | `/company/offers/:id` | Offer detail + cap table |
| `Tokens` | `/company/tokens` | Token lifecycle tracking |
| `PayInvestors` | `/company/payments/:offerId` | Dividend / Interest / Bullet payment flow |
| `PaymentHistory` | `/company/payment-history` | ⭐ Payment history log (added post-Mar 2026, previously undocumented) |
| `Wallet` | `/company/wallet` | Company wallet management |
| `Documents` | `/company/documents` | Legal document management |
| `Reports` | `/company/reports` | Financial reports |
| `Settings` | `/company/settings` | Company profile settings |
| `IPFSInfo` | `/company/ipfs-info` | IPFS document hashes |

### Admin Portal (13 pages)
| Page | Route | Purpose |
|------|-------|---------|
| `Login` | `/admin/login` | Freighter/Passkey admin login |
| `Dashboard` | `/admin/dashboard` | Platform overview + metrics |
| `Approvals` | `/admin/approvals` | Multisig TX queue |
| `UserManagement` | `/admin/users` | Investor KYC approval |
| `Companies` | `/admin/companies` | Company management |
| `AdminOffers` | `/admin/offers` | Cross-company offer review |
| `Contracts` | `/admin/contracts` | Soroban sale contract admin |
| `TokensPage` | `/admin/tokens` | Token lifecycle admin |
| `AssetCompliance` | `/admin/compliance` | Freeze, clawback, compliance ops |
| `EmergencyControls` | `/admin/emergency` | Emergency freeze/pause |
| `Wallets` | `/admin/wallets` | System wallet management |
| `FeeConfig` | `/admin/fees` | Fee configuration |
| `DefaultCases` | `/admin/defaults` | Defaulted offer management |

---

## Components (21)

| Component | Purpose |
|-----------|---------|
| `MobileSidebar` | Responsive mobile navigation |
| `NotificationBell` | Real-time notification indicator |
| ~~`FreighterConnect`~~ | **DELETED** (commit 7aad8c3) — unused wrapper; admin pages use `useFreighter` hook directly |
| `LedgerConnect` | Ledger hardware wallet pairing |
| `TokenManagementModal` | Token lifecycle action modal |
| `InvestmentDialog` | Soroban investment purchase flow |
| `InfoTooltip`, `TransactionLink` | Utility components (`components/ui/`) |
| `badge`, `button`, `card`, `dialog`, `input`, `label`, `table`, `tabs` | shadcn/ui primitives (`components/ui/`) |
| ~~`dropdown-menu`~~ | **DELETED** (commit 7aad8c3) — scaffolded, never used; dep `@radix-ui/react-dropdown-menu` also removed |
| `offer-card` | Marketplace offer display |
| `qrcode` | QR code for deposit address |
| `DepositDialog`, `DepositTracker` | USDC deposit flow (`components/wallet/`) |
| `RelatedEntities` | Admin related entities panel (`components/admin/`) |

---

## Key Issues Found

| Issue | Severity | Location |
|-------|----------|----------|
| **Duplicate API client**: Axios (`api/client.ts`) + fetch (`lib/api.ts`) | 🟡 Tech debt | Both files |
| ~~`auth.ts` API module~~ | — | **DELETED** (commit 696f300) |
| Type mismatch: `snake_case` types vs `camelCase` backend responses | 🟡 Bug source | `types/index.ts` |
| `RegisterInvestorForm` includes `password` field — legacy from pre-passkey | 🟡 Dead code | `types/index.ts` |
| No global state management (no Redux, Zustand, etc.) — all state in hooks | 🟢 Acceptable for scope | Architecture |
| ~~Pusher requires separate configuration~~ | — | **DELETED** (commit 7aad8c3) |

---

## App + Index Summary

### `app.js` (239L) — Express Application Setup
- Helmet CSP, multi-origin CORS, SEP-1 `stellar.toml` before restrictive CORS
- 4-tier rate limiting: `authLimiter` (5/min), `apiLimiter` (30/min), `strictLimiter` (10/min), `globalLimiter` (100/min)
- Health probe (`/health`) + readiness probe (`/ready` — checks DB + Redis)
- Response sanitizer strips error details in production
- Swagger UI at `/api-docs`

### `index.js` (≈330L) — Startup Orchestration
- Auto-verify issuer account flags (skip in multisig mode)
- **5 cron jobs**:
  1. Payment reminder scheduler (PaymentReminderService)
  2. Overdue payment checker — 00:30 UTC daily
  3. MultiSig expiry checker — midnight UTC daily
  4. Database backup — 3:00 AM UTC daily
  5. Soroban TTL maintenance (MaintenanceService.init)
- **Conditional services** (ENABLE_SOROBAN_SALE=true):
  - SorobanEventIndexer (30s interval)
  - SorobanReconciler (5min interval)
  - YieldPaymentReconciler (5min interval) ⭐ *added Apr 2026*
  - SorobanMetrics (10min flush to DB)
- **Always-on service** (regardless of ENABLE_SOROBAN_SALE):
  - WalletMonitorService (5min interval) ⭐ *added Apr 2026*
- Graceful shutdown (SIGTERM/SIGINT): stops PaymentMonitor + WalletMonitorService + all Soroban services
