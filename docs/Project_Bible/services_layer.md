# Services Layer — Complete Inventory

> 31 files · ~14,439 lines · Initial read 2026-03-10 · Line counts updated 2026-04-29

---

## 1. Stellar Core

### stellar.service.js (2,101L)
**Role:** Full Stellar backbone — token issue, trust, SAC deploy, distribution, treasury ops, freeze/clawback, verification

| Method | Purpose |
|---|---|
| `issueSecurityToken` | Create + issue Stellar asset with auth flags (was `issueToken` in old doc) |
| `createIssuerAccount` | Provision issuer account with correct flags |
| `setupSponsoredTrustline` | Investor trustline for asset, fee-sponsored by Operations (was `createTrustline`) |
| `authorizeInvestor` | Authorize specific investor trustline (issuer-signed `SET_TRUST_LINE_FLAGS`) |
| `authorizeAllUserTrustlines` | Batch authorize all investor trustlines for an asset |
| `distributeTokens` | ISSUER → Investor (delegates to TransactionManager for multisig routing) |
| `withdrawFromTreasury` | Treasury → destination with muxed ID + multisig or direct signing |
| `deploySACForAsset` | Deploy Stellar Asset Contract (SAC) on Soroban |
| `ensureSACDeployed` | Idempotent SAC deploy: check DB → deploy if missing → persist contractId |
| `freezeAccount` / `unfreezeAccount` | Toggle issuer-level freeze on investor trustline |
| `clawbackTokens` | Clawback tokens from investor trustline |
| `disableClawbackForTrustline` | Remove clawback flag from trustline |
| `unlockToken` | Unlock asset (remove `AUTH_REVOCABLE` flag from issuer) |
| `getAccountRPC` | Soroban RPC account load (sequence-safe) |
| `getAccountInfo` | Horizon account info + trustlines |
| `getTokenBalance` | Token balance for account |
| `listAccountAssets` | All assets held by account |
| `listAssetHolders` | All holders of a specific asset |
| `prepareSorobanTransaction` | Simulate + prepare Soroban TX |
| `simulateSorobanTransaction` | Dry-run Soroban TX via RPC |
| `extendContractTTL` | Bump Soroban entry TTL |
| `getContractTTL` | Read remaining TTL from ledger |
| `getSACContractId` | Derive SAC contract ID from Asset |
| `buildUnsignedTransaction` | Build unsigned classic TX |
| `buildDisableClawbackOp` | Build setOptions op to remove clawback |
| `submitTransaction` | Submit raw XDR to Horizon |
| `verifyUSDCPayment` | Verify incoming USDC payment details on Horizon |

**Calls:** `TransactionManager`, `KeyManager`, `stellar.js` config, `prisma`
**Called by:** Almost everything — controllers, other services

---

### sorobanSale.service.js (921L)
**Role:** Soroban sale contract lifecycle wrapper — full XDR builder suite

| Method | Purpose |
|---|---|
| `buildDeployXdr` | Upload WASM + instantiate sale contract (XDR only, no submit) |
| `contractExistsOnChain` | Check if contractId exists on RPC (pre-deploy guard) |
| `buildCreateSaleXdr` | Build `create()` call XDR with sell/buy config, deadlines, limits |
| `buildTradeXdr` | Build `trade(buyer, amount)` XDR — unsigned, returned to frontend for passkey signing |
| `getOffer` | Read-only: full contract state |
| `getBalance` | Read-only: token balance in contract |
| `getBuyerSpent` | Read-only: amount buyer has spent |
| `isFrozen` | Read-only: freeze status of buyer |
| `getVersion` | Read-only: contract version |
| `buildSetActiveXdr` | Build `set_active()` — pause/resume contract |
| `buildEmergencyDrainXdr` | Build `emergency_drain()` — full drain to admin |
| `buildFreezeBuyerXdr` | Build `freeze_buyer()` / unfreeze |
| `buildWithdrawXdr` | Build `withdraw()` — partial token withdrawal |
| `buildProposeAdminXdr` | Build `propose_admin()` — 2-step admin transfer step 1 |
| `buildAcceptAdminXdr` | Build `accept_admin()` — 2-step admin transfer step 2 |
| `buildUpdatePriceXdr` | Build `updt_price()` |
| `buildUpgradeXdr` | Build `upgrade()` with new WASM hash |
| `buildSacAuthorizeXdr` | Build SAC `set_authorized()` for contract authorization |
| `authorizeBuyerOnSac` | Convenience: authorize buyer on SAC (inline submit) |
| `buildSacTransferXdr` | Build SAC `transfer()` for depositing tokens into contract |
| `buildIssuerThresholdSetupXdr` | Build classic setOptions for issuer multisig threshold config |
| `precomputeContractId` | Deterministic contract ID pre-computation (static, sync) |
| `parseContractError` | Parse Soroban contract error codes to human-readable (static, sync) |
| `toHttpError` | Map Soroban error to HTTP status (static, sync) |

