-- Migration: Add offer relations to existing tables
-- Vincula tokens, distribuições e pagamentos às ofertas

-- Adicionar offer_id em tokens
ALTER TABLE tokens 
  ADD COLUMN IF NOT EXISTS offer_id INTEGER REFERENCES offers(id) ON DELETE SET NULL;

-- Adicionar issued_by em tokens (admin que emitiu)
ALTER TABLE tokens 
  ADD COLUMN IF NOT EXISTS issued_by INTEGER REFERENCES platform_admins(id) ON DELETE SET NULL;

-- Adicionar offer_id em token_distributions
ALTER TABLE token_distributions 
  ADD COLUMN IF NOT EXISTS offer_id INTEGER REFERENCES offers(id) ON DELETE SET NULL;

-- Adicionar offer_id em interest_payments
ALTER TABLE interest_payments 
  ADD COLUMN IF NOT EXISTS offer_id INTEGER REFERENCES offers(id) ON DELETE SET NULL;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_tokens_offer ON tokens(offer_id);
CREATE INDEX IF NOT EXISTS idx_tokens_issued_by ON tokens(issued_by);
CREATE INDEX IF NOT EXISTS idx_distributions_offer ON token_distributions(offer_id);
CREATE INDEX IF NOT EXISTS idx_interest_payments_offer ON interest_payments(offer_id);

COMMENT ON COLUMN tokens.offer_id IS 'Oferta à qual o token pertence';
COMMENT ON COLUMN tokens.issued_by IS 'Admin da plataforma que emitiu o token';
COMMENT ON COLUMN token_distributions.offer_id IS 'Oferta da qual veio a distribuição';
COMMENT ON COLUMN interest_payments.offer_id IS 'Oferta relacionada ao pagamento de juros';

