# 01 — Call Graph

> Full route → controller → service → external dependency map
> Generated: 2026-03-10 | **Method names verified against source: 2026-04-30**

---

## Investor Flows

### Registration (Email-First)
```
POST /api/investors/initiate-registration
  → investorRoutes (inline handler)
    → prisma.investor.findUnique
    → EmailService.sendVerificationEmail
    → prisma.systemConfig (store token)

POST /api/investors/verify-email-code
  → investorRoutes (inline)
    → prisma.systemConfig.findFirst (token lookup)
    → returns token

POST /api/investors/register
  → investorController.registerInvestorWithPasskey
    → prisma.investor.create
    → PasskeyWalletService.createSmartWallet (if passkey)
```

### Passkey Login (Discoverable)
```
GET /api/auth/passkey-login/discover
  → authRoutes (inline)
    → crypto.randomBytes → base64 challenge
    → in-memory challengeStore.set

POST /api/auth/passkey-login/discover
  → authRoutes (inline)
    → WebAuthnService.findUserByHandle (by credentialId)
    → maps to investor | companyUser | platformAdmin
    → jwt.sign (access + refresh)
    → res.cookie('refreshToken', httpOnly)
```

### Investment Purchase (Soroban)
```
POST /api/investments/purchase
  → investmentController.purchaseInvestment (routed via controller, NOT inline)
    → SorobanSaleService.buildTradeXdr
      → sorobanServer.getAccount
      → Contract.call('trade', buyer, amount)
      → sorobanServer.simulateTransaction
      → rpc.assembleTransaction
    → prisma.investment.create (status: pending_payment)
    → returns { xdr, investmentId }

POST /api/investments/submit-tx
  → investmentController.submitInvestmentTx
    → verifyInvestmentContext (HMAC integrity check)
    → idempotency guard (returns existing trade_submitted investment)
    → race-condition guard (409 on duplicate pending)
    → server-side offer/amount re-derivation
    → PasskeyWalletService.submitWithSponsorship (channels fee sponsorship)
    → prisma.investment.create (status: trade_submitted)
    → (async) SorobanEventIndexer picks up → distributed
```

### Wallet Operations
```
POST /api/investors/:id/withdraw/propose
  → InvestorController.proposeWithdrawal
    → PasskeyWalletService.buildWithdrawalTx
      → sorobanServer.getAccount
      → usdcSac.call('transfer', from, to, amount)
      → sorobanServer.simulateTransaction
    → returns { xdr }

POST /api/investors/withdraw/submit
  → InvestorController.submitWithdrawal
    → PasskeyWalletService.submitWithdrawalTx
      → sorobanServer.sendTransaction → poll
    → prisma.$transaction (update withdrawal record)
```

### Deposit Relay
```
POST /api/investors/:id/deposit/initiate
  → InvestorController.initiateDeposit
    → DepositRelayService.initiateDeposit
      → prisma.investor.findUnique (investor lookup)
      → crypto.createHash (deterministic memo from investorId)
      → returns { treasuryAddress, memo, status: 'ready' }
      ⚠️ NOTE: no prisma.deposit.create here — deposit record created on first payment received

(Background) PaymentMonitorService.start()
  → PaymentMonitorService.startStream() (Horizon SSE on treasury account)
    → on payment received with matching memo:
      → DepositRelayService.handleIncomingPayment
        → prisma.deposit.findUnique (by memo)
        → if not found: prisma.investor.findMany → computeMemo reverse-lookup → prisma.deposit.create
        → StellarService.withdrawFromTreasury → investor smart wallet
        → prisma.deposit.update (status: completed)
        → NotificationService.createNotification
```

---

## Company Flows

### Offer Lifecycle
```
POST /api/companies/offers (multer + FormData)
  → OfferController.createOffer
    → IPFSService.uploadFile (for each file)
      → pinata.upload.file → returns { cid, url }
    → prisma.offer.create (status: pending_review)

PUT /api/admin/offers/:id/review
  → OfferController.reviewOffer
    → prisma.offer.update (status: approved/rejected)
    → EmailService.sendOfferStatusUpdate

POST /api/admin/offers/:id/issue
  → OfferController.issueTokenFromOffer
    → StellarService.issueSecurityToken (forSaleContract: true)
      → Horizon: setOptions (home_domain, flags re-assertion — no distributor payment)
      → Tokens will be minted via SAC during sale activation
    → StellarService.deploySACForAsset (if needed)
      → sorobanServer.simulateTransaction
    → prisma.token.create
    → prisma.offer.update (status: admin_verified)

POST /api/admin/offers/:id/activate
  → OfferController.activateOffer
    → OfferService.activateOffer
      → SorobanSaleService.buildDeployXdr (sale_deploy)
      → MultiSigTransactionService.processEffects chain:
        → sale_create: contract.create(admin, seller, sell, buy, …)
        → contract_deposit_auth: SAC.set_authorized(contractAddr, true)
        → contract_deposit_transfer: SAC.transfer(issuer → contract, totalSupply) [MINTS]
        → contract_resume: contract.set_active(true)
    → prisma.offer.update (status: active, sorobanContractId)
```