**Calls:** `StellarService`, `KeyManager`, Soroban RPC
**Called by:** `offer.service.js`, `multiSigTransaction.service.js` (processEffects)

---

### transactionManager.service.js (88L)
**Role:** Unified routing — direct sign vs multisig queue

```
submit(opts) → KeyManager mode === 'multisig' 
    ? MultiSigTransactionService.create(…) 
    : sign + submit directly
```

**Calls:** `KeyManager`, `MultiSigTransactionService`, `stellar.js`
**Called by:** All services that need to submit Stellar TXs

---

### multiSigTransaction.service.js (1,205L)
**Role:** Full multisig lifecycle — create → approve → submit → side-effects

| Method | Purpose |
|---|---|
| `create` | Queue TX with XDR, operation type, required signers, expiration |
| `getById` | Fetch TX by ID with signers/signatures |
| `listPending` | List pending TXs (filterable by signer, type, status) |
| `addSignature` | Cryptographic signature verification + threshold check (was `signTransaction` in old doc) |
| `submit` | Submit TX when threshold met, update status |
| `reject` | Reject TX, run `processRejectionEffects` |
| `markExpired` | Mark single TX expired |
| `expireOldTransactions` | Batch expire all past-deadline TXs (daily 00:00 UTC cron) |
| `getStats` | Dashboard metrics |
| `rebuildSorobanXdr` | Rebuild Soroban XDR for re-signing (handles simulation refresh) |
| `processEffects` | **13 post-exec hooks** (chain operations) |
| `processRejectionEffects` | Rollback DB state on reject/expire |

**processEffects operation types:**
| Op | Side Effect |
|---|---|
| `token_issue` | Auto-deploy SAC → chain `sac_deploy` TX |
| `sac_deploy` | Update Token.sacContractId, chain `token_distribute` if investmentId |
| `token_distribute` | Update Investment status + TokenDistribution |
| `sale_deploy` | Chain `sale_create` TX |
| `sale_create` | Verify contract, extend TTL, chain `contract_resume` |
| `contract_resume` | Auto-activate offer in DB |
| `contract_deposit_auth` | Chain SAC transfer to contract |
| `contract_deposit_transfer` | Log completion |
| `treasury_payment` | Update Deposit status if deposit_relay |
| `dividend_distribution` | Record InterestPayments + send emails |

---

## 2. Smart Wallet (Passkeys)

### passkeyWallet.service.js (1,185L)
**Role:** Complete smart wallet lifecycle via `smart-account-kit` + OpenZeppelin Stellar Channels

| Method | Purpose |
|---|---|
| `deploySmartWallet` | OZ SmartAccountClient.deploy → Channels submission → DB update (stellarContractId) |
| `createSmartWallet` | High-level wrapper: deploySmartWallet + DB record creation for investor/companyUser |
| `hasSmartWallet` | Check if user has a deployed smart wallet (DB lookup) |
| `getWalletStatus` | Full wallet status: contract ID, balances, deployment state |
| `getSorobanWalletBalances` | Query USDC + XLM SAC balances for a contract ID |
| `buildInvestmentTx` | SAC transfer USDC investor→company (footprint handled by Channels) |
| `sendTransaction` | Channels submitTransaction → fee-bump fallback |
| `sendSorobanTransaction` | Channels submitSorobanTransaction (func+auth — auto footprint) |
| `submitWithSponsorship` | Submit XDR with Operations wallet fee sponsorship (non-Channels path) |
| `submitWithdrawalTx` | Validates contract allowlist before sponsoring |
| `buildWithdrawalTx` / `buildWithdrawalTxForCompany` | Build SAC transfer from smart wallet |
| ~~`addPasskeySigner` / `removePasskeySigner`~~ | ⚠️ **REMOVED** — required passkey auth, backend used wrong key |
| ~~`addEd25519Signer` / `removeEd25519Signer`~~ | ⚠️ **REMOVED** — same issue, signer management needs frontend-initiated flow |
| `listUserPasskeys` / `listEd25519Signers` | List all signers (DB read-only, active) |

