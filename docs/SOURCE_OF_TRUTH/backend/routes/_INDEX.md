---
tags: [backend, routes, index]
status: verified
last_verified: 2026-02-05
---

# Backend Routes

> **Path**: `backend/src/routes/` | **Count**: 15 files

Routes define API endpoints, apply middleware, and map to controllers.

---

## Route Overview

| Route File | Prefix | Size | Purpose |
|------------|--------|------|---------|
| [[platformAdminRoutes]] | `/api/admin` | 49KB | Admin dashboard |
| [[securityRoutes]] | `/api/security` | 16KB | Freeze, clawback |
| [[adminTransactionRoutes]] | `/api/admin/transactions` | 16KB | MultiSig queue |
| [[investorRoutes]] | `/api/investors` | 15KB | Investor API |
| [[offerRoutes]] | `/api/offers` | 14KB | Offers (public + company) |
| [[authRoutes]] | `/api/auth` | 12KB | Authentication |
| [[companyRoutes]] | `/api/companies` | 12KB | Company management |
| [[companyUserRoutes]] | `/api/company-users` | 10KB | Company user CRUD |
| [[walletRoutes]] | `/api/wallet` | 9KB | Wallet operations |
| [[tokenRoutes]] | `/api/tokens` | 7KB | Token management |
| [[companyPaymentRoutes]] | `/api/company-payments` | 7KB | Company payments |
| [[paymentRoutes]] | `/api/payments` | 6KB | Payment endpoints |
| [[webauthnRoutes]] | `/api/webauthn` | 6KB | Passkey auth |
| [[investmentRoutes]] | `/api/investments` | 3KB | Investments |
| [[notificationRoutes]] | `/api/notifications` | 1KB | Notifications |

---

## Route Groups

### Authentication (`/api/auth`, `/api/webauthn`)

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/auth/logout` | POST | JWT | Logout (blocklist token) |
| `/webauthn/:type/register/start` | POST | — | Get registration challenge |
| `/webauthn/:type/register/complete` | POST | — | Complete registration |
| `/webauthn/:type/login/start` | POST | — | Get login challenge |
| `/webauthn/:type/login/complete` | POST | — | Complete login, get JWT |

---

### Investor Routes (`/api/investors`)

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/investors/register` | POST | — | New investor (+ wallet) |
| `/investors/profile` | GET | Investor | Get profile |
| `/investors/portfolio` | GET | Investor | Token holdings |
| `/investors/kyc` | POST | Investor | Submit KYC |
| `/investors/investments` | GET | Investor | Investment history |

---

### Company Routes (`/api/companies`)

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/companies/register` | POST | — | New company |
| `/companies/offers` | GET/POST | Company | Manage offers |
| `/companies/offers/:id` | GET/PUT | Company | Offer details |
| `/companies/offers/:id/investors` | GET | Company | Cap table |
| `/companies/tokens` | GET | Company | Issued tokens |

---

### Admin Routes (`/api/admin`)

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/admin/dashboard` | GET | Admin | Dashboard stats |
| `/admin/offers` | GET | Admin | All offers |
| `/admin/offers/:id/review` | PUT | Admin | Approve/reject |
| `/admin/offers/:id/issue` | POST | Admin | Mint tokens |
| `/admin/investors` | GET | Admin | All investors |
| `/admin/investors/:id/kyc` | PUT | Admin | KYC decision |
| `/admin/companies` | GET | Admin | All companies |
| `/admin/wallets` | GET | Admin | All wallets |
| `/admin/deposits` | GET | Admin | Deposit monitoring |

---

### Security Routes (`/api/security`)

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/security/freeze` | POST | Admin | Freeze account |
| `/security/unfreeze` | POST | Admin | Unfreeze account |
| `/security/clawback` | POST | Admin | Clawback tokens |

---

### Wallet Routes (`/api/wallet`)

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/wallet/status` | GET | User | Wallet status |
| `/wallet/balances` | GET | User | All balances |
| `/wallet/deposit` | GET | User | Get deposit memo |
| `/wallet/withdraw` | POST | User | Initiate withdrawal |

---

## Middleware Applied

Each route file applies appropriate middleware:

```javascript
// Example: investorRoutes.js
router.use(authenticateToken);      // JWT verification
router.use(requireInvestor);        // Role check
router.use(requireVerification);    // Email verified
```

---

## Related

- [[backend/controllers/_INDEX]] — Controllers
- [[backend/middleware/_INDEX]] — Middleware
- [[backend/_INDEX]] — Backend overview
