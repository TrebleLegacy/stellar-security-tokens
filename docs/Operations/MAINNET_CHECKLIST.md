# Radox — Mainnet Migration Checklist

> Last updated: 2026-03-31

This document details all specific actions required to transition the **Radox** platform from Testnet to Mainnet (Production).

## 🌍 Environment Variables Configuration

Create a production `.env` file with the following changes:

### Network Settings
| Variable | Testnet Value | **Production Value** |
|----------|---------------|----------------------|
| `STELLAR_NETWORK` | `testnet` | `public` |
| `STELLAR_HORIZON_URL` | `https://horizon-testnet.stellar.org` | `https://horizon.stellar.org` |
| `SOROBAN_RPC_URL` | `https://soroban-testnet.stellar.org` | `https://soroban-rpc.mainnet.stellar.org` |
| `VITE_STELLAR_NETWORK` | `testnet` | `public` |
| `VITE_SOROBAN_RPC_URL` | *(Testnet URL)* | `https://soroban-rpc.mainnet.stellar.gateway.fm` |
| `VITE_STELLAR_NETWORK_PASSPHRASE`| `Test SDF Network ; September 2015` | `Public Global Stellar Network ; September 2015` |

### Keys & Accounts (Action Required)
> **NOTE:** The platform uses `KEY_MANAGEMENT_MODE=multisig` — only public keys + the Operations hot wallet key are needed. Issuer/Treasury/Distributor sign via Freighter/Ledger.

- [ ] **Generate new mainnet keypairs** for Issuer, Distributor, Treasury, Operations. Fund each with XLM.
- [ ] **All `*_PUBLIC_KEY` vars**: Update in `.env.production` with mainnet public keys.

### Operations Hot Wallet Security
> `OPERATIONS_SECRET_KEY` is the **only** secret key on the server. It sponsors gasless transactions (wallet creation, trustlines).