**Architecture notes:**
- 2-tier submission: Channels → fee-bump fallback
- OZ smart-account contract uses External (passkey) and Delegated (Stellar account) signer types
- Channels handles footprint discovery + resource calculation for Soroban transactions

---

### webauthn.service.js (390L)
**Role:** WebAuthn full lifecycle across 3 user types (investor, companyUser, platformAdmin)

| Method | Purpose |
|---|---|
| `generateRegistrationOptions` | Generate WebAuthn registration challenge |
| `verifyRegistration` | Verify credential creation response |
| `saveCredential` | Store WebAuthn credential (was `registerCredential` in old doc) |
| `generateAuthenticationOptions` | Generate auth challenge for known credential |
| `generateDiscoverableAuthOptions` | Generate discoverable credential challenge (passkey login) |
| `verifyAuthentication` | Verify authentication response + update counter |
| `getUserCredentials` | List all credentials for user (was `getCredentialByUserId`) |
| `getCredentialById` | Lookup by raw credential ID |
| `findUserByHandle` | Lookup user by WebAuthn user handle |
| `updateCredentialCounter` | Increment replay counter (was `updateCounter`) |
| `updateCredentialLastUsed` | Track last-used timestamp |

*Private helpers (not in public API):* `getCredentialsTableName`, `getPrismaModel`, `getUserIdColumnName`, `getUserIdFieldName` — polymorphic model routing across 3 user types.

---

## 3. Payments & Dividends

### payment.service.js (513L)
**Role:** Maturity/bullet cron engine (heavily pruned Apr 2026 — periodic dividend methods moved to companyPayment.service.js; cron schedule methods removed)

| Method | Purpose |
|---|---|
| `getBalanceSource` | Locked=DB, Unlocked=on-chain routing decision |
| `getOnChainTokenBalance` | Query SAC balance via Soroban RPC |
| `getInvestorsWithBalancesByOffer` | Offer-aware investor+balance query (locked/unlocked routing) |
| `processBulletPayments` | Flip matured offers to `status: 'matured'`, notify company users |
| `getExpiredBulletOffers` | List offers past maturityDate |
| `processAllScheduledPayments` | Daily cron entry: calls processBulletPayments |

**Removed (migrated or deleted):** `getInvestorsWithBalances`, `calculateMonthlyInterest`, `createBatchUSDCPayment`, `processMonthlyInterestPayments`, `scheduleMonthlyPayments`, `scheduleQuarterlyPayments`, `scheduleSemiAnnualPayments` — all periodic-yield logic lives in `companyPayment.service.js` + `YieldDistributorService`.

---

### companyPayment.service.js (1,314L)
**Role:** Company-facing payment calculations, execution, and bullet maturity batch flow

| Method | Purpose |
|---|---|
| `calculateOwedAmount` | Per-investor interest breakdown (locked=DB, unlocked=on-chain) |
| `calculateBulletPayment` | Principal + accrued interest at maturity |
| `getUpcomingPayments` | All due payments for a company |
| ~~`processTokenSaleFees`~~ | **GHOST — method does not exist** in codebase (never implemented or removed; trade-time fees handled by Soroban contract `fixed_fee`) |
| `createPaymentTransaction` | Build unsigned TX — routes C-wallets through YieldDistributor, G-wallets through classic ops |
| `processSignedPayment` | Submit periodic TX directly + call `_recordPayments()` |
| `processSignedBatches` | Submit multi-batch YieldDistributor TXs sequentially with retry |
| `_recordPayments(prisma, offer, breakdown, opts)` | DRY helper: creates InterestPayment + FeeLog records (shared by periodic + bullet) |
| `checkOverduePayments` | Late fees (0.1%/day) + 10-day grace → default + CompanyPenalty |

