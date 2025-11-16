-- Migration: Create company_users table
-- Tabela para usuários das empresas (login das empresas)

CREATE TABLE IF NOT EXISTS company_users (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_company_users_email ON company_users(email);
CREATE INDEX IF NOT EXISTS idx_company_users_company ON company_users(company_id);
CREATE INDEX IF NOT EXISTS idx_company_users_active ON company_users(is_active);

COMMENT ON TABLE company_users IS 'Usuários das empresas que podem criar e gerenciar ofertas';
COMMENT ON COLUMN company_users.company_id IS 'Empresa à qual o usuário pertence';
COMMENT ON COLUMN company_users.role IS 'Role do usuário dentro da empresa (user ou admin)';

