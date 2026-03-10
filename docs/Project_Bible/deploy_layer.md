# Deploy Layer — Full Deep Read

> Read date: 2026-03-10
> Files: `Dockerfile` (34L), `docker-compose.yml` (147L), `docker-compose.prod.yml` (261L), `deploy/Caddyfile` (32L)

---

## Architecture

```
Internet → Caddy (auto-HTTPS) → ┬→ frontend:80 (nginx, React SPA)
                                 ├→ backend:3000 (Node.js Express)
                                 └→ radox.net (static landing page)

Internal:  backend → postgres:5432
           backend → redis:6379
```

## Services (5 in production)

| Service | Image | Memory | CPU | Health Check |
|---------|-------|--------|-----|-------------|
| **postgres** | postgres:15-alpine | 1G | 1 | `pg_isready` |
| **redis** | redis:7-alpine | 256M | 0.5 | `redis-cli ping` |
| **backend** | node:20-alpine + pg_dump | 2G | 2 | `wget --spider /health` |
| **frontend** | nginx (built with Vite) | 256M | 0.5 | `curl || wget /` |
| **caddy** | caddy:2-alpine | 128M | 0.25 | — |

## Domain Routing (Caddyfile)

| Domain | Target | Purpose |
|--------|--------|---------|
| `radox.net` | Static files + `/.well-known/*` → backend | Landing + SEP-1 stellar.toml |
| `app.radox.net` | frontend:80 | React SPA |
| `api.radox.net` | backend:3000 | API + Swagger + mobile |

## Security (Production)

- **No wallet secret keys in env** — admin signing via Freighter/Ledger multisig
- **Docker Secrets**: operations_key at `/root/.secrets/operations_key` (chmod 600) → `/run/secrets/operations_key` (tmpfs)
- DB: no external port exposure, required password (`?` guard)
- Redis: internal only, optional password
- JWT_SECRET: required, no default
- WebAuthn: RP_ID + ORIGIN required
- Localhost-only DB bind in dev (`127.0.0.1:5432`)
- `ports: !override []` prevents frontend external exposure (only Caddy)

## Startup Sequence (Backend)

```
1. Wait 5s for DB
2. Run Prisma migrations (node --import tsx src/database/migrate.js)
3. Start server (node --import tsx src/index.js)
4. Auto-verify issuer flags (skip if multisig)
5. Start 5 cron jobs + payment monitor + Soroban services
```

## Environment Variables (Key Groups)

| Group | Variables | Dev Default |
|-------|-----------|-------------|
| Database | DATABASE_URL, DB_HOST/PORT/NAME/USER/PASSWORD | postgres/postgres |
| Stellar | STELLAR_NETWORK, HORIZON_URL, SOROBAN_RPC_URL | testnet |
| Accounts | ISSUER/DISTRIBUTOR/OPERATIONS/TREASURY_PUBLIC_KEY | — |
| Secrets | ISSUER/DISTRIBUTOR/TREASURY_SECRET_KEY | env mode only |
| Auth | JWT_SECRET, API_KEY | change_this_in_production |
| WebAuthn | WEBAUTHN_RP_ID, WEBAUTHN_ORIGIN | localhost |
| Passkey Kit | LAUNCHTUBE_URL/JWT, FACTORY_CONTRACT_ID | testnet URLs |
| Soroban | ENABLE_SOROBAN_SALE, SALE_WASM_HASH, XLM/USDC_SAC_CONTRACT_ID | false |
| Email | RESEND_API_KEY, EMAIL_FROM | Radox noreply |
| Monitoring | SENTRY_DSN, VITE_SENTRY_DSN | — |

## Key Difference: Dev vs Prod

| Aspect | Dev | Prod |
|--------|-----|------|
| Network | testnet | public (mainnet) |
| Signing | env keys | Freighter/Ledger multisig |
| HTTPS | none | Caddy + Let's Encrypt auto |
| Port exposure | 3000, 80, 5432 | 80, 443 only (via Caddy) |
| Secrets | .env file | Docker Secrets (tmpfs) |
| Soroban RPC | soroban-testnet.stellar.org | mainnet.sorobanrpc.com |