**Periodic Yield Flow (Smart Wallet — YieldDistributor):**
1. `createPaymentTransaction()` detects C-wallet → routes to `YieldDistributorService.buildMultiBatchXdrs()`
2. >30 investors split into batches of 30. Each batch = 1 Soroban TX
3. DB write-through: `YieldPaymentJob` created at prepare, updated at submit
4. Company signs each batch XDR sequentially (1 passkey prompt per batch)
5. Backend submits signed XDRs sequentially with 3x retry + error classification
6. Partial failures → admin notified, retry via admin endpoints

**Bullet Maturity Flow (Soroban Settlement):**
1. Daily cron `processBulletPayments()` scans for `maturityDate ≤ today` and flips offer to `status: 'matured'`, notifies company users
2. Company initiates settlement: `prepare-deposit` → calculates total owed (principal + interest + spread)
3. Company submits USDC deposit to settlement contract via `submit-deposit`
4. Admin executes settlement: `SorobanSettlementService.executeFullSettlement()` → atomic USDC distribution + token burn
5. Offer transitions to `status: 'closed'`

> ⚠️ **Legacy Pipeline Removed:** The classic `maturity_clawback` multi-batch pipeline (49-investor caps, `setOptions` guard, `batch_pending` status) was fully decommissioned in Apr 2026. All bullet maturity payments now use the Soroban MaturitySettlement contract.

---

### yieldDistributor.service.js (485L)
**Role:** Multi-batch Soroban yield distribution via YieldDistributor contract

| Method | Purpose |
|---|---|
| `buildMultiBatchXdrs` | Split investor list into 30-per-batch XDRs. Each calls contract `distribute()` |
| `submitBatches` | Sequential submission with 3x retry + exponential backoff |
| `acquireLock` / `releaseLock` | Redis-based concurrency lock (`yield_lock:{offerId}`, 15-min TTL) |
| `classifyError` | Categorize errors: retryable (network/RPC) vs fatal (auth/contract) |
| `extendContractTtl` | Extend contract instance TTL via `extend_ttl()` |

**Calls:** `StellarService`, `KeyManager`, Redis
**Called by:** `companyPayment.service.js`

---

### paymentReminder.service.js (409L)
**Role:** Automated payment reminder scheduler

**Schedule:** Daily cron at 09:00 UTC
- 30d, 21d, 14d, 7d, 6-2d, 1d, due day → escalating emails + notifications
- Overdue: daily reminders with late fee calculation, 10-day grace period
- Updates `paymentDueStatus`: current → upcoming → due → overdue → defaulted

**Methods:** `startReminderScheduler`, `stopReminderScheduler`, `processReminders`, `sendReminder`, `sendOverdueReminder`, `updatePaymentDueStatus`, `getPeriodsPerYear`, `getReminderTitle`, `getReminderMessage`

---

### paymentMonitor.service.js (350L)
**Role:** Real-time Horizon payment stream (singleton)

- Watches treasury account for incoming payments
- Routes `DEP`-prefixed memos to `DepositRelayService`
- Handles 429 rate limiting with 30s base backoff
- Handles 404 (unfunded treasury) with 5-min retry
- Max 10 reconnect attempts before alert

---

### depositRelay.service.js (214L)
**Role:** Off-chain deposit → smart wallet forwarding

| Method | Purpose |
|---|---|
| `initiateDeposit` | Generate deterministic memo via `computeMemo` (static: DEP + sha256) |
| `handleIncomingPayment` | Create Deposit record on first payment, forward via treasury (was `processDeposit` in old doc) |
| `forwardAsset` | `StellarService.withdrawFromTreasury()` → smart wallet |
| `getInvestorDeposits` | List all deposits for an investor |
| `computeMemo` | Static: compute deterministic memo string (sha256 prefix) |

---

## 4. Collateral & Default

### collateralDistribution.service.js (352L)
**Role:** Admin-triggered collateral distribution on company default

