---
tags: [frontend, index]
status: verified
last_verified: 2026-02-05
---

# Frontend Documentation

> **Path**: `frontend/` | **Framework**: React 19 + Vite 7 + TypeScript

---

## Directory Structure

```
frontend/src/
├── pages/                 # Page components (33 total)
│   ├── admin/            # Admin dashboard (14 pages)
│   ├── company/          # Company dashboard (12 pages)
│   └── investor/         # Investor dashboard (7 pages)
├── components/           # Shared components
│   ├── ui/               # Base UI components (13)
│   ├── admin/            # Admin-specific (3)
│   ├── invest/           # Investment (1)
│   └── wallet/           # Wallet (1)
├── hooks/                # Custom hooks (10)
├── api/                  # API client (15 files)
├── lib/                  # Utility libraries (7)
├── layouts/              # Layout components (3)
└── routes/               # Route definitions
```

---

## Page Overview

### [[frontend/pages/admin/_INDEX|Admin Pages]] (14 pages)

| Page | Size | Purpose |
|------|------|---------|
| [[AdminOffers]] | 36KB | Offer review & approval |
| [[Companies]] | 32KB | Company management |
| [[UserManagement]] | 32KB | All users (investors + companies) |
| [[AssetCompliance]] | 30KB | Security flags & controls |
| [[EmergencyControls]] | 30KB | Freeze, clawback actions |
| [[Wallets]] | 27KB | All smart wallets |
| [[Dashboard]] | 24KB | Admin overview stats |
| [[PendingTransactions]] | 24KB | MultiSig queue |
| [[Treasury]] | 20KB | Treasury balances |
| [[TokensPage]] | 16KB | All tokens |
| [[DefaultCases]] | 14KB | Default tracking |
| [[Login]] | 13KB | Admin login (OTP) |
| [[FeeConfig]] | 10KB | Platform fees |
| [[Settings]] | 8KB | Admin settings |

---

### [[frontend/pages/company/_INDEX|Company Pages]] (12 pages)

| Page | Size | Purpose |
|------|------|---------|
| [[CreateOffer]] | 62KB | Offer creation wizard |
| [[Wallet]] | 32KB | Company wallet |
| [[OfferDetails]] | 30KB | Single offer view |
| [[Dashboard]] | 26KB | Company overview |
| [[Settings]] | 19KB | Company settings |
| [[PayInvestors]] | 16KB | Dividend payments |
| [[IPFSInfo]] | 14KB | IPFS document info |
| [[Offers]] | 14KB | Offer listing |
| [[Documents]] | 13KB | Legal documents |
| [[SelectOfferType]] | 12KB | Offer type selection |
| [[Reports]] | 11KB | Company reports |
| [[Tokens]] | 8KB | Token management |

---

### [[frontend/pages/investor/_INDEX|Investor Pages]] (7 pages)

| Page | Size | Purpose |
|------|------|---------|
| [[Wallet]] | 36KB | Investor wallet |
| [[Portfolio]] | 17KB | Token holdings |
| [[Settings]] | 15KB | Profile/KYC settings |
| [[Dashboard]] | 9KB | Investor overview |
| [[OfferDetails]] | 8KB | Investment details |
| [[Transactions]] | 7KB | Transaction history |
| [[Marketplace]] | 3KB | Active offers |

---

## [[frontend/components/_INDEX|Components]]

### UI Components (`/components/ui/`)

| Component | Purpose |
|-----------|---------|
| `button.tsx` | Standard button |
| `dialog.tsx` | Modal dialogs (Radix) |
| `dropdown-menu.tsx` | Dropdown (Radix) |
| `input.tsx` | Form inputs |
| `label.tsx` | Form labels |
| `select.tsx` | Select inputs (Radix) |
| `separator.tsx` | Visual separators |
| `tabs.tsx` | Tab navigation (Radix) |
| `tooltip.tsx` | Tooltips (Radix) |
| `badge.tsx` | Status badges |

### Shared Components

| Component | Purpose |
|-----------|---------|
| `NotificationBell.tsx` | Real-time notifications |
| `MobileSidebar.tsx` | Mobile navigation |

---

## [[frontend/hooks/_INDEX|Custom Hooks]] (10)

| Hook | Purpose |
|------|---------|
| [[usePasskeys]] | Passkey registration/auth (7KB) |
| [[useCompany]] | Company data/actions (6KB) |
| [[usePendingInvestments]] | Investment queue (5KB) |
| [[useFreighter]] | Freighter wallet (4KB) |
| [[useLedger]] | Ledger hardware wallet (3KB) |
| [[useRecoverySigners]] | Recovery key management (3KB) |
| [[usePortfolio]] | Portfolio data (3KB) |
| [[useOffers]] | Offer data (1KB) |
| [[useInvestment]] | Investment actions (1KB) |
| [[usePasskey]] | Single passkey hook (0.4KB) |

---

## [[frontend/api/_INDEX|API Client]]

API modules in `frontend/src/api/`:

| File | Purpose |
|------|---------|
| `client.ts` | Axios instance, interceptors |
| `auth.ts` | Authentication endpoints |
| `investors.ts` | Investor API |
| `companies.ts` | Company API |
| `offers.ts` | Offer API |
| `tokens.ts` | Token API |
| `wallet.ts` | Wallet API |
| `admin.ts` | Admin API |

---

## [[frontend/lib/_INDEX|Libraries]]

| Library | Purpose |
|---------|---------|
| `utils.ts` | `cn()` class merger |
| `stellar.ts` | Stellar SDK helpers |
| `passkey.ts` | Passkey utilities |
| `format.ts` | Number/date formatting |

---

## Layouts

| Layout | Purpose |
|--------|---------|
| `AdminLayout.tsx` | Admin sidebar + header |
| `CompanyLayout.tsx` | Company sidebar + header |
| `InvestorLayout.tsx` | Investor sidebar + header |

---

## Related

- [[overview/tech_stack]] — Frontend dependencies
- [[backend/_INDEX]] — Backend API
- [[flows/investment]] — Investment flow
