-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "MultiSigOperationType" ADD VALUE 'sale_deploy';
ALTER TYPE "MultiSigOperationType" ADD VALUE 'sale_create';
ALTER TYPE "MultiSigOperationType" ADD VALUE 'contract_pause';
ALTER TYPE "MultiSigOperationType" ADD VALUE 'contract_resume';
ALTER TYPE "MultiSigOperationType" ADD VALUE 'contract_deposit_auth';
ALTER TYPE "MultiSigOperationType" ADD VALUE 'contract_deposit_transfer';
ALTER TYPE "MultiSigOperationType" ADD VALUE 'contract_price';
ALTER TYPE "MultiSigOperationType" ADD VALUE 'contract_withdraw';
ALTER TYPE "MultiSigOperationType" ADD VALUE 'contract_freeze';
ALTER TYPE "MultiSigOperationType" ADD VALUE 'contract_drain';
ALTER TYPE "MultiSigOperationType" ADD VALUE 'contract_propose_admin';
ALTER TYPE "MultiSigOperationType" ADD VALUE 'contract_accept_admin';
ALTER TYPE "MultiSigOperationType" ADD VALUE 'contract_upgrade';
