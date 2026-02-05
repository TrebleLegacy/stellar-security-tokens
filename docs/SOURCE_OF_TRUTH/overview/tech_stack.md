---
tags: [overview, dependencies]
status: verified
last_verified: 2026-02-05
---

# Technology Stack

> Complete list of dependencies and their purposes.

---

## Backend

> **Runtime**: Node.js ≥18.0.0 | **Entry**: `backend/src/index.js`

### Core Framework

| Package | Version | Purpose |
|---------|---------|---------|
| `express` | 4.18.2 | HTTP server framework |
| `cors` | 2.8.5 | Cross-origin resource sharing |
| `helmet` | 7.1.0 | Security headers |
| `hpp` | 0.2.3 | HTTP parameter pollution protection |
| `morgan` | 1.10.0 | HTTP request logging |

### Database & ORM

| Package | Version | Purpose |
|---------|---------|---------|
| `prisma` | 7.3.0 | Database toolkit |
| `@prisma/client` | 7.3.0 | Database client |
| `@prisma/adapter-pg` | 7.3.0 | PostgreSQL adapter |
| `pg` | 8.11.3 | PostgreSQL driver |
| `ioredis` | 5.3.2 | Redis client |

### Stellar / Blockchain

| Package | Version | Purpose |
|---------|---------|---------|
| `@stellar/stellar-sdk` | 14.3.2 | Stellar blockchain SDK |
| `passkey-kit` | 0.11.3 | Soroban smart wallets |

### Authentication

| Package | Version | Purpose |
|---------|---------|---------|
| `@simplewebauthn/server` | 13.2.2 | WebAuthn/Passkey server |
| `jsonwebtoken` | 9.0.2 | JWT tokens |
| `bcrypt` | 5.1.1 | Password hashing |

### Rate Limiting

| Package | Version | Purpose |
|---------|---------|---------|
| `express-rate-limit` | 8.2.1 | Rate limiting middleware |
| `rate-limit-redis` | 4.3.1 | Redis store for rate limits |

### Background Jobs

| Package | Version | Purpose |
|---------|---------|---------|
| `bull` | 4.12.0 | Job queue (Redis-backed) |
| `node-cron` | 3.0.3 | Scheduled tasks |

### External Services

| Package | Version | Purpose |
|---------|---------|---------|
| `nodemailer` | 7.0.10 | Email sending |
| `pinata-web3` | 0.5.4 | IPFS document storage |
| `axios` | 1.6.0 | HTTP client |
| `pusher` | 5.3.2 | Real-time notifications |

### Validation

| Package | Version | Purpose |
|---------|---------|---------|
| `express-validator` | 7.0.1 | Request validation |
| `multer` | 2.0.2 | File upload handling |

### Monitoring

| Package | Version | Purpose |
|---------|---------|---------|
| `@sentry/node` | 10.34.0 | Error tracking |

### Documentation

| Package | Version | Purpose |
|---------|---------|---------|
| `swagger-jsdoc` | 6.2.8 | OpenAPI docs generator |
| `swagger-ui-express` | 5.0.1 | API docs UI |

---

## Frontend

> **Framework**: React 19 + Vite 7 | **Language**: TypeScript 5.9

### Core

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | 19.2.3 | UI library |
| `react-dom` | 19.2.3 | DOM rendering |
| `react-router-dom` | 7.9.5 | Client-side routing |
| `vite` | 7.2.2 | Build tool |
| `typescript` | 5.9.3 | Type checking |

### Styling

| Package | Version | Purpose |
|---------|---------|---------|
| `tailwindcss` | 4.1.17 | Utility-first CSS |
| `clsx` | 2.1.1 | Class name composition |
| `tailwind-merge` | 3.4.0 | Merge Tailwind classes |
| `class-variance-authority` | 0.7.1 | Component variants |

### UI Components (Radix)

| Package | Version | Purpose |
|---------|---------|---------|
| `@radix-ui/react-dialog` | 1.1.15 | Modal dialogs |
| `@radix-ui/react-dropdown-menu` | 2.1.16 | Dropdown menus |
| `@radix-ui/react-select` | 2.2.6 | Select inputs |
| `@radix-ui/react-tabs` | 1.1.13 | Tab navigation |
| `@radix-ui/react-tooltip` | 1.2.8 | Tooltips |
| `@radix-ui/react-label` | 2.1.8 | Form labels |
| `@radix-ui/react-separator` | 1.1.8 | Visual separators |

### Icons & Visualization

| Package | Version | Purpose |
|---------|---------|---------|
| `lucide-react` | 0.553.0 | Icon library |
| `recharts` | 3.4.1 | Charts/graphs |
| `qrcode` | 1.5.4 | QR code generation |

### Blockchain / Auth

| Package | Version | Purpose |
|---------|---------|---------|
| `@stellar/stellar-sdk` | 14.3.2 | Stellar SDK |
| `passkey-kit` | 0.11.3 | Passkey wallets |
| `@simplewebauthn/browser` | 13.2.2 | WebAuthn client |
| `@ledgerhq/hw-app-str` | 7.3.1 | Ledger Stellar app |
| `@ledgerhq/hw-transport-webusb` | 6.29.16 | Ledger USB transport |

### Utilities

| Package | Version | Purpose |
|---------|---------|---------|
| `axios` | 1.13.2 | HTTP client |
| `date-fns` | 4.1.0 | Date utilities |
| `sonner` | 2.0.7 | Toast notifications |
| `pusher-js` | 8.4.0 | Real-time client |

### Monitoring

| Package | Version | Purpose |
|---------|---------|---------|
| `@sentry/react` | 10.34.0 | Error tracking |

---

## Infrastructure

| Tool | Purpose |
|------|---------|
| Docker | Containerization |
| PostgreSQL | Primary database |
| Redis | Cache, rate limiting, job queue |
| Nginx | Frontend reverse proxy |

---

## Related

- [[overview/architecture]] — System architecture
- [[overview/env_variables]] — Configuration
- [[backend/_INDEX]] — Backend structure
- [[frontend/_INDEX]] — Frontend structure
