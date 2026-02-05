---
tags: [audit, deprecation, maintenance]
status: verified
last_verified: 2026-02-05
---

# Deprecation Audit Report

> Comprehensive code audit following Anthropic best practices

---

## Executive Summary

| Category | Count | Severity |
|----------|-------|----------|
| Actionable TODOs | 4 | 🟡 Medium |
| Console.log in production | ~50+ | 🟡 Medium |
| Duplicate/Redundant Files | 0 | ✅ None |
| Deprecated Code Markers | 0 | ✅ None |
| Orphaned Files | 0 | ✅ None |

**Overall Assessment**: 🟢 Codebase is clean with no major deprecated code.

---

## 1. Actionable TODOs

These represent incomplete features that should be addressed:

### Backend TODOs

| File | Line | Description | Priority |
|------|------|-------------|----------|
| `alert.service.js` | 44 | `// TODO: Implementar integrações externas` | Low |
| `companyController.js` | 202-203 | Send registration email/notification to admins | Medium |
| `offerController.js` | 916 | Save stellar.toml to web server | Low |

### Recommendation
- **Email notifications**: Should be implemented for company registration flow
- **TOML saving**: Currently handled via Pinata but manual save may be needed

---

## 2. Console.log Usage

Found ~50+ `console.log` statements in production services:

### Services with Console.log

| Service | Approx Count | Purpose |
|---------|--------------|---------|
| `paymentMonitor.service.js` | ~15 | Stream debugging |
| `multiSigTransaction.service.js` | ~10 | TX lifecycle |
| `depositRelay.service.js` | ~5 | Relay debugging |
| `companyPayment.service.js` | ~8 | Payment processing |
| `maintenance.service.js` | ~6 | TTL maintenance |
| `KeyManager.js` | ~4 | Initialization |

### Recommendation
- **Action**: Replace with proper logging (e.g., `logger.info()`)
- **Exception**: Keep for development/debugging if intentional
- **Priority**: Low (operational logging, not noise)

---

## 3. Potential Duplicates (False Positive)

### `usePasskey.ts` vs `usePasskeys.ts`

Upon investigation, these are **NOT duplicates**:

| File | Purpose | Usage |
|------|---------|-------|
| `usePasskey.ts` (18 lines) | Simple transaction signing wrapper | Used in 2 pages |
| `usePasskeys.ts` (194 lines) | Multi-device passkey management (add/remove/list) | Settings page |

**Verdict**: ✅ Both are necessary and serve different purposes.

---

## 4. Stale Comments (HACK)

Found 1 HACK comment:

```javascript
// ipfs.service.js:67
// We attach the name via a File object construction or hacked blob if File is not global
```

**Verdict**: This is a legitimate workaround for Node.js File API compatibility, not technical debt.

---

## 5. Environment Files

| File | Status | Notes |
|------|--------|-------|
| `.env` | Active | Main config |
| `.env.example` | Needed | Template |
| `.env.development` | Active | Dev overrides |
| `.env.production` | Active | Prod config |
| `.env.production.example` | ⚠️ Consider merge | Could merge with `.env.production.template` |
| `.env.production.template` | ⚠️ Consider merge | Redundant with above |

### Recommendation
Consolidate `.env.production.example` and `.env.production.template` into a single template.

---

## 6. Orphaned Test Files

No orphaned tests detected. All test files in `backend/tests/` correspond to active source files.

---

## Summary Actions

| Action | Priority | Effort |
|--------|----------|--------|
| Implement company registration emails | Medium | 2h |
| Replace console.log with proper logger | Low | 4h |
| Consolidate .env.production templates | Low | 15min |

---

## Conclusion

The codebase is in **good health** with no critical deprecated code or orphaned files. The few TODOs are feature-related rather than technical debt. Console.log usage is primarily for operational visibility and can be addressed gradually.
