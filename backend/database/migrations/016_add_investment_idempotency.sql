-- Migration: Add idempotency constraints to prevent duplicate distributions
-- Ensures same USDC payment cannot result in multiple token distributions

-- Add unique constraint on token_distributions for idempotency
-- Prevents duplicate distributions for same investor/asset/USDC payment
CREATE UNIQUE INDEX IF NOT EXISTS idx_distributions_idempotency 
  ON token_distributions(investor_id, asset_code, usdc_payment_hash) 
  WHERE usdc_payment_hash IS NOT NULL;

-- Add memo column to token_distributions if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'token_distributions' AND column_name = 'memo'
  ) THEN
    ALTER TABLE token_distributions ADD COLUMN memo VARCHAR(28) NULL;
    CREATE INDEX IF NOT EXISTS idx_distributions_memo ON token_distributions(memo) WHERE memo IS NOT NULL;
  END IF;
END $$;

-- Comments
COMMENT ON COLUMN token_distributions.memo IS 'Memo from Stellar transaction for tracking and idempotency';

