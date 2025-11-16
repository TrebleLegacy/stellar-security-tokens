-- Migration: Add password authentication to investors
-- Permite login de investidores com senha

ALTER TABLE investors 
  ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

ALTER TABLE investors 
  ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_investors_password_hash ON investors(password_hash) WHERE password_hash IS NOT NULL;

COMMENT ON COLUMN investors.password_hash IS 'Hash da senha do investidor (bcrypt)';
COMMENT ON COLUMN investors.last_login IS 'Data e hora do último login';

