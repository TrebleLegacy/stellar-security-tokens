---
tags: [overview, architecture]
status: verified
last_verified: 2026-02-05
---

# System Architecture

> **Platform**: Stellar Security Tokens — A blockchain-based RWA tokenization platform

---

## High-Level Architecture

```mermaid
graph TB
    subgraph Frontend ["🎨 Frontend (React/Vite)"]
        UI[User Interface]
        API_Client[API Client]
    end
    
    subgraph Backend ["⚙️ Backend (Node/Express)"]
        Routes[Routes]
        Controllers[Controllers]
        Services[Services]
        Middleware[Middleware]
    end
    
    subgraph Data ["💾 Data Layer"]
        Prisma[Prisma ORM]
        Postgres[(PostgreSQL)]
        Redis[(Redis)]
    end
    
    subgraph Blockchain ["⛓️ Stellar Network"]
        Horizon[Horizon API]
        Soroban[Soroban RPC]
        Contracts[Smart Wallets]
    end
    
    subgraph External ["🌐 External Services"]
        Launchtube[Launchtube<br/>Sponsorship]
        Pinata[Pinata<br/>IPFS]
        SMTP[SMTP<br/>Email]
    end
    
    UI --> API_Client
    API_Client --> Routes
    Routes --> Controllers
    Controllers --> Services
    Services --> Prisma
    Prisma --> Postgres
    Services --> Redis
    Services --> Horizon
    Services --> Soroban
    Soroban --> Contracts
    Services --> Launchtube
    Services --> Pinata
    Services --> SMTP
```

---

## Core Components

### User Roles

| Role | Description | Auth Method |
|------|-------------|-------------|
| **Investor** | Individual buying tokens | Passkey (Smart Wallet) |
| **Company** | Token issuers | Passkey (Smart Wallet) |
| **Platform Admin** | System operators | Email OTP + Passkey |

### Account Architecture (Stellar)

```mermaid
graph LR
    subgraph Platform Accounts
        Issuer[Issuer<br/>Creates tokens]
        Distributor[Distributor<br/>Holds inventory]
        Treasury[Treasury<br/>Receives USDC]
        Operations[Operations<br/>Gas station]
    end
    
    subgraph User Wallets
        SmartWallet[Smart Wallet<br/>Contract-based]
    end
    
    Issuer -->|"Mint tokens"| Distributor
    Distributor -->|"Distribute"| SmartWallet
    SmartWallet -->|"Pay USDC"| Treasury
    Operations -->|"Fee bump"| Distributor
```

---

## Data Flow

### Investment Lifecycle

1. **Registration** → Passkey creates Smart Wallet contract
2. **KYC Approval** → Trustlines auto-authorized
3. **Investment** → Investor sends USDC with memo
4. **Detection** → PaymentMonitor detects payment
5. **Distribution** → Tokens sent via SAC transfer

### Payment Monitoring

```mermaid
sequenceDiagram
    participant I as Investor
    participant T as Treasury
    participant PM as PaymentMonitor
    participant Q as BullMQ
    participant D as Distributor
    
    I->>T: Send USDC + Memo
    PM->>T: Stream payments
    PM->>Q: Queue distribution job
    Q->>D: Process distribution
    D->>I: Send tokens (SAC transfer)
```

---

## Key Technologies

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | React + Vite | UI framework |
| Styling | TailwindCSS | Utility-first CSS |
| State | React Query | Server state management |
| Backend | Express | HTTP server |
| ORM | Prisma | Database access |
| Database | PostgreSQL | Persistent storage |
| Cache | Redis | Rate limiting, sessions |
| Blockchain | Stellar SDK | Asset operations |
| Smart Contracts | Soroban | Smart wallets (Passkey Kit) |
| Sponsorship | Launchtube | XLM-free transactions |
| Storage | IPFS (Pinata) | Legal documents |

---

## Security Model

### Asset Control Flags

All issued tokens have:
- `AUTH_REQUIRED` — Trustlines need approval
- `AUTH_REVOCABLE` — Can freeze accounts
- `AUTH_CLAWBACK_ENABLED` — Can recover tokens

### Authentication

- **Passkeys (WebAuthn)** — Primary auth for all users
- **Email OTP** — Secondary factor for admins
- **JWT** — Session tokens (24h expiry)
- **Redis Blocklist** — Token invalidation on logout

### Rate Limiting

- `/api/investors/register` — Strict (prevent spam)
- `/api/auth/*` — Auth-focused (prevent brute force)
- General API — Standard limits

---

## Related Docs

- [[overview/tech_stack]] — Dependencies
- [[overview/env_variables]] — Configuration
- [[backend/_INDEX]] — Backend structure
- [[frontend/_INDEX]] — Frontend structure
