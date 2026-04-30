# 09 — Service Internals

> **SOTA Documentation Protocol** — Every method signature, control path, Prisma model, and Soroban call below is verified against source code. No phantom claims.
>
> **Scope:** 31 backend services in `backend/src/services/`.
> **Last verified:** 2026-04-30

---

## Table of Contents

1. [KeyManager](#1-keymanager)
2. [ConfigService](#2-configservice)
3. [TransactionManager](#3-transactionmanager)
4. [AlertService](#4-alertservice)
5. [AlertRouter](#5-alertrouter)
6. [BackupService](#6-backupservice)
7. [TomlService](#7-tomlservice)
8. [SorobanMetrics](#8-sorobanmetrics)
9. [NotificationService](#9-notificationservice)
10. [MaintenanceService](#10-maintenanceservice)
11. [WalletMonitor](#11-walletmonitor)
12. [YieldPaymentReconciler](#12-yieldpaymentreconciler)
13. [IpfsService](#13-ipfsservice)
14. [DepositRelayService](#14-depositrelayservice)
15. [SorobanEventIndexer](#15-sorobaneventindexer)
16. [SorobanReconciler](#16-sorobanreconciler)
17. [WebAuthnService](#17-webauthnservice)
18. [InvestmentMetrics](#18-investmentmetrics)
19. [CollateralDistribution](#19-collateraldistribution)
20. [PaymentMonitor](#20-paymentmonitor)
21. [PaymentReminderService](#21-paymentreminderservice)
22. [PaymentService](#22-paymentservice)
23. [OfferService](#23-offerservice)
24. [YieldDistributorService](#24-yielddistributorservice)
25. [CompanyPaymentService](#25-companypaymentservice)
26. [MultiSigTransactionService](#26-multisigtransactionservice)
27. [PasskeyWalletService](#27-passkeywallet service)
28. [EmailService](#28-emailservice)
29. [StellarService](#29-stellarservice)
30. [SorobanSaleService](#30-sorobansaleservice)
31. [SorobanSettlementService](#31-sorobansettlementservice)

---

## 1. KeyManager

**File:** `KeyManager.js` | **Pattern:** Singleton (`keyManager` export), instantiated once at module load.

### Role
Platform secret-key vault. Reads all keypairs from environment variables and exposes only public-key getters in normal operation. Provides channel-account round-robin pool for concurrent TX sponsorship.

### Private State
| Field | Type | Source |
|---|---|---|
| `#issuer` | `Keypair` | `ISSUER_SECRET_KEY` |
| `#distributor` | `Keypair` | `DISTRIBUTOR_SECRET_KEY` |
| `#treasury` | `Keypair` | `TREASURY_SECRET_KEY` |
| `#operations` | `Keypair` | `OPERATIONS_SECRET_KEY` |
| `#channels[]` | `Keypair[]` | `CHANNEL_1_SECRET_KEY`…`CHANNEL_10_SECRET_KEY` |
| `#channelIndex` | `number` | Round-robin cursor |

### Methods

| Method | Returns | Notes |
|---|---|---|
| `getIssuerPublicKey()` | `string` | G... |
| `getIssuerKeypair()` | `Keypair` | Full secret — used by Settlement service |
| `getDistributorPublicKey()` | `string` | |
| `getTreasuryPublicKey()` | `string` | |
| `getOperationsPublicKey()` | `string` | |
| `getOperationsKeypair()` | `Keypair` | Used for fee-bump sponsorship |
| `getNextChannelKeypair()` | `Keypair` | Round-robin: `#channelIndex = (idx+1) % channels.length`; falls back to ops keypair if pool empty |
| `sign(transaction, role)` | `void` | Adds signature to TX based on `role` ∈ `{ISSUER, DISTRIBUTOR, TREASURY, OPERATIONS}` |

### Dependencies
- `@stellar/stellar-sdk` `Keypair`
- `.env` — all secret keys

---

## 2. ConfigService

**File:** `config.service.js` | **Pattern:** Static class.

### Role
Read-only accessor for platform-level DB configuration stored in the `platformConfig` Prisma model. Caches results in memory.

### Methods

| Method | Prisma | Returns |
|---|---|---|
| `static async get(key)` | `platformConfig.findUnique({ where: { key } })` | `value` string or `null` |
| `static async set(key, value)` | `platformConfig.upsert` | Updated record |
| `static async getAll()` | `platformConfig.findMany()` | `{key, value}[]` |

### Prisma Models
- `platformConfig` — `{ key: String @id, value: String }`

---

## 3. TransactionManager

**File:** `transactionManager.service.js` | **Pattern:** Static class, 88 lines.

### Role
Single entry-point for all on-chain TX submission. Routes between:
1. **Direct signing** — if signing role's secret key is available in env and `MULTISIG_MODE !== 'true'`
2. **MultiSig queue** — creates a `MultiSigTransaction` record for Ledger/Freighter signing

### Methods

```js
static async submit({
  transaction,   // Transaction object OR { xdr, operationType, signingRole, metadata, description }
  xdr,           // Alternative to passing transaction object
  signingRole,   // 'ISSUER' | 'DISTRIBUTOR' | 'TREASURY' | 'OPERATIONS'
  operationType, // e.g. 'token_issue', 'sac_deploy', 'sale_create'
  metadata,      // JSON stored on MultiSigTransaction record
  description,   // Human-readable label
  requiredSigners, // optional override
  thresholdRequired // optional override
}): Promise<{ success, hash, ledger, status, multiSigTransactionId }>
```

**Control Flow:**
1. If `MULTISIG_MODE=true` OR no secret key for role → calls `MultiSigTransactionService.create()`; returns `{ status: 'pending_multisig', multiSigTransactionId }`
2. Otherwise → `keyManager.sign(tx, role)` → `stellarServer.submitTransaction()` → returns `{ success, hash, ledger }`

### Dependencies
- `KeyManager` (signing)
- `MultiSigTransactionService` (queuing)
- `@stellar/stellar-sdk` `TransactionBuilder`

---

## 4. AlertService

**File:** `alert.service.js` | **Pattern:** Static class.

### Role
Structured in-DB alert logging with severity tiers. All writes are fire-and-forget (callers use `.catch(() => {})`).

### Methods

| Method | Severity | Prisma |
|---|---|---|
| `static async info(title, meta)` | `info` | `alert.create` |
| `static async warn(title, meta)` | `warn` | `alert.create` |
| `static async error(title, meta)` | `error` | `alert.create` |
| `static async critical(title, meta)` | `critical` | `alert.create` |
| `static async getRecent(limit)` | — | `alert.findMany({ orderBy: createdAt desc, take: limit })` |

### Prisma Models
- `Alert` — `{ id, title, severity, metadata: Json, createdAt }`

---

## 5. AlertRouter

**File:** `alertRouter.service.js` | **Pattern:** Static class.

### Role
Fan-out alerts to multiple channels: DB (via AlertService) + optional Slack/webhook. Routes by severity.

### Methods

```js
static async send({ title, message, severity, source, metadata })
// → always writes to AlertService
// → if severity >= 'high' && SLACK_WEBHOOK_URL set → HTTP POST to Slack
// → if ALERT_WEBHOOK_URL set → HTTP POST JSON payload

static async sendToSlack(payload)   // internal
static async sendToWebhook(payload) // internal
```

### Dependencies
- `AlertService`
- `node-fetch` / native `fetch` for webhook delivery
- `SLACK_WEBHOOK_URL`, `ALERT_WEBHOOK_URL` env vars

---

## 6. BackupService

**File:** `backup.service.js` | **Pattern:** Static class.

### Role
Scheduled database dump + optional S3/B2 upload for disaster recovery.

### Methods

| Method | Description |
|---|---|
| `static async createBackup()` | Runs `pg_dump` via child process → writes to `./backups/YYYY-MM-DD_HHmmss.sql.gz` |
| `static async uploadToS3(filePath)` | Streams file to S3-compatible bucket using `AWS_*` env vars (optional) |
| `static async listBackups()` | Returns sorted list of local backup files |
| `static async pruneOldBackups(keepDays)` | Deletes backups older than `keepDays` (default 30) |
| `static startScheduled()` | Sets `node-cron` schedule from `BACKUP_CRON` env var (default `0 2 * * *`) |

### Dependencies
- `node-cron`, `child_process.exec`, `@aws-sdk/client-s3` (optional)
- Env: `DATABASE_URL`, `BACKUP_CRON`, `AWS_BUCKET`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`

---

## 7. TomlService

**File:** `toml.service.js` | **Pattern:** Static class.

### Role
Generates the `stellar.toml` file content served at `/.well-known/stellar.toml` for SEP-1 compliance.

### Methods

```js
static async generateToml(): Promise<string>
// Queries: prisma.token.findMany({ where: { offerId: { not: null } } })
// Queries: prisma.offer.findMany({ where: { status: 'active' } })
// Builds TOML string with [DOCUMENTATION], [[CURRENCIES]], [NETWORK]]
// Uses: STELLAR_NETWORK, STELLAR_HOME_DOMAIN, keyManager.getIssuerPublicKey()

static async updateHomeDomain(): Promise<void>
// Calls StellarService.createIssuerAccount() to set home_domain
```

### Prisma Models
- `Token` (assetCode, issuerPublicKey, totalSupply)
- `Offer` (status, offerName)

### Dependencies
- `KeyManager`, `StellarService`, Prisma

---

## 8. SorobanMetrics

**File:** `sorobanMetrics.service.js` | **Pattern:** Static class.

### Role
Polls Soroban RPC for network health metrics — fee stats, ledger sequence, RPC latency. Used by admin dashboard.

### Methods

```js
static async getNetworkMetrics(): Promise<{
  latencyMs: number,
  latestLedger: number,
  baseFee: string,
  feeP50: string,
  feeP99: string,
}>
// → rpc.Server.getFeeStats() + rpc.Server.getLatestLedger()
// → measures wall-clock latency

static async getSorobanRpcHealth(): Promise<{ healthy: boolean, latencyMs: number }>
```

### Dependencies
- `@stellar/stellar-sdk` `rpc.Server`
- `getSorobanRpcUrl()` from config

---

## 9. NotificationService

**File:** `notification.service.js` | **Pattern:** Static class.

### Role
In-app notification creation and retrieval. Persists to DB; real-time delivery via Pusher is handled at the controller layer.

### Methods

| Method | Prisma | Notes |
|---|---|---|
| `static async create({ userId, userType, title, body, type, metadata })` | `notification.create` | `type` ∈ `payment`, `kyc`, `offer`, `system` |
| `static async markRead(id, userId)` | `notification.update({ data: { readAt: now } })` | Scoped to userId |
| `static async markAllRead(userId, userType)` | `notification.updateMany` | |
| `static async getForUser(userId, userType, limit)` | `notification.findMany` | `orderBy: createdAt desc` |
| `static async getUnreadCount(userId, userType)` | `notification.count({ where: { readAt: null } })` | |

### Prisma Models
- `Notification` — `{ id, userId, userType, title, body, type, metadata: Json, readAt, createdAt }`

---

## 10. MaintenanceService

**File:** `maintenance.service.js` | **Pattern:** Static class.

### Role
Platform-wide maintenance mode flag. Checked by a global Express middleware to return 503 responses.

### Methods

```js
static async enable(reason?: string): Promise<void>
// → prisma.platformConfig.upsert({ key: 'maintenance_mode', value: 'true' })
// → prisma.platformConfig.upsert({ key: 'maintenance_reason', value: reason })

static async disable(): Promise<void>
// → prisma.platformConfig.upsert({ key: 'maintenance_mode', value: 'false' })

static async isEnabled(): Promise<boolean>
// → prisma.platformConfig.findUnique({ key: 'maintenance_mode' }) → value === 'true'

static async getReason(): Promise<string | null>
// → prisma.platformConfig.findUnique({ key: 'maintenance_reason' })
```

### Prisma Models
- `platformConfig` (key/value store)

---

## 11. WalletMonitor

**File:** `walletMonitor.service.js` | **Pattern:** Static class with scheduled polling.

### Role
Monitors the **Operations wallet** XLM balance. Fires alerts when balance drops below configurable thresholds.

### Thresholds (env-configurable)
| Env Var | Default | Action |
|---|---|---|
| `OPERATIONS_WALLET_WARN_XLM` | `20` | `AlertService.warn` |
| `OPERATIONS_WALLET_CRITICAL_XLM` | `5` | `AlertService.critical` + `AlertRouter.send(severity:'critical')` |

### Methods

```js
static async checkBalance(): Promise<{ xlm: number, status: 'ok'|'warn'|'critical' }>
// → stellarServer.loadAccount(keyManager.getOperationsPublicKey())
// → finds native balance
// → compares against thresholds → fires alerts

static startMonitoring(intervalMs = 300_000): void
// setInterval → checkBalance() every 5 min

static stopMonitoring(): void
```

### Dependencies
- `KeyManager`, `AlertService`, `AlertRouter`
- Horizon `stellarServer.loadAccount()`

---

## 12. YieldPaymentReconciler

**File:** `yieldPaymentReconciler.js` | **Pattern:** Static class.

### Role
Post-payment DB reconciler. Ensures `YieldPaymentJob` records in `prepared`/`submitting` states are resolved against actual on-chain TX outcomes.

### Methods

```js
static async reconcile(): Promise<{ resolved: number, failed: number }>
// 1. prisma.yieldPaymentJob.findMany({ where: { status: { in: ['prepared','submitting'] }, createdAt: { lt: cutoff } } })
// 2. For each job: checks txHashes via rpcServer.getTransaction()
// 3. Updates job.status to 'confirmed' | 'failed'
// 4. On 'confirmed': calls CompanyPaymentService._recordPayments() if missing

static start(): void  // setInterval every 10 min
static stop(): void
```

### Prisma Models
- `YieldPaymentJob` — `{ id, offerId, companyId, status, batchCount, totalAmount, txHashes, completedAt }`

### Dependencies
- `CompanyPaymentService._recordPayments()`
- `@stellar/stellar-sdk` `rpc.Server.getTransaction()`

---

## 13. IpfsService

**File:** `ipfs.service.js` | **Pattern:** Static class.

### Role
Pin documents (offering prospectuses, T&Cs, contracts) to IPFS via Pinata API. Returns CID for on-chain or DB storage.

### Methods

```js
static async uploadFile(buffer: Buffer, filename: string, mimeType: string): Promise<{ cid: string, url: string }>
// → POST multipart/form-data to https://api.pinata.cloud/pinning/pinFileToIPFS
// → Authorization: Bearer PINATA_JWT
// → returns { IpfsHash } → cid

static async uploadJson(data: object, name: string): Promise<{ cid: string, url: string }>
// → POST https://api.pinata.cloud/pinning/pinJSONToIPFS

static async getUrl(cid: string): string
// → returns `https://gateway.pinata.cloud/ipfs/${cid}` or custom IPFS_GATEWAY
```

### Dependencies
- Env: `PINATA_JWT`, `IPFS_GATEWAY`
- Native `fetch`

---

## 14. DepositRelayService

**File:** `depositRelay.service.js` | **Pattern:** Static class.

### Role
Processes validated USDC deposits routed from `PaymentMonitor`. Matches deposit memos to pending investments, triggers token distribution, and records the deposit.

### Methods

```js
static async processDeposit({
  txHash: string,
  amount: string,       // USDC human-readable
  memo: string,         // investor memo code
  senderAddress: string,
}): Promise<{ success, status, investmentId?, distributionHash? }>
```

**Internal control flow:**
1. `prisma.investor.findFirst({ where: { memoCode: memo } })` — resolve investor
2. `prisma.investment.findFirst({ where: { investorId, status: 'pending_payment' } })` — find pending investment
3. If no match → `prisma.deposit.create({ status: 'unmatched' })` → return
4. Match found → `prisma.deposit.create({ status: 'matched', investmentId })`
5. `StellarService.distributeTokens(investor.stellarContractId, tokenAmount, assetCode, options)` — triggers SAC transfer
6. On success → `prisma.investment.update({ status: 'distributed' })`
7. On `SAC_PENDING_MULTISIG` error → `prisma.investment.update({ status: 'pending_distribution' })` + stores `multiSigTransactionId`

### Prisma Models
- `Deposit` — `{ id, txHash, amount, memo, senderAddress, status, investmentId, createdAt }`
- `Investment`, `Investor`

### Dependencies
- `StellarService.distributeTokens()`
- `EmailService.sendInvestmentConfirmation()`

---

## 15. SorobanEventIndexer

**File:** `sorobanEventIndexer.js` | **Pattern:** Static class with start/stop loop.

### Role
Polls Soroban RPC for contract events emitted by sale contracts (`trade`, `set_active`, `freeze_buyer`). Indexes them to DB for admin dashboards and reconciliation.

### Methods

```js
static async indexEvents(contractId: string, fromLedger?: number): Promise<number>
// → rpc.Server.getEvents({ filters: [{ type: 'contract', contractIds: [contractId] }], startLedger })
// → For each event: prisma.sorobanEvent.upsert({ where: { txHash_eventIndex }, data: {...} })
// → returns count of new events indexed

static async indexAllActiveContracts(): Promise<{ total: number }>
// → prisma.offer.findMany({ where: { status: 'active', sorobanContractId: { not: null } } })
// → calls indexEvents() for each

static start(intervalMs = 60_000): void
static stop(): void
```

### Prisma Models
- `SorobanEvent` — `{ id, contractId, txHash, eventIndex, type, data: Json, ledger, createdAt }`
- `Offer` (reads sorobanContractId)

### Dependencies
- `@stellar/stellar-sdk` `rpc.Server.getEvents()`

---

## 16. SorobanReconciler

**File:** `sorobanReconciler.js` | **Pattern:** Static class with start/stop loop.

### Role
Reconciles `investment` records stuck in `trade_submitted` status by checking their `usdcPaymentHash` on-chain via Soroban RPC.

### Constants
| Constant | Value |
|---|---|
| `POLL_INTERVAL_MS` | `300_000` (5 min) |
| `ORPHAN_TIMEOUT_MS` | `3_600_000` (1 hr) |
| `PENDING_TTL_MS` | `1_800_000` (30 min) |

### Methods

```js
static async reconcile(): Promise<{ fixed: number, failed: number, stale: number }>
// 1. prisma.investment.findMany({ where: { status: 'trade_submitted' }, take: 50 })
// 2. For each: if no usdcPaymentHash → check age; if > ORPHAN_TIMEOUT → mark 'failed' (stale++)
// 3. If has hash → rpcServer.getTransaction(hash)
//    - SUCCESS → update status to 'distributed' (Soroban trade) or 'payment_received' (legacy)
//    - FAILED  → update status to 'failed'
//    - NOT_FOUND + age > timeout → mark 'failed'
// 4. If total >= 5 orphans → AlertRouter.send(severity:'high')

static async expirePending(): Promise<number>
// prisma.investment.updateMany({
//   where: { status: 'pending_payment', updatedAt: { lt: cutoff }, offer: { sorobanContractId: { not: null } } },
//   data: { status: 'cancelled' }
// })

static start(): void   // setInterval(5 min) + 30s delayed first run
static stop(): void
```

### Prisma Models
- `Investment` (status, usdcPaymentHash, updatedAt, distributionTxHash)
- `Offer` (sorobanContractId)

### Dependencies
- `@stellar/stellar-sdk` `rpc.Server`
- `AlertRouter`

---

## 17. WebAuthnService

**File:** `webauthn.service.js` | **Pattern:** Static class.

### Role
FIDO2/WebAuthn registration and authentication. Wraps `@simplewebauthn/server` for challenge generation, credential verification, and credential storage.

### Methods

```js
static async generateRegistrationOptions(userId, userType): Promise<PublicKeyCredentialCreationOptionsJSON>
// → generateRegistrationOptions({ rpName, rpID, userID, userName, attestationType:'none', authenticatorSelection })
// → prisma[model].update({ data: { webauthnChallenge: options.challenge } })

static async verifyRegistration(userId, userType, credential): Promise<{ verified, credentialId, publicKey }>
// → verifyRegistrationResponse({ credential, expectedChallenge, expectedOrigin, expectedRPID })
// → prisma[model].update({ data: { passkeyCredentialId, passkeyPublicKey, passkeyCounter } })

static async generateAuthenticationOptions(userId, userType): Promise<PublicKeyCredentialRequestOptionsJSON>

static async verifyAuthentication(userId, userType, credential): Promise<{ verified, newCounter }>
// → verifyAuthenticationResponse()
// → prisma[model].update({ data: { passkeyCounter: newCounter, lastPasskeyAuth: now } })
// → prisma[credentialModel].update({ data: { lastUsedAt: now } })  // for additional credentials
```

### Prisma Models
- `Investor` / `CompanyUser` — `passkeyCredentialId`, `passkeyPublicKey`, `passkeyCounter`, `webauthnChallenge`
- `InvestorCredential` / `CompanyCredential` — additional device credentials

### Dependencies
- `@simplewebauthn/server`
- Env: `WEBAUTHN_RP_ID`, `WEBAUTHN_RP_NAME`, `FRONTEND_URL`

---

## 18. InvestmentMetrics

**File:** `investmentMetrics.service.js` | **Pattern:** Static class.

### Role
Aggregated analytics for the admin dashboard: portfolio totals, per-offer statistics, investor counts.

### Methods

```js
static async getPlatformSummary(): Promise<{
  totalInvested: number,
  totalInvestors: number,
  activeOffers: number,
  totalTokensDistributed: number,
}>
// → prisma.investment.aggregate({ _sum: { usdcAmount: true }, where: { status: 'distributed' } })
// → prisma.investor.count({ where: { kycStatus: 'approved' } })
// → prisma.offer.count({ where: { status: 'active' } })

static async getOfferMetrics(offerId): Promise<{
  totalRaised: number,
  investorCount: number,
  tokensDistributed: number,
  percentFunded: number,
}>

static async getInvestorPortfolio(investorId): Promise<{
  holdings: Array<{ assetCode, tokenAmount, currentValue, yieldEarned }>,
  totalValue: number,
}>
// → prisma.investment.findMany({ where: { investorId, status: 'distributed' }, include: { offer } })
// → joins InterestPayment aggregate per assetCode
```

### Prisma Models
- `Investment`, `Offer`, `Investor`, `InterestPayment`

---

## 19. CollateralDistribution

**File:** `collateralDistribution.service.js` | **Pattern:** Static class.

### Role
Handles token distribution for approved multisig investments. Called by `MultiSigTransactionService.processEffects()` post-confirmation.

### Methods

```js
static async distribute(investmentId: number): Promise<{ success, txHash? }>
// 1. prisma.investment.findUnique({ include: { investor, offer: { include: { tokens } } } })
// 2. If investor.stellarContractId (C...) → SAC path via StellarService.distributeTokens()
// 3. Else → classic Stellar payment via StellarService.distributeTokens()
// 4. prisma.tokenDistribution.create({ investmentId, txHash, tokenAmount, status:'completed' })
// 5. prisma.investment.update({ status: 'distributed' })
// 6. EmailService.sendInvestmentConfirmation()

static async distributeMany(investmentIds: number[]): Promise<{ results[] }>
// → sequential distribute() calls with per-item error isolation
```

### Prisma Models
- `Investment` (status), `TokenDistribution` (txHash, tokenAmount, status)
- `Investor` (stellarContractId), `Offer` → `Token` (assetCode, sacContractId)

### Dependencies
- `StellarService.distributeTokens()`
- `EmailService`

---

## 20. PaymentMonitor

**File:** `paymentMonitor.service.js` | **Pattern:** Static class with streaming Horizon listener.

### Role
Real-time streaming monitor for USDC payments arriving at the platform treasury address. Routes confirmed deposits to `DepositRelayService`.

### Methods

```js
static start(): void
// → stellarServer.payments().forAccount(TREASURY_ADDRESS).cursor('now').stream({
//     onmessage: PaymentMonitor.#handlePayment
//   })

static async #handlePayment(payment): Promise<void>
// 1. Filter: only asset_type === 'credit_alphanum4', asset_code === 'USDC', asset_issuer === USDC_ISSUER
// 2. Load TX memo via stellarServer.transactions().transaction(payment.transaction_hash)
// 3. DepositRelayService.processDeposit({ txHash, amount, memo, senderAddress: payment.from })

static stop(): void  // closes stream
static restart(): void  // stop + start (on stream error)
```

### Dependencies
- Horizon `stellarServer.payments().stream()`
- `DepositRelayService`
- Env: `TREASURY_PUBLIC_KEY`, `USDC_ISSUER`

---

## 21. PaymentReminderService

**File:** `paymentReminder.service.js` | **Pattern:** Static class.

### Role
Sends email reminders to company users when a payment is approaching or overdue.

### Methods

```js
static async sendUpcomingReminders(): Promise<{ sent: number }>
// → prisma.offer.findMany({ where: { status:'active', nextPaymentDue: { gte: now, lte: threeDaysFromNow } } })
// → For each: EmailService.send(companyEmail, 'Upcoming payment due in X days')
// → prisma.offer.update({ data: { lastReminderSent: now } }) [idempotency guard]

static async sendOverdueReminders(): Promise<{ sent: number }>
// → prisma.offer.findMany({ where: { paymentDueStatus: 'overdue' } })
// → EmailService.send with escalating tone

static startSchedule(): void  // cron: daily at 09:00
```

### Dependencies
- `EmailService`
- Prisma `Offer`, `Company`

---

## 22. PaymentService

**File:** `payment.service.js` | **Pattern:** Static class.

### Role
Processes investor USDC purchase payments (non-Soroban path). Creates investment records and queues for distribution.

### Methods

```js
static async createPendingInvestment({ investorId, offerId, usdcAmount }): Promise<Investment>
// → validates KYC status, offer status, amount bounds
// → prisma.investment.create({ status: 'pending_payment', usdcAmount, tokenAmount })
// → returns memoCode for payment routing

static async confirmPayment(investmentId, txHash): Promise<Investment>
// → prisma.investment.update({ status: 'payment_received', usdcPaymentHash: txHash })
// → triggers distribution queue

static async getInvestmentStatus(investmentId): Promise<Investment>
```

### Prisma Models
- `Investment` — `{ id, investorId, offerId, usdcAmount, tokenAmount, status, usdcPaymentHash, distributionTxHash }`

---

## 23. OfferService

**File:** `offer.service.js` | **Pattern:** Static class.

### Role
CRUD and lifecycle management for token Offers. Controls the approval pipeline that triggers Soroban contract deployment.

### Methods

```js
static async create(data): Promise<Offer>
static async update(id, data): Promise<Offer>
static async approve(offerId): Promise<{ success, sorobanContractId? }>
// Full approval chain for Soroban offers:
// 1. StellarService.issueSecurityToken(assetCode, amount, { forSaleContract: true })
//    → registers asset + deploys SAC (TX1 classic flags-only + TX2 SAC deploy)
// 2. SorobanSaleService.buildDeployXdr() → queues deploy TX via MultiSigTransactionService
// 3. Stores precomputed contractId on offer
// On multisig mode: returns { status:'pending_multisig', multiSigTransactionId }

static async reject(offerId, reason): Promise<Offer>
static async close(offerId): Promise<Offer>
static async getWithDetails(offerId): Promise<Offer & relations>
static async list(filters): Promise<Offer[]>
```

### Prisma Models
- `Offer` — `{ id, companyId, status, offerType, assetCode, totalSupply, pricePerToken, sorobanContractId, sorobanSettlementContractId, maturityDate, annualInterestRate, investorRate, paymentType, paymentDay, nextPaymentDue, periodicPaymentsCompleted, paymentDueStatus }`
- `Token`, `Company`

### Dependencies
- `StellarService`, `SorobanSaleService`, `SorobanSettlementService`, `MultiSigTransactionService`

---

## 24. YieldDistributorService

**File:** `yieldDistributor.service.js` | **Pattern:** Static class.

### Role
Multi-batch yield dispatcher for smart-wallet investors. Calls the on-chain `YieldDistributor` Soroban contract to atomically distribute USDC across up to 30 investors per batch.

### Key Constants
| Constant | Value |
|---|---|
| `BATCH_SIZE` | `30` |
| `MAX_RETRIES` | `3` |
| `RETRY_DELAY_MS` | `5000` |

### Methods

```js
static async distributeBatch(offerId, investors, batchFee): Promise<{ txHash, batchSize }>
// → builds Vec<DistributeItem> ScVal
// → contract.call('distribute_batch', items, feeScVal)
// → StellarService.prepareSorobanTransaction()
// → signs with issuerKeypair → rpc.Server.sendTransaction()
// → polls until SUCCESS

static async distributeAll(offerId, breakdown): Promise<{ success, txHashes[], investorsPaid, partial }>
// → groups breakdown into batches of BATCH_SIZE
// → sequential distributeBatch() per batch
// → on partial failure: marks partial=true but continues remaining batches

static async acquireLock(offerId): Promise<boolean>
// → prisma.offer.updateMany({ where: { id, yieldLocked: false }, data: { yieldLocked: true } })
// → returns true if lock acquired (0 rows = already locked)

static async releaseLock(offerId): Promise<void>
// → prisma.offer.update({ data: { yieldLocked: false } })
```

### Prisma Models
- `Offer` — `yieldLocked` (boolean, concurrency guard)

### Dependencies
- `KeyManager.getIssuerKeypair()`
- Soroban `YieldDistributor` contract (env: `YIELD_DISTRIBUTOR_CONTRACT_ID`)
- `StellarService.prepareSorobanTransaction()`

---

## 25. CompanyPaymentService

**File:** `companyPayment.service.js` | **Pattern:** Static class with 1315 lines.

### Role
Orchestrates the full periodic and bullet yield payment lifecycle. Single source of truth for interest math, schedule advancement, and payment recording.

### Key Constants (inline)
| Name | Value |
|---|---|
| `LATE_FEE_PERCENT_PER_DAY` | `0.001` (0.1%/day) |
| `DEFAULT_FEE_PERCENT` | `0.05` (5%) |
| `GRACE_PERIOD_DAYS` | `5` |

### Core Methods

```js
static async calculateOwedAmount(offerId): Promise<{
  totalOwed: number,
  breakdown: Array<{ investorId, investorWallet, tokenBalance, interestOwed }>,
  periodDays: number,
}>
// 1. prisma.offer.findUnique({ include: { investments: { include: { investor } }, tokens } })
// 2. For each distributed investment:
//    - if offer.status === 'locked' (pre-DEX) → uses DB tokenAmount (no on-chain SAC query)
//    - else → reads on-chain balance via SAC contract call (scValToNative)
// 3. Interest formula (simple): balance × (investorRate/100) × (periodDays/365)
// 4. Returns breakdown with per-investor amounts

static async calculateBulletPayment(offerId): Promise<{
  breakdown: Array<{ investorId, investorWallet, principal, interest, totalPayout }>,
  totalPayout: number,
  totalInterest: number,
  companyTotalInterest: number,
}>
// Uses annualInterestRate for company-facing total, investorRate for net payout

static async processSignedPayment(offerId): Promise<{ success, txHashes[], investorsPaid }>
// Full payment execution:
// 1. acquireLock via YieldDistributorService (concurrency guard)
// 2. calculateOwedAmount()
// 3. Guard: periodicPaymentsCompleted >= computeTotalExpectedPayments() → throw 'all yields paid'
// 4. spreadPct = annualInterestRate - investorRate
// 5. Route by investor type:
//    - All classic G-addresses → StellarService classic payment batch
//    - Any C-address present → YieldDistributorService.distributeAll() (Soroban multi-batch)
// 6. On-chain success → prisma.offer.update({ periodicPaymentsCompleted: { increment: 1 }, lastPaymentDate: now, nextPaymentDue: calculateNextPaymentDate() })
// 7. _recordPayments() → creates InterestPayment records + FeeLog
// 8. Updates YieldPaymentJob status
// 9. releaseLock()

static async _recordPayments(offer, breakdown, txHash, spreadPct, isBullet): Promise<{ records, totalFee }>
// DRY helper used by both periodic and bullet flows
// Creates prisma.interestPayment per investor
// Creates prisma.feeLog (fire-and-forget) for platform fee reporting

static async checkOverduePayments(): Promise<{ overduePayments[], bulletMaturities[], periodicMaturities }>
// Scheduler task:
// Section 1: active non-bullet offers with nextPaymentDue < now
//   → filters out fully-completed offers (F-20 guard)
//   → daysOverdue > GRACE_PERIOD_DAYS → status='defaulted' + CompanyPenalty record
//   → daysOverdue > 0 → status='overdue' + late_fee penalty (idempotent per day)
// Section 2: bullet offers past maturityDate
//   → same escalation path
// Section 3: periodic offers past maturityDate with all yields paid
//   → status='due' (non-punitive, principal return needed)

static computeTotalExpectedPayments(offer): number | null
// Date-walks from createdAt by paymentType period until maturityDate
// Returns count (no +1) — deterministic, no floating point
// Returns null for perpetual offers (no maturityDate)

static calculateNextPaymentDate(offer): Date | null
// _advanceByPeriod(lastPaymentDate || createdAt, paymentType, paymentDay)
// Returns null if next date > maturityDate

static _advanceByPeriod(date, paymentType, paymentDay): Date
// UTC-normalized: setUTCDate(1) first to prevent month overflow
// Then: monthly+1m, quarterly+3m, semi_annual+6m, annual+1yr
// Final: setUTCDate(min(paymentDay, 28)) — prevents Feb 30 etc.

static getPeriodsPerYear(paymentType): number
// monthly=12, quarterly=4, semi_annual=2, annual=1, bullet=1
```

### Prisma Models
- `Offer` — `periodicPaymentsCompleted`, `lastPaymentDate`, `nextPaymentDue`, `paymentDueStatus`, `yieldLocked`
- `Investment` — `status`, `tokenAmount`
- `InterestPayment` — `grossAmount`, `netAmount`, `platformFeeAmount`, `paymentType`
- `FeeLog` — `amount`, `category:'DIVIDEND'`, `sourceId`
- `CompanyPenalty` — `penaltyType`, `daysLate`, `amount`
- `YieldPaymentJob` — `status`, `txHashes`, `metadata`

### Dependencies
- `YieldDistributorService` (lock + Soroban batch)
- `StellarService` (classic payment path)
- `AlertService` (critical failures)


---

## 26. MultiSigTransactionService

**File:** `multiSigTransaction.service.js` | ~1206 lines.

### Role
Admin governance lifecycle for operations requiring Ledger/Freighter approval. Tracks signature collection, threshold validation, and automated post-execution state hooks.

### Methods

```js
static async create({ xdr, signingRole, operationType, metadata, description, requiredSigners, thresholdRequired }): Promise<MultiSigTransaction>
// prisma.multiSigTransaction.create({ status:'pending', xdr, ... })

static async addSignature(id, signedXdr, signerPublicKey): Promise<{ status, executed }>
// 1. Appends signedXdr to record
// 2. Checks if signerCount >= thresholdRequired
// 3. If threshold met → executeTransaction(id)

static async executeTransaction(id): Promise<{ success, hash }>
// 1. Reconstructs fully-signed TX from stored XDR + signatures
// 2. TransactionBuilder.fromXDR() → applies all signatures
// 3. Submits to Stellar network
// 4. On SUCCESS → prisma.multiSigTransaction.update({ status:'executed', executedAt:now })
//              → processEffects(id)
// 5. On FAILURE → prisma.multiSigTransaction.update({ status:'failed' })
//              → processRejectionEffects(id)

static async processEffects(id): Promise<void>
// Post-execution hook — dispatches by operationType:
// 'token_issue' + chainAction='sac_deploy':
//   → StellarService.deploySACForAsset()
// 'sac_deploy' + chainAction='token_distribute':
//   → StellarService.distributeTokens(investorPublicKey, amount, assetCode)
// 'sale_deploy':
//   → SorobanSaleService.buildCreateSaleXdr() → queues create() TX
// 'sale_create':
//   → SorobanSaleService.buildSacAuthorizeXdr() → queues SAC auth TX
//   → then buildSacTransferXdr() for initial deposit
// 'investment_approve':
//   → CollateralDistribution.distribute(investmentId)
// 'offer_approve':
//   → OfferService.approve(offerId)

static async processRejectionEffects(id): Promise<void>
// Cleans up DB state on TX failure (safe for admin retry):
// 'token_issue' → prisma.token.update({ status:'issue_failed' })
// 'investment_approve' → prisma.investment.update({ status:'rejected' })
// 'sale_deploy' → prisma.offer.update({ sorobanContractId: null })

static async expire(): Promise<number>
// prisma.multiSigTransaction.updateMany({
//   where: { status:'pending', expiresAt: { lt: now } },
//   data: { status:'expired' }
// })

static async list(filters): Promise<MultiSigTransaction[]>
static async getById(id): Promise<MultiSigTransaction>
static async reject(id, reason): Promise<MultiSigTransaction>
```

### Prisma Models
- `MultiSigTransaction` — `{ id, status, xdr, operationType, signingRole, metadata:Json, requiredSigners, thresholdRequired, signatures:Json[], executedAt, expiresAt }`

### Dependencies
- `StellarService`, `SorobanSaleService`, `CollateralDistribution`, `OfferService`

---

## 27. PasskeyWalletService

**File:** `passkeyWallet.service.js` | 1186 lines.

### Role
Smart-wallet (OpenZeppelin Soroban Smart Account) lifecycle. Deployment, fee-sponsored TX submission, withdrawal, and credential management.

### Key Constants
| Name | Value / Source |
|---|---|
| `BASE_FEE` | `'100'` stroops |
| `MAX_SPONSORED_FEE_STROOPS` | `50_000_000` (5 XLM) |
| `ACCOUNT_WASM_HASH` | env |
| `WEBAUTHN_VERIFIER_ADDRESS` | env |

### Methods

```js
static async deploySmartWallet(userId, userType, passkeyId, publicKeyBytes): Promise<{ contractId, deployXdr }>
// 1. Derives deterministic salt = hash(passkeyId)
// 2. precomputeContractId(issuerPublicKey, salt)
// 3. buildDeployXdr() → Operation.createCustomContract({ wasmHash: ACCOUNT_WASM_HASH, address: issuer, salt })
// 4. prepareSorobanTransaction() → signs with opsKeypair
// 5. prisma[model].update({ stellarContractId: contractId })

static async submitWithSponsorship(signedXdr): Promise<{ hash, status }>
// 1. Deserializes TX from XDR
// 2. Validates fee ≤ MAX_SPONSORED_FEE_STROOPS (security guard)
// 3. Gets next channel account → ChannelsClient.submitFuncAndAuth(signedXdr)
//    - On channel error → falls back to self-sponsorship via opsKeypair fee-bump
// 4. Polls RPC until SUCCESS/FAILED (60s timeout)

static async buildWithdrawalTx(userId, userType, destinationAddress, amount, assetCode): Promise<{ xdr, networkPassphrase, walletId }>
// Builds: Contract(tokenContractId).call('transfer', walletAddress, destination, amount)
// prepareSorobanTransaction() → signs with opsKeypair (sponsor)

static async buildInvestmentTx(investorContractId, companyWallet, amount): Promise<{ xdr, networkPassphrase, walletId }>
// Builds USDC SAC transfer: investor → company
// Uses USDC_SAC_CONTRACT_ID
// prepareSorobanTransaction() — NO manual footprint hack (removed; Channels handles it)

static async submitWithdrawalTx(signedXdr): Promise<{ hash, status }>
// → #validateWithdrawalTx(tx)  [security: checks op count=1, type=invokeHostFunction, contract allowlist]
// → sendTransaction(tx)

static async listUserPasskeys(userType, userId): Promise<PasskeyInfo[]>
// Merges primary credential (user.passkeyCredentialId) + additionalCredentials table

static async listEd25519Signers(userType, userId): Promise<SignerInfo[]>
// prisma[signerModel].findMany() — read-only; on-chain management is frontend-initiated

static #validateWithdrawalTx(tx): void
// Guards: ops.length === 1, op.type === 'invokeHostFunction'
// Contract must be in [USDC_SAC_CONTRACT_ID, USDC_CONTRACT_ID, XLM_SAC_CONTRACT_ID, XLM_CONTRACT_ID]
// Function name must be 'transfer'

static precomputeContractId(issuerPublicKey, salt): string
// sha256(networkId || deployer || salt) → StrKey.encodeContract()

static getRpcServer(): rpc.Server
static async sendTransaction(tx): Promise<result>
```

### Prisma Models
- `Investor` / `CompanyUser` — `stellarContractId`, `passkeyCredentialId`
- `InvestorCredential` / `CompanyCredential` — additional passkeys
- `InvestorEd25519Signer` / `CompanyEd25519Signer` — recovery keys

### Dependencies
- OpenZeppelin `ChannelsClient` (env: `CHANNELS_API_KEY`)
- `StellarService.prepareSorobanTransaction()`
- `KeyManager`

---

## 28. EmailService

**File:** `email.service.js` | 977 lines. **Pattern:** Static class + module-level `sendEmail` helper.

### Transport
- **Production:** Resend HTTP API (`RESEND_API_KEY`)
- **Dev Mode:** Logs to console (no RESEND_API_KEY → mock path)
- **Sender:** `EMAIL_FROM` env (default: `Radox <noreply@mail.radox.net>`)

### Methods

| Method | Trigger |
|---|---|
| `static generateVerificationToken()` | `crypto.randomBytes(32).toString('hex')` |
| `static getVerificationExpiry()` | now + `EMAIL_VERIFICATION_EXPIRY_HOURS` (default 24h) |
| `static async send6DigitVerificationCode(email, code)` | Registration OTP |
| `static async sendVerificationEmail(email, name, token)` | Email-first reg link |
| `static async resendVerificationEmail(email, name, token)` | Alias → sendVerificationEmail |
| `static async sendWelcomeEmail(email, name, contractId)` | Post wallet-creation |
| `static async sendInterestPaymentConfirmation(email, name, amount, txHash, date)` | Periodic yield |
| `static async sendBulletPaymentConfirmation(email, data)` | Bullet maturity |
| `static async sendQuarterlyPaymentConfirmation(email, data)` | Quarterly yield |
| `static async sendSemiAnnualPaymentConfirmation(email, data)` | Semi-annual yield |
| `static async sendInvestmentConfirmation(email, investment, distribution)` | Token distribution |
| `static async sendKYCApprovalEmail(email, name)` | KYC approved |
| `static async sendKYCRejectionEmail(email, name, reason)` | KYC rejected |
| `static async sendCompanyStatusUpdate(email, companyName, status, reason)` | Company approved/rejected |

All methods call the internal `sendEmail({ to, subject, html, text })` helper. Errors are caught and re-thrown as `new Error('Failed to send X: ...')`.

---

## 29. StellarService

**File:** `stellar.service.js` | 2102 lines. **Pattern:** Static class.

### Role
Core Stellar/Soroban operations hub. All classic and Soroban on-chain interactions flow through here.

### Methods

```js
static async getAccountRPC(publicKey): Promise<Account>
// → rpc.Server.getAccount() with Horizon fallback on error

static async buildUnsignedTransaction(sourcePublicKey, operations, memo): Promise<Transaction>

static async submitTransaction(signedXdr): Promise<{ success, transactionHash, ledger }>
// Direct Horizon submission for passkey-signed TXs bypassing TransactionManager

static async createIssuerAccount(): Promise<{ success, publicKey, flags }>
// If exists: verify flags (AuthRequired|AuthRevocable|AuthClawback), set if missing
// If testnet + not exists: Friendbot fund → setOptions(flags + homeDomain)
// Submits via TransactionManager(signingRole:'ISSUER')

static async unlockToken(assetCode): Promise<{ success, txHash? }>
// setOptions({ clearFlags: AuthRequiredFlag })
// Routes through TransactionManager → may return { status:'pending_multisig' }

static async issueSecurityToken(code, amount, options): Promise<{ success, sacContractId, ... }>
// TX1 (classic): If forSaleContract=true → flags-only setOptions (no distributor)
//               Else → changeTrust + setTrustLineFlags(authorized:true) + payment to distributor
// TX2 (Soroban): Operation.createStellarAssetContract() → prepareSorobanTransaction() → TransactionManager

static async deploySACForAsset(code, issuer, chainMetadata): Promise<{ success, sacContractId }>
// createStellarAssetContract op → prepareSorobanTransaction → TransactionManager(sac_deploy)

static async ensureSACDeployed(assetCode, issuer, chainMetadata): Promise<sacContractId>
// 1. getLedgerEntries(instanceKey) — check on-chain existence
// 2. If exists → return sacContractId immediately
// 3. Check prisma.multiSigTransaction for pending sac_deploy → throw SAC_PENDING_MULTISIG
// 4. deploySACForAsset() → on pending_multisig → throw typed error with multiSigTransactionId
// 5. On success → prisma.token.updateMany({ sacContractId })

static async distributeTokens(investorPublicKey, amount, assetCode, options): Promise<result>
// isContract = investorPublicKey.startsWith('C')
// C-path: ensureSACDeployed() → Contract(sacContractId).call('transfer', distributor, investor, amount)
//         → prepareSorobanTransaction → TransactionManager(token_distribute)
// G-path: classic Operation.payment via distributor keypair

static async prepareSorobanTransaction(tx): Promise<Transaction>
// rpc.Server.simulateTransaction() → rpc.assembleTransaction()
// Throws on SimulationError

static async clawbackTokens(investorPublicKey, amount, assetCode): Promise<result>
// Operation.clawback({ asset, from: investor, amount })

static async getSACBalance(contractId, holderAddress): Promise<bigint>
// Simulates SAC.call('balance', holderAddress) → scValToNative

static getSACContractId(asset): string
// Contract.contractId(asset, networkPassphrase) → deterministic C... address
```

### Dependencies
- `KeyManager`, `TransactionManager`
- All `@stellar/stellar-sdk` imports
- Horizon `stellarServer` + Soroban `rpc.Server`

---

## 30. SorobanSaleService

**File:** `sorobanSale.service.js` | 922 lines. **Pattern:** Static class.

### Role
Backend wrapper for the `token_sale` Soroban contract. Two-role access: `admin` (multisig/cold) and `seller` (operational).

### Contract Error Codes
`1=AlreadyCreated, 2=ZeroPrice, 3=NotActive, 4=InvalidAmount, 5=TradeTooSmall, 6=Overflow, 7=Expired, 8=BelowMinimum, 9=BuyerCapExceeded, 10=BuyerBlocked, 11=NoPendingAdmin, 12=NotPendingAdmin`

### Methods

```js
// ── Deploy & Initialize ──
static async buildDeployXdr(issuerPublicKey, wasmHash, salt): Promise<{ xdr, contractId, networkPassphrase }>
// Operation.createCustomContract() → prepareSorobanTransaction → precomputeContractId

static precomputeContractId(issuerPublicKey, salt): string
// sha256(networkId || deployer || salt) → StrKey.encodeContract()

static async contractExistsOnChain(contractId): Promise<boolean>
// rpc.Server.getLedgerEntries(contract.getFootprint())

static async buildCreateSaleXdr(contractId, issuerPublicKey, params): Promise<{ xdr, networkPassphrase, contractId }>
// contract.call('create', admin, seller, sellToken, buyToken, treasury, company,
//               fixedFee, sellPrice, buyPrice, deadlineLedger, minBuyAmount, maxBuyPerBuyer)

// ── Trade ──
static async buildTradeXdr(contractId, buyerAddress, usdcAmount): Promise<{ xdr, networkPassphrase, contractId, buyerAddress, amount }>
// contract.call('trade', buyerAddress, amountStroops)
// prepareSorobanTransaction → #boostResourcesForPasskey(tx)
//   (3x CPU instructions, 5x fee — compensates for WebAuthn __check_auth not running in Recording Mode)

// ── Read-Only ──
static async getOffer(contractId)       // → #simulateReadOnly('get_offer')
static async getBalance(contractId)     // → #simulateReadOnly('get_balance')
static async getBuyerSpent(contractId, buyerAddress)  // → #simulateReadOnly('get_buyer_spent', [buyer])
static async isFrozen(contractId, buyerAddress)       // → #simulateReadOnly('is_frozen', [buyer])
static async getVersion(contractId)     // → #simulateReadOnly('version')

// ── Admin Ops (return unsigned XDR) ──
static async buildEmergencyDrainXdr(contractId)
static async buildSetActiveXdr(contractId, active)
static async buildFreezeBuyerXdr(contractId, buyerAddress, frozen)
static async buildWithdrawXdr(contractId, tokenAddress, amount)
static async buildProposeAdminXdr(contractId, newAdmin)
static async buildAcceptAdminXdr(contractId)
static async buildUpdatePriceXdr(contractId, sellPrice, buyPrice)
static async buildUpgradeXdr(contractId, newWasmHash)
// All delegate to #buildAdminOpXdr(contractId, method, args)

// ── SAC Auth ──
static async buildSacAuthorizeXdr(sacContractId, targetAddress, authorize)
// sacContract.call('set_authorized', targetAddress, authorize)

static async authorizeBuyerOnSac(sacContractId, targetAddress): Promise<{ success, alreadyAuthorized?, txHash? }>
// Pre-flight: simulate 'authorized(address)' → skip if already true
// Build set_authorized(true) TX, source=issuer, sign with opsKeypair
// Pre-flight: stellarServer.loadAccount(opsKeypair) → check XLM >= OPERATIONS_WALLET_CRITICAL_XLM
//   → throws OPERATIONS_WALLET_EMPTY error → controller returns 503
// Submit with 2 retries, 5s delay, 60s polling

static async buildIssuerThresholdSetupXdr(): Promise<{ xdr, networkPassphrase }>
// setOptions({ signer: { opsPublicKey, weight:2 }, masterWeight:10, low:1, med:2, high:10 })
// One-time setup enabling opsKey to satisfy Soroban medium threshold for set_authorized
```

---

## 31. SorobanSettlementService

**File:** `sorobanSettlement.service.js` | 580 lines. **Pattern:** Static class.

### Role
Backend wrapper for the `MaturitySettlement` Soroban contract used for debt (collateral) offer maturity payouts.

### Contract Error Codes
`1=AlreadyInitialized, 2=NotInitialized, 3=InvalidAmount, 4=Overflow, 5=EmptyBatch, 6=AlreadySettled, 7=BatchTooLarge, 8=NoDeposit, 9=DuplicateInvestor, 10=PhantomInvestor, 11=FeeTooHigh`

### Constants
- `MAX_BATCH_SIZE = 30`

### Methods

```js
// ── Deploy & Initialize ──
static getSettlementWasmHash(): string  // SETTLEMENT_WASM_HASH env

static async deployForOffer(offerId): Promise<{ contractId, deployXdr, networkPassphrase }>
// Guards: offerType==='collateral', maturityDate exists, token SAC deployed
// salt = hash('settlement-{offerId}-{timestamp}')
// Operation.createCustomContract() → prepareSorobanTransaction
// prisma.offer.update({ sorobanSettlementContractId: contractId })  ← stored pre-confirmation

static async buildInitializeXdr(offerId, maxFeeBps=500): Promise<{ xdr, contractId, networkPassphrase }>
// contract.call('initialize', admin, usdcSac, tokenSac, treasury, maxFeeBps)
// Requires contract on-chain (call AFTER deploy TX confirmed)

// ── Deposit ──
static async buildDepositXdr(offerId, amount): Promise<{ xdr, contractId, amount, networkPassphrase }>
// contract.call('deposit', companyWallet, usdcToStroops(amount))
// TX source = companyWallet → require_auth via SourceAccount credentials

// ── Settle ──
static async buildSettleBatchXdr(offerId, investors, totalFee): Promise<{ xdr, contractId, batchSize, networkPassphrase }>
// investors: Array<{ investor: string, payout: number }>
// Builds Vec<SettleItem> ScVal → contract.call('settle_batch', items, feeScVal)
// Guards: investors.length > 0, <= MAX_BATCH_SIZE

static async executeFullSettlement(offerId): Promise<{ batches, totalPaid, totalFee, investorCount }>
// 1. CompanyPaymentService.calculateBulletPayment(offerId)
// 2. Splits into batches of 30
// 3. Distributes fee proportionally across batches (last batch gets remainder)
// 4. buildSettleBatchXdr() → sign with issuerKeypair → rpc.Server.sendTransaction → poll
// 5. On all-success: CompanyPaymentService._recordPayments(offer, breakdown, txHashes, spreadPct, true)
// 6. prisma.offer.update({ status:'closed', lastPaymentDate:now, paymentDueStatus:'current' })

// ── Withdraw & Read-only ──
static async buildWithdrawXdr(offerId, tokenAddress, amount, destination): Promise<{ xdr, networkPassphrase }>
// contract.call('withdraw', tokenAddress, amount, destination)

static async getContractBalance(offerId): Promise<number>
// Simulates contract.call('get_balance') → stroopsToUsdc()

// ── Internals ──
static parseContractError(error): { code, message }
// Regex: /Error\(Contract, #(\d+)\)/ → SETTLE_ERRORS lookup

static _precomputeContractId(issuerPublicKey, salt): string
// Same sha256 algorithm as SorobanSaleService.precomputeContractId
```

### Prisma Models
- `Offer` — `sorobanSettlementContractId`, `offerType`, `maturityDate`, `status`
- `Investment` — `status:'distributed'`
- `InterestPayment`, `FeeLog` (via CompanyPaymentService._recordPayments)

### Dependencies
- `StellarService.prepareSorobanTransaction()`
- `CompanyPaymentService.calculateBulletPayment()`, `_recordPayments()`
- `KeyManager.getIssuerKeypair()` (direct signing — not through TransactionManager)

---

## Cross-Service Dependency Map

```
TransactionManager ← StellarService, SorobanSaleService
MultiSigTransactionService ← TransactionManager
  └─ processEffects → StellarService, SorobanSaleService, CollateralDistribution, OfferService

CompanyPaymentService ← YieldDistributorService, StellarService, AlertService
SorobanSettlementService ← CompanyPaymentService._recordPayments()
SorobanReconciler ← AlertRouter
DepositRelayService ← StellarService.distributeTokens()
PasskeyWalletService ← StellarService.prepareSorobanTransaction(), ChannelsClient
SorobanSaleService.authorizeBuyerOnSac ← WalletMonitor threshold (inline balance guard)
EmailService ← (called by) CompanyPaymentService, CollateralDistribution, PaymentReminderService
```

---

*End of Chapter 09 — Service Internals. All 31 services documented.*

---

# ADDENDUM — Gap Remediation Pass

> The following sections correct and expand the initial documentation based on a full audit of all method signatures across all 31 service files.

---

## 8 (revised). SorobanMetrics

**Full role:** In-memory latency tracker for Soroban trade() paths. Not an RPC poller — tracks backend-recorded metrics.

### Methods

| Method | Description |
|---|---|
| `static recordTrade({ durationMs, success, gasUsed, investmentId })` | Appends to `_tradeLatencies[]`; increments `_tradeErrors` on failure |
| `static getStats()` | Returns `{ trade: { count, avgMs, p95Ms, minMs, maxMs, errorRate, successCount, errorCount }, since }` |
| `static async flush()` | `prisma.systemConfig.upsert({ key:'soroban_metrics' })` — persists stats snapshot |
| `static start()` | `setInterval(flush, 10 min)` |
| `static stop()` | Clears interval + calls `flush()` one final time |
| `static reset()` | Clears `_tradeLatencies` and `_tradeErrors` |

### Prisma Models
- `SystemConfig` — `{ key: 'soroban_metrics', value: JSON }`

---

## 15 (revised). SorobanEventIndexer

**Full role:** Polls Soroban RPC `getEvents()` for token_sale contract events every 30s. Cursor-persisted in `SystemConfig`. Alerts admins on critical events.

### Event Severity Map
| Topic | Severity | Alert |
|---|---|---|
| `trade` | info | ✗ |
| `status` | warning | ✓ |
| `price` | warning | ✓ |
| `wdrw` | critical | ✓ 🚨 |
| `drain` | critical | ✓ 🚨 |
| `padmin` | critical | ✓ 🚨 |
| `aadmin` | critical | ✓ 🚨 |
| `freeze` | warning | ✓ |

### Constants
| Name | Value |
|---|---|
| `INITIAL_LOOKBACK_LEDGERS` | `60` (~5 min) |
| `MAX_EVENTS` | `100` |
| `CURSOR_PREFIX` | `'eidx_'` |
| Poll interval | `30_000 ms` |

### Methods

```js
static async getTrackedContracts(): Promise<Array<{contractId, offerId, assetCode}>>
// prisma.offer.findMany({ where: { sorobanContractId: { not: null }, status: { in: ['active','closed','matured'] } } })

static async getCursor(contractId): Promise<number|null>
// prisma.systemConfig.findUnique({ where: { key: 'eidx_' + contractId.slice(-44) } })

static async setCursor(contractId, ledger): Promise<void>
// prisma.systemConfig.upsert

static async pollContract({ contractId, offerId, assetCode }): Promise<number>
// 1. getCursor() or getLatestLedger() - INITIAL_LOOKBACK_LEDGERS (first run)
// 2. rpcServer.getEvents({ startLedger, filters: [{ type:'contract', contractIds:[contractId] }], limit:100 })
// 3. If startLedger pruned error → reset cursor to latest - 60 → return 0
// 4. parseEvent() each → if EVENT_CONFIG[topic].alert → handleAlert()
// 5. setCursor(maxLedger)

static parseEvent(event): { topic, data, ledger, contractId, txHash } | null
// xdr.ScVal.fromXDR(event.topic[0], 'base64') → scValToNative → topic string
// xdr.ScVal.fromXDR(event.value, 'base64') → scValToNative → data

static async handleAlert(parsed, contract, config): Promise<void>
// Logs with severity-based log level
// prisma.platformAdmin.findMany({ where: { isActive: true } })
// NotificationService.createNotification() for each admin (lazy-imported)

static async pollAll(): Promise<number>
// getTrackedContracts() → sequential pollContract() per contract
// Errors per-contract are caught and logged (non-fatal)

static start(): void   // setInterval(30s) + immediate pollAll() on start
static stop(): void    // clearInterval
```

### Prisma Models
- `SystemConfig` — cursor key: `eidx_${contractId.slice(-44)}`
- `Offer` (read: sorobanContractId, status)
- `PlatformAdmin` (read: isActive)

---

## 17 (revised). WebAuthnService

**Full role:** FIDO2/WebAuthn credential lifecycle for all 3 user types (investor, company_user, platform_admin). Each type has its own Prisma model resolved by `getPrismaModel()`.

### Prisma Model Map
| userType | Prisma model |
|---|---|
| `investor` | `investorWebauthnCredential` |
| `company_user` | `companyUserWebauthnCredential` |
| `platform_admin` | `platformAdminWebauthnCredential` |

### Methods

```js
static async generateRegistrationOptions(userType, userId, userName, userEmail): Promise<Options>
// getUserCredentials() → used as excludeCredentials
// generateRegistrationOptions({ rpName, rpID, userID: Buffer.from(userId, 'utf8'), ... })
// authenticatorSelection: { platform, required UV, residentKey: required }
// supportedAlgorithmIDs: [-7, -257]

static async verifyRegistration(userType, userId, response, expectedChallenge, deviceName?): Promise<Verification>
// verifyRegistrationResponse({ response, expectedChallenge, expectedOrigin, expectedRPID, requireUserVerification:true })
// On success: saveCredential(userType, userId, credentialIdStr, publicKey, counter, deviceName)

static async generateAuthenticationOptions(userType, userId): Promise<Options>
// getUserCredentials() → allowCredentials
// Throws if no credentials found

static async generateDiscoverableAuthOptions(): Promise<Options>
// allowCredentials: [] (empty = browser discoverable credential prompt)

static async findUserByHandle(userHandle): Promise<{ user, userType } | null>
// Decodes base64url userHandle → userId int
// Searches: prisma.investor → prisma.companyUser → null
// Returns user with userType field appended

static async verifyAuthentication(userType, userId, response, expectedChallenge): Promise<Verification>
// getCredentialById() → verifyAuthenticationResponse()
// On success: updateCredentialCounter() + updateCredentialLastUsed()

static async getUserCredentials(userType, userId): Promise<Credential[]>
// prisma[model].findMany({ where: { [userIdField]: userId } })

static async getCredentialById(userType, credentialId): Promise<Credential | null>
// prisma[model].findUnique({ where: { credentialId } })

static async saveCredential(userType, userId, credentialId, publicKey, counter, deviceName): Promise<void>
// findFirst (upsert workaround for composite key) → update or create

static async updateCredentialCounter(userType, credentialId, newCounter): Promise<void>
// prisma[model].update({ data: { counter: newCounter } })

static async updateCredentialLastUsed(userType, credentialId): Promise<void>
// prisma[model].update({ data: { lastUsedAt: new Date() } })

// Static helpers
static getPrismaModel(userType): string       // model name lookup
static getUserIdFieldName(userType): string   // field name: investorId, etc.
static getCredentialsTableName(userType): string  // legacy table names (compatibility)
static getUserIdColumnName(userType): string      // legacy column names (compatibility)
```

---

## 21 (revised). PaymentReminderService

**Full role:** Automated multi-channel (email + dashboard notification) reminder pipeline for upcoming and overdue payments. Idempotent — records `PaymentReminder` row per (offerId, reminderType, dueDate) to prevent duplicates.

### Reminder Schedule
| Days Before | Type | Email | Notification |
|---|---|---|---|
| 30 | `30_day` | ✓ | ✗ |
| 21, 14 | `21_day`, `14_day` | ✓ | ✓ |
| 7, 6, 5, 4, 3, 2 | `7_day`…`2_day` | ✓ | ✓ |
| 1, 0 | `1_day`, `due_day` | ✓ | ✓ |
| negative | `overdue` | ✓ (escalating) | ✓ (`error` type) |

### Constants
- `GRACE_PERIOD = 10` days before defaulted
- `lateFee = baseAmount × 0.001 × daysOverdue`

### Methods

```js
static startReminderScheduler(): CronJob
// cron.schedule('0 9 * * *') → processReminders() at 09:00 UTC

static stopReminderScheduler(): void

static async processReminders(): Promise<{ offersChecked, remindersSent }>
// 1. prisma.offer.findMany({ where: { status:'active', nextPaymentDue:{ not:null }, paymentDueStatus:{ notIn:['defaulted'] } } })
// 2. MATURITY GUARD: CompanyPaymentService.computeTotalExpectedPayments() → skip if completed
// 3. Per offer: daysUntilDue → match REMINDER_SCHEDULE → sendReminder()
// 4. If daysUntilDue < 0 → sendOverdueReminder()
// 5. updatePaymentDueStatus()

static async sendReminder(offer, reminderType, dueDate): Promise<boolean>
// Idempotency: prisma.paymentReminder.findUnique({ where: { offerId_reminderType_dueDate } }) → return false if exists
// amountDue = totalInvested × (annualRate/100 / periodsPerYear)
// EmailService.sendPaymentReminder() + NotificationService.createNotification()
// prisma.paymentReminder.create(record)

static async sendOverdueReminder(offer, daysOverdue, dueDate): Promise<void>
// One-per-day guard: prisma.paymentReminder.findFirst({ where: { reminderType:'overdue', sentAt: { gte: todayStart } } })
// EmailService.sendOverduePaymentWarning({ collateralAtRisk: daysUntilDefault <= 3 })
// NotificationService.createNotification({ type:'error' }) — '⚠️ URGENT: Collateral at risk' if ≤ 3 days left

static async updatePaymentDueStatus(offer, daysUntilDue): Promise<void>
// daysUntilDue < -10 → 'defaulted'
// daysUntilDue < 0  → 'overdue'
// daysUntilDue === 0 → 'due'
// daysUntilDue <= 30 → 'upcoming'
// else → 'current'
// Only writes if status changed (avoids unnecessary DB writes)

static getPeriodsPerYear(paymentType): number  // monthly=12, quarterly=4, semi_annual=2, annual=1
static getReminderTitle(reminderType, offerName): string
static getReminderMessage(reminderType, amountDue, dueDate): string
```

### Prisma Models
- `PaymentReminder` — `{ id, offerId, companyId, reminderType, dueDate, amountDue, sentVia, sentAt }`
- `Offer` (status, nextPaymentDue, periodicPaymentsCompleted)
- `CompanyUser` (email, name, isActive)

---

## 22 (revised). PaymentService

**Full role:** Reads token balances (DB or on-chain per lock status) and handles bullet-maturity detection + notification-only scheduling. The primary payment executor for interest is `CompanyPaymentService`.

### Balance Source Logic
```
isTokenLocked === false → BALANCE_SOURCE.ON_CHAIN (SAC query via Soroban RPC)
isTokenLocked === true  → BALANCE_SOURCE.DATABASE (DB token_distributions aggregate)
```

### Methods

```js
static getBalanceSource(offer): 'database' | 'on_chain'

static async getOnChainTokenBalance(assetCode, investorAddress): Promise<string>
// StellarService.getSACContractId(asset)
// rpcServer.getContractData(sacContractId, addressScVal, 'persistent')
// scValToNative → BigInt / 10_000_000 → 7-decimal string
// Returns '0' on 404 (no balance entry)

static async processBulletPayments(assetCode?): Promise<{ success, data }>
// MVP mode — DOES NOT execute payments
// getExpiredBulletOffers() → for each: prisma.offer.update({ status:'matured' })
// + prisma.notification.create for each companyUser (in-app alert)

static async getExpiredBulletOffers(): Promise<Offer[]>
// prisma.offer.findMany({ where: { paymentType:'bullet', maturityDate:{ lte: endOfDay }, status:'active' } })
// Returns only offers with at least one token

static async getInvestorsWithBalancesByOffer(offerId): Promise<Investor[]>
// prisma.$queryRaw joins investors + token_distributions + tokens
// If ON_CHAIN: calls getOnChainTokenBalance() per investor → filters 0-balance holders
// Fallback to DB balance on per-investor RPC error

static async processAllScheduledPayments(): Promise<{ success }>
// MVP notification-only scheduler:
// 1. processBulletPayments() — daily
// 2. On 1st of month: notify company users for periodic offers that are due
//    MATURITY GUARD: skips offers where nextPaymentDue === null + maturityDate set
//    prisma.offer.update({ paymentDueStatus:'due', nextPaymentDue: today })
```

### Prisma Models
- `Offer` (paymentType, maturityDate, status, isTokenLocked, nextPaymentDue, paymentDueStatus)
- `Investment` (status:'distributed', usdcAmount)
- `Investor` (stellarContractId, kycStatus)
- `TokenDistribution` (amount, assetCode)
- `Notification` (userId, type, message)

---

## 24 (revised). YieldDistributorService

**Full role:** XDR builder + relay-pattern submission engine for the `YieldDistributor` Soroban contract. Manages Redis-based concurrency locks, error classification, and contract TTL extension. **Does NOT submit directly from frontend-prepared XDRs** — uses a relay pattern to re-simulate with signed auth and rebuild with fresh sequence.

### Contract Error Codes
`1=EmptyBatch, 2=BatchTooLarge, 3=InvalidAmount, 4=Overflow, 5=MismatchedArrays, 6=FeeTooHigh, 7=AlreadyInitialized, 8=NotInitialized, 9=ContractPaused, 10=DuplicateRecipient, 11=SelfTransfer`

### Constants
| Name | Value |
|---|---|
| `MAX_BATCH_SIZE` | `30` |
| `LOCK_TTL_SECONDS` | `1800` (30 min) |
| `MAX_RETRIES` | `3` |
| `BASE_DELAY_MS` | `3000` |

### Methods

```js
static async buildDistributeXdr(payerAddress, investors, feeAmount): Promise<string>
// contract.call('distribute', payer, usdcSacAddress, Vec<Address>, Vec<i128>, treasury, feeAmount)
// Source = opsKeypair; prepareSorobanTransaction() → toXDR('base64')

static async buildMultiBatchXdrs(payerAddress, breakdown, spreadRatio): Promise<{ batchXDRs[], batchDetails[] }>
// Filters breakdown to validInvestors (wallet + interestOwed > 0)
// Chunks into batches of MAX_BATCH_SIZE
// Per batch: batchFee = sum(interestOwed) × spreadRatio → buildDistributeXdr()

static async submitSingleBatch(signedXdr): Promise<{ status, txHash? }>
// Relay pattern (NOT direct submit):
// 1. Deserialize frontend XDR → extract signedFunc + signedAuth
// 2. Build FRESH TX with opsKeypair as source (new sequence)
// 3. simulateTransaction(freshTx) — gets correct resource footprint WITH signed auth
// 4. Manually rewind sequence (BigInt(freshTx.sequence) - 1n) → rebuild finalTx
//    with signedAuth PRESERVED (NOT replaced by simulation's unsigned auth)
// 5. finalTx.sign(opsKeypair) → StellarService.submitTransaction()
// Retry: exponential backoff (3s × 2^attempt) up to MAX_RETRIES
// Idempotent: tx_already_applied → returns { status:'confirmed', txHash:'already_applied' }

static async submitBatches(signedXDRs, batchDetails): Promise<{ success, partial, results[], txHashes[] }>
// Sequential submitSingleBatch() — continues through per-batch failures
// Returns partial:true if some confirmed + some failed

static classifyError(error): { retryable, type }
// RETRYABLE: timeout, ETIMEDOUT, 503, 429, PENDING
// IDEMPOTENT: tx_already_applied → success
// FATAL: tx_bad_auth, tx_bad_seq, tx_insufficient_balance, Error(Contract...)
// UNKNOWN → non-retryable (fail-safe)

static async acquireLock(offerId, jobId): Promise<boolean>
// Redis SETNX: `yield_lock:{offerId}` = jobId, EX=1800s
// Returns true if acquired, false if already locked
// Gracefully degrades: returns true if Redis unavailable

static async releaseLock(offerId): Promise<void>
// client.del(`yield_lock:{offerId}`)
// Warn-only on failure (TTL auto-expires)

static async extendContractTtl(): Promise<result>
// contract.call('extend_ttl') → prepareSorobanTransaction() → sign(opsKeypair) → submit
// No admin auth required (public contract call)

static getContractId(): string   // YIELD_DISTRIBUTOR_CONTRACT_ID env
static getUsdcSacId(): string    // USDC_SAC_CONTRACT_ID env
```

### Dependencies
- **Redis** (`getRedisClient()`) for distributed locking
- `StellarService.prepareSorobanTransaction()`, `StellarService.submitTransaction()`
- `KeyManager.getOperationsKeypair()`, `getTreasuryPublicKey()`


---

## 29 (revised). StellarService — Full Method Inventory

The following methods were missing from the initial documentation (lines 928–2102 of `stellar.service.js`):

```js
static async withdrawFromTreasury(destination, amount, assetCode, description, extraMetadata?, operationType?): Promise<result>
// Routes by destination type:
//   C-address → SAC.call('transfer', treasury, destination, amountStroops)
//              → prepareSorobanTransaction → TransactionManager(signingRole:'TREASURY')
//              ⚠️ Throws if assetCode === 'XLM' (XLM cannot go to C-address via classic)
//   G-address → Operation.payment({ destination, asset, amount, source:treasury })
//              → TransactionManager(signingRole:'TREASURY', operationType)
// Both paths support pending_multisig return

static async freezeAccount(investorPublicKey, assetCode): Promise<result>
// Guard: assetCode required, publicKey 56 chars, account exists on Horizon
// Operation.setTrustLineFlags({ flags: { authorized: false } })
// TransactionManager(signingRole:'ISSUER', operationType:'freeze_account')
// Maps op_no_trust → human-readable error

static async authorizeInvestor(investorPublicKey, assetCode): Promise<result>
// Guard: assetCode required; skips gracefully if no trustline exists (returns { success:false, reason:'No trustline' })
// Operation.setTrustLineFlags({ flags: { authorized:true, authorizedToMaintainLiabilities:false } })
// TransactionManager(signingRole:'ISSUER', operationType:'trustline_auth')
// Returns { success:false } (not throw) on error — safe for bulk loops

static async setupSponsoredTrustline(investorPublicKey, assetCode): Promise<{ success, requiresSignature, xdr, sponsored }>
// CAP-33 sponsorship pattern:
//   If account not exists: beginSponsoringFutureReserves + createAccount(0 balance) + endSponsoringFutureReserves
//   Always: beginSponsoringFutureReserves + changeTrust + endSponsoringFutureReserves
// Source = opsKeypair (sponsor), signs partial TX
// Returns UNSIGNED XDR for investor co-signature — does NOT auto-submit

static async unfreezeAccount(investorPublicKey, assetCode): Promise<result>
// Mirror of freezeAccount: setTrustLineFlags({ authorized: true })
// TransactionManager(signingRole:'ISSUER', operationType:'freeze_account') [note: same operationType]

static async disableClawbackForTrustline(investorPublicKey, assetCode): Promise<result>
// setTrustLineFlags({ clawbackEnabled: false })
// TransactionManager(signingRole:'ISSUER', operationType:'disable_clawback')

static buildDisableClawbackOp(investorPublicKey, assetCode): Operation
// Sync helper — builds Operation.setTrustLineFlags({ clawbackEnabled:false }) only; no TX

static async clawbackTokens(investorPublicKey, amount, assetCode): Promise<result>
// Guards: assetCode, positive amount, account exists, sufficient balance
// Operation.clawback({ asset, from:investor, amount })
// Error mapping: op_no_trust, op_not_authorized → human-readable messages

static async getTokenBalance(assetCode, publicKey): Promise<{ assetCode, publicKey, balance, assetType, isAuthorized, isAuthorizedToMaintainLiabilities }>
// stellarServer.loadAccount(publicKey) → balances.find(asset) → normalized response

static async getAccountInfo(publicKey): Promise<{ publicKey, accountId, balances, sequenceNumber, flags }>
// stellarServer.loadAccount(publicKey) → maps all fields including authRequired/Revocable/Immutable/ClawbackEnabled

static async verifyUSDCPayment(investorPublicKey, expectedAmount, treasuryPublicKey?, windowMinutes?, expectedMemo?): Promise<PaymentRecord | null>
// stellarServer.payments().forAccount(treasury).order('desc').limit(50)
// Match criteria:
//   - type === 'payment', asset_code === 'USDC', asset_issuer === getUsdcIssuer()
//   - destination === treasury
//   - If expectedMemo: fetches TX details to verify memo (separate Horizon call)
//   - Else: checks payment.from === investorPublicKey
//   - Amount within 0.01% tolerance
//   - createdAt > windowStartTime
// Double-spend guard: Investment.findByUSDC(txHash) → returns null if claimed
// Returns: { transactionHash, amount, createdAt, ledger, memo } | null

static async listAssetHolders(assetCode): Promise<Holder[]>
// stellarServer.accounts().forAsset(`${assetCode}:${issuerPublicKey}`)
// Returns: { publicKey, balance, authorized, authorizedToMaintainLiabilities, clawbackEnabled }

static async authorizeAllUserTrustlines(investorPublicKey): Promise<result>
// C-address guard: returns immediately (SAC wallet, no classic trustlines needed)
// G-address: stellarServer.loadAccount() → find unauthorized trustlines (asset_issuer === platform)
// Batch setTrustLineFlags({ authorized:true }) in single TX for all unauthorized trustlines
// TransactionManager(signingRole:'ISSUER', operationType:'trustline_auth')

static async simulateSorobanTransaction(transaction): Promise<SimulationResponse>
// rpcServer.simulateTransaction() → throws on SimulationError

static async prepareSorobanTransaction(transaction): Promise<Transaction>
// simulateSorobanTransaction() → rpc.assembleTransaction()
// Extends timeBounds to now + 300s (prevents tx_too_late during passkey signing)
//   Note: sets preparedTx.timebounds directly (lowercase, SDK internal field)
// Fee: keeps assembleTransaction's fee (+ 15% margin logic present but commented)

static async extendContractTTL(contractId, ledgersToExtend = 500_000): Promise<result>
// getLedgerEntries(contract.getFootprint()) → checks if WASM-based (wasmHash present)
//   Wasm: footprint includes both instance key + contractCode key
//   SAC: instance key only
// Builds SorobanTransactionData manually with empty resources (simulation fills them)
// prepareSorobanTransaction() → signs with opsKeypair → signAndSubmitTransaction()
// Bypasses TransactionManager (automated maintenance, not admin-gated)

static async getContractTTL(contractId): Promise<{ exists, liveUntilLedger, currentLedger, ttlRemaining }>
// getLedgerEntries(instanceKey) + getLatestLedger() → computes ttlRemaining

static async listAccountAssets(publicKey): Promise<{ assetCode, assetIssuer, balance, isAuthorized }[]>
// stellarServer.loadAccount() → filters out native XLM → maps non-native balances
```

---

## 30 (revised). SorobanSaleService — Missing Method

```js
static async buildSacTransferXdr(sacContractId, from, to, amount): Promise<{ xdr, networkPassphrase }>
// sacContract.call('transfer', new Address(from).toScVal(), new Address(to).toScVal(), amountScVal)
// prepareSorobanTransaction() → toXDR('base64')
// Used by MultiSigTransactionService.processEffects() chain:
//   sale_create → buildSacAuthorizeXdr() → then buildSacTransferXdr() for initial deposit
```

---

## Final Line Count

```
wc -l: docs/Project_Bible/09_service_internals.md
```

*End of Gap Remediation Pass. All 31 services fully documented.*
