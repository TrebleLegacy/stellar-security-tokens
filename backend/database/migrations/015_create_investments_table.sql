-- Migration: Create investments table to track investment flow
-- Tracks investments from payment to token distribution

CREATE TABLE IF NOT EXISTS investments (
  id SERIAL PRIMARY KEY,
  investor_id INTEGER NOT NULL REFERENCES investors(id) ON DELETE CASCADE,
  offer_id INTEGER REFERENCES offers(id) ON DELETE SET NULL,
  asset_code VARCHAR(12) NOT NULL REFERENCES tokens(asset_code) ON DELETE RESTRICT,
  usdc_amount NUMERIC(20, 7) NOT NULL CHECK (usdc_amount > 0),
  token_amount NUMERIC(20, 7) NOT NULL CHECK (token_amount > 0),
  status VARCHAR(20) NOT NULL DEFAULT 'pending_payment' 
    CHECK (status IN ('pending_payment', 'payment_received', 'distributed', 'failed', 'cancelled')),
  usdc_payment_hash VARCHAR(64) NULL,
  distribution_tx_hash VARCHAR(64) NULL,
  memo VARCHAR(28) NULL, -- Stellar memo max 28 bytes
  error_message TEXT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_investments_investor ON investments(investor_id);
CREATE INDEX IF NOT EXISTS idx_investments_offer ON investments(offer_id);
CREATE INDEX IF NOT EXISTS idx_investments_status ON investments(status);
CREATE INDEX IF NOT EXISTS idx_investments_asset ON investments(asset_code);
CREATE INDEX IF NOT EXISTS idx_investments_usdc_hash ON investments(usdc_payment_hash) WHERE usdc_payment_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_investments_distribution_hash ON investments(distribution_tx_hash) WHERE distribution_tx_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_investments_created ON investments(created_at DESC);

-- Unique constraint to prevent duplicate investments for same payment
CREATE UNIQUE INDEX IF NOT EXISTS idx_investments_usdc_unique 
  ON investments(investor_id, offer_id, usdc_payment_hash) 
  WHERE usdc_payment_hash IS NOT NULL;

-- Trigger to update updated_at automatically
CREATE TRIGGER update_investments_updated_at 
  BEFORE UPDATE ON investments 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE investments IS 'Tracks investment flow from USDC payment to token distribution';
COMMENT ON COLUMN investments.status IS 'Current status of the investment: pending_payment, payment_received, distributed, failed, cancelled';
COMMENT ON COLUMN investments.usdc_payment_hash IS 'Transaction hash of USDC payment to treasury';
COMMENT ON COLUMN investments.distribution_tx_hash IS 'Transaction hash of token distribution';
COMMENT ON COLUMN investments.memo IS 'Unique memo used in Stellar transaction for tracking';

