# Compliance & Governance

Digital assets are regulated. This document explains how we ensure safety and legal compliance.

## Know Your Customer (KYC)

Every user (Investor or Issuer) must be verified before they can touch the blockchain.

### 1. Onboarding
- User signs up with email.
- **KYC Check**: They submit ID documents (Passport, Driver's License).
- **Status**: Account starts as `pending`.
- **Approval**: An Admin reviews the documents and marks the account `approved`.

### 2. Whitelisting (Access Control)
Even with a wallet, a user cannot buy a Security Token unless they are "Authorized".
- We check if the user is `approved`.
- In advanced setups, we can enforce "Accredited Investor" checks for specific high-risk assets.

## Admin Governance

Platform Admins have special powers to maintain order:
- **Fee Management**: Setting global rates (see monetization).
- **Asset Approval**: Only Admins can approve a new token for the marketplace.
- **Emergency Action**: Admins can intervene if there is technical failure or fraud (e.g., freezing a bad actor's wallet).

---

> **See also:** [AUTHENTICATION.md](AUTHENTICATION.md) for auth flows · [MONETIZATION.md](MONETIZATION.md) for fee management · [TOKENIZATION.md](TOKENIZATION.md) for asset lifecycle
