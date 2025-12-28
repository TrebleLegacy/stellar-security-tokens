# Monetization & Fee System

This document outlines the fee structure implemented in the Stellar Security Tokens platform.

## Overview

The platform supports a dynamic, configurable fee system that allows administrators to monetize various operations. Fees are collected in USDC and tracked in the `FeeLog` table.

## Fee Types

### 1. Blockchain Operation Fee (Fixed)
- **Purpose**: Covers the cost of Stellar network transaction fees (gas) and operational overhead.
- **Trigger**: Charged on every investment purchase.
- **Amount**: Defaults to **5.0 USDC**.
- **Configuration Key**: `BLOCKCHAIN_OPERATION_FEE_FIXED`
- **Deduction**: Deducted from the User's USDC payment *before* tokens are calculated.
  - *Example*: User pays 100 USDC. Fee is 5 USDC. Net investment is 95 USDC. User receives 95 USDC worth of tokens.

### 2. Investment Fee (Percentage)
- **Purpose**: A platform fee charged on the volume of capital raised.
- **Trigger**: Charged on every investment purchase.
- **Amount**: Percentage (0-100%). Defaults to **0%**.
- **Configuration Key**: `INVESTMENT_FEE_PERCENT`
- **Deduction**: Combined with the Fixed Fee and deducted from the gross USDC amount.

### 3. Dividend Distribution Fee (Percentage)
- **Purpose**: A service fee charged when issuers distribute dividends/interest to investors.
- **Trigger**: Charged during the monthly/quarterly payment processing.
- **Amount**: Percentage of the *gross* dividend amount. Defaults to **0%**.
- **Configuration Key**: `DIVIDEND_FEE_PERCENT`
- **Deduction**: Deducted from the total interest payment batch before individual investor payouts are calculated.

## Configuration

Platform Administrators can adjust these fees using the Admin API.

### Get Current Configuration
```http
GET /api/platform-admins/system-config
Authorization: Bearer <admin_token>
```

### Update Fees
```http
PUT /api/platform-admins/system-config
Authorization: Bearer <admin_token>
Content-Type: application/json

[
  {
    "key": "BLOCKCHAIN_OPERATION_FEE_FIXED",
    "value": "5.0",
    "description": "Fixed fee per investment transaction"
  },
  {
    "key": "INVESTMENT_FEE_PERCENT",
    "value": "1.5",
    "description": "1.5% platform fee on investments"
  }
]
```

## Fee Logging

All collected fees are recorded in the `FeeLog` database table for auditing and reporting.

- **Admin Endpoint**: `GET /api/platform-admins/fee-logs`
- **Schema**:
  - `id`: UUID
  - `relatedId`: ID of the investment or payment
  - `type`: `INVESTMENT_FEE` or `DIVIDEND_FEE`
  - `amount`: USDC amount collected
  - `assetCode`: Asset involved (e.g., REIT01)
  - `description`: Detailed breakdown (e.g., "Investment Fee: 1.5% + 5.0 USDC Fixed")
  - `createdAt`: Timestamp
