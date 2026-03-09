-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "DepositStatus" ADD VALUE 'pending_approval';
ALTER TYPE "DepositStatus" ADD VALUE 'rejected';

-- AlterEnum
ALTER TYPE "InvestmentStatus" ADD VALUE 'pending_distribution';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "MultiSigOperationType" ADD VALUE 'sac_deploy';
ALTER TYPE "MultiSigOperationType" ADD VALUE 'dividend_distribution';
ALTER TYPE "MultiSigOperationType" ADD VALUE 'disable_clawback';

-- DropIndex
DROP INDEX "investments_investor_offer_pending_unique";

-- AlterTable
ALTER TABLE "offers" ADD COLUMN     "soroban_init_error" TEXT,
ADD COLUMN     "soroban_init_status" VARCHAR(20);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" SERIAL NOT NULL,
    "token_hash" VARCHAR(64) NOT NULL,
    "user_type" VARCHAR(20) NOT NULL,
    "user_id" INTEGER NOT NULL,
    "expires_at" TIMESTAMP NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP,
    "replaced_by" VARCHAR(64),

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_user_type_idx" ON "refresh_tokens"("user_id", "user_type");

-- CreateIndex
CREATE INDEX "refresh_tokens_expires_at_idx" ON "refresh_tokens"("expires_at");
