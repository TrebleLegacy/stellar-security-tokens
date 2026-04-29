# 00 — Project Bible Index

> **Radox / Stellar Security Tokens** — Complete Codebase Reference
> Full deep read completed: 2026-03-10
> Last updated: 2026-04-29 (WalletMonitorService, SorobanSettlementService, maturity settlement routes, new env vars)
> Total files read: ~180+ (backend, frontend, smart contract, deploy)

---

## Layer Artifacts (per-layer deep reads)

| # | Artifact | Scope | Lines Read |
|---|----------|-------|-----------|
| 1 | [services_layer.md](services_layer.md) | 31 backend service files | ~15,000 |
| 2 | [controllers_layer.md](controllers_layer.md) | 13 controller files | ~6,818 |
| 3 | [routes_layer.md](routes_layer.md) | 15 route files + HTTP map | ~5,828 |
| 4 | [frontend_layer.md](frontend_layer.md) | 101 frontend files (API, lib, hooks, pages, components, layouts) | ~8,000+ |
| 5 | [smart_contract_layer.md](smart_contract_layer.md) | Soroban TokenSale v3 contract + 47 tests | 383 |
| 6 | [deploy_layer.md](deploy_layer.md) | Docker, Caddy, Dockerfile | 474 |

## Synthesis Artifacts (cross-cutting analysis)

| # | Artifact | Purpose |
|---|----------|---------|
| 1 | [01_call_graph.md](01_call_graph.md) | Route → controller → service → external dependency map for every major flow |
| 2 | [02_feature_matrix.md](02_feature_matrix.md) | Complete feature inventory with implementation status (✅/🟡/❌) |
| 3 | [03_data_flow.md](03_data_flow.md) | How data moves: user → frontend → backend → blockchain/DB |
| 4 | [04_dead_code.md](04_dead_code.md) | Unused, unreachable, or superseded code |
| 5 | [05_config_env_map.md](05_config_env_map.md) | Every environment variable with required/optional status |
| 6 | [06_security_audit.md](06_security_audit.md) | Security posture: auth, network, on-chain, validation, data protection |
| 7 | [07_error_recovery.md](07_error_recovery.md) | Error propagation chain and recovery mechanisms per layer |
| 8 | [08_email_inventory.md](08_email_inventory.md) | Every email the platform sends, triggers, and dependencies |

---

## Quick Reference

### Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite + shadcn/ui |
| Backend | Node.js + Express + Prisma + tsx |
| Database | PostgreSQL 15 + Redis 7 |
| Blockchain | Stellar (Horizon + Soroban RPC) |
| Smart Contract | Soroban (Rust, `#[no_std]`) |
| Auth | WebAuthn (Passkeys) + Freighter + Ledger |
| Email | Resend (HTTP API) |
| IPFS | Pinata |
| Monitoring | Sentry (frontend + backend) |
| Real-time | Pusher (backend `config/pusher.js` — optional, graceful no-op if unconfigured; used by `multiSigTransaction.service.js` for governance events. Frontend `pusher-js` client **deleted** commit 7aad8c3) |
| Reverse Proxy | Caddy 2 (auto-HTTPS) |
| Container | Docker Compose |

### Domains
| Domain | Service |
|--------|---------|
| `radox.net` | Landing page + SEP-1 |
| `app.radox.net` | React SPA (investor, company, admin) |
| `api.radox.net` | REST API + Swagger |

### Key Accounts (Stellar)
| Account | Purpose |
|---------|---------|
| Issuer | Token issuance (flags: AUTH_REQUIRED + REVOCABLE + CLAWBACK) |
| Distributor | Holds tokens before depositing into sale contracts |
| Operations | Gasless sponsoring (XLM, trustlines) |
| Treasury | Receives USDC from trades, holds until company withdrawal |

---

## Top Critical Issues

| Priority | Issue | Artifact |
|----------|-------|----------|
| ~~🔴 P0~~ | ~~Fee collection not on-chain~~ — **RESOLVED Apr 2026** (Soroban `fixed_fee` + yield spread) | [02_feature_matrix](02_feature_matrix.md) |
| ~~🔴 P0~~ | ~~In-memory WebAuthn challenges~~ — **RESOLVED** (all stores migrated to Redis with TTL: webauthnController, authRoutes, platformAdminRoutes) | [06_security_audit](06_security_audit.md) |
| 🟡 P1 | `platformAdminRoutes.js` — 2,067L mega-file with inline handlers | [routes_layer](routes_layer.md) |
| 🟡 P1 | Duplicate API clients (Axios + fetch) | [frontend_layer](frontend_layer.md) |
| 🟡 P1 | Type mismatch (snake_case types vs camelCase responses) | [frontend_layer](frontend_layer.md) |
| 🟡 P2 | Dead code: legacy auth, TransactionManagerService | [04_dead_code](04_dead_code.md) |
| 🟡 P2 | No TX retry queue for failed Soroban transactions | [07_error_recovery](07_error_recovery.md) |
| ~~🟡 P2~~ | ~~`WalletMonitorService` has no `stop()`~~ — **RESOLVED 2026-04-29** (`stop()` + graceful shutdown wiring) | [07_error_recovery](07_error_recovery.md) |
| 🟢 P3 | Email templates are inline HTML strings | [08_email_inventory](08_email_inventory.md) |
