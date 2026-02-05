---
tags: [overview, config, env]
status: verified
last_verified: 2026-02-05
---

# Environment Variables Reference

> Reference for all environment variables used across the platform. **Never commit actual secrets.**

---

## Network Configuration

| Variable | Description | Testnet | Production |
|----------|-------------|---------|------------|
| `STELLAR_NETWORK` | Network identifier | `testnet` | `public` |
| `STELLAR_HORIZON_URL` | Horizon API endpoint | `https://horizon-testnet.stellar.org` | `https://horizon.stellar.org` |
| `SOROBAN_RPC_URL` | Soroban RPC endpoint | `https://soroban-testnet.stellar.org` | `https://soroban-rpc.mainnet.stellar.org` |

---

## Stellar Accounts

> ⚠️ Generate new keys for production. Never reuse testnet keys.

| Variable | Description | Notes |
|----------|-------------|-------|
| `ISSUER_SECRET_KEY` | Token issuer account | Creates assets with compliance flags |
| `ISSUER_PUBLIC_KEY` | Issuer public key | Derived from secret |
| `DISTRIBUTOR_SECRET_KEY` | Distribution account | Holds token inventory |
| `DISTRIBUTOR_PUBLIC_KEY` | Distributor public key | Derived from secret |
| `TREASURY_SECRET_KEY` | Treasury account | Receives USDC payments |
| `TREASURY_PUBLIC_KEY` | Treasury public key | Derived from secret |

---

## USDC Configuration

| Variable | Description | Value |
|----------|-------------|-------|
| `USDC_ISSUER` | Circle's official USDC issuer | `GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN` |

> Same issuer for both testnet and mainnet.

---

## Smart Wallets (Passkey Kit)

| Variable | Description | Notes |
|----------|-------------|-------|
| `FACTORY_CONTRACT_ID` | Smart wallet factory contract | Deploy new for mainnet |
| `LAUNCHTUBE_URL` | Sponsorship service URL | `https://launchtube.xyz` |
| `LAUNCHTUBE_JWT` | Sponsorship auth token | Get from Stellar Discord |

---

## Database

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_NAME` | Database name | `stellar_tokens` |
| `DB_USER` | Database user | `postgres` |
| `DB_PASSWORD` | Database password | — |
| `DB_SSL` | Enable SSL | `false` (dev), `true` (prod) |
| `DATABASE_URL` | Prisma connection string | Constructed from above |

---

## Redis

| Variable | Description | Notes |
|----------|-------------|-------|
| `REDIS_HOST` | Redis host | `localhost` |
| `REDIS_URL` | Full Redis URL | Optional, overrides host |

---

## Security

| Variable | Description | Notes |
|----------|-------------|-------|
| `JWT_SECRET` | JWT signing secret | Generate: `openssl rand -hex 32` |
| `API_KEY` | Internal API key | For service-to-service |

---

## WebAuthn (Passkeys)

| Variable | Description | Example |
|----------|-------------|---------|
| `WEBAUTHN_RP_ID` | Relying Party ID | `localhost` / `yourdomain.com` |
| `WEBAUTHN_ORIGIN` | Allowed origin | `http://localhost:5173` / `https://app.yourdomain.com` |

> ⚠️ Passkeys are domain-bound. Cannot migrate between domains.

---

## Email (SMTP)

| Variable | Description | Notes |
|----------|-------------|-------|
| `SMTP_HOST` | SMTP server | e.g., `smtp.sendgrid.net` |
| `SMTP_PORT` | SMTP port | `587` (TLS) |
| `SMTP_SECURE` | Use SSL | `false` for STARTTLS |
| `SMTP_USER` | SMTP username | — |
| `SMTP_PASSWORD` | SMTP password | — |
| `SMTP_FROM` | Sender address | e.g., `noreply@yourdomain.com` |

---

## IPFS (Document Storage)

| Variable | Description | Notes |
|----------|-------------|-------|
| `PINATA_JWT` | Pinata API token | Get from pinata.cloud |

---

## Frontend-Specific (VITE_*)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API URL |
| `VITE_STELLAR_NETWORK` | Network for frontend |
| `VITE_SOROBAN_RPC_URL` | Soroban RPC for frontend |
| `VITE_FACTORY_CONTRACT_ID` | Factory for frontend |
| `VITE_STELLAR_NETWORK_PASSPHRASE` | Network passphrase |

---

## Admin Bootstrap

| Variable | Description |
|----------|-------------|
| `ADMIN_1_EMAIL` | First admin email |
| `ADMIN_1_NAME` | First admin name |
| `ADMIN_2_EMAIL` | Second admin email |
| `ADMIN_2_NAME` | Second admin name |

---

## Feature Flags

| Variable | Description | Default |
|----------|-------------|---------|
| `ENABLE_AUTO_PAYMENTS` | Enable payment scheduler | `true` |
| `EMAIL_VERIFICATION_EXPIRY_HOURS` | Email token expiry | `24` |

---

## Monitoring (Optional)

| Variable | Description |
|----------|-------------|
| `SENTRY_DSN` | Backend Sentry DSN |
| `VITE_SENTRY_DSN` | Frontend Sentry DSN |

---

## Related

- [[overview/architecture]] — System architecture
- [[backend/config/_INDEX]] — Config files
- [[infrastructure/docker]] — Docker setup
