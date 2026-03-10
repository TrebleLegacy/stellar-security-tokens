# 05 — Configuration & Environment Map

> Every environment variable, its purpose, required/optional status, and default value
> Generated: 2026-03-10

---

## Runtime Modes

| Variable | Values | Effect |
|----------|--------|--------|
| `NODE_ENV` | `development` / `production` | Debug routes enabled, error detail in responses, Sentry enabled |
| `KEY_MANAGEMENT_MODE` | `env` / `multisig` | `env`: server signs with secret keys. `multisig`: Freighter/Ledger signing |
| `ENABLE_SOROBAN_SALE` | `true` / `false` | Enables event indexer, reconciler, metrics, Soroban dashboard |
| `ENABLE_PAYMENT_MONITORING` | `true` / `false` | Enables deposit relay (PaymentMonitor streaming) |
| `ENABLE_AUTO_PAYMENTS` | `true` / `false` | Enables payment reminder scheduler |

---

## Full Variable Inventory

### Database
| Variable | Required | Default | Used By |
|----------|----------|---------|---------|
| `DATABASE_URL` | ✅ Prod | `postgresql://postgres:postgres@postgres:5432/stellar_tokens` | Prisma |
| `DB_HOST` | — | `postgres` | docker-compose |
| `DB_PORT` | — | `5432` | docker-compose |
| `DB_NAME` | — | `stellar_tokens` | docker-compose |
| `DB_USER` | — | `postgres` (dev), `stellar_prod` (prod) | docker-compose |
| `DB_PASSWORD` | ✅ Prod | `postgres` (dev) | docker-compose |
| `POSTGRES_PASSWORD` | ✅ Prod | — | docker-compose.prod |

### Stellar Network
| Variable | Required | Default | Used By |
|----------|----------|---------|---------|
| `STELLAR_NETWORK` | ❌ | `testnet` (dev), `public` (prod) | stellar.js config |
| `STELLAR_HORIZON_URL` | ❌ | Auto from network | StellarService |
| `HORIZON_URL` | ❌ | Same as above | Legacy alias |
| `SOROBAN_RPC_URL` | ❌ | `https://soroban-testnet.stellar.org` | SorobanSaleService |
| `STELLAR_HOME_DOMAIN` | ❌ | — | TomlService (SEP-1) |

### Stellar Accounts — Public Keys
| Variable | Required | Default | Used By |
|----------|----------|---------|---------|
| `ISSUER_PUBLIC_KEY` | ✅ | — | StellarService (token issuance) |
| `DISTRIBUTOR_PUBLIC_KEY` | ✅ | — | StellarService (token distribution) |
| `OPERATIONS_PUBLIC_KEY` | ✅ | — | StellarService (gasless sponsoring) |
| `TREASURY_PUBLIC_KEY` | ✅ | — | Deposit relay, withdrawal, payments |

### Stellar Accounts — Secret Keys (env mode only)
| Variable | Required | Default | Used By |
|----------|----------|---------|---------|
| `ISSUER_SECRET_KEY` | Only in env mode | — | StellarService |
| `DISTRIBUTOR_SECRET_KEY` | Only in env mode | — | StellarService |
| `TREASURY_SECRET_KEY` | Only in env mode | — | platformAdminRoutes (sponsor) |
| `OPERATIONS_SECRET_KEY` | Only in env mode | — | StellarService (gasless) |

### Soroban / Smart Wallets
| Variable | Required | Default | Used By |
|----------|----------|---------|---------|
| `LAUNCHTUBE_URL` | ❌ | `https://launchtube.xyz` | PasskeyWalletService |
| `LAUNCHTUBE_JWT` | ✅ Prod | — | PasskeyWalletService |
| `FACTORY_CONTRACT_ID` | ✅ Prod | — | PasskeyWalletService (wallet deploy) |
| `SALE_WASM_HASH` | When Soroban enabled | — | SorobanSaleService (deploy) |
| `XLM_SAC_CONTRACT_ID` | ✅ | Testnet default | platformAdminRoutes (sponsor) |
| `USDC_SAC_CONTRACT_ID` | ✅ | Testnet default | PasskeyWalletService (balances) |
| `USDC_ISSUER` | ❌ | Auto-detected from network | StellarService |

### Security
| Variable | Required | Default | Used By |
|----------|----------|---------|---------|
| `JWT_SECRET` | ✅ | `change_this_in_production` ⚠️ | auth middleware |
| `API_KEY` | ❌ | — | API key middleware |

### WebAuthn / Passkeys
| Variable | Required | Default | Used By |
|----------|----------|---------|---------|
| `WEBAUTHN_RP_ID` | ✅ Prod | `localhost` | WebAuthnService |
| `WEBAUTHN_ORIGIN` | ✅ Prod | `http://localhost:5173` | WebAuthnService |
| `WEBAUTHN_RP_NAME` | ❌ | `Stellar Tokens` | WebAuthnService |

### Email (Resend)
| Variable | Required | Default | Used By |
|----------|----------|---------|---------|
| `RESEND_API_KEY` | ❌ | — (emails silently skip if missing) | EmailService |
| `EMAIL_FROM` | ❌ | `Radox <noreply@mail.radox.net>` | EmailService |

### Redis
| Variable | Required | Default | Used By |
|----------|----------|---------|---------|
| `REDIS_HOST` | ❌ | `redis` | redis.js config |
| `REDIS_PORT` | ❌ | `6379` | redis.js config |
| `REDIS_PASSWORD` | ❌ | — | redis.js config |

### External Services
| Variable | Required | Default | Used By |
|----------|----------|---------|---------|
| `PINATA_JWT` | ❌ | — | PinataService (IPFS uploads) |
| `SENTRY_DSN` | ❌ | — | Backend Sentry |
| `FRONTEND_URL` | ✅ Prod | `http://localhost` | CORS, email links |
| `PORT` | ❌ | `3000` | Express server |

### Frontend (Vite Build-Time)
| Variable | Required | Default | Used By |
|----------|----------|---------|---------|
| `VITE_API_URL` | ❌ | `/api` (prod), `http://localhost:3000/api` (dev) | API client |
| `VITE_STELLAR_NETWORK` | ❌ | — | Frontend config |
| `VITE_SOROBAN_RPC_URL` | ❌ | — | Frontend config |
| `VITE_STELLAR_NETWORK_PASSPHRASE` | ❌ | — | Frontend config |
| `VITE_FACTORY_CONTRACT_ID` | ❌ | — | PasskeyKit init |
| `VITE_SENTRY_DSN` | ❌ | — | Frontend Sentry |
| `VITE_APP_VERSION` | ❌ | `1.0.0` | Sentry release tag |
| `VITE_PUSHER_KEY` | ❌ | — | Pusher client |
| `VITE_PUSHER_CLUSTER` | ❌ | — | Pusher client |

### Docker Secrets (Production)
| Secret | Path | Used By |
|--------|------|---------|
| `operations_key` | `/root/.secrets/operations_key` → `/run/secrets/operations_key` | StellarService (gasless ops) |
