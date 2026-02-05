---
tags: [backend, config, index]
status: verified
last_verified: 2026-02-05
---

# Backend Configuration

> **Path**: `backend/src/config/` | **Count**: 6 files

Configuration modules for external services and infrastructure.

---

## Config Overview

| File | Size | Purpose |
|------|------|---------|
| [[stellar.js]] | 16KB | Stellar SDK setup, keypairs, helpers |
| [[redis.js]] | 6KB | Redis client, token blocklist |
| [[sentry.js]] | 6KB | Error monitoring |
| [[swagger.js]] | 6KB | API documentation |
| [[prisma.js]] | 1KB | Database client singleton |
| [[pusher.js]] | 1KB | Real-time notifications |

---

## Detailed Descriptions

### [[stellar.js]] ⭐
> **Stellar SDK Configuration (16KB)**

**Exports:**
| Export | Purpose |
|--------|---------|
| `stellarServer` | Horizon server instance |
| `sorobanServer` | Soroban RPC instance |
| `getIssuerKeypair()` | Get issuer keypair |
| `getDistributorKeypair()` | Get distributor keypair |
| `getTreasuryKeypair()` | Get treasury keypair |
| `getOperationsKeypair()` | Get operations keypair |
| `getNetworkPassphrase()` | Network passphrase |
| `isTestnet()` | Network check |
| `getSorobanRpcUrl()` | Soroban RPC URL |
| `getUsdcIssuer()` | USDC issuer address |
| `createAsset(code, issuer)` | Create Asset object |
| `buildTransaction()` | Transaction builder |
| `signAndSubmitTransaction()` | Submit with fee bump |

**Uses:**
- [[KeyManager.js]] — Secure key access

---

### [[redis.js]]
> **Redis Client & Token Blocklist**

**Exports:**
- `redisClient` — Redis client instance
- `addToBlocklist(token)` — Block JWT
- `isBlocked(token)` — Check blocklist

**Blocklist TTL:** Matches JWT expiry (24h default)

---

### [[prisma.js]]
> **Database Client Singleton**

Simple singleton pattern:
```javascript
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
export default prisma;
```

---

### [[pusher.js]]
> **Real-time Notifications**

Configured Pusher client for:
- Investment status updates
- Payment notifications
- Admin alerts

---

### [[sentry.js]]
> **Error Monitoring**

Sentry SDK initialization with:
- Environment tagging
- Release tracking
- Performance monitoring

---

### [[swagger.js]]
> **API Documentation**

OpenAPI/Swagger configuration for `/api-docs` endpoint.

---

## Related

- [[overview/env_variables]] — Env var reference
- [[backend/_INDEX]] — Backend overview
- [[backend/services/_INDEX]] — Services
