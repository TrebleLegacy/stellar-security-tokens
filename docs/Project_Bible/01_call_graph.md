# 01 — Call Graph

> Full route → controller → service → external dependency map
> Generated: 2026-03-10

---

## Investor Flows

### Registration (Email-First)
```
POST /api/investors/initiate-registration
  → investorRoutes (inline handler)
    → prisma.investor.findUnique
    → EmailService.sendVerificationCode
    → prisma.registrationToken.create

POST /api/investors/verify-email-code
  → investorRoutes (inline)
    → prisma.registrationToken.findFirst
    → returns registrationToken

POST /api/investors/register
  → InvestorController.registerInvestor
    → InvestorService.registerWithPasskey
      → prisma.investor.create
      → prisma.registrationToken.delete
```

### Passkey Login (Discoverable)
```
GET /api/auth/passkey-login/discover
  → authRoutes (inline)
    → crypto.randomBytes → base64 challenge
    → in-memory challengeStore.set

POST /api/auth/passkey-login/discover
  → authRoutes (inline)
    → prisma.passkeyCredential.findFirst (by credentialId)
    → maps to investor | companyUser | company
    → jwt.sign (access + refresh)
    → res.cookie('refreshToken', httpOnly)
```

### Investment Purchase (Soroban)
```
POST /api/investments/purchase
  → investmentRoutes (inline handler)
    → SorobanSaleService.buildTradeTx
      → sorobanServer.getAccount
      → Contract.call('trade', buyer, amount)
      → sorobanServer.simulateTransaction
      → rpc.assembleTransaction
    → prisma.investment.create (status: pending_payment)
    → returns { xdr, investmentId }

POST /api/investments/submit-tx
  → investmentRoutes (inline handler)
    → SorobanSaleService.submitSignedTx
      → sorobanServer.sendTransaction
      → poll getTransaction (30 attempts)
    → prisma.investment.update (status: trade_submitted)
    → (async) SorobanEventIndexer picks up → distributed
```

### Wallet Operations
```
POST /api/investors/:id/withdraw/propose
  → InvestorController.proposeWithdrawal
    → PasskeyWalletService.buildUsdcWithdrawal
      → sorobanServer.getAccount
      → usdcSac.call('transfer', from, to, amount)
      → sorobanServer.simulateTransaction
    → returns { xdr }

POST /api/investors/withdraw/submit
  → InvestorController.submitWithdrawal
    → PasskeyWalletService.submitSignedTransaction
      → sorobanServer.sendTransaction → poll
    → prisma.$transaction (update withdrawal record)
```

### Deposit Relay
```
POST /api/investors/:id/deposit/initiate
  → InvestorController.initiateDeposit
    → DepositRelayService.initiateDeposit
      → prisma.deposit.create (memo = unique ID)
      → returns { treasuryAddress, memo, expectedAmount }

(Background) PaymentMonitor.start()
  → StellarService.streamPayments (treasury account)
    → on payment received with matching memo:
      → DepositRelayService.processDeposit
        → PasskeyWalletService.forwardToSmartWallet
          → usdcSac.call('transfer', treasury → investor wallet)
        → prisma.deposit.update (status: completed)
        → NotificationService.create
```

---

## Company Flows

### Offer Lifecycle
```
POST /api/companies/offers (multer + FormData)
  → OfferController.createOffer
    → PinataService.uploadDocument (for each file)
      → pinata.pinFileToIPFS → returns { hash, url }
    → prisma.offer.create (status: pending_review)

PUT /api/admin/offers/:id/review
  → OfferController.reviewOffer
    → prisma.offer.update (status: approved/rejected)
    → EmailService.sendOfferReview

POST /api/admin/offers/:id/issue
  → OfferController.issueToken
    → StellarService.issueToken (forSaleContract: true)
      → Horizon: setOptions (home_domain, flags re-assertion — no distributor payment)
      → Tokens will be minted via SAC during sale activation
    → StellarService.deploySAC (if needed)
      → sorobanServer.simulateTransaction
    → prisma.token.create
    → prisma.offer.update (status: admin_verified)

POST /api/admin/offers/:id/activate
  → OfferController.activateOffer
    → OfferService.activateOffer
      → SorobanSaleService.buildDeployXdr (sale_deploy)
      → processEffects chain:
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
  → CompanyPaymentService.submitSignedPayment
    → sorobanServer.sendTransaction → poll
    → prisma.interestPayment.createMany
    → prisma.offer.update (lastPaymentDate)
    → FeeService.logFee (platform fee)
    → EmailService.sendPaymentNotification (each investor)
```

---

## Admin Flows

### Freighter Login
```
POST /api/platform-admins/freighter/challenge
  → platformAdminRoutes (inline)
    → StellarService.buildChallengeTx (SEP-10 style)
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
  → WalletController.createProposal
    → MultiSigTransactionService.createProposal
      → prisma.multiSigTransaction.create

GET /api/admin/transactions/:id/xdr
  → adminTransactionRoutes (inline)
    → prisma.multiSigTransaction.findUnique
    → (if Soroban) rebuild XDR with fresh simulation

POST /api/admin/transactions/:id/sign
  → adminTransactionRoutes (inline)
    → MultiSigTransactionService.addSignature
      → prisma.multiSigTransaction.update

POST /api/admin/transactions/:id/submit
  → adminTransactionRoutes (inline)
    → MultiSigTransactionService.submitTransaction
      → stellarServer.submitTransaction
      → MultiSigTransactionService.executePostHooks
        → chains: issueToken → deploySAC → deployContract → activate
    → prisma.multiSigTransaction.update (status: executed)
```

### Investor KYC Approval
```
PUT /api/platform-admins/investors/:id/approve
  → PlatformAdminController.approveInvestor
    → prisma.investor.update (kycStatus: approved)
    → StellarService.whitelistInvestorForAllTokens
      → for each active token: changeTrust + setTrustLineFlags(authorized)
    → EmailService.sendKycApproval
    → NotificationService.create
```

---

## Background Services Call Map

| Service | Trigger | Calls |
|---------|---------|-------|
| PaymentMonitor | Startup (streaming) | StellarService.streamPayments → DepositRelayService |
| PaymentReminderService | Cron (daily) | prisma queries → EmailService.sendPaymentReminder |
| CompanyPaymentService.checkOverduePayments | Cron (00:30 UTC) | prisma queries → prisma.offer.update → prisma.companyPenalty.create |
| MultiSigTransactionService.expireOldTransactions | Cron (midnight UTC) | prisma queries → prisma.multiSigTransaction.updateMany |
| BackupService.fullDatabaseDump | Cron (3:00 AM UTC) | child_process.exec(`pg_dump`) |
| MaintenanceService | Startup (interval) | StellarService.getContractTTL → SorobanSaleService.extendTTL |
| SorobanEventIndexer | Startup (30s interval) | sorobanServer.getEvents → prisma.investment.update |
| SorobanReconciler | Startup (5min interval) | prisma queries → sorobanServer.getTransaction |
| SorobanMetrics | Startup (10min flush) | prisma aggregations → prisma.sorobanMetric.upsert |
