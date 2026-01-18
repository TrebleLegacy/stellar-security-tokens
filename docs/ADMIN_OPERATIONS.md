# Admin Operations Cheat Sheet 🛠️

This document contains the most important terminal commands for platform administrators.

> [!IMPORTANT]
> Always run these commands from the `backend/` directory.

---

## 🔒 Stellar Security (Multisig & Locking)

These commands manage the security of your Stellar accounts.

### 1. Check Account Status
Check the current flags, signers, and thresholds for all platform accounts.
```bash
npm run multisig:inspect
```

### 2. Lock Issuer Account (Irreversible)
Prevents any further tokens from being minted. **Do this once after all tokens for a project are created.**
```bash
npm run multisig:setup -- -a issuer --lock
```

### 3. Setup Multisig (Ledger Wallets)
Add hardware wallet signers to the Treasury or Distributor accounts.
```bash
npm run multisig:setup -- -a treasury -s <PUBLIC_KEY> -t 2
```

---

## 🗄️ Database Management

### 1. Database Studio (Visual UI)
Open a browser window to view and edit database records directly.
```bash
npm run prisma:studio
```

### 2. Apply Migrations
Update the database schema to the latest version.
```bash
npm run migrate
```

---

## 🧪 Development & Testing

### 1. Seed Database
Populate the database with initial admin users and test data.
```bash
npm run seed
```

### 2. Run Integration Tests
Verify the platform logic (requires Docker to be running).
```bash
npm run test:integration
```

---

## 🚨 Emergency Operations

For **Freeze**, **Unfreeze**, and **Pause Offer** actions, use the **Emergency Controls** page in the Admin Dashboard UI.

If the UI is unavailable, these are managed via the same Stellar multisig commands above by people with the signing keys.
