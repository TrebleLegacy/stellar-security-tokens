# Mainnet Migration Guide: Comparative Analysis

This document outlines **exactly** what you are currently using in Testnet, **why** it cannot be used in Production, and the **solution** required for Mainnet.

## 🌐 1. Network & Connectivity

| Variable / Feature | Current State (Testnet) | Why it FAILS in Mainnet | Production Solution |
|-------------------|-------------------------|-------------------------|---------------------|
| **`STELLAR_NETWORK`** | `testnet` | Connects to the experimental "Sandbox" network. Transactions have no real financial value and can be reset. | Change to **`public`** to interact with the real Stellar ledger. |
| **`HORIZON_URL`** | `https://horizon-testnet.stellar.org` | Points to Testnet nodes. Passphrase mismatch will cause all transaction submissions to fail immediately. | Update to **`https://horizon.stellar.org`**. |
| **`SOROBAN_RPC_URL`** | `https://soroban-testnet.stellar.org` | Connects to Testnet smart contract execution engines. Contracts deployed here do not exist on Mainnet. | Update to **`https://soroban-rpc.mainnet.stellar.org`**. |
| **Passphrase** (Frontend) | `Test SDF Network ; September 2015` | Invalid signature for Mainnet. Transactions signed with this will be rejected by Mainnet nodes. | Update to **`Public Global Stellar Network ; September 2015`**. |

## 🔑 2. Critical Accounts (Keys)

| Variable | Current State (Testnet) | Why it FAILS in Mainnet | Production Solution |
|----------|-------------------------|-------------------------|---------------------|
| **`ISSUER_SECRET_KEY`** | Generated via `Keypair.random()` and funded by **Friendbot**. | **Friendbot does not exist on Mainnet.** Your startup script will fail or use empty, unfunded accounts, making token issuance impossible. | **Generate new keys offline.** Manually fund them with XLM (approx 5-10 XLM) via an exchange or wallet. |
| **`DISTRIBUTOR_SECRET_KEY`** | Same as above (Friendbot funded). | Cannot pay transaction fees or hold asset trustlines without XLM. | **Generate & Fund manually.** Must have trustline to Issuer's asset. |
| **`TREASURY_SECRET_KEY`** | Same as above (Friendbot funded). | Cannot receive USDC payments without a trustline to the real USDC contract. | **Generate & Fund manually.** Add trustline to Mainnet USDC. |

## 💰 3. Assets & Smart Contracts

| Variable | Current State (Testnet) | Why it FAILS in Mainnet | Production Solution |
|----------|-------------------------|-------------------------|---------------------|
| **`USDC_ISSUER`** | Often a proprietary test issuer or a placeholder. | No one holds "Test USDC" in the real world. Investors cannot pay you with it. | Use **Official Circle Issuer**: `GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN`. |
| **`FACTORY_CONTRACT_ID`** | Testnet Contract ID (e.g., `CBKZ...`). | This contract ID **does not exist** on Mainnet. The Passkey Wallet will fail to deploy smart wallets. | **Deploy the Factory Contract to Mainnet** using Soroban CLI, then update this ID with the new address. |

## 🔒 4. Security & Infrastructure

| Variable | Current State (Testnet) | Why it FAILS in Mainnet | Production Solution |
|----------|-------------------------|-------------------------|---------------------|
| **`DB_SSL`** | `false` (Localhost) | Cloud databases (DigitalOcean, AWS RDS) **require** SSL connections. App will fail to connect. | Set to **`true`**. |
| **`CORS_ORIGIN`** | `*` (All origins) or `http://localhost:5173` | **Security Risk.** Allows malicious sites to call your API. | Set `FRONTEND_URL` to your real domain (e.g., `https://app.tokenizadora.com`). |
| **`WEBAUTHN_RP_ID`** | `localhost` | **Passkeys are domain-bound.** A key created for `localhost` is cryptographically invalid on `tokenizadora.com`. | Set to your **exact production domain** (e.g., `tokenizadora.com`). |
| **`JWT_SECRET`** | Simple/Short string. | Vulnerable to brute-force attacks, allowing session forgery. | Generate a **long, high-entropy random string** (64+ chars). |

## 📧 5. Email Services

| Variable | Current State (Dev) | Why it FAILS in Mainnet | Production Solution |
|----------|---------------------|-------------------------|---------------------|
| **SMTP Config** | Commented out / Mocked. | Users will not receive verification codes or payment receipts. Compliance risk. | **Configure real SMTP** (SendGrid, AWS SES) with a verified sender domain. |
