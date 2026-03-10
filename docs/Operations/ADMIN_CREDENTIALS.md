# Admin Credentials & Setup (Radox Platform)

> ⚠️ **IMPORTANT**: This file contains sensitive credentials. Do NOT commit to public repos.

## Platform Admin Accounts

Admin accounts are bootstrapped from `.env` variables `ADMIN_1_EMAIL` / `ADMIN_2_EMAIL` on first startup.

| Account | Email (from `.env`) | Auth Method | Role |
|---------|---------------------|-------------|------|
| Pedro | `psaragossy@gmail.com` | Password → MFA OTP → Passkey | Super Admin |
| Gabriel | `admin2@stellar-tokens.local` | Password → MFA OTP → Passkey | Super Admin |

> **Note:** Admins authenticate via password + email MFA OTP code. Once logged in, they can register a passkey for future passwordless login.

## Passkey Setup

After the first password login, both admins should register passkeys for secure, passwordless login:

1. Login at `/admin/login` with password
2. Go to **Settings** (sidebar)
3. Click **"Register Passkey"**
4. Complete Face ID / Touch ID / PIN prompt
5. Future logins: Use **"Login with Passkey"** button

## System Wallets (Admin Control)

The platform now uses a secure 4-wallet architecture (recommended by Stellar Best Practices):

1.  **Issuer Account** (`ISSUER`)
    *   **Role**: Mints tokens.
    *   **Security**: Cold Storage (ideally). High security.
    *   **Action**: Only active during initial Token Offering setup.

2.  **Distributor Account** (`DISTRIBUTOR`)
    *   **Role**: Holds token inventory for sale.
    *   **Security**: Hot/Warm Wallet.
    *   **Action**: Sends tokens to investors upon purchase.

3.  **Operations Account** (`OPERATIONS`)
    *   **Role**: The "Gas Station".
    *   **Action**: Pays for transaction fees, sponsors user trustlines, and covers network rent.
    *   **Note**: Admin dashboard monitors this wallet to ensure it doesn't run out of XLM.

4.  **Treasury Account** (`TREASURY`)
    *   **Role**: Receives payments.
    *   **Action**: Collects USDC from token sales.

### Key Management & Security

*   **Development**: `OPERATIONS_SECRET_KEY` loaded from `.env` via `KeyManager`. Issuer/Treasury/Distributor use Freighter/Ledger only (`KEY_MANAGEMENT_MODE=multisig`).
*   **Production**: Migrate `OPERATIONS_SECRET_KEY` to **Google Secret Manager** (~$0.06/10k accesses). No other secret keys exist in `.env`.
*   **Safety**: The `KeyManager` throws if secret key access is attempted in multisig mode.

## Database

**Local development** (Docker):
- Host: `localhost:5432`
- Database: `stellar_tokens`
- User: `postgres`
- Password: `postgres`

## Redis

**Local development** (Docker):
- Host: `localhost:6379`
- No password (local only)

---

> **See also:** [AUTHENTICATION.md](AUTHENTICATION.md) for auth flows · [ADMIN_OPERATIONS.md](ADMIN_OPERATIONS.md) for CLI commands · [STELLAR_MULTISIG_REFERENCE.md](STELLAR_MULTISIG_REFERENCE.md) for key management

*Last updated: March 2026*
