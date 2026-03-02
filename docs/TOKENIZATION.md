# Tokenization Model

This document explains how Real World Assets (RWAs) are transformed into digital tokens on the platform.

## What is a Token?

A token represents a fractional ownership or claim on a real-world asset (like a real estate property, debt instrument, or company equity).
- **Example**: A building valued at $1,000,000 might be represented by 1,000,000 tokens (Token Name: `BUILD01`), each worth $1.00.

## The Lifecycle of a Token

### 1. Asset Definition (Company)
An issuer (Company) defines the asset:
- **Details**: Name, Description, Total Value, Legal Documents.
- **Supply**: How many tokens will be created.
- **Yield**: Does it pay interest? (e.g., 10% APY).

### 2. Creation & Minting (Platform Admin)
Once approved, the platform "mints" (creates) the tokens on the Stellar Blockchain.
- **Issuer Account**: The "owner" account that creates the tokens.
- **Distributor Account**: The account that holds the tokens ready for sale.
- **Control**: The tokens are initially locked and cannot be traded until sold.

### 3. Distribution (Sales)
When an Investor buys into an Offer:
1.  They pay with USDC (Digital Dollar).
2.  The platform transfers the equivalent amount of tokens from the Distributor to the Investors' Wallet.

### 4. Lifecycle Management
- **Freezing**: If a user is flagged (e.g., legal order), their tokens can be frozen.
- **Burning**: If the asset is sold or matures, tokens might be "burned" (destroyed) in exchange for the final payout.

## Why Stellar?
We use the Stellar network because it is fast, cheap (fractions of a cent per transaction), and built specifically for asset issuance.

---

> **See also:** [SYSTEM_FLOW.md](SYSTEM_FLOW.md) for technical diagrams · [INVESTMENT_FLOW.md](INVESTMENT_FLOW.md) for purchase journey · [STELLAR_MULTISIG_REFERENCE.md](STELLAR_MULTISIG_REFERENCE.md) for account security