| Method | Purpose |
|---|---|
| `getDefaultedOffers` | List defaulted offers with pro-rata distributions (locked=DB, unlocked=on-chain) |
| `getDefaultedOfferDetails` | Full detail for single defaulted offer (investors + balances + penalty) |
| `prepareCollateralDistribution` | Build unsigned batch payment TX |
| `processCollateralDistribution` | Submit + close offer + enforce penalties + notify investors |
| `getDefaultStatistics` | Dashboard: pending defaults, resolved, total pending penalties |

---

## 5. Offer Management

### offer.service.js (574L)
**Role:** Offer CRUD + Soroban contract deployment pipeline

| Method | Purpose |
|---|---|
| `createOffer` | Validate fields (payment, asset, limits) + prisma create |
| `reviewOffer` | Admin approve/reject + trigger Soroban chain via `issueTokenFromOffer` |
| `activateOffer` | Mark offer active after contract chain completes |
| `issueTokenFromOffer` | Entry point: token issue → SAC deploy → sale deploy → sale create (all via TransactionManager) |
| `retrySorobanInit` | Crash recovery: resume interrupted contract chain from last completed step |
| `getActiveOffers` | List active offers (with contract state) |
| `getOffersByType` | Filter offers by payment type / collateral |
| `getOfferInvestors` | Investors + their token balances for an offer |

---

## 6. Infrastructure Services

### alert.service.js (132L)
**Role:** Alert logging hub (6 methods: `paymentMonitorFailed`, `transactionFailed`, `sorobanEventFailed`, etc.)
**Note:** `distributionQueueFailed` was already removed from source (confirmed Round 6); doc note was stale.

### alertRouter.service.js (136L)
**Role:** Multi-channel alert routing: Slack webhook + PagerDuty + DB notifications
**Methods:** `send` (main router), `_sendSlack`, `_sendPagerDuty`, `_sendDbNotification`

### notification.service.js (121L)
**Role:** CRUD for in-app notifications
**Methods:** `createNotification`, `getUserNotifications`, `markAsRead`, `markAllAsRead`

### email.service.js (976L)
**Role:** Resend-based transactional email with 16 templates
**Methods:** `sendVerificationEmail`, `sendWelcomeEmail`, `send6DigitVerificationCode`, `resendVerificationEmail`, `sendInvestmentConfirmation`, `sendInterestPaymentConfirmation`, `sendBulletPaymentConfirmation`, `sendQuarterlyPaymentConfirmation`, `sendSemiAnnualPaymentConfirmation`, `sendKYCApprovalEmail`, `sendKYCRejectionEmail`, `sendCompanyStatusUpdate`, `sendOfferStatusUpdate`, `sendAdminAlert`, `generateVerificationToken`, `getVerificationExpiry`

### config.service.js (58L)
**Role:** SystemConfig CRUD + FeeLog management
**Methods:** `get`, `getFloat`, `logFee`

### backup.service.js (181L)
**Role:** Database pg_dump + retention management

---

## 7. Soroban Monitoring

### sorobanEventIndexer.js (329L)
**Role:** 30-second interval Soroban event poller

- Tracks all active sale contracts
- 8 event types: `trade`, `status`, `price`, `wdrw`, `drain`, `padmin`, `aadmin`, `freeze`
- Cursor persisted in SystemConfig
- Critical events (`wdrw`, `drain`, `padmin`, `aadmin`) → admin notifications

### sorobanMetrics.service.js (103L)
**Role:** In-memory trade latency tracking (avg, p95, min, max, error rate)
- Periodic flush to SystemConfig every 10 min

### sorobanReconciler.js (206L)
**Role:** Fix orphaned Soroban investments (every 5 min)

| Scenario | Action |
|---|---|
| TX succeeded on-chain, DB stuck | Fix to `distributed` |
| TX failed on-chain | Fix to `failed` |
| No TX hash after 10 min | Mark `failed` (stale) |
| `pending_payment` > 30 min | Auto-cancel |
| ≥5 orphans in one cycle | Alert via AlertRouter |

### yieldPaymentReconciler.js (150L)
**Role:** Fix orphaned yield payment jobs (every 5 min)

