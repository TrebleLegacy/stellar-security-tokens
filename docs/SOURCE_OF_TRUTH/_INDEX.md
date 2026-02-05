---
tags: [index, navigation]
status: active
last_verified: 2026-02-05
---

# 📚 Source of Truth — Master Index

> **Purpose**: This is the definitive reference for the Stellar Security Tokens codebase. Every file is documented with its purpose, connections, and current state.

---

## 🏗️ Architecture Overview

- [[overview/architecture]] — High-level system architecture
- [[overview/tech_stack]] — Dependencies and versions
- [[overview/env_variables]] — Environment variable reference

---

## ⚙️ Backend

> Node.js/Express API with Prisma ORM and Stellar SDK integration.

- [[backend/_INDEX]] — Backend entry point

### Core Layers
| Layer | Description | Files |
|-------|-------------|-------|
| [[backend/services/_INDEX\|Services]] | Business logic | 25 |
| [[backend/controllers/_INDEX\|Controllers]] | API handlers | 13 |
| [[backend/routes/_INDEX\|Routes]] | Route definitions | 15 |
| [[backend/middleware/_INDEX\|Middleware]] | Auth, rate limiting | 6 |
| [[backend/models/_INDEX\|Models]] | Data models | 7 |
| [[backend/config/_INDEX\|Config]] | Configuration | 6 |
| [[backend/database/_INDEX\|Database]] | Prisma schema | 1 |
| [[backend/scripts/_INDEX\|Scripts]] | Utility scripts | 18 |

---

## 🎨 Frontend

> React/TypeScript with Vite and TailwindCSS.

- [[frontend/_INDEX]] — Frontend entry point

### Structure
| Layer | Description | Files |
|-------|-------------|-------|
| [[frontend/pages/_INDEX\|Pages]] | Route pages (by role) | 39 |
| [[frontend/components/_INDEX\|Components]] | UI components | 20 |
| [[frontend/hooks/_INDEX\|Hooks]] | React hooks | 10 |
| [[frontend/api/_INDEX\|API]] | API clients | 15 |
| [[frontend/lib/_INDEX\|Lib]] | Utilities | 7 |
| [[frontend/layouts/_INDEX\|Layouts]] | Layout wrappers | 3 |

---

## 🐳 Infrastructure

- [[infrastructure/docker]] — Docker setup and services
- [[infrastructure/scripts]] — Root-level scripts
- [[infrastructure/ci_cd]] — GitHub Actions

---

## 🔄 System Flows

Critical user journeys documented end-to-end:

- [[flows/investment_flow]] — Investor purchases tokens
- [[flows/payment_flow]] — Payment detection → distribution
- [[flows/token_lifecycle]] — Token creation → settlement
- [[flows/passkey_wallet]] — Smart wallet deployment

---

## 📖 Existing Documentation

These docs in `/docs/` are maintained separately:

| Doc | Purpose |
|-----|---------|
| `SYSTEM_FLOW.md` | Lifecycle overview with mermaid diagrams |
| `AUTHENTICATION.md` | Passkey/WebAuthn flow |
| `POST_MIGRATION_REMINDERS.md` | Active roadmap (17 items) |
| `MAINNET_CHECKLIST.md` | Production deployment guide |
| `STELLAR_SECURITY_AUDIT.md` | Security best practices audit |
| `COMMAND REFERENCE.md` | CLI cheatsheet |

---

## 🔍 Quick Navigation

**By Role:**
- Admin pages → [[frontend/pages/admin/_INDEX]]
- Company pages → [[frontend/pages/company/_INDEX]]
- Investor pages → [[frontend/pages/investor/_INDEX]]

**By Feature:**
- Stellar integration → [[backend/services/stellar.service]]
- Passkey wallets → [[backend/services/passkeyWallet.service]]
- Payment processing → [[backend/services/payment.service]]
- Token distribution → [[backend/services/distributionQueue.service]]

---

## 📅 Maintenance Log

| Date | Action |
|------|--------|
| 2026-02-05 | Initial creation — full codebase audit |
