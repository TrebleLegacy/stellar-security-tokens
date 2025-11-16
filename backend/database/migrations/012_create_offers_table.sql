-- Migration: Create offers table
-- Tabela para ofertas de tokenização criadas pelas empresas

CREATE TABLE IF NOT EXISTS offers (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  requested_by INTEGER NOT NULL REFERENCES company_users(id) ON DELETE CASCADE,
  asset_code VARCHAR(12) NOT NULL UNIQUE,
  offer_name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  total_supply NUMERIC(20, 7) NOT NULL,
  annual_interest_rate NUMERIC(10, 7),
  offer_type VARCHAR(20) NOT NULL CHECK (offer_type IN ('collateral', 'sale')),
  offer_rules JSONB DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'under_review', 'approved', 'rejected', 'active', 'closed')),
  rejection_reason TEXT,
  reviewed_by INTEGER REFERENCES platform_admins(id),
  reviewed_at TIMESTAMP,
  legal_documents JSONB DEFAULT '{}',
  due_diligence_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_offers_company ON offers(company_id);
CREATE INDEX IF NOT EXISTS idx_offers_status ON offers(status);
CREATE INDEX IF NOT EXISTS idx_offers_asset_code ON offers(asset_code);
CREATE INDEX IF NOT EXISTS idx_offers_type ON offers(offer_type);
CREATE INDEX IF NOT EXISTS idx_offers_reviewed_by ON offers(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_offers_active ON offers(status) WHERE status = 'active';

COMMENT ON TABLE offers IS 'Ofertas de tokenização criadas pelas empresas';
COMMENT ON COLUMN offers.asset_code IS 'Código único do asset Stellar (ex: RWA001)';
COMMENT ON COLUMN offers.offer_type IS 'Tipo de oferta: collateral (captação) ou sale (venda)';
COMMENT ON COLUMN offers.offer_rules IS 'Regras personalizadas da oferta em formato JSONB';
COMMENT ON COLUMN offers.legal_documents IS 'Documentos legais com hashes IPFS em formato JSONB';
COMMENT ON COLUMN offers.status IS 'Status da oferta no workflow de aprovação';

