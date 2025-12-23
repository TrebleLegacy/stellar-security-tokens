# Mainnet Migration Checklist

This document details all specific actions required to transition the **Stellar Security Tokens** platform from Testnet to Mainnet (Production).

## 🚨 Critical Code Changes (Must Fix Before Deployment)

### Backend Logic
- [ ] **Disable Friendbot Calls (`backend/src/services/stellar.service.js`):**
    - The methods `createIssuerAccount`, `createDistributionAccount`, and `createInvestorAccount` currently attempt to call `friendbot.stellar.org` uncritically.
    - **Risk:** This will fail in Production/Mainnet or potentially leak keys to a testnet service.
    - **Fix:** Wrap all friendbot calls in `if (process.env.STELLAR_NETWORK === 'testnet')` blocks. For Mainnet, these functions should assume the accounts are already funded (manually or via a treasury operation).

- [ ] **Secure CORS Policy (`backend/src/app.js`):**
    - Currently, `app.use(cors())` allows ALL origins (`*`).
    - **Fix:** Restrict to your frontend domain: 
      ```javascript
      app.use(cors({ origin: process.env.FRONTEND_URL }));
      ```

- [ ] **Swagger Configuration (`backend/src/config/swagger.js`):**
    - The server URL is hardcoded to `http://localhost:3000`.
    - **Fix:** Update to your production API URL (e.g., `https://api.yourdomain.com`).

### hardcoded Values
- [ ] **Asset Code:** `stellar.service.js` defaults to `'SIN01'`. Verify if you want this dynamic for prod.
- [ ] **USDC Issuer:** `stellar.service.js` uses a default issuer address if `USDC_ISSUER` is not in env. Ensure this fallback isn't used or update it.

---

## 🌍 Environment Variables Configuration

You must create a production `.env` file with the following changes:

### Network Settings
| Variable | Testnet Value | **Production Value** |
|----------|---------------|----------------------|
| `STELLAR_NETWORK` | `testnet` | `public` |
| `HORIZON_URL` | `https://horizon-testnet.stellar.org` | `https://horizon.stellar.org` |
| `SOROBAN_RPC_URL` | `https://soroban-testnet.stellar.org` | `https://soroban-rpc.mainnet.stellar.org` |
| `VITE_SOROBAN_RPC_URL` | *(Testnet URL)* | `https://soroban-rpc.mainnet.stellar.org` |
| `VITE_STELLAR_NETWORK_PASSPHRASE`| `Test SDF Network ; September 2015` | `Public Global Stellar Network ; September 2015` |

### Keys & Accounts (Action Required)
> **WARNING:** Do not use Testnet keys on Mainnet. Generate new keys using `Keypair.random()` offline or hardware wallets.

- [ ] **`ISSUER_SECRET_KEY`**: Rotated to Mainnet Key (Funded with XLM).
- [ ] **`DISTRIBUTOR_SECRET_KEY`**: Rotated to Mainnet Key (Funded with XLM).
- [ ] **`TREASURY_SECRET_KEY`**: Rotated to Mainnet Key (Funded with XLM).
- [ ] **`USDC_ISSUER`**: Update to Official Circle USDC Mainnet Issuer: `GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN` (Verify this!).

### Smart Contracts (Passkey Wallet)
- [ ] **`FACTORY_CONTRACT_ID`**: Deploy your Smart Wallet Factory to Mainnet and update this ID. The Testnet ID `CBKZ...` **will not work**.
- [ ] **`VITE_FACTORY_CONTRACT_ID`**: Update in Frontend `.env`.

### Infrastructure & Security
- [ ] **`DB_SSL`**: Set to `true` (Required for managed databases like AWS RDS/Heroku).
- [ ] **`JWT_SECRET`**: Generate a strong, long random string.
- [ ] **`WEBAUTHN_RP_ID`**: Change `localhost` to your real domain (e.g., `tokenizadora.com`).
- [ ] **`WEBAUTHN_ORIGIN`**: Change `http://localhost:5173` to `https://dashboard.tokenizadora.com`.
- [ ] **`FRONTEND_URL`**: Update to `https://dashboard.tokenizadora.com`.
- [ ] **`VITE_API_URL`**: Update in frontend build to `https://api.yourdomain.com/api`.

### Third Party Services
- [ ] **Launchtube**: `LAUNCHTUBE_URL` and `LAUNCHTUBE_JWT` must be updated to a paid/production instance if you are using sponsored transactions.

---

## 📧 Email Configuration (SMTP)

The `.env.example` has SMTP sections commented out. For production, you **must** configure a real SMTP service to send verification emails and payment notifications.

- [ ] Uncomment and fill:
    - `SMTP_HOST` (e.g., `smtp.sendgrid.net`)
    - `SMTP_USER`
    - `SMTP_PASSWORD`
    - `SMTP_FROM` (Must be a verified sender domain)

## 🏗️ Build & Deployment

### Frontend
- Run `npm run build` in the `frontend` directory.
- Serve the `frontend/dist` folder using Nginx, Vercel, or Netlify.

### Database
- Run `npm run migrate` (Production alias) to apply migrations to the production DB.
- **Do not run `npm run seed`** unless you strictly intend to populate test data in production.

### Docker
- Use `docker-compose.prod.yml` instead of the default `docker-compose.yml`.
