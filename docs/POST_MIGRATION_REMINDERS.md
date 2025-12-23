# Post-Migration Reminders & Roadmap

This document tracks items that need to be addressed **after** the initial Mainnet launch and validation.

## 🚨 Pre-Launch Checklist (Critical)

### 📧 Email Infrastructure
- [ ] **Migrate SMTP**: Currently using personal email (`psaragossy@gmail.com`).
- [ ] **Action**: Switch to enterprise provider (Amazon SES, SendGrid, or Postmark) for reliability and domain reputation (`info@tokenizadora.com`).

### 🌐 Frontend & Marketing
- [ ] **Landing Page**: Develop a professional landing page for the main domain.
- [ ] **Redirect**: The current "Functional App" should be a subdomain (e.g., `app.tokenizadora.com`).

### 📦 Infrastructure
- [ ] **Pinata / IPFS**: Verify IPFS integration. Currently running in **MOCK MODE** (fake uploads) if credentials are missing.
- [ ] **Pinata Routes**: Check routing and gateway configuration. The "broken links" are due to Mock Mode returning fake Hashes.

## 1. Business Logic & Fees
- [ ] **Fee Recovery**: We are currently sponsoring user account activation (~3 XLM per user). We must implement a "Withdrawal Fee" or "Deposit Fee" premium in the `PaymentService` to recover this cost over time.
- [ ] **Fee Buffer**: Ensure the calculated fee includes a buffer for Stellar network surges (though rare).

## 2. Infrastructure & Monitoring
- [ ] **Treasury Monitoring**: Set up an alert (Cron job or external monitor) to notify admins when the **Treasury Account** balance drops below 100 XLM. If it hits 0, new user signups will fail.
- [ ] **Rate Limiting**: Hardening the `createInvestorAccount` endpoint ensures malicious actors cannot drain the Treasury by creating thousands of accounts. (Currently relies on basic IP rate limiting).

## 3. Features to Build
- [ ] **Fiat On-Ramp**: Build the prompt/flow for users to deposit Fiat (PIX), which allows switching from "Sponsored Activation" to "Deposit-based Activation" in the future if desired.
- [ ] **Smart Contract Verification**: Once deployed, verify the Source Code on Stellar Expert for transparency.

## 4. Housekeeping
- [ ] **Clean `.env`**: After verifying production, remove any lingering `TESTNET` variables from the production environment to prevent confusion.
