---
tags: [backend, index]
status: verified
last_verified: 2026-02-05
---

# Backend Documentation

> **Path**: `backend/` | **Runtime**: Node.js ≥18 | **Framework**: Express 4.18

---

## Directory Structure

```
backend/
├── src/
│   ├── index.js          # Entry point, server startup
│   ├── app.js            # Express app configuration
│   ├── config/           # Configuration files (6)
│   ├── controllers/      # API handlers (13)
│   ├── routes/           # Route definitions (15)
│   ├── services/         # Business logic (25)
│   ├── middleware/       # Middleware functions (6)
│   ├── models/           # Data models (7)
│   └── database/         # Database utilities (5)
├── prisma/
│   ├── schema.prisma     # Database schema (697 lines, 24 models)
│   └── migrations/       # Migration history
├── scripts/              # Utility scripts (18)
└── tests/                # Test suite (68 files)
```

---

## Core Files

### Entry Points

| File | Purpose |
|------|---------|
| [[backend/index.js]] | Server startup, port binding, graceful shutdown |
| [[backend/app.js]] | Express app config, middleware stack, route mounting |

---

## Layers

### [[backend/services/_INDEX|Services]] (25 files)
Core business logic. Each service encapsulates a domain:

| Service | Purpose |
|---------|---------|
| [[stellar.service]] | Stellar blockchain operations (74KB) |
| [[payment.service]] | Payment processing (61KB) |
| [[email.service]] | Email templates & sending (55KB) |
| [[passkeyWallet.service]] | Smart wallet deployment (52KB) |
| [[companyPayment.service]] | Company payment processing (29KB) |
| [[multiSigTransaction.service]] | Multi-signature orchestration |
| [[distributionQueue.service]] | Token distribution queue |
| [[paymentMonitor.service]] | Real-time payment detection |
| [[offer.service]] | Offer management |
| [[depositRelay.service]] | USDC deposit forwarding |

### [[backend/controllers/_INDEX|Controllers]] (13 files)
API request handlers:

| Controller | Purpose |
|------------|---------|
| [[offerController]] | Offer CRUD (33KB) |
| [[investorController]] | Investor operations (27KB) |
| [[companyController]] | Company management (24KB) |
| [[companyUserController]] | Company user CRUD (20KB) |
| [[investmentController]] | Investment processing (17KB) |
| [[walletController]] | Wallet operations (17KB) |
| [[platformAdminController]] | Admin functions (16KB) |
| [[webauthnController]] | Passkey auth (12KB) |
| [[tokenController]] | Token management (12KB) |

### [[backend/routes/_INDEX|Routes]] (15 files)
Route definitions with middleware:

| Route File | Prefix | Purpose |
|------------|--------|---------|
| [[platformAdminRoutes]] | `/api/admin` | Admin dashboard (49KB) |
| [[securityRoutes]] | `/api/security` | Freeze, clawback (16KB) |
| [[investorRoutes]] | `/api/investors` | Investor API (15KB) |
| [[adminTransactionRoutes]] | `/api/admin/transactions` | MultiSig (16KB) |
| [[offerRoutes]] | `/api/offers` | Offer endpoints (14KB) |
| [[authRoutes]] | `/api/auth` | Authentication (12KB) |

### [[backend/middleware/_INDEX|Middleware]] (6 files)

| Middleware | Purpose |
|------------|---------|
| [[auth.js]] | JWT verification + Redis blocklist |
| [[rateLimit.js]] | Multi-tier rate limiting |
| [[companyAuth.js]] | Company authorization |
| [[investorAuth.js]] | Investor authorization |
| [[platformAdminAuth.js]] | Admin authorization |
| [[validators.js]] | Request validation |

### [[backend/config/_INDEX|Config]] (6 files)

| Config | Purpose |
|--------|---------|
| [[stellar.js]] | Stellar SDK setup, account keypairs |
| [[redis.js]] | Redis client, token blocklist |
| [[prisma.js]] | Database client singleton |
| [[bull.js]] | Job queue configuration |
| [[pusher.js]] | Real-time notifications |
| [[env.js]] | Environment validation |

---

## Database

### Schema Overview

**[[backend/database/schema|Prisma Schema]]** — 24 models:

| Category | Models |
|----------|--------|
| **Users** | `Investor`, `Company`, `CompanyUser`, `PlatformAdmin` |
| **Tokens** | `Token`, `Offer`, `TokenDistribution`, `Investment` |
| **Payments** | `InterestPayment`, `Deposit`, `PaymentReminder`, `CompanyPenalty` |
| **Auth** | `*WebauthnCredential` (3), `*Ed25519Signer` (2) |
| **System** | `SystemConfig`, `FeeLog`, `Notification`, `MultiSigTransaction` |

### Key Enums

- `KYCStatus`: pending, approved, rejected
- `OfferStatus`: pending_review → under_review → approved → active → closed
- `InvestmentStatus`: pending_payment → payment_received → distributed
- `DepositStatus`: pending → received → forwarding → completed

---

## Scripts

### [[backend/scripts/_INDEX|Backend Scripts]] (18 files)

| Script | Purpose |
|--------|---------|
| `setup-multisig.js` | Configure multisig signers |
| `inspect-accounts.js` | View Stellar account details |
| `setup-test-accounts.js` | Create test users |
| `clean-test-data.js` | Remove test data |
| `fundWallet.js` | Fund testnet wallets |

---

## Related

- [[overview/architecture]] — System architecture
- [[backend/services/_INDEX]] — All services
- [[backend/controllers/_INDEX]] — All controllers
- [[frontend/_INDEX]] — Frontend structure
