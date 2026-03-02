# Authentication & Identity

The platform uses **Passkeys (WebAuthn)** as the primary authentication method for investors and companies, and **Password + MFA (Email OTP)** for platform admins.

## User Roles

1.  **Investor**: Individual users (KYC required) who buy tokens. Auth: Passkey only.
2.  **Company**: Issuers who deploy tokens and manage offerings. Auth: Passkey only.
3.  **Platform Admin**: Super-users who manage fees, system config, and approvals. Auth: Password → Email OTP → optional Passkey.

## Passkey Implementation (Investors & Companies)

We use the `passkey-kit` (Stellar) and standard WebAuthn API.

### Registration Flow
1.  User enters name, email, and document (CPF).
2.  Frontend calls `POST /api/webauthn/{userType}/register/start` (userType: `investor` or `company`).
3.  Server returns a challenge.
4.  Browser prompts user (FaceID / TouchID / PIN).
5.  Frontend sends signed challenge to `POST /api/webauthn/{userType}/register/complete`.
6.  Server verifies signature, deploys a **Soroban Smart Wallet** on-chain, and stores the credential.

### Login Flow
1.  User enters email.
2.  Frontend calls `POST /api/webauthn/{userType}/login/start`.
3.  Server looks up registered credentials and returns a challenge.
4.  Browser signs challenge with the private key (stored in device enclave).
5.  Frontend sends signature to `POST /api/webauthn/{userType}/login/complete`.
6.  Server verifies and issues a **JWT Token** (access + refresh).

## Admin Authentication

1.  Admin enters email + password at `POST /api/auth/admin/login`.
2.  Server verifies password (bcrypt), then sends a 6-digit **MFA OTP** via email.
3.  Admin submits OTP to `POST /api/auth/admin/verify-mfa`.
4.  Server issues JWT. Admin can optionally register a passkey via the Admin Settings page.

## Security Notes

- **JWT Expiry**: Access tokens are 15-minute lived; refresh tokens are 7-day.
- **Refresh Token Rotation**: Each refresh generates a new token and revokes the old one (stored in `RefreshToken` table).
- **Token Blocklist**: Redis-backed blocklist invalidates tokens on logout (`POST /api/auth/logout`).
- **No Password Hashes for Investors/Companies**: Only passkey public keys are stored.
- **Admin Passwords**: Stored as bcrypt hashes in `PlatformAdmin.passwordHash`.
- **Lost Devices**: Currently requires Admin intervention (future: passkey recovery via on-chain contract verification).

## API Endpoints

### WebAuthn (Investors & Companies)
- `POST /api/webauthn/:userType/register/start`
- `POST /api/webauthn/:userType/register/complete`
- `POST /api/webauthn/:userType/login/start`
- `POST /api/webauthn/:userType/login/complete`

### Admin Auth
- `POST /api/auth/admin/login`
- `POST /api/auth/admin/verify-mfa`

### Token Management
- `POST /api/auth/logout`
- `POST /api/auth/refresh`

---

> **See also:** [ADMIN_CREDENTIALS.md](ADMIN_CREDENTIALS.md) for admin accounts · [API_KEY_ROTATION_POLICY.md](API_KEY_ROTATION_POLICY.md) for API key · [COMPLIANCE.md](COMPLIANCE.md) for KYC requirements
