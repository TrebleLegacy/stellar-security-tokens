---
tags: [frontend, pages, company, index]
status: verified
last_verified: 2026-02-05
---

# Company Dashboard Pages

> **Path**: `frontend/src/pages/company/` | **Count**: 12 pages

Dashboard for token issuers (companies). Access via Passkey authentication.

---

## Dashboard & Overview

| Page | Size | Purpose |
|------|------|---------|
| [[Dashboard.tsx]] | 26KB | Company overview, alerts, stats |
| [[Settings.tsx]] | 19KB | Company settings & profile |

---

## Offer Management

| Page | Size | Purpose |
|------|------|---------|
| [[CreateOffer.tsx]] | 62KB | Full offer creation wizard |
| [[SelectOfferType.tsx]] | 12KB | Select offer type (equity, debt) |
| [[Offers.tsx]] | 14KB | List all company offers |
| [[OfferDetails.tsx]] | 30KB | Single offer view with actions |

---

## Token & Payments

| Page | Size | Purpose |
|------|------|---------|
| [[Tokens.tsx]] | 8KB | Issued tokens, lock/unlock |
| [[PayInvestors.tsx]] | 16KB | Dividend distribution |
| [[Reports.tsx]] | 11KB | Payment history, reports |

---

## Documents & Wallet

| Page | Size | Purpose |
|------|------|---------|
| [[Wallet.tsx]] | 32KB | Company smart wallet |
| [[Documents.tsx]] | 13KB | Legal documents (IPFS) |
| [[IPFSInfo.tsx]] | 14KB | IPFS integration info |

---

## Key Page Details

### [[CreateOffer.tsx]] ⭐ (62KB)
> **Offer creation wizard**

Multi-step form:
1. Basic info (name, description)
2. Financial terms (yield, maturity)
3. Token details (code, supply)
4. Legal documents (upload to IPFS)
5. Review & submit

### [[PayInvestors.tsx]]
> **Dividend distribution**

Functions:
- View upcoming payments
- Process dividend payments
- View payment history
- Handle matured payments

### [[Wallet.tsx]]
> **Company wallet**

Functions:
- View USDC balance
- View XLM balance (for fees)
- Initiate withdrawals
- View deposit address

---

## Related

- [[frontend/_INDEX]] — Frontend overview
- [[backend/routes/companyRoutes]] — Company API
- [[flows/offer_creation]] — Offer creation flow
