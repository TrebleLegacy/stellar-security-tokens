-- Add settlement contract ID to offers table
ALTER TABLE "offers" ADD COLUMN "soroban_settlement_contract_id" VARCHAR(56);

-- Index for fast lookup
CREATE INDEX "offers_soroban_settlement_contract_id_idx" ON "offers"("soroban_settlement_contract_id");
