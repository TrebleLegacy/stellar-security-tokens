---
tags: [backend, services, index]
status: verified
last_verified: 2026-02-05
---

# Backend Services

> **Path**: `backend/src/services/` | **Count**: 25 files

Services contain the core business logic of the platform. Each service encapsulates a specific domain.

---

## Service Overview

| Service | Size | Lines | Purpose |
|---------|------|-------|---------|
| [[stellar.service]] | 74KB | ~2000 | Stellar blockchain operations |
| [[payment.service]] | 61KB | ~1750 | Interest/dividend payments |
| [[email.service]] | 55KB | ~1500 | Email templates & sending |
| [[passkeyWallet.service]] | 52KB | ~1500 | Smart wallet deployment |
| [[companyPayment.service]] | 29KB | ~800 | Company payment processing |
| [[multiSigTransaction.service]] | 19KB | ~500 | Multi-signature orchestration |
| [[distributionQueue.service]] | 17KB | ~450 | Token distribution queue |
| [[paymentMonitor.service]] | 17KB | ~450 | Real-time payment detection |
| [[offer.service]] | 15KB | ~400 | Offer management |
| [[paymentReminder.service]] | 15KB | ~400 | Payment due reminders |
| [[collateralDistribution.service]] | 14KB | ~350 | Collateral distribution |
| [[webauthn.service]] | 11KB | ~300 | WebAuthn/Passkey logic |
| [[KeyManager.js]] | 10KB | ~250 | Stellar key management |
| [[investmentMetrics.service]] | 8KB | ~200 | Investment analytics |
| [[stellarToml.service]] | 8KB | ~200 | stellar.toml generation |
| [[depositRelay.service]] | 7KB | ~180 | USDC deposit forwarding |
| [[ipfs.service]] | 5KB | ~120 | IPFS/Pinata integration |
| [[alert.service]] | 4KB | ~100 | System alerts |

| [[notification.service]] | 4KB | ~100 | In-app notifications |
| [[maintenance.service]] | 4KB | ~100 | Maintenance tasks |
| [[toml.service]] | 3KB | ~80 | TOML file handling |
| [[transactionManager.service]] | 3KB | ~80 | Transaction orchestration |
| [[config.service]] | 2KB | ~50 | System configuration |
| [[paymentScheduler.js]] | 2KB | ~50 | Payment cron jobs |

---

## Core Services (Detailed)

### [[stellar.service]] ⭐
> **The heart of blockchain operations**

**Key Functions:**
| Function | Purpose |
|----------|---------|
| `createIssuerAccount()` | Setup issuer with compliance flags |
| `issueSecurityToken()` | Mint new tokens |
| `distributeTokens()` | Send tokens to investors (G... or C...) |
| `deploySACForAsset()` | Deploy Stellar Asset Contract |
| `unlockToken()` | Clear AUTH_REQUIRED for DEX trading |
| `freezeAccount()` | Freeze investor's tokens |
| `unfreezeAccount()` | Unfreeze investor's tokens |
| `clawbackTokens()` | Recover tokens (compliance) |
| `authorizeAllUserTrustlines()` | Whitelist after KYC |
| `getAccountBalances()` | Get wallet balances |
| `listAssetHolders()` | List all token holders |
| `withdrawFromTreasury()` | OpEx withdrawals |
| `getSACContractId()` | Get contract ID for asset |

**Dependencies:**
- [[KeyManager.js]] — Key access
- Stellar SDK — Transaction building

---

### [[payment.service]] ⭐
> **Interest/dividend payment processing**

**Key Functions:**
| Function | Purpose |
|----------|---------|
| `processMonthlyInterestPayments()` | Monthly dividend run |
| `processBulletPayment()` | One-time maturity payment |
| `getInvestorsWithBalances()` | Get holders for distribution |
| `calculateMonthlyInterest()` | Interest calculation |
| `createBatchUSDCPayment()` | Batch USDC payments |
| `recordInterestPayments()` | DB logging |
| `sendConfirmationEmails()` | Payment receipts |
| `getBalanceSource()` | DB vs on-chain balance |
| `getOnChainTokenBalance()` | Query SAC balance |

**Dependencies:**
- [[stellar.service]] — Blockchain ops
- [[email.service]] — Notifications
- Prisma — Database

---

### [[passkeyWallet.service]] ⭐
> **Soroban smart wallet management**

**Key Functions:**
| Function | Purpose |
|----------|---------|
| `deploySmartWallet()` | Deploy via Factory |
| `createSmartWallet()` | Full wallet creation flow |
| `getWalletStatus()` | Check wallet status |
| `getSorobanWalletBalances()` | Query SAC balances |
| `buildWithdrawalTx()` | Build withdrawal XDR |
| `submitWithdrawal()` | Execute withdrawal |
| `signWithTestKey()` | Dev-only signing |
| `submitWithSponsorship()` | Fee bump fallback |

**Dependencies:**
- `passkey-kit` — Smart wallet SDK
- [[stellar.service]] — Soroban RPC

---

### [[paymentMonitor.service]]
> **Real-time payment detection**

**Key Functions:**
| Function | Purpose |
|----------|---------|
| `startMonitoring()` | Start Horizon stream |
| `handlePayment()` | Process detected payment |
| `matchInvestment()` | Match memo to investment |
| `queueDistribution()` | Add to distribution queue |

**Dependencies:**
- [[distributionQueue.service]] — Job queue
- Horizon streaming API

---

### [[distributionQueue.service]]
> **Token distribution job queue**

**Key Functions:**
| Function | Purpose |
|----------|---------|
| `addDistributionJob()` | Queue new distribution |
| `processDistribution()` | Execute distribution |
| `handleFailure()` | Retry logic |

**Dependencies:**
- BullMQ — Job queue
- [[stellar.service]] — Token transfer

---

### [[multiSigTransaction.service]]
> **Multi-signature transaction orchestration**

**Key Functions:**
| Function | Purpose |
|----------|---------|
| `createTransaction()` | Create pending txn |
| `addSignature()` | Add signer's signature |
| `submitTransaction()` | Submit when threshold met |
| `getRequiredSigners()` | List required signers |

**Dependencies:**
- Prisma — `MultiSigTransaction` model
- [[stellar.service]] — Transaction building

---

### [[depositRelay.service]]
> **USDC deposit forwarding (Treasury → Smart Wallet)**

**Key Functions:**
| Function | Purpose |
|----------|---------|
| `createDepositMemo()` | Generate unique memo |
| `relayDeposit()` | Forward USDC via SAC |
| `retryFailedDeposit()` | Manual retry |

**Dependencies:**
- [[paymentMonitor.service]] — Detection
- [[stellar.service]] — SAC transfer

---

## Support Services

### [[email.service]]
> **Email templates and sending (55KB)**

Templates for:
- Registration verification
- KYC status updates
- Investment confirmations
- Payment receipts
- Payment reminders
- Admin alerts

### [[webauthn.service]]
> **WebAuthn/Passkey authentication**

- Challenge generation
- Credential verification
- Counter management

### [[offer.service]]
> **Offer lifecycle management**

- Create/update offers
- Status transitions
- Collateral calculations

### [[companyPayment.service]]
> **Company payment processing**

- Record company payments
- Calculate distributions
- Track payment history

---

## Related

- [[backend/_INDEX]] — Backend overview
- [[backend/controllers/_INDEX]] — Controllers
- [[backend/routes/_INDEX]] — Routes