| Scenario | Action |
|---|---|
| TX confirmed on-chain, DB stuck in `submitting` | Fix to `confirmed` |
| Some TXs confirmed, some not | Fix to `partial_failure` |
| Job stale > 1 hour, no TXs | Mark `failed` |
| ≥3 stale jobs in one cycle | Alert via AlertRouter |

### maintenance.service.js (140L)
**Role:** Daily TTL extension sweep (03:00 UTC + startup)
**Methods:** `init()` (registers cron + runs at startup), `checkAndExtendAllTTLs()` (batch TTL check)

### walletMonitor.service.js (153L) ⭐ NEW (Apr 2026)
**Role:** Proactive Operations hot wallet balance monitor

| Method | Purpose |
|---|---|
| `start()` | Singleton guard: 10s startup delay → 5-min polling interval |
| `checkOperationsBalance()` | Loads Horizon account → XLM balance → threshold comparison |
| `_sendAlert(level, xlm)` | Non-blocking email to `ADMIN_ALERT_EMAIL` via `EmailService.sendAdminAlert()` |

**Thresholds:**
- `OPERATIONS_WALLET_WARNING_XLM` (default 20 XLM) → warn email
- `OPERATIONS_WALLET_CRITICAL_XLM` (default 5 XLM) → critical email

**Debounce logic:** Re-alerts only when severity *worsens* (ok→warn→critical). Resets on recovery above warn threshold. HTTP 404 on account = instant critical.

**Calls:** `stellarServer.loadAccount()` (Horizon — NOT Soroban RPC), `KeyManager`, `EmailService`
**Registered in:** `src/index.js:289` — `WalletMonitorService.start()`

---

## 7b. Soroban Maturity Settlement

### sorobanSettlement.service.js (579L) ⭐ NEW (Apr 2026)
**Role:** Backend wrapper for the MaturitySettlement Soroban contract

| Method | Purpose |
|---|---|
| `getSettlementWasmHash()` | Returns `SETTLEMENT_WASM_HASH` env var (throws if missing) |
| `deployForOffer(offerId)` | Deploy MaturitySettlement contract → stores `contractId` on offer |
| `buildInitializeXdr(offerId)` | Build `initialize()` call XDR (after deploy TX confirmed) |
| `buildDepositXdr(offerId, amount)` | Build company USDC→contract deposit XDR |
| `executeFullSettlement(offerId)` | Multi-batch `settle_batch()` → pays all investors + burns tokens |
| `buildWithdrawXdr(offerId)` | Admin leftover USDC withdrawal |
| `getContractBalance(offerId)` | Read-only: USDC held in contract |
| `extendTtl(offerId)` | Bump contract TTL |

**Contract Error Codes:** AlreadyInitialized(1), NotInitialized(2), InvalidAmount(3), Overflow(4), EmptyBatch(5), AlreadySettled(6), BatchTooLarge(7), NoDeposit(8), DuplicateInvestor(9), PhantomInvestor(10), FeeTooHigh(11)

**Lifecycle:**
1. Admin deploys + `initialize()` at offer approval (debt offers with maturityDate only)
2. On maturity: company submits USDC deposit → contract holds funds
3. Admin triggers `executeFullSettlement()` → atomic USDC distribution per token balance + token burn
4. Multi-batch (max 30 investors/batch)
5. Admin withdraws leftover USDC if any

**Admin endpoints:**
- `POST /api/admin/offers/:id/deploy-settlement` — deploy contract
- `POST /api/admin/offers/:id/init-settlement` — initialize contract (after deploy TX confirmed)
- `POST /api/admin/offers/:id/settlement-deposit` — admin builds deposit XDR (alternative to company-side flow)
- `POST /api/admin/offers/:id/settle` — execute multi-batch settlement (pays investors + burns tokens)
- `GET /api/admin/offers/:id/settlement-status` — contract balance + state

**Company endpoints:**
- `POST /api/company/payments/:offerId/prepare-deposit` — build deposit XDR for company signature
- `POST /api/company/payments/:offerId/submit-deposit` — submit signed deposit (notifies admins)
- `GET /api/company/payments/:offerId/settlement-status` — check contract balance

**Calls:** `StellarService`, `KeyManager`, Soroban RPC, `prisma`
**Called by:** `offerRoutes.js`, `companyPaymentRoutes.js`, `contractController.js`

