# Dividends & Payments

How investors get paid.

## The "Smart" Payment System

Unlike traditional banks that take days to process dividends, our platform automates this via the Blockchain.

### 1. Revenue Collection
The Issuer (Company) deposits the interest/dividend payment in USDC into the **Treasury Account**.

### 2. Proportional Calculation
On the scheduled payment date, the system queries **on-chain token balances** for all holders.
- It calculates how much each investor owns *at that exact moment*.
- Example:
  - Alice owns 10% of tokens → Gets 10% of the payment.
  - Bob owns 5% of tokens → Gets 5% of the payment.

### 3. Fee Deduction
Before distribution, the **Dividend Fee** (if configured) is deducted from the total pot.

### 4. Distribution (Payout)
The system sends USDC directly to the wallet of every token holder.
- **Speed**: Hundreds of investors can be paid in minutes.
- **Transparency**: Every payment is recorded on the blockchain (and `FeeLog` for taxes).

## Payment Types
- **Monthly Interest**: Regular income (e.g., Real Estate rent).
- **Quarterly/Semi-Annual/Annual**: Periodic schedules based on offer configuration.
- **Bullet**: One-time principal + interest payment at maturity (e.g., Loan repayment).

---

> **See also:** [INVESTMENT_FLOW.md](INVESTMENT_FLOW.md) for purchase flow · [MONETIZATION.md](MONETIZATION.md) for fee structure · [TOKENIZATION.md](TOKENIZATION.md) for token lifecycle
