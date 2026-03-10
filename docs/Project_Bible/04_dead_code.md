# 04 — Dead Code Inventory

> Code that is unused, unreachable, or superseded
> Generated: 2026-03-10

---

## Confirmed Dead Code

| File | Code | Reason | Action |
|------|------|--------|--------|
| `frontend/src/api/auth.ts` | `investorLogin`, `companyLogin` | Legacy password login — all auth now via passkeys | **DELETE file** |
| `frontend/src/types/index.ts` | `RegisterInvestorForm.password`, `RegisterInvestorForm.confirmPassword` | Password fields — passkey registration has no passwords | **Remove fields** |
| `frontend/src/types/index.ts` | `Investor.password_hash` | Password hash — no longer stored | **Remove field** |
| `backend/src/services/transactionManager.service.js` | Entire file | Classic distribution pipeline — superseded by Soroban sale contracts | **Review → DELETE** |
| `backend/src/services/alert.service.js` | `distributionQueueFailed()` | References removed Bull queue — queue system deleted | **Remove method** |

## Potentially Dead Code (Needs Verification)

| File | Code | Reason | Action |
|------|------|--------|--------|
| `backend/src/services/payment.service.js` | Entire file | Classic manual payment distribution — may overlap with CompanyPaymentService | **Audit → likely DELETE** |
| `backend/src/controllers/investorController.js` | Legacy 3-step registration (non-email-first) | Old flow before email-first was added | **Verify no routes point to it** |
| `frontend/src/lib/api.ts` | `ApiClient` class (192L) | Duplicate of `api/client.ts` (Axios). Only used by `lib/passkey.ts` | **Migrate passkey.ts to Axios → DELETE** |
| `backend/src/routes/investorRoutes.js` | `POST /verify-email`, `POST /resend-verification` | Legacy email verification — email-first flow uses `/verify-email-code` | **Verify unused → DELETE** |

## Superseded Patterns

| Pattern | Old | New | Files Affected |
|---------|-----|-----|----------------|
| Password auth | `bcrypt` hash + compare | Passkey (WebAuthn) | investorController, authRoutes |
| Manual token distribution | TransactionManagerService | Soroban sale contract `trade()` | transactionManager.service.js |
| Bull job queue | Bull + Redis queues | Direct async + SorobanEventIndexer | References in alert.service.js |
| Single-step registration | Direct /register | Email-first 3-step flow | investorRoutes, companyRoutes |

## Redundancy (Not Dead, But Should Consolidate)

| Redundancy | Files | Recommendation |
|------------|-------|----------------|
| Passkey config endpoint | 4 route files return same config | Single shared endpoint |
| Wallet status endpoint | investorRoutes, companyRoutes, companyUserRoutes | Shared utility |
| SAC sponsor code | platformAdminRoutes L1055-1207 vs L1403-1555 (~300L duplicated) | Extract to SponsorService |
| Challenge store | authRoutes (in-memory Map) + platformAdminRoutes (in-memory Map) | Move to Redis |