### Company Payment to Investors
```
GET /api/company/payments
  → CompanyPaymentService.getUpcomingPayments
    → prisma.offer.findMany (company's active offers)
    → calculate per-investor interest amounts

POST /api/company/payments/:offerId/prepare
  → CompanyPaymentService.preparePaymentTransaction
    → build batch USDC transfer XDR (company → each investor)
    → sorobanServer.simulateTransaction
    → returns { xdr, breakdown, expiresAt }

POST /api/company/payments/:offerId/submit
  → CompanyPaymentService.processSignedBatches (multi-batch YieldDistributor path) or
    CompanyPaymentService.processSignedPayment (single XDR classic/Soroban path)
    → sorobanServer.sendTransaction → poll
    → prisma.interestPayment.createMany
    → prisma.offer.update (lastPaymentDate)
    → prisma.feeLog.create (platform fee — direct, not via ConfigService)
    → EmailService.sendInterestPaymentConfirmation (each investor)
```

---

## Admin Flows

### Freighter Login
```
POST /api/platform-admins/freighter/challenge
  → platformAdminRoutes (inline)
    → crypto challenge + SEP-10 style challenge TX (inline, no service call)
    → returns { challengeXdr, networkPassphrase }

POST /api/platform-admins/freighter/verify
  → platformAdminRoutes (inline)
    → TransactionBuilder.fromXDR → verify signature
    → prisma.platformAdmin.findUnique (by publicKey)
    → jwt.sign → res.cookie
```

### Multisig Transaction Lifecycle
```
POST /api/wallets/transactions (create proposal)
  → WalletController.createTransactionProposal
    → prisma.multiSigTransaction.create (direct — bypasses MultiSigTransactionService)
    → Note: MultiSigTransactionService.create() also exists and does the same via service layer,
      with additional Pusher broadcast. WalletController skips the service and calls Prisma directly.

GET /api/admin/transactions/:id/xdr
  → adminTransactionRoutes (inline)
    → prisma.multiSigTransaction.findUnique
    → (if Soroban) MultiSigTransactionService.rebuildSorobanXdr

POST /api/admin/transactions/:id/sign
  → adminTransactionRoutes (inline)
    → MultiSigTransactionService.addSignature
      → TransactionBuilder.fromXDR + Keypair.verify (cryptographic signature check)
      → prisma.multiSigTransaction.update (collectedSignatures, status)
      → Pusher broadcast ('signature-added')
      → ⚠️ AUTO-SUBMITS if thresholdMet: calls this.submit(txId) immediately

POST /api/admin/transactions/:id/submit
  → adminTransactionRoutes (inline)
    → MultiSigTransactionService.submit
      → stellarServer.submitTransaction
      → MultiSigTransactionService.processEffects
        → chains: issueSecurityToken → deploySACForAsset → buildDeployXdr → activateOffer
    → prisma.multiSigTransaction.update (status: executed)
```

### Investor KYC Approval
```
PUT /api/platform-admins/investors/:id/approve
  → PlatformAdminController.approveInvestor
    → prisma.investor.update (kycStatus: approved)
    → StellarService.authorizeAllUserTrustlines
      → for each active token: SET_TRUST_LINE_FLAGS(authorized)
    → EmailService.sendKYCApprovalEmail
    → NotificationService.createNotification
```

---

## Background Services Call Map

| Service | Trigger | Calls |
|---------|---------|-------|
| PaymentMonitorService | Startup (SSE streaming) | `PaymentMonitorService.startStream()` → `DepositRelayService.handleIncomingPayment` |
| PaymentReminderService | Cron (daily 09:00 UTC) | prisma queries → `EmailService.sendInterestPaymentConfirmation` / `sendBulletPaymentConfirmation` |
| CompanyPaymentService.checkOverduePayments | Cron (00:30 UTC) | prisma queries → prisma.offer.update → prisma.companyPenalty.create |
| MultiSigTransactionService.expireOldTransactions | Cron (midnight UTC) | prisma queries → prisma.multiSigTransaction.updateMany |
| BackupService.fullDatabaseDump | Cron (3:00 AM UTC) | child_process.exec(`pg_dump`) |
| MaintenanceService.checkAndExtendAllTTLs | Startup + daily 03:00 UTC | `StellarService.getContractTTL` → `StellarService.extendContractTTL` |
| SorobanEventIndexer | Startup (30s interval) | sorobanServer.getEvents → prisma.investment.update |
| SorobanReconciler | Startup (5min interval) | prisma queries → sorobanServer.getTransaction |
| SorobanMetrics | Startup (10min flush) | in-memory stats → `prisma.systemConfig.upsert` (stores metrics in SystemConfig) |
| YieldPaymentReconciler ⭐ | Startup / ENABLE_SOROBAN_SALE=true (5min interval) | prisma.yieldPaymentJob (stuck `submitting`) → `YieldDistributorService.submitSingleBatch` (resubmit) |
| WalletMonitorService ⭐ | Startup, always (5min interval) | stellarServer.loadAccount(opsWallet) → `EmailService.sendAdminAlert` |
