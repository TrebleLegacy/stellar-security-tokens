# Stellar Security Tokens

Plataforma baseada em blockchain para tokenização de ativos reais na rede Stellar.

## 🚀 Características

- **Backend**: Express.js com arquitetura baseada em serviços.
- **Frontend**: Dashboard Admin React v19.
- **Blockchain**: Integração com rede Stellar (SDK v14).
- **Segurança**: Autenticação via Passkey (WebAuthn).
- **Banco de Dados**: PostgreSQL com Prisma ORM.

## 🛠️ Instalação Rápida

### Usando Docker (Recomendado)

```bash
# Iniciar ambiente de desenvolvimento
docker-compose up -d
```

### Manual

1. Instale as dependências:
   ```bash
   npm install
   cd frontend && npm install
   ```

2. Configure o ambiente:
   ```bash
   cp .env.example .env
   # Edite o .env com suas chaves Stellar e banco de dados
   ```

3. Setup do banco e chaves:
   ```bash
   npm run setup
   ```

## 📖 Documentação da API

A documentação da API é gerada automaticamente via Swagger.

1. Inicie o servidor: `npm run dev`
2. Acesse: `http://localhost:3000/api-docs`

## 🧪 Testes

```bash
# Executar todos os testes
npm test
```

## 🏗️ Estrutura do Projeto

- `backend/src/`: Código fonte da API (Controllers, Services, Routes, Models).
- `frontend/src/`: Aplicação React.
- `scripts/`: Scripts de utilidade e setup.

---
*Nota: Esta documentação foi limpa para refletir o estado atual do projeto (Dezembro 2025).*