---

## 8. TOML & IPFS

### toml.service.js (184L)
**Role:** Dynamic `stellar.toml` from DB — all tokens + offers with IPFS legal doc links (SEP-1)
**Methods:** `generateToml()`

### ipfs.service.js (146L)
**Role:** Pinata SDK wrapper — upload, fetch, validate CID. Mock mode if no `PINATA_JWT`

---

## 9. Identity & Keys

### KeyManager.js (464L)
**Role:** Key management with `env` (dev) and `multisig` (prod) modes
- Resolves keypairs for ISSUER, DISTRIBUTOR, TREASURY, OPERATIONS, CHANNEL_X
- Configures multisig thresholds

---

## 10. Metrics & Analytics

### investmentMetrics.service.js (283L)
**Role:** Dashboard analytics

| Method | Purpose |
|---|---|
| `getMetrics` | Counts by status, totals, success rate, avg processing time |
| `getStatisticsByPeriod` | Daily breakdown with unique investors |
| `getPendingInvestments` | Stale investments > 5 min old |
| `getFundraisingProgress` | Per-offer sold/target/percentage |
| `getRevenueBreakdown` | FeeLog aggregation by category |
| `getInvestorCohorts` | Active (30d) vs dormant investors |

---

## Cron Job Summary

| Schedule | Service | Job |
|---|---|---|
| Every 30s | `SorobanEventIndexer` | Poll contract events |
| Every 5m | `SorobanReconciler` | Fix orphaned investments |
| Every 5m | `YieldPaymentReconciler` | Fix stuck yield payment jobs |
| Every 5m ⭐ | `WalletMonitorService` | Operations wallet XLM balance check + alert |
| Every 10m | `SorobanMetrics` | Flush latency stats |
| Daily 00:00 UTC | `MultiSigTransactionService` | Expire old governance proposals (`expireOldTransactions`) ⭐ UNDOCUMENTED until this audit |
| Daily 00:30 UTC | `PaymentService` + `CompanyPaymentService` | Bullet maturity check (`processAllScheduledPayments`) + overdue payment check (`checkOverduePayments`) |
| Daily 03:00 UTC | `MaintenanceService` | TTL extension sweep (incl. YieldDistributor + settlement contracts) |
| Daily 03:00 UTC | `BackupService` | Full PostgreSQL dump (`fullDatabaseDump`) |
| Daily 09:00 UTC | `PaymentReminderService` | Payment reminder emails |
| ~~1st of month~~ | ~~`PaymentService`~~ | ~~Monthly interest payments~~ — **REMOVED** (methods deleted from payment.service.js). Monthly interest payments are **company-initiated** via `companyPaymentRoutes /payment-transaction` + frontend PayInvestors page |
| ~~1st of Jan/Apr/Jul/Oct~~ | ~~`PaymentService`~~ | ~~Quarterly payments~~ — **REMOVED** (same reason) |
| ~~1st of Jan/Jul~~ | ~~`PaymentService`~~ | ~~Semi-annual payments~~ — **REMOVED** (same reason) |

---

## Key Findings

### Dead Code
- ~~`alert.service.js` → `distributionQueueFailed()`~~ — **RESOLVED**: method was already removed (confirmed Round 6)
- ~~`payment.service.js` → `getOffersByPaymentTypeAndFrequency()`~~ — **REMOVED** with entire pruning of payment.service.js to 513L
- ~~`payment.service.js` → `processPeriodicPayments()`~~ — **REMOVED** with pruning

### Security Notes
- `submitWithdrawalTx` validates contract allowlist before sponsoring
- `buildInvestmentTx` footprint and resource calculation handled by Channels service
- Multisig signatures cryptographically verified before acceptance
- Withdrawal XDR validation: single op, invokeHostFunction only, known contracts, transfer function only

### Architecture Patterns
- **Balance source routing:** locked tokens → DB, unlocked → on-chain SAC query
- **2-tier TX submission:** Channels → fee-bump fallback
- **Chain operations:** processEffects cascades up to 5 TXs automatically
- **Crash recovery:** offer.service.js checks sorobanInitStatus on deploy
