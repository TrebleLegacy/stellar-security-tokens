-- Migration: Create platform_admins table
-- Tabela para administradores da plataforma

CREATE TABLE IF NOT EXISTS platform_admins (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'admin' CHECK (role IN ('admin', 'manager', 'super_admin')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_admins_email ON platform_admins(email);
CREATE INDEX IF NOT EXISTS idx_platform_admins_role ON platform_admins(role);
CREATE INDEX IF NOT EXISTS idx_platform_admins_active ON platform_admins(is_active);

COMMENT ON TABLE platform_admins IS 'Administradores da plataforma que gerenciam aprovações e due diligence';
COMMENT ON COLUMN platform_admins.role IS 'Role do admin: admin, manager ou super_admin';