- [x] **Docker Secrets** — key stored at `/root/.secrets/operations_key` (chmod 600), mounted to container at `/run/secrets/operations_key` (tmpfs, never on disk). `KeyManager.#readOperationsSecret()` reads it automatically.
- [ ] **Fresh keypair** — generate a new mainnet Operations key at deploy time. Never reuse testnet keys.
- [ ] **Minimal balance** — keep only ~50 XLM (enough for ~1000 sponsored txns). Refill as needed.
- [ ] **Account monitoring** — set up alerts on [stellar.expert](https://stellar.expert) for unexpected transactions on the Operations account.
- [ ] **Key rotation plan** — document how to rotate the Operations key if compromised (replace `/root/.secrets/operations_key`, recreate backend container).

### Smart Contracts (Smart Account Kit)
- [ ] **`ACCOUNT_WASM_HASH`**: Deploy OZ Smart Account WASM to Mainnet and record hash.
- [ ] **`WEBAUTHN_VERIFIER_ADDRESS`**: Deploy WebAuthn verifier and record address.
- [ ] **`ED25519_VERIFIER_ADDRESS`**: Deploy Ed25519 verifier and record address.
- [ ] **`SALE_WASM_HASH`**: Deploy token_sale v6 WASM to Mainnet and record hash.

### Channel Accounts Pool (Parallel Fee Sponsorship)
- [ ] **Generate 5 new keypairs** for mainnet (never reuse testnet keys):
  ```bash
  node -e "const {Keypair}=require('@stellar/stellar-sdk'); for(let i=1;i<=5;i++){const k=Keypair.random(); console.log('CHANNEL_'+i+'_SECRET_KEY='+k.secret()); console.log('# Public: '+k.publicKey()); console.log();}"
  ```
- [ ] **Fund each with 2 XLM** from the Operations wallet (enough for ~20,000 fee-bump TXs each).
- [ ] **Add secret keys** to production env (`CHANNEL_1_SECRET_KEY`..`CHANNEL_5_SECRET_KEY`).
- [ ] **Verify pool loads** — backend log should show: `Initialized channel pool with 5 accounts.`
- [ ] **File permissions** — ensure channel keys have same security as `OPERATIONS_SECRET_KEY` (chmod 600 or Docker Secrets).

### Infrastructure & Security
- [ ] **`DB_SSL`**: Set to `true` (Required for cloud databases).
- [ ] **`JWT_SECRET`**: Generate with `openssl rand -hex 32`.
- [ ] **`WEBAUTHN_RP_ID`**: Keep as `radox.net` (covers all subdomains).
- [ ] **`WEBAUTHN_ORIGIN`**: Change to `https://app.radox.net`.
- [ ] **`FRONTEND_URL`**: Update to `https://app.radox.net`.
- [ ] **`API_URL`**: Update to `https://api.radox.net`.
- [ ] **`VITE_API_URL`**: Keep as `/api` (same-origin proxy via nginx).

### Third Party Services
- [ ] **Channels API Key**: Get production API key from OpenZeppelin.
- [ ] **`RESEND_API_KEY`**: Production Resend API key (already configured for testnet).
- [ ] **Launchtube Mainnet JWT**: Obtain from SDF for sponsoring Soroban transactions on mainnet.

---

## 🏗️ Build & Deployment

### Frontend
- Run `npm run build` in the `frontend` directory.
- Set `VITE_*` env vars before building (they are baked into the bundle at build time).

### Database
- Run `npm run migrate` to apply migrations.
- Enable SSL for production databases.

### Key Generation
```bash
# JWT Secret
openssl rand -hex 32

# Stellar Keypairs (run for Issuer, Distributor, Treasury, Operations)
node -e "const {Keypair} = require('@stellar/stellar-sdk'); const kp = Keypair.random(); console.log('SECRET=' + kp.secret()); console.log('PUBLIC=' + kp.publicKey());"
```

---

## 🔒 Security Audit (Before Launch)

### Dependency Audit
```bash
cd backend && npm audit
cd frontend && npm audit
```

- [ ] **No critical vulnerabilities** in production dependencies
- [ ] **Review high severity issues** - ensure none are exploitable in our code paths
- [ ] **Document exceptions** for non-exploitable transitive dependencies

### Multisig Setup
```bash
cd backend
npm run multisig:inspect  # Verify account configuration
npm run multisig:setup    # Configure production signers
```

- [ ] **Treasury account** - 2-of-3 multisig with Ledger keys
- [ ] **Issuer account** - Locked after initial token setup
- [ ] **Master keys disabled** on all production accounts

### Error Monitoring
- [ ] **SENTRY_DSN** configured in backend `.env`
- [ ] **VITE_SENTRY_DSN** configured in frontend `.env`

### Stellar-Specific Security (CRITICAL)

> ⚠️ **Read the full audit:** [STELLAR_SECURITY_AUDIT.md](./STELLAR_SECURITY_AUDIT.md)

- [ ] **Verify issuer flags** - Run `npm run multisig:inspect` to confirm:
  - `auth_required: true`
  - `auth_revocable: true`
  - `auth_clawback_enabled: true`

- [ ] **Set up issuer thresholds for SAC auto-authorization** ⚠️
  > Without this, every investment fails with `"balance is deauthorized"`.
  > The operations key needs to be a signer on the issuer account so it can
  > call `set_authorized()` on the SAC automatically during purchases.
  
  Go to [Stellar Laboratory](https://laboratory.stellar.org/#txbuilder?network=public) → **Set Options** on the **issuer account**:
  - Master Weight: `10`
  - Low Threshold: `1`
  - Medium Threshold: `2`
  - High Threshold: `10`
  - Signer: Operations public key, weight `2`
  
  Sign with Freighter (issuer key). This allows:
  - Ops key (weight=2) → `set_authorized` (medium=2) ✅
  - Only issuer (weight=10) → mint/clawback/set_admin (high=10) 🔒
  
- [ ] **Lock issuer account AFTER initial token minting**
  ```bash
  # WARNING: This is IRREVERSIBLE! Only do after all tokens are minted.
  npm run multisig:setup -- -a issuer --lock
  ```
  This sets `masterWeight: 0` preventing any further minting.

- [x] **Remove secret keys from production .env** — `.env.production` has zero Stellar secret keys. Only public keys + `OPERATIONS_SECRET_KEY` present.
  - Issuer/Treasury/Distributor transactions require Ledger/Freighter signatures

### Post-Launch Verification
```bash
# Verify account configuration on Stellar Explorer
# https://stellarchain.io/accounts/GXXXX (your issuer public key)
# Should show: 
#   - Flags: auth_required, auth_revocable, auth_clawback_enabled
#   - Master Weight: 0 (if locked)
#   - Signers: Your Ledger public keys
```

# Verify TOML is live
```bash
curl -s https://radox.net/.well-known/stellar.toml | head -20
# Should show: NETWORK_PASSPHRASE, ACCOUNTS, [[CURRENCIES]] with IPFS links
```
