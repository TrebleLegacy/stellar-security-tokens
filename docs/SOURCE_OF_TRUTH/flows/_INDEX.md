---
tags: [flows, index]
status: verified
last_verified: 2026-02-05
---

# System Flow Documentation

> End-to-end flows through the platform

---

## Flow Overview

| Flow | Description |
|------|-------------|
| [[flows/authentication]] | Passkey registration & login |
| [[flows/investment]] | Investor → USDC → Tokens |
| [[flows/offer_lifecycle]] | Draft → Review → Issue → Active |
| [[flows/dividend_payment]] | Company → USDC → Investors |
| [[flows/deposit_relay]] | Treasury → Smart Wallet |
| [[flows/kyc_approval]] | KYC submission → Approval |
| [[flows/token_compliance]] | Freeze, Unfreeze, Clawback |

---

## [[flows/authentication|Authentication Flow]] ⭐

### Investor Registration

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant S as Stellar/Soroban
    
    U->>F: Enter email
    F->>B: POST /webauthn/investor/register/start
    B->>F: Challenge
    F->>U: Create Passkey (biometric)
    U->>F: Passkey created
    F->>B: POST /webauthn/investor/register/complete
    B->>S: Deploy Smart Wallet (Factory)
    S->>B: Contract ID
    B->>B: Create Investor + Wallet record
    B->>F: JWT Token
    F->>U: Dashboard
```

### Login Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    
    U->>F: Click Login
    F->>B: POST /webauthn/investor/login/start
    B->>F: Challenge + allowed credentials
    F->>U: Authenticate (biometric)
    U->>F: Signed assertion
    F->>B: POST /webauthn/investor/login/complete
    B->>B: Verify signature, check blocklist
    B->>F: JWT Token
    F->>U: Dashboard
```

---

## [[flows/investment|Investment Flow]] ⭐

```mermaid
sequenceDiagram
    participant I as Investor
    participant F as Frontend
    participant B as Backend
    participant T as Treasury
    participant PM as PaymentMonitor
    participant Q as DistributionQueue
    participant D as Distributor

    Note over I,F: 1. INITIATE INVESTMENT
    I->>F: Select offer, amount
    F->>B: POST /investments
    B->>B: Create investment (status: pending_payment)
    B->>F: Investment ID + Payment instructions
    F->>I: Show deposit address + memo

    Note over I,T: 2. MAKE PAYMENT
    I->>T: Send USDC with memo

    Note over PM,Q: 3. DETECT PAYMENT
    PM->>T: Stream payments (Horizon)
    PM->>PM: Match memo to investment
    PM->>B: Update investment (payment_received)
    PM->>Q: Queue distribution job

    Note over Q,I: 4. DISTRIBUTE TOKENS
    Q->>D: Process job
    D->>I: SAC transfer tokens
    D->>B: Update investment (distributed)
    B->>I: Email confirmation
```

---

## [[flows/offer_lifecycle|Offer Lifecycle]]

```mermaid
stateDiagram-v2
    [*] --> pending_review: Company creates
    pending_review --> under_review: Admin starts review
    under_review --> approved: Admin approves
    under_review --> rejected: Admin rejects
    approved --> issued: Admin issues tokens
    issued --> active: Company activates
    active --> closed: Manual close or sold out
    rejected --> [*]
    closed --> [*]
```

### Status Descriptions

| Status | Description |
|--------|-------------|
| `pending_review` | Awaiting admin review |
| `under_review` | Admin reviewing |
| `approved` | Ready for token issuance |
| `issued` | Tokens minted, pending launch |
| `active` | Live, accepting investments |
| `closed` | No longer accepting |
| `rejected` | Rejected by admin |

---

## [[flows/dividend_payment|Dividend Payment]]

```mermaid
sequenceDiagram
    participant C as Company
    participant B as Backend
    participant T as Treasury
    participant I as Investors

    C->>B: POST /payments/start
    B->>B: Get investors with balances
    B->>B: Calculate pro-rata amounts
    B->>B: Deduct platform fee (2%)
    B->>T: Batch USDC payment
    T->>I: USDC to each investor
    B->>I: Email receipts
```

### Calculation

```
monthly_interest = (annual_rate / 12) * token_balance
net_payment = monthly_interest - platform_fee
```

---

## [[flows/deposit_relay|Deposit Relay]]

> For users depositing via Classic Stellar (exchanges)

```mermaid
sequenceDiagram
    participant U as User
    participant E as Exchange
    participant T as Treasury
    participant PM as PaymentMonitor
    participant SW as Smart Wallet

    U->>E: Withdraw USDC to Treasury
    E->>T: USDC + memo (DEP-XXXXX)
    PM->>T: Detect payment
    PM->>PM: Look up investor by memo
    PM->>B: Create Deposit record
    B->>SW: SAC transfer USDC
    SW->>U: Funds available
```

---

## [[flows/token_compliance|Compliance Actions]]

### Freeze Account

```mermaid
sequenceDiagram
    participant A as Admin
    participant B as Backend
    participant S as Stellar

    A->>B: POST /security/freeze
    B->>S: setTrustLineFlags(FROZEN)
    S->>B: Success
    B->>B: Log action
    B->>A: Confirmation
```

### Clawback

```mermaid
sequenceDiagram
    participant A as Admin
    participant B as Backend
    participant S as Stellar

    A->>B: POST /security/clawback
    B->>S: clawback(investor, amount)
    S->>B: Success
    B->>B: Update balances, log
    B->>A: Confirmation
```

---

## Related

- [[overview/architecture]] — System architecture
- [[backend/services/_INDEX]] — Service logic
- [[docs/SYSTEM_FLOW]] — Original flow doc
