# Authentication & Identity

The platform uses **Passkeys (WebAuthn)** as the primary authentication method, eliminating passwords and increasing security.

## User Roles

1.  **Investor**: Individual users (KYC required) who buy tokens.
2.  **Company**: Issuers who deploy tokens and manage offerings.
3.  **Platform Admin**: Super-users who manage fees, system config, and approvals.

## Passkey Implementation

We use the `passkey-kit` (Stellar) and standard WebAuthn API.

### Registration Flow
1.  User enters email.
2.  Frontend calls `POST /api/webauthn/{userType}/register/start`.
3.  Server returns a challenge.
4.  Browser prompts user (FaceID / TouchID).
5.  Frontend sends signed challenge to `POST /api/webauthn/{userType}/register/complete`.
6.  Server verifies signature and stores the public key (Credential ID).

### Login Flow
1.  User enters email.
2.  Frontend calls `POST /api/webauthn/{userType}/login/start`.
3.  Server looks up registered credentials and returns a challenge.
4.  Browser signs challenge with the private key (stored in device enclave).
5.  Frontend sends signature to `POST /api/webauthn/{userType}/login/complete`.
6.  Server verifies and issues a **JWT Token**.

## Security Notes

- **JWT Expiry**: Tokens are short-lived (e.g., 24h).
- **No Password Hashes**: The database does NOT store passwords. Only public keys.
- **Lost Devices**: Currently, account recovery requires Admin intervention (future: multi-device support).

## API Endpoints

- `POST /api/webauthn/register/start`
- `POST /api/webauthn/register/complete`
- `POST /api/webauthn/login/start`
- `POST /api/webauthn/login/complete`
