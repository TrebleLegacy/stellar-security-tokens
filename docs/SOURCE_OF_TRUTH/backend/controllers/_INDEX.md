---
tags: [backend, controllers, index]
status: verified
last_verified: 2026-02-05
---

# Backend Controllers

> **Path**: `backend/src/controllers/` | **Count**: 13 files

Controllers handle HTTP request/response. They validate input, call services, and format output.

---

## Controller Overview

| Controller | Size | Lines | Purpose |
|------------|------|-------|---------|
| [[offerController]] | 34KB | ~1100 | Offer CRUD & lifecycle |
| [[investorController]] | 27KB | ~850 | Investor operations |
| [[companyController]] | 24KB | ~750 | Company management |
| [[companyUserController]] | 20KB | ~600 | Company user CRUD |
| [[investmentController]] | 17KB | ~500 | Investment processing |
| [[walletController]] | 17KB | ~500 | Wallet operations |
| [[platformAdminController]] | 16KB | ~500 | Admin dashboard |
| [[webauthnController]] | 12KB | ~350 | Passkey authentication |
| [[tokenController]] | 12KB | ~350 | Token management |
| [[paymentController]] | 7KB | ~200 | Payment endpoints |
| [[notificationController]] | 3KB | ~80 | Notification CRUD |
| [[treasuryController]] | 3KB | ~80 | Treasury operations |
| [[investmentMetricsController]] | 4KB | ~100 | Analytics |

---

## Core Controllers (Detailed)

### [[offerController]] ⭐
> **Offer lifecycle management (1098 lines, 19 functions)**

| Function | Route | Purpose |
|----------|-------|---------|
| `createOffer` | POST `/companies/offers` | Create new offer |
| `getCompanyOffers` | GET `/companies/offers` | List company's offers |
| `getOfferDetails` | GET `/companies/offers/:id` | Get offer details |
| `updateOffer` | PUT `/companies/offers/:id` | Update pending offer |
| `getOfferInvestors` | GET `/companies/offers/:id/investors` | Cap table |
| `getActiveOffers` | GET `/offers/active` | Public marketplace |
| `getPublicOfferDetails` | GET `/offers/:id` | Public offer view |
| `getAllOffers` | GET `/admin/offers` | Admin: all offers |
| `reviewOffer` | PUT `/admin/offers/:id/review` | Admin: approve/reject |
| `issueTokenFromOffer` | POST `/admin/offers/:id/issue` | Admin: mint tokens |
| `activateOffer` | POST `/admin/offers/:id/activate` | Admin: go live |
| `verifyOfferIssuance` | POST `/admin/offers/:id/verify` | Admin: verify mint |

---

### [[investorController]]
> **Investor operations**

| Function | Route | Purpose |
|----------|-------|---------|
| `register` | POST `/investors/register` | New investor |
| `getProfile` | GET `/investors/profile` | Get profile |
| `updateProfile` | PUT `/investors/profile` | Update profile |
| `getPortfolio` | GET `/investors/portfolio` | Token holdings |
| `getKYCStatus` | GET `/investors/kyc/status` | KYC status |
| `submitKYC` | POST `/investors/kyc` | Submit KYC |

---

### [[walletController]]
> **Wallet and balance operations**

| Function | Route | Purpose |
|----------|-------|---------|
| `getWalletStatus` | GET `/wallet/status` | Wallet info |
| `getBalances` | GET `/wallet/balances` | All balances |
| `initiateWithdrawal` | POST `/wallet/withdraw` | Start withdrawal |
| `getDepositAddress` | GET `/wallet/deposit` | Get deposit memo |

---

### [[platformAdminController]]
> **Admin dashboard functions**

| Function | Route | Purpose |
|----------|-------|---------|
| `getDashboard` | GET `/admin/dashboard` | Dashboard stats |
| `getSystemStats` | GET `/admin/stats` | System metrics |
| `getInvestors` | GET `/admin/investors` | All investors |
| `approveKYC` | PUT `/admin/investors/:id/kyc` | KYC approval |
| `getCompanies` | GET `/admin/companies` | All companies |
| `approveCompany` | PUT `/admin/companies/:id/approve` | Company approval |

---

### [[webauthnController]]
> **Passkey authentication**

| Function | Route | Purpose |
|----------|-------|---------|
| `startRegistration` | POST `/webauthn/:type/register/start` | Get challenge |
| `completeRegistration` | POST `/webauthn/:type/register/complete` | Verify & save |
| `startLogin` | POST `/webauthn/:type/login/start` | Get login challenge |
| `completeLogin` | POST `/webauthn/:type/login/complete` | Verify & JWT |

---

## Related

- [[backend/routes/_INDEX]] — Route definitions
- [[backend/services/_INDEX]] — Business logic
- [[backend/middleware/_INDEX]] — Middleware
