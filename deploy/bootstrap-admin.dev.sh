#!/bin/bash
# =============================================================================
# Bootstrap Admin (Dev) — Seeds admin accounts for local development
# =============================================================================
# Use this on dev/testnet. For production, use deploy/bootstrap-admin.sh.
#
# Reads ADMIN_1_EMAIL, ADMIN_1_NAME, ADMIN_2_EMAIL, ADMIN_2_NAME from .env.
# Freighter keys are testnet keys — safe to hardcode here.
#
# Usage (from project root):
#   chmod +x deploy/bootstrap-admin.dev.sh
#   ./deploy/bootstrap-admin.dev.sh
# =============================================================================

set -euo pipefail

# Load env vars from .env (dev)
if [ -f .env ]; then
    export $(grep -E '^(DB_USER|DB_PASSWORD|DB_NAME|ADMIN_[12]_EMAIL|ADMIN_[12]_NAME)=' .env | xargs)
fi

DB_USER=${DB_USER:-postgres}
DB_NAME=${DB_NAME:-stellar_tokens}
ADMIN_1_EMAIL=${ADMIN_1_EMAIL:?'ERROR: ADMIN_1_EMAIL must be set in .env'}
ADMIN_1_NAME=${ADMIN_1_NAME:-'Pedro Wakigawa Saragossy'}
ADMIN_2_EMAIL=${ADMIN_2_EMAIL:-''}
ADMIN_2_NAME=${ADMIN_2_NAME:-'Gabriel'}

echo "🔐 Bootstrapping dev admin accounts..."
echo "   Admin 1: $ADMIN_1_NAME <$ADMIN_1_EMAIL>"

docker compose exec -T postgres psql -U "$DB_USER" -d "$DB_NAME" -c "
INSERT INTO platform_admins (
    email, name, password_hash, role, is_active,
    stellar_public_key, created_at, updated_at
) VALUES (
    '$ADMIN_1_EMAIL',
    '$ADMIN_1_NAME',
    'FREIGHTER_ONLY',
    'super_admin',
    true,
    -- Testnet Freighter key — safe to hardcode for dev
    'GCQPERDSGG4524J5N33IFUXOHRJKFJFBNDX27KXET7MC6OV7XJAG5VX5',
    NOW(), NOW()
) ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    stellar_public_key = EXCLUDED.stellar_public_key,
    is_active = true;
"

if [ -n "$ADMIN_2_EMAIL" ]; then
    echo "   Admin 2: $ADMIN_2_NAME <$ADMIN_2_EMAIL>"
    docker compose exec -T postgres psql -U "$DB_USER" -d "$DB_NAME" -c "
INSERT INTO platform_admins (
    email, name, password_hash, role, is_active,
    stellar_public_key, created_at, updated_at
) VALUES (
    '$ADMIN_2_EMAIL',
    '$ADMIN_2_NAME',
    'FREIGHTER_ONLY',
    'admin',
    true,
    -- ⚠️ Replace with Gabriel's testnet Freighter public key
    'GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    NOW(), NOW()
) ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    stellar_public_key = EXCLUDED.stellar_public_key,
    is_active = true;
"
fi

echo "✅ Done. Login via Freighter at https://dev.radox.net/admin/login"
