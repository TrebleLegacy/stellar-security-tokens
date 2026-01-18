# Production Multisig Migration Guide

> **Status**: For later implementation. Currently using .env wallets for testing.

---

## Current State

- `KEY_MANAGEMENT_MODE=env` (default) - auto-signs with .env secret keys
- All multisig infrastructure is built and ready
- Frontend supports Ledger + Freighter signing

---

## When Ready: Migration Steps

### 1. Get Hardware Wallets
- You: Ledger Nano S/X (~$79)
- Partner: Ledger or Freighter browser extension

### 2. Setup Multisig on Stellar Accounts
```bash
cd backend

# Treasury: 2-of-2 (you + partner)
npm run multisig:setup -- -a treasury \
  -s GYOUR_LEDGER_PUBKEY... \
  -s GPARTNER_PUBKEY... \
  -t 2

# Distributor: 2-of-2 (automation + approval)  
npm run multisig:setup -- -a distributor \
  -s GAUTOMATION_PUBKEY... \
  -s GYOUR_LEDGER_PUBKEY... \
  -t 2

# Lock issuer after final token issuance
npm run multisig:setup -- -a issuer --lock
```

### 3. Update .env for Production
```bash
# REMOVE secret keys (except operations)
# ISSUER_SECRET_KEY=      # DELETE
# TREASURY_SECRET_KEY=    # DELETE
# DISTRIBUTOR_SECRET_KEY= # DELETE

# KEEP operations as hot wallet
OPERATIONS_SECRET_KEY=S...

# Enable multisig mode
KEY_MANAGEMENT_MODE=multisig

# Configure signers
TREASURY_SIGNERS=GPUBKEY1,GPUBKEY2
TREASURY_THRESHOLD=2
```

### 4. Wire Up Operations (TODO)

Services that need modification to call `MultiSigTransactionService.create()`:
- [ ] Token distribution (`tokenService.js`)
- [ ] Interest payments (`paymentService.js`)
- [ ] Clawbacks (`emergencyService.js`)
- [ ] Trustline authorization (`trustlineService.js`)

---

## Account Security Summary

| Account | Production Setup | Notes |
|---------|-----------------|-------|
| Issuer | Locked (master=0) | Cannot mint after lock |
| Treasury | 2-of-2 multisig | Holds investor USDC |
| Distributor | 2-of-2 multisig | Token distribution |
| Operations | Hot wallet | Gas fees, limited funds |

---

## Files Reference

| File | Purpose |
|------|---------|
| `services/KeyManager.js` | Mode switching logic |
| `services/multiSigTransaction.service.js` | Transaction queue |
| `routes/adminTransactionRoutes.js` | Admin signing API |
| `scripts/setup-multisig.js` | Account configuration |
| `pages/admin/PendingTransactions.tsx` | Signing UI |
