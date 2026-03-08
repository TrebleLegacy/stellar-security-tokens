-- Migration: add_soroban_contract_integration
-- Adds soroban_contract_id to offers table and trade_submitted to investment status

-- Add trade_submitted status to InvestmentStatus enum
ALTER TYPE "InvestmentStatus" ADD VALUE IF NOT EXISTS 'trade_submitted' AFTER 'pending_payment';

-- Add soroban_contract_id column to offers table
ALTER TABLE "offers" ADD COLUMN "soroban_contract_id" VARCHAR(56);

-- Add index for querying offers by contract ID
CREATE INDEX "offers_soroban_contract_id_idx" ON "offers"("soroban_contract_id");
