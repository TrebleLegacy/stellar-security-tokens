# Investment Flow

How capital moves from Investors to Companies.

## The User Journey

### 1. Discovery
The Investor browses the **Marketplace**. They see available "Offers" (e.g., "Solar Farm Project - 12% APY").
- They can read documents, check the maturity date, and see the risk rating.

### 2. Purchase Request
The Investor decides to invest (e.g., 1,000 USDC).
- **Pre-requisite**: Must have a funded wallet (USDC) and completed KYC.
- **Check**: The system verifies they have enough funds + standard fees.

### 3. Settlement (The "Purchase")
When they click "Confirm Investment":
1.  **Fee Deduction**: The system deducts the **Blockchain Operation Fee** (5 USDC) and any % fees.
2.  **Payment**: The remaining USDC is sent to the **Treasury** (Vault).
3.  **Token Delivery**: In the same atomic transaction, the Project Tokens are sent to the Investor's wallet.
    - *Atomic* means: Both happen instantly, or neither happens. There is no risk of paying and not receiving tokens.

### 4. Post-Investment
The Investor now holds the tokens.
- They can see them in their Portfolio.
- They start accruing interest/dividends immediately according to the asset's schedule.
