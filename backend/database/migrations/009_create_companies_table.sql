-- Migration: Create companies table
-- Tabela para empresas que criam ofertas de tokenização

CREATE TABLE IF NOT EXISTS companies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  cnpj VARCHAR(18) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  legal_representative VARCHAR(255) NOT NULL,
  address TEXT,
  phone VARCHAR(20),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'suspended', 'rejected')),
  kyc_status VARCHAR(20) DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'approved', 'rejected')),
  kyc_documents JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_companies_email ON companies(email);
CREATE INDEX IF NOT EXISTS idx_companies_cnpj ON companies(cnpj);
CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(status);
CREATE INDEX IF NOT EXISTS idx_companies_kyc_status ON companies(kyc_status);

COMMENT ON TABLE companies IS 'Empresas que criam ofertas de tokenização na plataforma';
COMMENT ON COLUMN companies.cnpj IS 'CNPJ da empresa (único)';
COMMENT ON COLUMN companies.status IS 'Status da empresa na plataforma';
COMMENT ON COLUMN companies.kyc_status IS 'Status KYC da empresa';
COMMENT ON COLUMN companies.kyc_documents IS 'Documentos KYC em formato JSONB';

