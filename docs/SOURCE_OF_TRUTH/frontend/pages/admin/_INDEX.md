---
tags: [frontend, pages, admin, index]
status: verified
last_verified: 2026-02-05
---

# Admin Dashboard Pages

> **Path**: `frontend/src/pages/admin/` | **Count**: 14 pages

Admin dashboard for platform operators. Access requires platform_admin role with Email OTP + Passkey.

---

## Dashboard & Overview

| Page | Size | Purpose |
|------|------|---------|
| [[Dashboard.tsx]] | 24KB | Main admin dashboard with stats |
| [[Login.tsx]] | 13KB | Admin login with OTP flow |
| [[Settings.tsx]] | 8KB | Admin settings |

---

## User Management

| Page | Size | Purpose |
|------|------|---------|
| [[UserManagement.tsx]] | 32KB | All platform users (investors, companies) |
| [[Companies.tsx]] | 32KB | Company registration review |
| [[Wallets.tsx]] | 27KB | All smart wallets with balances |

---

## Offer & Token Management

| Page | Size | Purpose |
|------|------|---------|
| [[AdminOffers.tsx]] | 36KB | Offer review, approval, token issuance |
| [[TokensPage.tsx]] | 16KB | All issued tokens |
| [[FeeConfig.tsx]] | 10KB | Platform fee configuration |

---

## Compliance & Security

| Page | Size | Purpose |
|------|------|---------|
| [[AssetCompliance.tsx]] | 30KB | Token compliance flags |
| [[EmergencyControls.tsx]] | 30KB | Freeze, unfreeze, clawback |
| [[DefaultCases.tsx]] | 14KB | Default tracking & penalties |

---

## Operations

| Page | Size | Purpose |
|------|------|---------|
| [[Treasury.tsx]] | 20KB | Treasury balances, withdrawals |
| [[PendingTransactions.tsx]] | 24KB | MultiSig transaction queue |

---

## Key Page Details

### [[AdminOffers.tsx]] ⭐
> **Offer lifecycle management**

Functions:
- View all offers with status filters
- Review and approve/reject offers
- Issue tokens (calls `POST /api/admin/offers/:id/issue`)
- Verify issuance
- Activate offers

### [[EmergencyControls.tsx]] ⭐
> **Compliance actions**

Functions:
- Freeze investor account
- Unfreeze investor account
- Clawback tokens (regulatory compliance)
- View action history

### [[PendingTransactions.tsx]]
> **MultiSig queue**

- View pending transactions requiring signatures
- Sign with Ledger or Freighter
- Track signature progress
- View transaction details

---

## Related

- [[frontend/_INDEX]] — Frontend overview
- [[backend/routes/platformAdminRoutes]] — Admin API
- [[flows/kyc_approval]] — KYC approval flow
