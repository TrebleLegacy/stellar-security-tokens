# System Flow: Tokenization & Investment Lifecycle

This document provides a comprehensive technical overview of the platform's end-to-end lifecycle, from user onboarding to token settlement.

---

## Phase 0: Onboarding & Smart Wallet Deployment
The journey begins with a 100% XLM-free registration flow for both Investors and Company Users.

### Automatic Wallet Deployment
When a user registers via Passkey, the platform triggers an on-chain deployment of a **Soroban Smart Wallet** (Contract).

```mermaid
sequenceDiagram
    participant U as User (Passkey)
    participant B as Backend API
    participant LT as Launchtube (Sponsor)
    participant S as Stellar Network
    participant D as Database

    U->>B: POST /api/investors/register (Credentials)
    B->>B: Calculate deterministic ContractID
    
    rect rgb(240, 255, 240)
    Note over B,S: Sponsored Deployment
    B->>LT: Submit CreateContract XDR
    LT->>S: Submit to Network (Pays XLM Fees)
    S-->>B: Success (Contract Live)
    end

    B->>D: Save User (Record includes stellarContractId)
    B-->>U: 201 Created & Logged In
```

- **Zero-Friction**: The user never sees a public key or handles a secret key. Their passkey *is* their wallet.
- **Sponsorship**: Launchtube sponsors the initial 20 XLM reserve required for the contract entry, ensuring the user starts with a 0 balance and 0 XLM cost.

---

## Phase 1: Offer Creation (Asset Tokenization)
Companies create investment offers, frequently backed by **Real Estate Collateral**.

### Offer Wizard & Collateral Validation
The flow in `CreateOffer.tsx` handles structured data and legal documents.

```mermaid
sequenceDiagram
    participant C as Company
    participant B as Backend
    participant I as IPFS (Pinata)
    participant D as Database

    C->>B: POST /api/companies/offers (Metadata + Files)
    
    par Document Storage
        B->>I: Upload Prospectus/Matrícula
        I-->>B: Return IPFS CIDs
    and Collateral Math
        B->>B: Calculate LTV (Loan-to-Value)
        Note right of B: LTV = (Supply / Collateral) * 100
    end

    B->>D: Create Offer (Status: pending_review)
    B->>D: Log ISSUANCE Fee
    B-->>C: 201 Created
```

- **Collateral-Backed**: Offers specifically support `real_estate` types, storing valuation and LTV ratios for investor transparency.
- **Immutable Docs**: Legal documents are pinned to IPFS, ensuring the prospectus cannot be changed after the offer is published.

---

## Phase 2: Review & MultiSig Issuance
Platform Admins must approve and sign the token issuance via a secure multisig process.

### Admin Consensus Flow
Issuing tokens is a high-privilege operation that requires a MultiSig proposal.

```mermaid
graph TD
    A[Admin Approves Offer] --> B[Propose MultiSig Transaction]
    B --> C{Consensus Queue}
    C -->|Signatures Pending| D[Wait for other Admins]
    C -->|Threshold Reached| E[Submit to Stellar]
    
    subgraph Stellar Configuration
        E --> F[Setup Compliance Flags]
        F --> G[Issue Tokens to Distributor]
        G --> H[Deploy SAC - Asset Contract]
    end
    
    H --> I[Update Status: active]
```

- **Compliance Flags**: The asset is configured with `AuthRequired` (whitelisting), `AuthRevocable` (freezing), and `AuthClawbackEnabled`.
- **SAC (Stellar Asset Contract)**: Every asset gets a Soroban representation, enabling XLM-free transfers to smart wallets.

---

## Phase 3: Investment Flow
Investors browse the marketplace and purchase tokens using USDC.

### JIT (Just-In-Time) Onboarding
To maintain the XLM-free experience, the platform performs JIT trustline setup.

```mermaid
sequenceDiagram
    participant Inv as Investor
    participant B as Backend
    participant S as Stellar Network
    participant T as Treasury

    Inv->>B: POST /api/investments (Amount)
    
    par JIT Configuration
        B->>S: Sponsored Trustline Setup (No XLM cost)
    and Payment ID
        B->>B: Generate Unique INV-Memo
    end

    B-->>Inv: Instructions (Treasury Address + Memo)
    Inv->>T: Sends USDC + Required Memo
```

---

## Phase 4: Settlement & Atomic Distribution
The final step is the automatic detection of payment and token delivery.

### Payment Monitoring & Settlement
The `PaymentMonitor` service watches the ledger for the specific memo.

```mermaid
flowchart LR
    P[USDC Detected with Memo] --> Q[distributionQueue]
    Q --> Job[processDistribution]
    
    subgraph Settlement Logic
        Job --> Auth[JIT Authorize Investor]
        Auth --> Type{Wallet Type?}
        Type -->|Classic G...| P1[SEP-1 Payment]
        Type -->|Smart C...| P2[SAC Transfer]
    end
    
    P1 & P2 --> Done[Status: distributed]
    Done --> Notify[Email Confirmation]
```

- **JIT Authorization**: The issuer account "whitelists" the investor *immediately* before sending tokens.
- **Dual Support**: Supports both legacy wallets (Standard payments) and the new 100% XLM-free smart wallets (Contract transfers).

---

> **See also:** [TOKENIZATION.md](TOKENIZATION.md) for token lifecycle · [INVESTMENT_FLOW.md](INVESTMENT_FLOW.md) for user journey · [AUTHENTICATION.md](AUTHENTICATION.md) for passkey details
