# 05 — Configuration & Environment Map

> Every environment variable, its purpose, required/optional status, and default value
> Generated: 2026-03-10 · Updated: 2026-04-29

---

## Runtime Modes

| Variable | Values | Effect |
|----------|--------|--------|
| `NODE_ENV` | `development` / `production` | Debug routes enabled, error detail in responses, Sentry enabled |
| `KEY_MANAGEMENT_MODE` | `env` / `multisig` | `multisig`: Freighter/Ledger signing (dev & prod default). `env`: server signs with secret keys (test scripts only) |
| `ENABLE_SOROBAN_SALE` | `true` / `false` | Enables event indexer, reconciler, metrics, Soroban dashboard |
| `ENABLE_PAYMENT_MONITORING` | `true` / `false` | Enables deposit relay (PaymentMonitor streaming) |

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
| `OPERATIONS_SECRET_KEY` | Both modes (hot wallet) | — | StellarService (gasless) |

### Soroban / Smart Wallets
| Variable | Required | Default | Used By |
|----------|----------|---------|---------|
| `CHANNELS_API_KEY` | ✅ Prod | — | PasskeyWalletService (Channels fee sponsorship) |
| `ACCOUNT_WASM_HASH` | ✅ Prod | — | PasskeyWalletService (wallet deploy) |
| `WEBAUTHN_VERIFIER_ADDRESS` | ✅ Prod | — | PasskeyWalletService (passkey signer) |
| `ED25519_VERIFIER_ADDRESS` | ✅ Prod | — | PasskeyWalletService (Ledger signer) |
| `SALE_WASM_HASH` | When Soroban enabled | — | SorobanSaleService (deploy) |
| `SETTLEMENT_WASM_HASH` | ✅ Required for debt offers ⭐ | — | SorobanSettlementService. **Kill chain:** missing value does NOT fail at startup \u2014 silently absent. Fails only when admin calls `deploy-settlement` on a matured debt offer. Offer gets stuck in `matured` state with no automated recovery. Set **before** any debt offer is approved. |
| `XLM_SAC_CONTRACT_ID` | ✅ | Testnet default | platformAdminRoutes (sponsor) |
| `USDC_SAC_CONTRACT_ID` | ✅ | Testnet default | PasskeyWalletService (balances) |
| `YIELD_DISTRIBUTOR_CONTRACT_ID` | When Soroban enabled | — | YieldDistributorService (batched yield payments) |
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
| `PINATA_GATEWAY` | ❌ | — | PinataService (IPFS gateway URL for content retrieval) |
| `SENTRY_DSN` | ❌ | — | Backend Sentry |
| `FRONTEND_URL` | ✅ Prod | `http://localhost` | CORS, email links |
| `PORT` | ❌ | `3000` | Express server |
| `TRUSTED_API_KEY` | ❌ | — | Internal service-to-service API key |
| `ALLOW_TEST_MODE` | ❌ | — | Enables test-mode bypasses in non-production |

### Operations Wallet Monitoring ⭐ NEW (Apr 2026)
| Variable | Required | Default | Used By |
|----------|----------|---------|---------|
| `ADMIN_ALERT_EMAIL` | ✅ Prod | — | WalletMonitorService (alert destination). If unset, alerts log only — no email. |
| `OPERATIONS_WALLET_WARNING_XLM` | ❌ | `20` | WalletMonitorService (warn threshold in XLM) |
| `OPERATIONS_WALLET_CRITICAL_XLM` | ❌ | `5` | WalletMonitorService (critical threshold in XLM) |

### Alert Routing (alertRouter.service.js)
| Variable | Required | Default | Used By |
|----------|----------|---------|---------|
| `ALERT_SLACK_WEBHOOK_URL` | ❌ | — | AlertRouterService — Slack notifications for critical events |
| `ALERT_PAGERDUTY_ROUTING_KEY` | ❌ | — | AlertRouterService — PagerDuty escalation |

### Operational Tunables
| Variable | Required | Default | Used By |
|----------|----------|---------|---------|
| `LOG_LEVEL` | ❌ | `info` | Logging verbosity |
| `EMAIL_VERIFICATION_EXPIRY_HOURS` | ❌ | `24` | investorRoutes email-first registration code TTL |
| `PAYMENT_MONITOR_RECONNECT_DELAY` | ❌ | `30000` | paymentMonitor.service.js Horizon reconnect base delay (ms) |
| `USDC_PAYMENT_WINDOW_MINUTES` | ❌ | — | Deposit relay USDC deduplication window |
| `TREASURY_SIGNERS` | ❌ | — | JSON array of authorized treasury signers for multisig mode |

### Backup Service
| Variable | Required | Default | Used By |
|----------|----------|---------|---------|
| `BACKUP_DIR` | ❌ | `/backups` | backup.service.js pg_dump destination |
| `BACKUP_RETENTION_DAYS` | ❌ | `30` | backup.service.js retention policy |

### Frontend (Vite Build-Time)
| Variable | Required | Default | Used By |
|----------|----------|---------|---------|
| `VITE_API_URL` | ❌ | `/api` (prod), `http://localhost:3000/api` (dev) | API client |
| `VITE_STELLAR_NETWORK` | ❌ | — | Frontend config |
| `VITE_SOROBAN_RPC_URL` | ❌ | — | Frontend config |
| `VITE_STELLAR_NETWORK_PASSPHRASE` | ❌ | — | Frontend config |
| `VITE_SENTRY_DSN` | ❌ | — | Frontend Sentry |
| `VITE_APP_VERSION` | ❌ | `1.0.0` | Sentry release tag |
| ~~`VITE_PUSHER_KEY`~~ | — | — | **Deleted** (commit 7aad8c3) — frontend pusher-js client removed |
| ~~`VITE_PUSHER_CLUSTER`~~ | — | — | **Deleted** (commit 7aad8c3) |

### Backend Real-time (Pusher SDK — optional)
Backend `config/pusher.js` exists and is used by `multiSigTransaction.service.js`. Graceful no-op if unconfigured.
| Variable | Required | Default | Used By |
|----------|----------|---------|---------| 
| `PUSHER_APP_ID` | ❌ | — | `config/pusher.js` — Pusher server SDK |
| `PUSHER_KEY` | ❌ | — | `config/pusher.js` — also used as "configured" guard |
| `PUSHER_SECRET` | ❌ | — | `config/pusher.js` |
| `PUSHER_CLUSTER` | ❌ | — | `config/pusher.js` |
| `PUSHER_USE_TLS` | ❌ | `false` | `config/pusher.js` |


### Docker Secrets (Production)
| Secret | Path | Used By |
|--------|------|---------|
| `operations_key` | `/root/.secrets/operations_key` → `/run/secrets/operations_key` | StellarService (gasless ops) |
