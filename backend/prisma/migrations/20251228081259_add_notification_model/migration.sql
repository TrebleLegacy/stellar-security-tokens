-- CreateEnum
CREATE TYPE "MultiSigTxStatus" AS ENUM ('pending', 'executed', 'rejected', 'failed');

-- CreateTable
CREATE TABLE "multisig_transactions" (
    "id" SERIAL NOT NULL,
    "xdr" TEXT NOT NULL,
    "description" VARCHAR(255),
    "status" "MultiSigTxStatus" NOT NULL DEFAULT 'pending',
    "initiator_id" INTEGER,
    "signatures" JSONB NOT NULL DEFAULT '[]',
    "network" TEXT NOT NULL DEFAULT 'testnet',
    "threshold_met" BOOLEAN NOT NULL DEFAULT false,
    "hash" VARCHAR(64),
    "error_message" TEXT,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "multisig_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "user_type" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "action_link" VARCHAR(255),
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "multisig_transactions_status_idx" ON "multisig_transactions"("status");

-- CreateIndex
CREATE INDEX "multisig_transactions_initiator_id_idx" ON "multisig_transactions"("initiator_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_user_type_idx" ON "notifications"("user_id", "user_type");

-- CreateIndex
CREATE INDEX "notifications_is_read_idx" ON "notifications"("is_read");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at" DESC);

-- AddForeignKey
ALTER TABLE "multisig_transactions" ADD CONSTRAINT "multisig_transactions_initiator_id_fkey" FOREIGN KEY ("initiator_id") REFERENCES "platform_admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;
