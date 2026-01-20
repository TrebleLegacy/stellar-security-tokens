# ═══════════════════════════════════════════════════════════════════════════════
#                     STELLAR SECURITY TOKENS - COMMAND REFERENCE
# ═══════════════════════════════════════════════════════════════════════════════

# ─────────────────────────────────────────────────────────────────────────────────
# DEVELOPMENT SERVERS
# ─────────────────────────────────────────────────────────────────────────────────

# Start backend API server (with hot reload)
cd backend && npm run dev

# Start frontend dev server  
cd frontend && npm run dev

# ─────────────────────────────────────────────────────────────────────────────────
# DOCKER
# ─────────────────────────────────────────────────────────────────────────────────

# Start all services (backend, frontend, postgres, redis) in development mode
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Start with rebuild (after changing dependencies)
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build

# Stop all docker services
docker-compose -f docker-compose.yml -f docker-compose.dev.yml down

# Start just the database (for local development)
docker-compose up -d db

# ─────────────────────────────────────────────────────────────────────────────────
# DATABASE (PRISMA)
# ─────────────────────────────────────────────────────────────────────────────────

# Generate Prisma client after schema changes
cd backend && npm run prisma:generate

# Create and apply migrations in development
cd backend && npm run prisma:migrate

# Apply migrations in production
cd backend && npm run prisma:migrate:deploy

# Open Prisma Studio (visual database browser)
cd backend && npm run prisma:studio

# Pull schema from existing database
cd backend && npm run prisma:db:pull

# ─────────────────────────────────────────────────────────────────────────────────
# TEST ACCOUNTS (ONE-CLICK LOGIN)
# ─────────────────────────────────────────────────────────────────────────────────

# Create test accounts for investor, company, and admin (with Stellar funding)
cd backend && node scripts/setup-test-accounts.js

# Same but also generate JWT tokens to test-tokens.json
cd backend && node scripts/setup-test-accounts.js --generate-tokens

# ─────────────────────────────────────────────────────────────────────────────────
# TESTS
# ─────────────────────────────────────────────────────────────────────────────────

# Run all tests (unit + integration)
cd backend && npm test

# Run only unit tests
cd backend && npm run test:unit

# Run only integration tests
cd backend && npm run test:integration

# Run tests for CI (mocked, no real database)
cd backend && npm run test:ci

# Frontend tests
cd frontend && npm run test

# ─────────────────────────────────────────────────────────────────────────────────
# MULTISIG / LEDGER (PRODUCTION KEY MANAGEMENT)
# ─────────────────────────────────────────────────────────────────────────────────

# Inspect issuer/distributor accounts (see signers, thresholds, balances)
cd backend && npm run multisig:inspect

# Setup multisig on issuer account (add Ledger keys, set thresholds)
cd backend && npm run multisig:setup

# ─────────────────────────────────────────────────────────────────────────────────
# UTILITY SCRIPTS
# ─────────────────────────────────────────────────────────────────────────────────

# Clean test data from database
cd backend && node scripts/clean-test-data.js

# Inspect Stellar accounts (balances, trustlines, signers)
cd backend && node scripts/inspect-accounts.js

# Fund a wallet on testnet
cd backend && node scripts/fundWallet.js <PUBLIC_KEY>

# Test IPFS/Pinata connection
cd backend && node scripts/test-ipfs-connection.js

# Test Launchtube sponsorship
cd backend && node scripts/test-sponsorship.js

# ─────────────────────────────────────────────────────────────────────────────────
# LINTING & FORMATTING
# ─────────────────────────────────────────────────────────────────────────────────

# Check for lint errors (backend)
cd backend && npm run lint

# Fix lint errors automatically
cd backend && npm run lint:fix

# Format code with Prettier
cd backend && npm run format

# Check lint errors (frontend)
cd frontend && npm run lint

# ─────────────────────────────────────────────────────────────────────────────────
# BUILD & DEPLOY
# ─────────────────────────────────────────────────────────────────────────────────

# Build frontend for production
cd frontend && npm run build

# Preview production build
cd frontend && npm run preview

# Start backend in production mode
cd backend && npm start