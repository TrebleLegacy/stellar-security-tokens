# Prompt Completo para Lovable - Plataforma RWA Tokenization Multi-Portal

## Contexto do Projeto

Crie uma plataforma completa de tokenização de Real World Assets (RWA) na rede Stellar com **3 portais distintos**:

1. **Investor Portal**: Para investidores visualizarem ofertas ativas, seus portfólios e métricas
2. **Company Portal**: Para empresas criarem e gerenciarem ofertas de tokenização
3. **Platform Admin Portal**: Para administradores da plataforma gerenciarem aprovações, due diligence e emissão de tokens

A plataforma funciona como um **marketplace de investimentos RWA**, onde empresas criam ofertas personalizadas e investidores podem diversificar seus portfólios entre múltiplas ofertas.

## Stack Técnica

- **Framework**: React 19+ com TypeScript
- **Roteamento**: React Router DOM v7
- **Estilização**: Tailwind CSS 4+ (design moderno e responsivo)
- **HTTP Client**: Axios
- **Gráficos**: Recharts
- **Ícones**: Lucide React
- **Autenticação**: JWT (Bearer Token)
- **Gerenciamento de Estado**: React Query ou SWR (recomendado)

## Configuração da API

**Base URL**: `http://localhost:3000/api`

**Autenticação**: Todos os endpoints (exceto registro e login) requerem header:
```
Authorization: Bearer <token>
```

**Formato de Resposta Padrão**:
```typescript
{
  success: boolean;
  data?: any;
  error?: string;
  details?: string;
  pagination?: {
    limit: number;
    offset: number;
    count?: number;
  }
}
```

## Estrutura de Dados

### Investor (Investidor)
```typescript
interface Investor {
  id: number;
  name: string;
  email: string;
  document: string; // CPF/CNPJ
  stellar_public_key?: string;
  kyc_status: 'pending' | 'approved' | 'rejected';
  password_hash?: string; // Não retornado na API
  last_login?: string;
  created_at: string;
  updated_at: string;
}
```

### Company (Empresa)
```typescript
interface Company {
  id: number;
  name: string;
  cnpj: string; // Único
  email: string; // Único
  legal_representative: string;
  address?: string;
  phone?: string;
  status: 'pending' | 'approved' | 'suspended' | 'rejected';
  kyc_status: 'pending' | 'approved' | 'rejected';
  kyc_documents: Record<string, any>; // JSONB
  created_at: string;
  updated_at: string;
}
```

### CompanyUser (Usuário da Empresa)
```typescript
interface CompanyUser {
  id: number;
  company_id: number;
  email: string; // Único
  name: string;
  role: 'user' | 'admin'; // Role dentro da empresa
  is_active: boolean;
  created_at: string;
}
```

### PlatformAdmin (Administrador da Plataforma)
```typescript
interface PlatformAdmin {
  id: number;
  email: string; // Único
  name: string;
  role: 'admin' | 'manager' | 'super_admin';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
```

### Offer (Oferta de Tokenização)
```typescript
interface LegalDocument {
  hash: string; // IPFS hash (CID)
  url: string; // URL completa IPFS
  fileName?: string;
  uploadedAt?: string;
}

interface Offer {
  id: number;
  company_id: number;
  requested_by: number; // ID do company_user
  asset_code: string; // Único, máximo 12 caracteres
  offer_name: string;
  description: string;
  total_supply: string; // NUMERIC
  annual_interest_rate?: number;
  offer_type: 'collateral' | 'sale'; // Captação ou venda
  offer_rules: Record<string, any>; // JSONB com regras personalizadas
  status: 'pending_review' | 'under_review' | 'approved' | 'rejected' | 'active' | 'closed';
  rejection_reason?: string;
  reviewed_by?: number; // ID do platform_admin
  reviewed_at?: string;
  legal_documents: {
    contract?: LegalDocument;
    terms?: LegalDocument;
    prospectus?: LegalDocument;
    kyc?: LegalDocument;
    other?: LegalDocument;
  }; // JSONB formatado com URLs IPFS
  due_diligence_notes?: string;
  created_at: string;
  updated_at: string;
}
```

### Token
```typescript
interface Token {
  id: number;
  asset_code: string; // Ex: "RWA001"
  issuer_public_key: string;
  total_supply: string; // NUMERIC format
  description?: string;
  annual_interest_rate?: number;
  offer_id?: number; // Relacionado à oferta
  issued_by?: number; // ID do platform_admin que emitiu
  created_at: string;
  updated_at: string;
}
```

### Investment (Investimento)
```typescript
interface Investment {
  id: number;
  investor_id: number;
  offer_id?: number;
  asset_code: string;
  usdc_amount: string; // Quantidade em USDC investida
  token_amount: string; // Quantidade de tokens a receber
  status: 'pending_payment' | 'payment_received' | 'distributed' | 'failed';
  usdc_payment_hash?: string; // Hash da transação USDC recebida
  distribution_tx_hash?: string; // Hash da transação de distribuição de tokens
  memo?: string; // Memo único para idempotência (máx 28 caracteres)
  error_message?: string;
  created_at: string;
  updated_at: string;
}
```

### Token Distribution
```typescript
interface TokenDistribution {
  id: number;
  investor_id: number;
  asset_code: string;
  amount: string;
  transaction_hash: string;
  usdc_payment_hash?: string;
  offer_id?: number;
  memo?: string; // Memo único para idempotência
  created_at: string;
}
```

### Interest Payment
```typescript
interface InterestPayment {
  id: number;
  investor_id: number;
  asset_code: string;
  token_balance: string;
  interest_rate: string;
  interest_amount: string;
  usdc_amount: string;
  transaction_hash: string;
  payment_date: string; // YYYY-MM-DD
  status: 'pending' | 'completed' | 'failed';
  offer_id?: number;
  created_at: string;
}
```

## Portal 1: Investor Portal - Especificação Detalhada por Telas

### 1. Tela de Login (`/investor/login`)

#### Elementos Visuais
- **Título**: "Investor Login" ou "Acesse sua Conta"
- **Logo/Branding**: Logo da plataforma (opcional)
- **Campos**:
  - Email (input type="email", obrigatório, validação de formato em tempo real)
  - Senha (input type="password", obrigatório, mínimo 6 caracteres, mostrar/ocultar senha)
- **Botões**:
  - "Entrar" (primary, submit, loading durante autenticação)
  - "Esqueci minha senha" (link secundário, opcional)
- **Link**: "Não tem conta? Registre-se" (link para `/investor/register`)

#### Funcionalidades
- Validação de formulário em tempo real
- Mensagens de erro claras abaixo dos campos
- Loading spinner no botão durante autenticação
- Redirecionamento automático para `/investor/dashboard` após sucesso
- Tratamento de erro 401 (credenciais inválidas)
- Armazenar token JWT no localStorage

#### Endpoint
- `POST /api/investors/login`

---

### 2. Tela de Registro (`/investor/register`)

#### Elementos Visuais
- **Título**: "Criar Conta de Investidor"
- **Campos**:
  - Nome completo (input text, obrigatório, mínimo 3 caracteres)
  - Email (input email, obrigatório, validação de formato, verificar unicidade)
  - Documento/CPF (input text, obrigatório, máscara de CPF, verificar unicidade)
  - Senha (input password, obrigatório, mínimo 6 caracteres, indicador de força)
  - Confirmar Senha (input password, obrigatório, deve coincidir com senha)
- **Checkbox**: "Aceito os termos e condições" (obrigatório)
- **Botões**:
  - "Criar Conta" (primary, submit, loading)
  - "Já tenho conta" (link para login)

#### Funcionalidades
- Validação completa de formulário antes de submeter
- Máscara de CPF (XXX.XXX.XXX-XX)
- Verificação de email único em tempo real (debounce)
- Verificação de CPF único em tempo real (debounce)
- Indicador visual de força da senha
- Validação de confirmação de senha
- Após criação bem-sucedida:
  - Exibir modal com chave pública Stellar criada
  - Aviso de segurança sobre guardar a chave
  - Botão "Copiar Chave" para facilitar
  - Mostrar status KYC inicial (pending) com badge
  - Redirecionar para login após fechar modal

#### Endpoint
- `POST /api/investors/register`

---

### 3. Dashboard do Investidor (`/investor/dashboard`)

#### Layout
- **Sidebar** com navegação:
  - Dashboard (ativo)
  - Meu Portfólio
  - Ofertas Disponíveis
  - Meus Investimentos
  - Histórico de Pagamentos
  - Perfil
- **Header**:
  - Nome do investidor
  - Status KYC (badge)
  - Chave Pública Stellar (truncada, com tooltip completo)
  - Botão de logout

#### Cards de Resumo (Topo)
1. **Total de Ofertas Investidas**
   - Número grande
   - Ícone de portfólio
   - Link para "Meu Portfólio"
2. **Total Investido**
   - Valor formatado ($X,XXX.XX USDC)
   - Ícone de dinheiro
   - Badge com variação do mês (se aplicável)
3. **Total de Juros Recebidos**
   - Valor formatado ($X,XXX.XX USDC)
   - Ícone de gráfico crescente
   - Link para "Histórico de Pagamentos"
4. **Número Total de Pagamentos**
   - Número grande
   - Ícone de calendário
   - Link para "Histórico de Pagamentos"

#### Gráfico Principal
- **Tipo**: Gráfico de linha
- **Título**: "Evolução do Portfólio"
- **Eixo X**: Período (últimos 6 meses)
- **Eixo Y**: Valor Total (USDC)
- **Série**: Valor total investido ao longo do tempo
- **Tooltip**: Mostrar data e valor ao passar o mouse
- **Empty State**: Mensagem "Ainda não há dados para exibir" se não houver investimentos

#### Seção de Ofertas Recentes
- **Título**: "Suas Ofertas Investidas"
- **Cards** (máximo 3, com link "Ver todas"):
  - Nome da Oferta
  - Asset Code
  - Valor Investido
  - Saldo Atual de Tokens
  - Link "Ver Detalhes"

#### Seção de Investimentos Recentes
- **Título**: "Investimentos Recentes"
- **Tabela resumida** (últimos 5):
  - Data
  - Oferta
  - Valor (USDC)
  - Status (badge)
  - Link "Ver Detalhes"

#### Funcionalidades
- Atualização automática a cada 30 segundos
- Loading skeleton durante carregamento inicial
- Tratamento de erro com mensagem amigável

#### Endpoints
- `GET /api/investors/:id/metrics`

---

### 4. Meu Portfólio (`/investor/portfolio`)

#### Layout
- **Título**: "Meu Portfólio"
- **Filtros** (opcional):
  - Por tipo de oferta (Collateral/Sale)
  - Por status da oferta (Active/Closed)

#### Lista de Investimentos
- **Cards de Ofertas Investidas**:
  - **Header do Card**:
    - Nome da Oferta (link para detalhes)
    - Badge de tipo (Collateral/Sale)
    - Badge de status da oferta
  - **Informações Principais**:
    - Asset Code (com link para Stellar Explorer)
    - Taxa de Juros Anual (%)
    - Total Distribuído (tokens formatados)
    - Valor Investido (USDC formatado)
  - **Métricas**:
    - Juros Recebidos até agora (USDC)
    - Número de pagamentos recebidos
    - Último pagamento (data)
  - **Ações**:
    - Botão "Ver Detalhes" (leva para página de saldo)
    - Botão "Ver Histórico de Pagamentos"
    - Link para documentos IPFS da oferta

#### Empty State
- **Quando não há investimentos**:
  - Ícone ilustrativo
  - Mensagem: "Você ainda não possui investimentos"
  - Botão "Explorar Ofertas" (link para `/investor/offers`)

#### Funcionalidades
- Ordenação por data de investimento (mais recente primeiro)
- Busca por nome da oferta ou asset code
- Paginação se houver muitos investimentos

#### Endpoint
- `GET /api/investors/:id/portfolio`

---

### 5. Ofertas Disponíveis (`/investor/offers`)

#### Layout
- **Título**: "Ofertas Disponíveis para Investimento"
- **Subtítulo**: "Diversifique seu portfólio investindo em diferentes ativos tokenizados"

#### Filtros (Topo)
- **Tipo de Oferta**: 
  - Radio buttons ou Tabs: Todas | Collateral | Sale
- **Busca**:
  - Input de busca por nome da oferta, empresa ou asset code
  - Ícone de lupa
  - Debounce de 300ms

#### Grid de Cards de Ofertas
- **Layout**: Grid responsivo (3 colunas desktop, 2 tablet, 1 mobile)
- **Card de Oferta**:
  - **Header**:
    - Nome da Oferta (título grande)
    - Badge de tipo (Collateral/Sale)
    - Badge "Nova" se criada nos últimos 7 dias
  - **Informações da Empresa**:
    - Nome da empresa
    - Logo (se disponível)
  - **Descrição**:
    - Texto truncado (máx 150 caracteres)
    - Link "Ler mais" expande descrição completa
  - **Métricas**:
    - Taxa de Juros Anual (%)
    - Supply Total (formatado)
    - Total já investido (formatado, se disponível)
  - **Documentos Disponíveis**:
    - Ícones pequenos: Contrato, Termos, Prospecto
    - Tooltip ao passar o mouse
  - **Ações**:
    - Botão "Ver Detalhes" (primary)
    - Botão "Investir Agora" (secondary, destacado)

#### Empty State
- **Quando não há ofertas**:
  - Mensagem: "Nenhuma oferta disponível no momento"
  - Sugestão: "Volte em breve para novas oportunidades"

#### Paginação
- 12 ofertas por página
- Navegação: primeira, anterior, próxima, última
- Mostrar "Página X de Y"

#### Endpoint
- `GET /api/offers/active`

---

### 6. Detalhes da Oferta (`/investor/offers/:id`)

#### Layout
- **Breadcrumb**: Ofertas > [Nome da Oferta]
- **Botão Voltar**: Link para lista de ofertas

#### Seção 1: Informações Gerais
- **Título**: "Informações da Oferta"
- **Campos**:
  - Nome da Oferta (título grande)
  - Empresa (com link para perfil da empresa, se disponível)
  - Asset Code (badge, com link para Stellar Explorer)
  - Tipo (badge: Collateral/Sale)
  - Taxa de Juros Anual (%)
  - Supply Total (formatado)
  - Descrição completa (texto longo formatado)

#### Seção 2: Documentos Legais
- **Título**: "Documentos Legais"
- **Lista de Documentos**:
  - Para cada documento (Contrato, Termos, Prospecto, etc.):
    - Nome do documento
    - Tipo de arquivo (PDF/DOC)
    - Hash IPFS (truncado, com tooltip completo)
    - Botão "Visualizar" (abre em nova aba)
    - Botão "Download"
    - Link "Verificar no IPFS" (link externo)
- **Aviso**: "Todos os documentos são armazenados de forma imutável no IPFS"

#### Seção 3: Regras da Oferta
- **Título**: "Regras e Condições"
- **Informações**:
  - Investimento Mínimo (se definido)
  - Investimento Máximo (se definido)
  - Prazo (se aplicável)
  - Outras regras personalizadas (formato JSON legível)

#### Seção 4: Estatísticas
- **Título**: "Estatísticas da Oferta"
- **Métricas**:
  - Total Investido até agora (USDC)
  - Número de Investidores
  - Porcentagem do Supply já distribuída
  - Gráfico de evolução (se disponível)

#### Seção 5: Ação de Investimento
- **Card Fixo** (sticky no topo ao scrollar):
  - Título: "Investir nesta Oferta"
  - Botão "Investir Agora" (primary, grande)
  - Aviso: "Você precisa estar logado para investir"

#### Funcionalidades
- Compartilhar oferta (botão de compartilhamento)
- Favoritar oferta (se implementado)
- Scroll suave entre seções

#### Endpoint
- `GET /api/offers/:id`

---

### 7. Investir em Oferta (`/investor/invest/:offerId`)

#### Layout
- **Breadcrumb**: Ofertas > [Nome da Oferta] > Investir
- **Título**: "Investir em [Nome da Oferta]"

#### Formulário de Investimento
- **Informações da Oferta** (card resumo):
  - Nome da Oferta
  - Asset Code
  - Taxa de Juros
  - Tipo
- **Campo Principal**:
  - Label: "Quantidade em USDC"
  - Input numérico (obrigatório, mínimo 0.0000001)
  - Placeholder: "0.00"
  - Validação em tempo real
  - Mostrar equivalente em tokens (se taxa de câmbio disponível)
- **Resumo**:
  - Quantidade USDC a investir
  - Quantidade de tokens a receber (calculado)
  - Taxa estimada (se aplicável)
- **Avisos**:
  - "Você precisará enviar USDC para a conta Treasury após confirmar"
  - "Janela de tempo: 2 minutos após confirmação"
- **Botões**:
  - "Confirmar Investimento" (primary, loading)
  - "Cancelar" (secondary, volta para detalhes da oferta)

#### Após Confirmação - Instruções de Pagamento
- **Título**: "Instruções de Pagamento"
- **Card de Instruções**:
  - **Endereço da Conta Treasury**:
    - Texto completo (copiável)
    - Botão "Copiar Endereço"
    - QR Code (opcional)
  - **Quantidade Exata**:
    - Valor em USDC (destaque grande)
    - Botão "Copiar Valor"
  - **Memo** (se aplicável):
    - Texto completo
    - Botão "Copiar Memo"
  - **Janela de Tempo**:
    - Contador regressivo (2 minutos)
    - Aviso: "Envie o pagamento dentro deste prazo"
  - **Status**:
    - Badge: "Aguardando Pagamento"
    - Indicador de progresso: Pagamento → Processamento → Distribuído
- **Ações**:
  - Botão "Verificar Status" (atualiza status)
  - Link "Ver no Stellar Explorer" (quando hash disponível)
  - Botão "Cancelar Investimento" (se ainda pendente)

#### Funcionalidades
- Polling automático de status a cada 3 segundos
- Notificação quando status mudar para `distributed` ou `failed`
- Redirecionamento automático para status quando pagamento detectado
- Validação de saldo suficiente (se verificação disponível)

#### Endpoints
- `POST /api/investments/purchase`
- `GET /api/investments/:id/status` (polling)

---

### 8. Status do Investimento (`/investor/investments/:id/status`)

#### Layout
- **Título**: "Status do Investimento"
- **Breadcrumb**: Meus Investimentos > Status

#### Card de Status Principal
- **Status Atual** (badge grande, colorido):
  - `pending_payment`: Amarelo, "Aguardando Pagamento"
  - `payment_received`: Azul, "Pagamento Recebido"
  - `distributed`: Verde, "Tokens Distribuídos"
  - `failed`: Vermelho, "Falha no Processo"
- **Indicador de Progresso**:
  - Timeline visual: Criado → Pagamento → Processamento → Distribuído
  - Marcação do passo atual

#### Informações do Investimento
- **Valores**:
  - Quantidade Investida: $X,XXX.XX USDC
  - Quantidade de Tokens: X,XXX.XXXXX tokens
  - Asset Code: [Código] (link para Stellar Explorer)
- **Oferta**:
  - Nome da Oferta (link para detalhes)
  - Tipo (badge)

#### Transações
- **Transação USDC** (se recebida):
  - Hash: [hash truncado] (link para Stellar Explorer)
  - Data/Hora: DD/MM/YYYY HH:MM
  - Status: Confirmada
- **Transação de Distribuição** (se distribuída):
  - Hash: [hash truncado] (link para Stellar Explorer)
  - Data/Hora: DD/MM/YYYY HH:MM
  - Status: Confirmada
  - Memo: [memo único]

#### Mensagem de Erro (se failed)
- **Card de Erro**:
  - Título: "Erro no Processamento"
  - Mensagem: [mensagem de erro]
  - Botão "Tentar Novamente" (se aplicável)
  - Link "Contatar Suporte"

#### Datas
- **Criado em**: DD/MM/YYYY HH:MM
- **Última Atualização**: DD/MM/YYYY HH:MM

#### Ações
- Botão "Ver no Stellar Explorer" (se hash disponível)
- Botão "Ver Detalhes da Oferta"
- Botão "Voltar para Meus Investimentos"

#### Funcionalidades
- Atualização automática a cada 3 segundos (polling)
- Notificação quando status mudar
- Compartilhar status (opcional)

#### Endpoint
- `GET /api/investments/:id/status`

---

### 9. Meus Investimentos (`/investor/investments`)

#### Layout
- **Título**: "Meus Investimentos"
- **Filtros**:
  - Por status: Todas | Pendentes | Processando | Distribuídos | Falhados
  - Por oferta: Dropdown com ofertas investidas
  - Por período: Date picker inicial/final

#### Tabela de Investimentos
- **Colunas**:
  - ID do Investimento
  - Oferta (nome, link)
  - Asset Code
  - Valor Investido (USDC formatado)
  - Tokens a Receber (formatado)
  - Status (badge colorido)
  - Data de Criação
  - Ações (dropdown)
- **Ordenação**: Por data (mais recente primeiro, padrão)

#### Ações por Linha
- Ver Status Completo
- Ver Detalhes da Oferta
- Ver no Stellar Explorer (se hash disponível)
- Cancelar (se pending_payment)

#### Resumo (Topo)
- Total de Investimentos
- Total Investido (USDC)
- Total de Tokens Recebidos
- Investimentos Pendentes

#### Paginação
- 20 itens por página
- Navegação completa

#### Empty State
- Mensagem: "Você ainda não realizou investimentos"
- Botão "Explorar Ofertas"

#### Endpoint
- `GET /api/investors/:id/investments` (se disponível) ou usar dados do portfólio

---

### 10. Saldo e Histórico por Asset (`/investor/balance/:assetCode`)

#### Layout
- **Título**: "Saldo e Histórico - [Asset Code]"
- **Breadcrumb**: Meu Portfólio > [Nome da Oferta] > Saldo

#### Card de Saldo Atual
- **Saldo de Tokens**:
  - Valor grande e destacado
  - Asset Code (badge)
  - Valor equivalente em USDC (se taxa disponível)
- **Informações**:
  - Taxa de Juros Anual (%)
  - Próximo pagamento estimado (data)
  - Total investido neste asset (USDC)

#### Gráfico de Evolução
- **Tipo**: Gráfico de linha
- **Título**: "Evolução do Saldo"
- **Eixo X**: Período (últimos 6 meses)
- **Eixo Y**: Saldo de Tokens
- **Série**: Saldo ao longo do tempo
- **Marcadores**: Pontos de distribuição e pagamentos

#### Tabela de Distribuições Recebidas
- **Título**: "Histórico de Distribuições"
- **Colunas**:
  - Data/Hora
  - Quantidade (tokens)
  - Hash da Transação (link para Stellar Explorer)
  - Status
- **Filtros**: Por período
- **Ordenação**: Por data (mais recente primeiro)

#### Tabela de Pagamentos de Juros Recebidos
- **Título**: "Histórico de Pagamentos de Juros"
- **Colunas**:
  - Data do Pagamento
  - Saldo de Tokens (na data)
  - Taxa de Juros (%)
  - Valor de Juros (USDC)
  - Hash da Transação (link para Stellar Explorer)
  - Email Enviado (badge sim/não)
- **Filtros**: Por período
- **Ordenação**: Por data (mais recente primeiro)

#### Resumo Consolidado
- **Card de Resumo**:
  - Total de Distribuições Recebidas
  - Total de Tokens Recebidos
  - Total de Juros Recebidos (USDC)
  - Número de Pagamentos Recebidos
  - Média por Pagamento (USDC)

#### Ações
- Botão "Ver Detalhes da Oferta"
- Botão "Exportar Histórico" (CSV)
- Link "Ver no Stellar Explorer" (conta do investidor)

#### Endpoint
- `GET /api/investors/:investorId/balance?assetCode=...`

---

### 11. Histórico de Pagamentos (`/investor/payments`)

#### Layout
- **Título**: "Histórico de Pagamentos de Juros"
- **Filtros**:
  - Por Asset Code: Dropdown com assets investidos
  - Por Período: Date picker inicial/final
  - Busca: Por hash de transação

#### Tabela de Pagamentos
- **Colunas**:
  - Data do Pagamento (DD/MM/YYYY)
  - Asset Code (badge, link para saldo)
  - Valor USDC (formatado, destacado)
  - Taxa de Juros (%)
  - Saldo de Tokens (na data do pagamento)
  - Hash da Transação (truncado, link para Stellar Explorer)
  - Email Recebido (badge sim/não)
- **Ordenação**: Por data (mais recente primeiro, padrão)

#### Resumo (Topo)
- **Cards**:
  - Total de Pagamentos Recebidos
  - Total de Juros Recebidos (USDC)
  - Média por Pagamento (USDC)
  - Último Pagamento (data)

#### Gráfico (Opcional)
- **Tipo**: Gráfico de barras
- **Título**: "Pagamentos ao Longo do Tempo"
- **Eixo X**: Período (mensal)
- **Eixo Y**: Valor (USDC)
- **Série**: Total de juros recebidos por mês

#### Paginação
- 50 itens por página

#### Exportação
- Botão "Exportar CSV"

#### Empty State
- Mensagem: "Nenhum pagamento recebido ainda"
- Informação: "Os pagamentos são processados mensalmente"

#### Endpoint
- `GET /api/investors/:investorId/payments`

---

### 12. Perfil do Investidor (`/investor/profile`)

#### Layout
- **Título**: "Meu Perfil"
- **Tabs**: Informações | Segurança | Configurações

#### Tab 1: Informações Pessoais
- **Campos** (read-only ou editáveis):
  - Nome Completo (editável)
  - Email (read-only, com aviso)
  - Documento/CPF (read-only)
  - Chave Pública Stellar (read-only, com botão copiar)
  - Status KYC (badge, read-only)
  - Data de Registro (read-only)
  - Último Login (read-only)
- **Botões**:
  - "Salvar Alterações" (se editável)
  - "Cancelar" (se em modo de edição)

#### Tab 2: Segurança
- **Alterar Senha**:
  - Senha Atual (input password)
  - Nova Senha (input password, com indicador de força)
  - Confirmar Nova Senha (input password)
  - Botão "Alterar Senha"
- **Sessões Ativas** (se implementado):
  - Lista de dispositivos logados
  - Opção de encerrar sessões

#### Tab 3: Configurações
- **Preferências**:
  - Idioma (dropdown)
  - Moeda de Exibição (dropdown)
  - Notificações por Email (toggle)
  - Notificações de Pagamentos (toggle)

#### Endpoints
- `GET /api/investors/:id`
- `PUT /api/investors/:id`
- `PUT /api/investors/:id/password`

## Portal 2: Company Portal - Especificação Detalhada por Telas

### 1. Registro da Empresa (`/company/register`)

#### Elementos Visuais
- **Título**: "Registrar Empresa"
- **Subtítulo**: "Crie sua conta empresarial para tokenizar seus ativos"
- **Campos**:
  - Nome da Empresa (input text, obrigatório, mínimo 3 caracteres)
  - CNPJ (input text, obrigatório, máscara XX.XXX.XXX/XXXX-XX, verificar unicidade)
  - Email (input email, obrigatório, validação de formato, verificar unicidade)
  - Representante Legal (input text, obrigatório)
  - Endereço (textarea, opcional)
  - Telefone (input tel, opcional, máscara (XX) XXXXX-XXXX)
- **Checkbox**: "Aceito os termos e condições" (obrigatório)
- **Botões**:
  - "Registrar Empresa" (primary, submit, loading)
  - "Já tenho conta" (link para login)

#### Funcionalidades
- Validação completa de formulário
- Máscara de CNPJ em tempo real
- Máscara de telefone em tempo real
- Verificação de CNPJ único (debounce)
- Verificação de email único (debounce)
- Após criação bem-sucedida:
  - Exibir mensagem de sucesso
  - Mostrar status inicial (pending) com badge
  - Redirecionar para criação de usuário

#### Endpoint
- `POST /api/companies/register`

---

### 2. Criar Usuário da Empresa (`/company/register-user`)

#### Elementos Visuais
- **Título**: "Criar Usuário da Empresa"
- **Subtítulo**: "Crie o primeiro usuário para acessar o portal da empresa"
- **Informação**: "Empresa: [Nome da Empresa]" (read-only)
- **Campos**:
  - Company ID (input hidden, preenchido automaticamente)
  - Email (input email, obrigatório, validação de formato, verificar unicidade)
  - Senha (input password, obrigatório, mínimo 6 caracteres, indicador de força)
  - Confirmar Senha (input password, obrigatório, deve coincidir)
  - Nome Completo (input text, obrigatório)
  - Role (radio buttons ou select: User | Admin, padrão: User)
- **Botões**:
  - "Criar Usuário" (primary, submit, loading)
  - "Voltar" (link para registro da empresa)

#### Funcionalidades
- Validação completa de formulário
- Verificação de email único (debounce)
- Indicador visual de força da senha
- Após criação bem-sucedida:
  - Mensagem de sucesso
  - Redirecionar para login

#### Endpoint
- `POST /api/company-users/register`

---

### 3. Login (`/company/login`)

#### Elementos Visuais
- **Título**: "Company Portal Login"
- **Logo/Branding**: Logo da plataforma (opcional)
- **Campos**:
  - Email (input type="email", obrigatório)
  - Senha (input type="password", obrigatório, mostrar/ocultar senha)
- **Botões**:
  - "Entrar" (primary, submit, loading)
- **Link**: "Não tem conta? Registre sua empresa" (link para `/company/register`)

#### Funcionalidades
- Validação de formulário em tempo real
- Mensagens de erro claras
- Loading spinner durante autenticação
- Redirecionamento para `/company/dashboard` após sucesso
- Tratamento de erro 401
- Armazenar token JWT no localStorage

#### Endpoint
- `POST /api/company-users/login`

---

### 4. Dashboard da Empresa (`/company/dashboard`)

#### Layout
- **Sidebar** com navegação:
  - Dashboard (ativo)
  - Minhas Ofertas
  - Criar Nova Oferta
  - Perfil da Empresa
  - Usuários da Empresa
- **Header**:
  - Nome da empresa
  - Status da empresa (badge)
  - Status KYC (badge)
  - Nome do usuário logado
  - Botão de logout

#### Cards de Resumo (Topo)
1. **Total de Ofertas**
   - Número total
   - Badge com pendentes de revisão
   - Link para lista de ofertas
2. **Ofertas Ativas**
   - Número de ofertas ativas
   - Link para ofertas ativas
3. **Ofertas Pendentes**
   - Número de ofertas aguardando revisão
   - Badge vermelho se > 0
   - Link para ofertas pendentes
4. **Total Investido nas Ofertas**
   - Valor total (USDC formatado)
   - Link para estatísticas

#### Seção de Ofertas Recentes
- **Título**: "Suas Ofertas Recentes"
- **Cards** (máximo 3, com link "Ver todas"):
  - Nome da Oferta
  - Asset Code
  - Status (badge)
  - Data de Criação
  - Link "Ver Detalhes"

#### Seção de Atividades Recentes
- **Título**: "Atividades Recentes"
- **Timeline** (últimas 5 atividades):
  - Mudanças de status de ofertas
  - Notas de due diligence recebidas
  - Tokens emitidos
  - Ofertas ativadas

#### Funcionalidades
- Atualização automática a cada 30 segundos
- Loading skeleton durante carregamento
- Tratamento de erro com mensagem amigável

#### Endpoints
- `GET /api/companies/profile`
- `GET /api/companies/offers` (para resumo)

---

### 5. Perfil da Empresa (`/company/profile`)

#### Layout
- **Título**: "Perfil da Empresa"
- **Tabs**: Informações | Status | Documentos KYC

#### Tab 1: Informações da Empresa
- **Campos** (editáveis ou read-only):
  - Nome da Empresa (editável)
  - CNPJ (read-only)
  - Email (read-only, com aviso)
  - Representante Legal (editável)
  - Endereço (editável, textarea)
  - Telefone (editável)
- **Botões**:
  - "Salvar Alterações" (primary, se em modo de edição)
  - "Editar" (secondary, se em modo de visualização)
  - "Cancelar" (se em modo de edição)

#### Tab 2: Status
- **Status da Empresa** (badge grande):
  - `pending`: Amarelo, "Aguardando Aprovação"
  - `approved`: Verde, "Aprovada"
  - `suspended`: Laranja, "Suspensa"
  - `rejected`: Vermelho, "Rejeitada"
- **Status KYC** (badge):
  - `pending`: Amarelo, "KYC Pendente"
  - `approved`: Verde, "KYC Aprovado"
  - `rejected`: Vermelho, "KYC Rejeitado"
- **Histórico de Mudanças**:
  - Timeline de mudanças de status
  - Data e motivo de cada mudança
- **Informações**:
  - Data de Registro
  - Última Atualização

#### Tab 3: Documentos KYC
- **Lista de Documentos Enviados**:
  - Para cada documento:
    - Nome do documento
    - Tipo de arquivo
    - Data de upload
    - Status (Aprovado/Rejeitado/Pendente)
    - Link para visualizar/download
- **Ações**:
  - Upload de novos documentos (se permitido)
  - Reenviar documentos rejeitados

#### Funcionalidades
- Validação de campos editáveis
- Confirmação antes de salvar alterações
- Upload de documentos com preview

#### Endpoints
- `GET /api/companies/profile`
- `PUT /api/companies/:id`

---

### 6. Lista de Ofertas (`/company/offers`)

#### Layout
- **Título**: "Minhas Ofertas"
- **Botão**: "Criar Nova Oferta" (primary, destacado, link para criar)

#### Filtros (Topo)
- **Status**: 
  - Tabs ou Dropdown: Todas | Pendentes | Em Revisão | Aprovadas | Rejeitadas | Ativas | Fechadas
- **Tipo**:
  - Radio buttons: Todas | Collateral | Sale
- **Busca**:
  - Input de busca por nome da oferta ou asset code
  - Debounce de 300ms

#### Tabela de Ofertas
- **Colunas**:
  - Asset Code (link para detalhes)
  - Nome da Oferta (link para detalhes)
  - Tipo (badge: Collateral/Sale)
  - Status (badge colorido)
  - Data de Criação (DD/MM/YYYY)
  - Última Atualização (DD/MM/YYYY)
  - Revisado Por (nome do admin, se revisado)
  - Ações (dropdown)
- **Ordenação**: Por data de criação (mais recente primeiro, padrão)

#### Ações por Linha
- Ver Detalhes
- Editar (apenas se status = pending_review)
- Ver Token no Stellar Explorer (se token emitido)
- Duplicar Oferta (opcional)

#### Paginação
- 20 itens por página
- Navegação completa

#### Empty State
- **Quando não há ofertas**:
  - Ícone ilustrativo
  - Mensagem: "Você ainda não criou nenhuma oferta"
  - Botão "Criar Primeira Oferta" (link para criar)

#### Endpoint
- `GET /api/companies/offers`

---

### 7. Criar Oferta (`/company/offers/create`)

#### Layout
- **Título**: "Criar Nova Oferta"
- **Breadcrumb**: Minhas Ofertas > Criar Nova Oferta
- **Progresso**: Indicador de etapas (1. Informações | 2. Documentos | 3. Revisão)

#### Etapa 1: Informações Básicas
- **Campos**:
  - **Asset Code** (input text, obrigatório):
    - Máximo 12 caracteres
    - Apenas letras maiúsculas e números
    - Validação em tempo real
    - Verificação de unicidade (debounce)
    - Aviso: "Este código será usado no Stellar"
  - **Nome da Oferta** (input text, obrigatório):
    - Máximo 200 caracteres
    - Contador de caracteres
  - **Descrição** (textarea, obrigatório):
    - Mínimo 100 caracteres
    - Máximo 5000 caracteres
    - Contador de caracteres
    - Editor de texto rico (opcional)
  - **Supply Total** (input number, obrigatório):
    - Número positivo
    - Máximo 7 casas decimais
    - Formatação em tempo real
  - **Taxa de Juros Anual** (input number, opcional):
    - Percentual (0-100)
    - 2 casas decimais
    - Placeholder: "Ex: 10.5"
  - **Tipo de Oferta** (radio buttons, obrigatório):
    - Collateral (empréstimo garantido)
    - Sale (venda de tokens)
  - **Regras Personalizadas** (seção expansível):
    - Editor JSON com validação
    - Campos sugeridos:
      - `min_investment` (número)
      - `max_investment` (número)
      - `loan_term` (número, para collateral)
      - `price_per_token` (número, para sale)
    - Preview formatado
- **Botões**:
  - "Próxima Etapa" (primary, valida antes de avançar)
  - "Salvar Rascunho" (secondary, opcional)
  - "Cancelar" (link para lista)

#### Etapa 2: Documentos Legais
- **Título**: "Upload de Documentos Legais"
- **Aviso**: "Todos os documentos serão armazenados no IPFS de forma imutável"
- **Upload de Documentos**:
  - **Contrato** (obrigatório):
    - Input file (aceita PDF, DOC, DOCX)
    - Preview após upload
    - Mostrar nome do arquivo
    - Botão "Remover" antes de enviar
    - Progresso de upload
    - Hash IPFS após upload bem-sucedido
    - Link "Verificar no IPFS"
  - **Termos** (obrigatório):
    - Mesmo formato do Contrato
  - **Prospecto** (opcional):
    - Mesmo formato do Contrato
  - **KYC** (opcional):
    - Mesmo formato do Contrato
  - **Outros** (opcional):
    - Upload múltiplo permitido
- **Validações**:
  - Tamanho máximo por arquivo (ex: 10MB)
  - Tipos de arquivo permitidos
  - Documentos obrigatórios presentes
- **Botões**:
  - "Voltar" (para etapa anterior)
  - "Próxima Etapa" (primary, valida antes de avançar)
  - "Cancelar"

#### Etapa 3: Revisão
- **Título**: "Revisar Oferta"
- **Seções**:
  1. **Resumo das Informações**:
     - Todos os campos preenchidos (read-only)
     - Opção de editar (volta para etapa correspondente)
  2. **Documentos Enviados**:
     - Lista de todos os documentos
     - Hash IPFS de cada um
     - Links para visualizar
     - Opção de substituir (volta para etapa 2)
- **Checkbox**: "Confirmo que todas as informações estão corretas" (obrigatório)
- **Botões**:
  - "Voltar" (para etapa anterior)
  - "Criar Oferta" (primary, submit, loading)
  - "Cancelar"

#### Após Criação
- **Modal de Sucesso**:
  - Mensagem: "Oferta criada com sucesso!"
  - Status: "pending_review" (badge)
  - Informação: "Sua oferta será revisada por um administrador"
  - Botão "Ver Oferta" (link para detalhes)
  - Botão "Criar Outra Oferta"

#### Funcionalidades
- Validação completa em cada etapa
- Salvamento automático de rascunho (opcional)
- Preview de documentos antes de enviar
- Validação de hash IPFS antes de submeter

#### Endpoints
- `POST /api/companies/offers`
- `POST /api/ipfs/upload` (para cada documento)

---

### 8. Detalhes da Oferta (`/company/offers/:id`)

#### Layout
- **Título**: "[Nome da Oferta]"
- **Breadcrumb**: Minhas Ofertas > [Nome da Oferta]
- **Status** (badge grande no topo)

#### Seção 1: Informações Gerais
- **Campos** (read-only, exceto se editável):
  - Asset Code (read-only)
  - Nome da Oferta
  - Descrição
  - Supply Total
  - Taxa de Juros Anual
  - Tipo de Oferta
  - Regras Personalizadas (JSON formatado)
- **Botão**: "Editar" (apenas se status = pending_review)

#### Seção 2: Documentos IPFS
- **Título**: "Documentos Legais Enviados"
- **Lista de Documentos**:
  - Para cada documento:
    - Nome do documento
    - Nome do arquivo original
    - Hash IPFS completo (com tooltip)
    - URL IPFS (link externo)
    - Data de upload
    - Botão "Visualizar" (abre em nova aba)
    - Botão "Download"
    - Link "Verificar no IPFS"
- **Aviso**: "Documentos não podem ser editados após criação"

#### Seção 3: Status e Workflow
- **Status Atual** (badge grande, colorido):
  - `pending_review`: Amarelo, "Aguardando Revisão"
  - `under_review`: Azul, "Em Revisão"
  - `approved`: Verde, "Aprovada"
  - `rejected`: Vermelho, "Rejeitada"
  - `active`: Verde escuro, "Ativa"
  - `closed`: Cinza, "Fechada"
- **Timeline de Status**:
  - Histórico de mudanças de status
  - Data e hora de cada mudança
  - Admin que revisou (se aplicável)
- **Notas de Due Diligence** (se houver):
  - Card com notas do admin
  - Data das notas
  - Admin que adicionou
- **Motivo de Rejeição** (se rejeitada):
  - Card destacado com motivo
  - Data da rejeição

#### Seção 4: Token Emitido (se aplicável)
- **Título**: "Token Stellar"
- **Informações**:
  - Asset Code
  - Issuer Public Key (com link para Stellar Explorer)
  - Supply Total
  - Data de Emissão
  - Admin que emitiu
- **Link**: "Ver no Stellar Explorer" (botão)

#### Ações (Topo)
- Botão "Editar" (apenas se status = pending_review)
- Botão "Duplicar Oferta" (opcional)
- Botão "Ver no Stellar Explorer" (se token emitido)

#### Funcionalidades
- Atualização automática de status
- Notificações quando status mudar

#### Endpoint
- `GET /api/companies/offers/:id`

---

### 9. Editar Oferta (`/company/offers/:id/edit`)

#### Layout
- **Título**: "Editar Oferta - [Nome da Oferta]"
- **Aviso**: "Apenas ofertas com status 'Aguardando Revisão' podem ser editadas"
- **Restrição**: Se status != pending_review, mostrar mensagem e botão "Voltar"

#### Formulário (Mesmo formato de criação)
- **Campos Editáveis**:
  - Nome da Oferta
  - Descrição
  - Supply Total
  - Taxa de Juros Anual
  - Tipo de Oferta
  - Regras Personalizadas
- **Campos Read-Only**:
  - Asset Code (não pode ser alterado)
- **Documentos**:
  - Seção informativa: "Documentos não podem ser editados após criação"
  - Lista de documentos atuais (read-only)
  - Links para visualizar

#### Validações
- Mesmas validações da criação
- Verificar status antes de permitir edição

#### Botões
- "Salvar Alterações" (primary, submit, loading)
- "Cancelar" (secondary, volta para detalhes)
- "Descartar Alterações" (link, confirma antes)

#### Após Salvar
- Mensagem de sucesso
- Redirecionar para detalhes da oferta
- Status permanece como `pending_review`

#### Endpoint
- `PUT /api/companies/offers/:id`

---

### 10. Usuários da Empresa (`/company/users`)

#### Layout
- **Título**: "Usuários da Empresa"
- **Botão**: "Adicionar Usuário" (primary, apenas para admins da empresa)

#### Tabela de Usuários
- **Colunas**:
  - Email
  - Nome Completo
  - Role (badge: User/Admin)
  - Status (badge: Ativo/Inativo)
  - Data de Criação
  - Último Login
  - Ações (dropdown)
- **Ordenação**: Por nome (padrão)

#### Ações por Linha
- Editar Usuário
- Desativar/Ativar (toggle)
- Alterar Role (apenas admins)
- Remover (apenas admins, confirmação necessária)

#### Filtros
- Por Role: Todas | User | Admin
- Por Status: Todas | Ativas | Inativas
- Busca por nome ou email

#### Modal de Criar/Editar Usuário
- **Campos**:
  - Email (obrigatório, único, read-only se edição)
  - Nome Completo (obrigatório)
  - Senha (obrigatório se criação, opcional se edição)
  - Confirmar Senha (se senha preenchida)
  - Role (dropdown: User | Admin)
  - Status (toggle: Ativo/Inativo)
- **Validações**:
  - Email único
  - Senha forte (se preenchida)
- **Botões**:
  - "Salvar" (primary)
  - "Cancelar" (secondary)

#### Restrições
- Não permitir desativar último admin ativo
- Não permitir remover próprio usuário
- Apenas admins podem gerenciar usuários

#### Paginação
- 20 itens por página

#### Endpoints
- `GET /api/company-users`
- `POST /api/company-users` (criar)
- `PUT /api/company-users/:id` (editar)
- `PUT /api/company-users/:id/status` (ativar/desativar)

## Portal 3: Platform Admin Portal - Especificação Detalhada por Telas

### 1. Tela de Login (`/admin/login`)

#### Elementos Visuais
- **Título**: "Platform Admin Login"
- **Logo/Branding**: Logo da plataforma (opcional)
- **Campos**:
  - Email (input type="email", obrigatório, validação de formato)
  - Senha (input type="password", obrigatório, mínimo 6 caracteres, mostrar/ocultar senha)
- **Botões**:
  - "Entrar" (primary, submit, loading durante autenticação)
- **Aviso de Segurança**: "Acesso restrito a administradores autorizados"

#### Funcionalidades
- Validação de formulário em tempo real
- Mensagens de erro claras abaixo dos campos
- Loading spinner no botão durante autenticação
- Redirecionamento automático para `/admin/dashboard` após sucesso
- Tratamento de erro 401 (credenciais inválidas)
- Armazenar token JWT no localStorage

#### Endpoint
- `POST /api/platform-admins/login`

---

### 2. Dashboard Principal (`/admin/dashboard`)

#### Layout
- **Sidebar** com navegação:
  - Dashboard (ativo)
  - Empresas
  - Ofertas
  - Investimentos
  - Investidores
  - Tokens
  - Pagamentos
  - Administradores (apenas super_admin, badge de acesso)
- **Header**:
  - Nome do admin logado
  - Role (badge: Admin | Manager | Super Admin)
  - Botão de logout
  - Ícone de notificações (opcional)

#### Cards de Resumo (Topo)
1. **Total de Empresas**
   - Número total
   - Badge com variação do mês (se aplicável)
   - Link para lista de empresas
   - Ícone de empresa
2. **Total de Ofertas**
   - Número total
   - Badge com pendentes de revisão (vermelho se > 0)
   - Link para lista de ofertas
   - Ícone de documento
3. **Ofertas Pendentes de Revisão**
   - Número (destaque se > 0)
   - Badge vermelho
   - Link direto para ofertas pendentes
   - Ícone de alerta
4. **Total de Investidores**
   - Número total
   - Link para lista de investidores
   - Ícone de usuários
5. **Total de Tokens Emitidos**
   - Número total
   - Link para lista de tokens
   - Ícone de token
6. **Total USDC Investido**
   - Valor formatado ($X,XXX.XX)
   - Badge com variação %
   - Link para métricas de investimentos
   - Ícone de dinheiro

#### Gráficos (Abaixo dos Cards)
1. **Ofertas por Status**
   - Tipo: Gráfico de pizza ou barras
   - Cores por status (pending_review: amarelo, approved: verde, etc.)
   - Tooltip com detalhes ao passar o mouse
   - Legenda interativa
2. **Empresas por Status**
   - Tipo: Gráfico de barras
   - Cores por status
   - Tooltip com contagem
3. **Tokens Emitidos ao Longo do Tempo**
   - Tipo: Gráfico de linha
   - Período: Últimos 6 meses
   - Eixo X: Meses
   - Eixo Y: Quantidade de tokens
   - Tooltip com data e quantidade

#### Seção de Atividades Recentes
- **Título**: "Atividades Recentes"
- **Timeline** (últimas 10 atividades):
  - Ofertas aprovadas/rejeitadas
  - Tokens emitidos
  - Empresas aprovadas
  - Investimentos processados
  - Cada item com data, hora e admin responsável

#### Funcionalidades
- Atualização automática a cada 30 segundos
- Filtros de período nos gráficos (últimos 7 dias, 30 dias, 6 meses, 1 ano)
- Exportação de dados do dashboard (opcional)
- Notificações em tempo real (se implementado)

#### Endpoints
- `GET /api/admin/companies` (para contagem)
- `GET /api/admin/offers` (para contagem)
- `GET /api/investors` (para contagem)
- `GET /api/tokens` (para contagem)
- `GET /api/platform-admins/investments/metrics` (para métricas)

---

### 3. Gerenciamento de Empresas

#### 3.1 Lista de Empresas (`/admin/companies`)

##### Layout
- **Título**: "Gerenciamento de Empresas"
- **Botão**: "Exportar CSV" (secondary, opcional)

##### Tabela
- **Colunas**:
  - ID (link para detalhes)
  - Nome (link para detalhes)
  - CNPJ (formatado: XX.XXX.XXX/XXXX-XX)
  - Email (link mailto)
  - Status (badge colorido)
  - Status KYC (badge colorido)
  - Data de Registro (DD/MM/YYYY)
  - Ações (dropdown com ícone)

##### Filtros (Topo)
- **Status**: 
  - Dropdown ou Tabs: Todas | Pending | Approved | Suspended | Rejected
- **Status KYC**: 
  - Dropdown: Todas | Pending | Approved | Rejected
- **Busca**:
  - Input de busca por nome, CNPJ ou email
  - Debounce de 300ms
  - Ícone de lupa

##### Ações por Linha (Dropdown)
- Ver Detalhes
- Aprovar (se pending)
- Suspender (se approved)
- Rejeitar (se pending/approved)
- Reativar (se suspended/rejected)
- Ver Ofertas da Empresa

##### Paginação
- 20 itens por página
- Navegação: primeira, anterior, próxima, última
- Mostrar "Mostrando X de Y empresas"
- Seletor de itens por página (10, 20, 50, 100)

##### Empty State
- Mensagem: "Nenhuma empresa encontrada"
- Sugestão de ajustar filtros

##### Endpoint
- `GET /api/admin/companies` (ou `GET /api/companies`)

---

#### 3.2 Detalhes da Empresa (`/admin/companies/:id`)

##### Layout
- **Título**: "[Nome da Empresa]"
- **Breadcrumb**: Empresas > [Nome da Empresa]
- **Status** (badge grande no topo)

##### Seção 1: Informações Básicas
- **Campos**:
  - Nome da Empresa
  - CNPJ (formatado)
  - Email (link mailto)
  - Representante Legal
  - Endereço (se disponível)
  - Telefone (se disponível)
  - Data de Registro
  - Última Atualização

##### Seção 2: Status e KYC
- **Status da Empresa** (badge grande):
  - `pending`: Amarelo, "Aguardando Aprovação"
  - `approved`: Verde, "Aprovada"
  - `suspended`: Laranja, "Suspensa"
  - `rejected`: Vermelho, "Rejeitada"
- **Status KYC** (badge):
  - `pending`: Amarelo, "KYC Pendente"
  - `approved`: Verde, "KYC Aprovado"
  - `rejected`: Vermelho, "KYC Rejeitado"
- **Histórico de Mudanças de Status**:
  - Timeline com todas as mudanças
  - Data, hora e admin responsável
  - Motivo (se aplicável)

##### Seção 3: Documentos KYC
- **Lista de Documentos Enviados**:
  - Para cada documento:
    - Nome do documento
    - Tipo de arquivo
    - Data de upload
    - Status (Aprovado/Rejeitado/Pendente)
    - Botão "Visualizar" (abre em nova aba)
    - Botão "Download"
- **Ações**:
  - Aprovar KYC (botão, se pending)
  - Rejeitar KYC (botão, se pending, abre modal com motivo)

##### Seção 4: Ofertas da Empresa
- **Título**: "Ofertas Criadas"
- **Tabela resumida**:
  - Asset Code (link)
  - Nome da Oferta (link)
  - Status (badge)
  - Data de Criação
- **Link**: "Ver todas as ofertas" (filtrado por empresa)

##### Seção 5: Usuários da Empresa
- **Título**: "Usuários da Empresa"
- **Tabela resumida**:
  - Email
  - Nome
  - Role (badge)
  - Status (badge)

##### Ações (Topo)
- Botão "Alterar Status" (dropdown ou modal)
- Botão "Aprovar KYC" (se aplicável)
- Botão "Rejeitar KYC" (se aplicável)
- Botão "Ver Todas as Ofertas"

##### Modal de Alterar Status
- **Título**: "Alterar Status da Empresa"
- **Campo**:
  - Novo Status (dropdown: Pending | Approved | Suspended | Rejected)
- **Campo de Motivo** (obrigatório se Suspended ou Rejected):
  - Textarea
  - Placeholder: "Motivo da mudança de status..."
- **Avisos**:
  - Se Suspended: "A empresa não poderá criar novas ofertas"
  - Se Rejected: "Esta ação não pode ser desfeita facilmente"
- **Botões**:
  - "Confirmar" (primary, loading)
  - "Cancelar" (secondary)

##### Funcionalidades
- Atualização automática de status
- Notificações quando status mudar
- Histórico completo de mudanças

##### Endpoints
- `GET /api/companies/:id`
- `PUT /api/admin/companies/:id/status`
- `PUT /api/companies/:id/kyc-status`

---

### 4. Gerenciamento de Ofertas

#### 4.1 Lista de Ofertas (`/admin/offers`)

##### Layout
- **Título**: "Gerenciamento de Ofertas"
- **Botão**: "Exportar CSV" (secondary, opcional)

##### Tabela
- **Colunas**:
  - ID (link para detalhes)
  - Asset Code (link para detalhes, badge)
  - Nome da Oferta (link para detalhes)
  - Empresa (nome, link para empresa)
  - Tipo (badge: Collateral/Sale)
  - Status (badge colorido)
  - Data de Criação (DD/MM/YYYY)
  - Revisado Por (nome do admin, se revisado)
  - Ações (dropdown)

##### Filtros (Topo)
- **Status**: 
  - Tabs ou Dropdown: Todas | Pending Review | Under Review | Approved | Rejected | Active | Closed
- **Empresa**: 
  - Dropdown com todas as empresas (busca dentro do dropdown)
- **Tipo**: 
  - Radio buttons: Todas | Collateral | Sale
- **Busca**:
  - Input de busca por asset code, nome da oferta ou empresa
  - Debounce de 300ms

##### Ações por Linha (Dropdown)
- Ver Detalhes
- Revisar (se pending_review ou under_review)
- Emitir Token (se approved, token não emitido)
- Ativar (se approved, token emitido)
- Ver Token no Stellar Explorer (se token emitido)
- Ver Empresa

##### Indicadores Visuais
- Destaque para ofertas pendentes há mais de 7 dias
- Badge de alerta para ofertas rejeitadas

##### Paginação
- 20 itens por página
- Navegação completa

##### Empty State
- Mensagem: "Nenhuma oferta encontrada"
- Sugestão de ajustar filtros

##### Endpoint
- `GET /api/admin/offers` (ou `GET /api/offers`)

---

#### 4.2 Revisar Oferta (`/admin/offers/:id/review`)

##### Layout
- **Título**: "Revisar Oferta - [Nome da Oferta]"
- **Breadcrumb**: Ofertas > [Nome da Oferta] > Revisar
- **Sidebar Fixa** (sticky) com seções:
  - Informações da Oferta
  - Documentos IPFS
  - Due Diligence
  - Aprovação/Rejeição

##### Seção 1: Informações da Oferta
- **Título**: "Informações da Oferta"
- **Campos** (read-only, organizados em cards):
  - **Dados Básicos**:
    - Asset Code (badge, read-only)
    - Nome da Oferta
    - Empresa (nome, link para empresa)
    - Tipo (badge)
  - **Descrição**:
    - Texto completo formatado
  - **Valores**:
    - Supply Total (formatado)
    - Taxa de Juros Anual (%)
  - **Regras Personalizadas**:
    - JSON formatado e legível
    - Campos destacados (min_investment, max_investment, etc.)
  - **Metadados**:
    - Criado Por (nome do company_user)
    - Data de Criação
    - Status Atual (badge)

##### Seção 2: Documentos IPFS
- **Título**: "Documentos Legais (IPFS)"
- **Aviso**: "Todos os documentos são armazenados de forma imutável no IPFS"
- **Lista de Documentos**:
  - Para cada documento (Contrato, Termos, Prospecto, KYC, Outros):
    - **Card do Documento**:
      - Nome do documento (título)
      - Nome do arquivo original
      - Tipo de arquivo (PDF/DOC/DOCX)
      - Hash IPFS completo (com tooltip, copiável)
      - URL IPFS (link externo, abre em nova aba)
      - Data de upload
      - Tamanho do arquivo (se disponível)
      - Botões:
        - "Visualizar" (abre em nova aba)
        - "Download"
        - "Copiar Hash"
        - "Verificar no IPFS" (link externo)
- **Validação Visual**:
  - Badge "Verificado" se hash válido
  - Aviso se documento ausente ou inválido

##### Seção 3: Due Diligence
- **Título**: "Notas de Due Diligence"
- **Campo de Notas**:
  - Textarea grande (mínimo 10 linhas)
  - Placeholder: "Adicionar notas de due diligence, observações, questões pendentes..."
  - Editor de texto rico (opcional)
  - Contador de caracteres
- **Botão**: "Salvar Notas" (secondary, salva sem mudar status)
- **Histórico de Notas**:
  - **Título**: "Histórico de Notas"
  - **Lista** (mais recente primeiro):
    - Card para cada nota:
      - Data e hora
      - Admin que adicionou (nome)
      - Conteúdo da nota (texto formatado)
      - Separador visual entre notas

##### Seção 4: Aprovação/Rejeição
- **Título**: "Ação de Revisão"
- **Dropdown de Ação**:
  - Selecionar: Approved | Rejected | Under Review
  - Label: "Nova Decisão"
- **Campo de Motivo** (obrigatório se Rejected):
  - Textarea
  - Placeholder: "Motivo da rejeição (obrigatório)..."
  - Mínimo 20 caracteres
  - Validação em tempo real
- **Avisos Contextuais**:
  - Se Approved: "A oferta será aprovada. Você poderá emitir o token em seguida."
  - Se Rejected: "Esta ação não pode ser desfeita facilmente. Certifique-se do motivo."
  - Se Under Review: "A oferta será marcada como 'Em Revisão'."
- **Botões**:
  - "Salvar e Aprovar" (se Approved, primary, verde)
  - "Salvar e Rejeitar" (se Rejected, primary, vermelho)
  - "Marcar como Em Revisão" (se Under Review, primary, azul)
  - "Cancelar" (secondary, volta para lista)

##### Validações
- Motivo obrigatório se Rejected
- Confirmação antes de aprovar/rejeitar (modal)
- Loading durante salvamento

##### Após Ação
- **Modal de Confirmação**:
  - Mensagem de sucesso
  - Novo status exibido
  - Botão "Ver Oferta" (link para detalhes)
  - Botão "Próxima Oferta" (se houver outras pendentes)

##### Funcionalidades
- Auto-save de notas (opcional, a cada 30 segundos)
- Histórico completo de mudanças
- Notificações quando status mudar

##### Endpoints
- `GET /api/offers/:id`
- `PUT /api/admin/offers/:id/review`
- `POST /api/admin/offers/:id/due-diligence`

---

#### 4.3 Emitir Token (`/admin/offers/:id/issue`)

##### Modal de Confirmação
- **Título**: "Emitir Token Stellar"
- **Ícone**: Ícone de token ou Stellar
- **Pré-requisitos** (verificação visual):
  - ✅ Oferta aprovada (badge verde)
  - ✅ Token ainda não emitido
  - ✅ Documentos IPFS válidos
  - ⚠️ Avisos se algum pré-requisito não atendido

##### Informações Exibidas
- **Card de Informações**:
  - Asset Code (badge, grande)
  - Supply Total (formatado, destacado)
  - Issuer Public Key (truncado, com botão copiar)
  - Home Domain (se configurado, com link)
  - Oferta relacionada (nome, link)

##### Avisos Importantes
- **Card de Avisos**:
  - ⚠️ "Esta ação não pode ser desfeita"
  - ⚠️ "O token será criado na rede Stellar"
  - ℹ️ "Certifique-se de que todos os documentos estão corretos"

##### Validações
- Verificar se token já foi emitido (mostrar erro se sim)
- Verificar documentos IPFS válidos (mostrar aviso se inválidos)
- Verificar se oferta está aprovada (mostrar erro se não)

##### Botões
- "Confirmar Emissão" (primary, loading durante processamento)
- "Cancelar" (secondary, fecha modal)

##### Durante Processamento
- **Loading State**:
  - Spinner grande
  - Mensagem: "Emitindo token na rede Stellar..."
  - Progresso (se disponível)

##### Após Emissão
- **Modal de Sucesso**:
  - ✅ Ícone de sucesso
  - Título: "Token Emitido com Sucesso!"
  - **Hash da Transação Stellar**:
    - Hash completo (copiável)
    - Link "Ver no Stellar Explorer" (abre em nova aba)
  - **Conteúdo do stellar.toml** (se aplicável):
    - Card expansível com conteúdo
    - Botão "Copiar Conteúdo"
  - **Informações**:
    - Asset Code emitido
    - Supply Total
    - Data/Hora da emissão
  - **Botões**:
    - "Ver Token" (link para lista de tokens)
    - "Ativar Oferta" (se aplicável)
    - "Fechar"

##### Funcionalidades
- Copiar hash com um clique
- Link direto para Stellar Explorer
- Atualização automática do status da oferta

##### Endpoint
- `POST /api/admin/offers/:id/issue`

---

#### 4.4 Ativar Oferta (`/admin/offers/:id/activate`)

##### Modal de Confirmação
- **Título**: "Ativar Oferta"
- **Ícone**: Ícone de ativação
- **Pré-requisitos** (verificação visual):
  - ✅ Token emitido (badge verde)
  - ✅ Oferta aprovada (badge verde)
  - ⚠️ Avisos se algum pré-requisito não atendido

##### Informações
- **Card de Informações**:
  - Nome da Oferta
  - Asset Code
  - Status atual (badge)
  - Token emitido (hash, link para explorer)

##### Aviso Importante
- **Card de Aviso**:
  - ℹ️ "A oferta ficará visível para investidores após ativação"
  - ℹ️ "Investidores poderão começar a investir imediatamente"

##### Botões
- "Confirmar Ativação" (primary, loading)
- "Cancelar" (secondary)

##### Após Ativação
- **Modal de Sucesso**:
  - ✅ Ícone de sucesso
  - Mensagem: "Oferta ativada com sucesso!"
  - Novo status: "active" (badge verde)
  - Informação: "A oferta está agora visível para investidores"
  - Botão "Ver Oferta" (link para detalhes)

##### Endpoint
- `POST /api/admin/offers/:id/activate`

---

### 5. Gerenciamento de Investimentos

#### 5.1 Métricas de Investimentos (`/admin/investments/metrics`)

##### Layout
- **Título**: "Métricas de Investimentos"
- **Breadcrumb**: Investimentos > Métricas

##### Filtros (Topo, Card)
- **Data Inicial** (date picker, opcional):
  - Placeholder: "Data inicial"
  - Formato: DD/MM/YYYY
- **Data Final** (date picker, opcional):
  - Placeholder: "Data final"
  - Formato: DD/MM/YYYY
- **Asset Code** (dropdown, opcional):
  - Lista de todos os asset codes
  - Busca dentro do dropdown
- **Oferta** (dropdown, opcional):
  - Lista de todas as ofertas
  - Busca dentro do dropdown
- **Botões**:
  - "Aplicar Filtros" (primary)
  - "Limpar Filtros" (secondary)
  - "Exportar CSV" (secondary)

##### Cards de Métricas (Grid 3x2)
1. **Total de Investimentos**
   - Número grande (distribuídos)
   - Badge com variação do período
   - Ícone de gráfico
2. **Total USDC Investido**
   - Valor formatado ($X,XXX.XX)
   - Badge com variação %
   - Ícone de dinheiro
3. **Total de Tokens Distribuídos**
   - Quantidade formatada
   - Badge com variação
   - Ícone de token
4. **Investimentos Pendentes**
   - Contagem
   - Valor total pendente (USDC)
   - Badge vermelho se > 0
   - Link para investimentos pendentes
   - Ícone de relógio
5. **Investimentos Falhados**
   - Contagem
   - Badge vermelho
   - Link para filtro de falhados
   - Ícone de alerta
6. **Investidores Únicos**
   - Número
   - Badge com variação
   - Ícone de usuários

##### Gráficos (Abaixo dos Cards)
1. **Evolução de Investimentos**
   - Tipo: Gráfico de linha
   - Título: "Evolução ao Longo do Tempo"
   - Eixo X: Período (conforme filtros)
   - Eixo Y: Quantidade de investimentos
   - Tooltip: Data e quantidade
   - Legenda interativa
2. **Distribuição por Oferta**
   - Tipo: Gráfico de pizza ou barras horizontais
   - Título: "Distribuição por Oferta"
   - Cores diferentes por oferta
   - Tooltip: Nome da oferta e valor
   - Legenda com valores
3. **Distribuição por Asset Code**
   - Tipo: Gráfico de barras horizontais
   - Título: "Distribuição por Asset Code"
   - Valores formatados
   - Tooltip: Asset code e valor

##### Exportação
- Botão "Exportar CSV" (topo)
- Botão "Exportar PDF" (opcional, topo)
- Incluir todos os dados filtrados

##### Funcionalidades
- Atualização automática ao mudar filtros
- Loading skeleton durante carregamento
- Empty state se não houver dados

##### Endpoint
- `GET /api/platform-admins/investments/metrics`

---

#### 5.2 Estatísticas de Investimentos (`/admin/investments/statistics`)

##### Layout
- **Título**: "Estatísticas de Investimentos"
- **Breadcrumb**: Investimentos > Estatísticas

##### Filtros (Obrigatórios)
- **Data Inicial** (date picker, obrigatório):
  - Label: "Data Inicial *"
  - Validação: Não pode ser maior que data final
- **Data Final** (date picker, obrigatório):
  - Label: "Data Final *"
  - Validação: Não pode ser menor que data inicial
- **Intervalo** (dropdown, padrão: Day):
  - Opções: Day | Week | Month | Year
  - Label: "Agrupar por"
- **Asset Code** (dropdown, opcional):
  - Lista de asset codes
- **Oferta** (dropdown, opcional):
  - Lista de ofertas
- **Botões**:
  - "Aplicar Filtros" (primary)
  - "Limpar" (secondary)

##### Gráfico Principal
- **Tipo**: Gráfico de linha ou barras (toggle)
- **Título**: "Evolução Temporal de Investimentos"
- **Eixo X**: Períodos (formato conforme intervalo selecionado)
- **Eixo Y**: Valores (escala automática)
- **Séries** (múltiplas linhas/barras):
  - Total de Investimentos (azul)
  - Total USDC Investido (verde)
  - Total de Tokens Distribuídos (roxo)
- **Legenda**: Interativa (clicar para mostrar/ocultar série)
- **Tooltip**: Mostrar todos os valores ao passar o mouse
- **Zoom e Pan**: Opcional, para análise detalhada

##### Tabela de Dados
- **Título**: "Dados Detalhados"
- **Colunas**:
  - Período (formatado conforme intervalo)
  - Total de Investimentos (número)
  - Total USDC Investido (formatado)
  - Total de Tokens Distribuídos (formatado)
- **Ordenação**: Por período (padrão)
- **Ações**:
  - Botão "Exportar CSV" (por linha ou tabela completa)

##### Resumo Estatístico
- **Card de Resumo**:
  - Média de investimentos por período
  - Maior período (investimentos)
  - Menor período (investimentos)
  - Tendência (crescimento/declínio)

##### Funcionalidades
- Validação de datas obrigatórias
- Mensagem de erro se datas inválidas
- Loading durante carregamento
- Empty state se não houver dados no período

##### Endpoint
- `GET /api/platform-admins/investments/statistics`

---

#### 5.3 Investimentos Pendentes (`/admin/investments/pending`)

##### Layout
- **Título**: "Investimentos Pendentes"
- **Breadcrumb**: Investimentos > Pendentes
- **Badge de Alerta**: Contagem de pendentes há mais de 30 minutos

##### Tabela
- **Colunas**:
  - ID do Investimento (link para detalhes)
  - Email do Investidor (link mailto)
  - Chave Pública Stellar (truncada: G...XXXX, com tooltip completo, copiável)
  - Asset Code (badge, link para token)
  - Oferta (nome, link, se relacionada)
  - Quantidade USDC (formatado, destacado)
  - Quantidade de Tokens (formatado)
  - Data de Criação (DD/MM/YYYY HH:MM)
  - Tempo em Espera (calculado: "X minutos" ou "X horas", destacado se > 30min)
  - Status (badge: pending_payment)
  - Ações (dropdown)

##### Indicadores Visuais
- **Destaque para Investimentos Antigos**:
  - Linha destacada (fundo amarelo claro) se > 30 minutos
  - Linha destacada (fundo laranja claro) se > 1 hora
  - Badge de alerta "Atenção" se > 2 horas

##### Filtros (Topo)
- **Asset Code** (dropdown):
  - Lista de asset codes
  - Opção "Todos"
- **Oferta** (dropdown):
  - Lista de ofertas
  - Opção "Todas"
- **Tempo em Espera** (dropdown):
  - < 5 minutos
  - < 15 minutos
  - < 30 minutos
  - > 30 minutos
  - > 1 hora
- **Busca**:
  - Por email do investidor ou chave pública

##### Ações por Linha (Dropdown)
- Ver Detalhes (modal ou página)
- Verificar Pagamento Manualmente (botão, abre modal de verificação)
- Cancelar Investimento (botão, modal de confirmação)
- Ver no Stellar Explorer (link, se hash disponível)

##### Resumo (Topo)
- **Cards**:
  - Total de Pendentes
  - Valor Total Pendente (USDC)
  - Pendentes há mais de 30min (contagem, badge vermelho)
  - Pendentes há mais de 1h (contagem, badge vermelho)

##### Atualização Automática
- **Polling**: A cada 10 segundos
- **Indicador**: "Última atualização: HH:MM:SS"
- **Toggle**: Ligar/Desligar atualização automática

##### Modal de Verificar Pagamento Manualmente
- **Título**: "Verificar Pagamento Manualmente"
- **Informações do Investimento**:
  - ID
  - Investidor
  - Valor esperado
  - Data de criação
- **Campo**:
  - Hash da Transação USDC (input, opcional)
  - Botão "Buscar no Stellar" (se hash fornecido)
- **Ações**:
  - Botão "Verificar Agora" (primary, força verificação)
  - Botão "Cancelar" (secondary)

##### Modal de Cancelar Investimento
- **Título**: "Cancelar Investimento"
- **Aviso**: "Esta ação cancelará o investimento. O investidor será notificado."
- **Campo de Motivo** (obrigatório):
  - Textarea
  - Placeholder: "Motivo do cancelamento..."
- **Botões**:
  - "Confirmar Cancelamento" (primary, vermelho)
  - "Cancelar" (secondary)

##### Funcionalidades
- Atualização automática configurável
- Notificações para investimentos muito antigos
- Exportação CSV da lista

##### Endpoint
- `GET /api/platform-admins/investments/pending`

---

#### 5.4 Detalhes do Investimento (Modal)

##### Layout
- **Título**: "Detalhes do Investimento #ID"
- **Tabs**: Informações | Transações | Histórico

##### Tab 1: Informações
- **Investidor**:
  - Nome (link para perfil)
  - Email (link mailto)
  - Chave Pública Stellar (completa, copiável, link para explorer)
- **Oferta** (se relacionada):
  - Nome (link para oferta)
  - Asset Code (badge)
  - Tipo (badge)
- **Valores**:
  - USDC Investido (formatado, destacado)
  - Tokens a Receber (formatado)
- **Status** (badge grande):
  - Cores conforme status
- **Datas**:
  - Criado em (DD/MM/YYYY HH:MM)
  - Última atualização (DD/MM/YYYY HH:MM)

##### Tab 2: Transações
- **Transação USDC** (se recebida):
  - Hash completo (copiável)
  - Link "Ver no Stellar Explorer"
  - Data/Hora
  - Status: Confirmada
  - Valor (USDC)
- **Transação de Distribuição** (se distribuída):
  - Hash completo (copiável)
  - Link "Ver no Stellar Explorer"
  - Data/Hora
  - Status: Confirmada
  - Memo único
  - Quantidade de tokens

##### Tab 3: Histórico
- **Timeline de Mudanças**:
  - Cada mudança de status
  - Data, hora e motivo
  - Admin responsável (se aplicável)

##### Mensagem de Erro (se failed)
- **Card de Erro**:
  - Título: "Erro no Processamento"
  - Mensagem completa
  - Número de tentativas (se aplicável)
  - Botão "Tentar Novamente" (se aplicável)

##### Ações (Footer do Modal)
- Botão "Ver no Stellar Explorer" (se hash disponível)
- Botão "Verificar Pagamento" (se pending)
- Botão "Cancelar Investimento" (se pending)
- Botão "Fechar" (secondary)

---

### 6. Gerenciamento de Investidores

#### 6.1 Lista de Investidores (`/admin/investors`)

##### Layout
- **Título**: "Gerenciamento de Investidores"
- **Botão**: "Exportar CSV" (secondary)

##### Tabela
- **Colunas**:
  - ID (link para detalhes)
  - Nome (link para detalhes)
  - Email (link mailto)
  - Documento (CPF/CNPJ formatado)
  - Status KYC (badge colorido)
  - Chave Pública Stellar (truncada, com tooltip completo)
  - Data de Registro (DD/MM/YYYY)
  - Último Login (DD/MM/YYYY ou "Nunca")
  - Ações (dropdown)

##### Filtros (Topo)
- **Status KYC**: 
  - Tabs ou Dropdown: Todas | Pending | Approved | Rejected
- **Busca**:
  - Input de busca por nome, email ou documento
  - Debounce de 300ms

##### Ações por Linha (Dropdown)
- Ver Detalhes
- Editar
- Aprovar KYC (se pending)
- Rejeitar KYC (se pending)
- Ver Portfólio
- Ver Saldo

##### Paginação
- 20 itens por página
- Navegação completa

##### Empty State
- Mensagem: "Nenhum investidor encontrado"

##### Endpoint
- `GET /api/investors`

---

#### 6.2 Detalhes do Investidor (`/admin/investors/:id`)

##### Layout
- **Título**: "[Nome do Investidor]"
- **Breadcrumb**: Investidores > [Nome]
- **Tabs**: Informações | Portfólio | Investimentos | Pagamentos

##### Tab 1: Informações Pessoais
- **Campos**:
  - Nome Completo (editável)
  - Email (read-only, com aviso)
  - Documento/CPF (read-only)
  - Chave Pública Stellar (read-only, copiável, link para explorer)
  - Data de Registro (read-only)
  - Último Login (read-only)
- **Status KYC**:
  - Badge grande
  - Botão "Aprovar KYC" (se pending)
  - Botão "Rejeitar KYC" (se pending, modal com motivo)
- **Botões**:
  - "Salvar Alterações" (se editável)
  - "Editar" (se em modo de visualização)

##### Tab 2: Portfólio
- **Título**: "Portfólio do Investidor"
- **Resumo**:
  - Total de Ofertas Investidas
  - Total Investido (USDC)
  - Total de Tokens
  - Total de Juros Recebidos
- **Tabela de Investimentos por Asset**:
  - Asset Code (link)
  - Oferta (nome, link)
  - Saldo de Tokens
  - Valor Investido (USDC)
  - Juros Recebidos (USDC)
  - Link "Ver Detalhes"

##### Tab 3: Investimentos
- **Título**: "Histórico de Investimentos"
- **Tabela**:
  - ID do Investimento
  - Oferta
  - Valor (USDC)
  - Status (badge)
  - Data
  - Link "Ver Detalhes"
- **Filtros**: Por status, por oferta, por período

##### Tab 4: Pagamentos
- **Título**: "Histórico de Pagamentos de Juros"
- **Tabela**:
  - Data do Pagamento
  - Asset Code
  - Valor (USDC)
  - Hash da Transação (link)
  - Status
- **Filtros**: Por asset, por período

##### Ações (Topo)
- Botão "Aprovar KYC" (se aplicável)
- Botão "Rejeitar KYC" (se aplicável)
- Botão "Ver Portfólio Completo"
- Botão "Exportar Dados" (CSV)

##### Endpoints
- `GET /api/investors/:id`
- `PUT /api/investors/:id`
- `PUT /api/investors/:id/kyc-status`
- `GET /api/investors/:id/portfolio`

---

### 7. Gerenciamento de Tokens

#### 7.1 Lista de Tokens (`/admin/tokens`)

##### Layout
- **Título**: "Gerenciamento de Tokens"
- **Botão**: "Exportar CSV" (secondary)

##### Tabela
- **Colunas**:
  - Asset Code (link para detalhes, badge)
  - Issuer Public Key (truncado, com tooltip completo, link para explorer)
  - Supply Total (formatado)
  - Taxa de Juros (%)
  - Oferta Relacionada (nome, link, se relacionada)
  - Emitido Por (nome do admin)
  - Data de Emissão (DD/MM/YYYY)
  - Ações (dropdown)

##### Filtros (Topo)
- **Por Oferta** (dropdown):
  - Lista de ofertas
  - Opção "Todas"
- **Busca**:
  - Por asset code ou issuer public key

##### Ações por Linha (Dropdown)
- Ver Detalhes
- Distribuir Tokens Manualmente (modal)
- Ver no Stellar Explorer (link)
- Ver Oferta Relacionada (se aplicável)

##### Paginação
- 20 itens por página

##### Empty State
- Mensagem: "Nenhum token emitido ainda"

##### Endpoint
- `GET /api/tokens`

---

#### 7.2 Distribuir Tokens Manualmente (Modal)

##### Layout
- **Título**: "Distribuir Tokens Manualmente"
- **Asset Code**: [Código] (badge, read-only)

##### Formulário
- **Campo 1: Investidor**:
  - Busca/Select de investidor
  - Mostrar nome, email e status KYC
  - Validação: Investidor deve ter KYC aprovado
  - Aviso se KYC não aprovado
- **Campo 2: Quantidade**:
  - Input numérico (obrigatório)
  - Placeholder: "0.0000000"
  - Validação: > 0
  - Máximo 7 casas decimais
  - Formatação em tempo real

##### Informações Exibidas
- **Resumo**:
  - Asset Code
  - Investidor selecionado
  - Quantidade a distribuir
  - Saldo atual do investidor neste asset (se disponível)

##### Validações
- Investidor obrigatório
- Investidor deve ter KYC aprovado
- Quantidade > 0
- Mensagens de erro claras

##### Botões
- "Distribuir" (primary, loading durante processamento)
- "Cancelar" (secondary)

##### Durante Distribuição
- Loading spinner
- Mensagem: "Distribuindo tokens..."

##### Após Distribuição
- **Modal de Sucesso**:
  - ✅ Ícone de sucesso
  - Mensagem: "Tokens distribuídos com sucesso!"
  - Hash da transação (copiável, link para explorer)
  - Quantidade distribuída
  - Botão "Ver no Stellar Explorer"
  - Botão "Distribuir Mais" (fecha e reabre modal)
  - Botão "Fechar"

##### Endpoint
- `POST /api/tokens/distribute`

---

### 8. Gerenciamento de Pagamentos

#### 8.1 Processar Pagamentos (`/admin/payments/process`)

##### Layout
- **Título**: "Processar Pagamentos de Juros"
- **Breadcrumb**: Pagamentos > Processar

##### Formulário
- **Campo: Asset Code** (dropdown, obrigatório):
  - Lista de todos os asset codes com tokens emitidos
  - Busca dentro do dropdown
  - Placeholder: "Selecione um asset code"

##### Informações Exibidas (Após Selecionar Asset)
- **Card de Informações**:
  - Asset Code selecionado
  - Número de investidores elegíveis (contagem)
  - Total estimado a pagar (USDC, cálculo aproximado)
  - Último pagamento processado (data, se disponível)
  - Taxa de juros anual (%)

##### Avisos Importantes
- **Card de Avisos**:
  - ⚠️ "Esta ação processará pagamentos para todos os investidores elegíveis"
  - ℹ️ "Confirmação por email será enviada automaticamente"
  - ℹ️ "O processamento pode levar alguns minutos"

##### Botão
- "Processar Pagamentos Mensais" (primary, grande, loading durante processamento)

##### Durante Processamento
- **Loading State**:
  - Spinner grande
  - Mensagem: "Processando pagamentos..."
  - Progresso (se disponível): "Processando investidor X de Y"

##### Após Processamento
- **Modal de Resultado**:
  - ✅ Ícone de sucesso
  - Título: "Pagamentos Processados com Sucesso!"
  - **Resumo**:
    - Hash da Transação (copiável, link para explorer)
    - Número de Pagamentos Processados
    - Total Pago (USDC formatado)
    - Emails Enviados (contagem)
    - Emails Falhados (contagem, badge vermelho se > 0)
    - Duração do Processamento (tempo formatado)
  - **Detalhes** (seção expansível):
    - Lista de investidores que receberam pagamento
    - Valor pago para cada um
  - **Botões**:
    - "Ver Histórico" (link para histórico)
    - "Ver no Stellar Explorer" (link)
    - "Processar Outro Asset" (fecha e limpa formulário)
    - "Fechar"

##### Tratamento de Erros
- Se nenhum investidor elegível:
  - Mensagem: "Nenhum investidor elegível para este asset"
  - Sugestão: "Verifique se há investidores com saldo de tokens"
- Se erro durante processamento:
  - Mensagem de erro detalhada
  - Número de pagamentos processados antes do erro
  - Opção de tentar novamente

##### Endpoint
- `POST /api/payments/process`

---

#### 8.2 Histórico de Pagamentos (`/admin/payments/history`)

##### Layout
- **Título**: "Histórico de Pagamentos de Juros"
- **Breadcrumb**: Pagamentos > Histórico

##### Filtros (Topo, Card)
- **Asset Code** (dropdown, opcional):
  - Lista de asset codes
  - Opção "Todos"
- **Investidor** (busca/select, opcional):
  - Busca por nome ou email
  - Dropdown com resultados
- **Período** (date pickers, opcional):
  - Data Inicial
  - Data Final
- **Status** (dropdown, opcional):
  - Todas | Completed | Failed
- **Botões**:
  - "Aplicar Filtros" (primary)
  - "Limpar Filtros" (secondary)
  - "Exportar CSV" (secondary)

##### Resumo (Topo, Cards)
1. **Total de Pagamentos**
   - Número total (conforme filtros)
2. **Total USDC Pago**
   - Valor formatado
3. **Investidores Únicos**
   - Número
4. **Média por Pagamento**
   - Valor formatado

##### Tabela
- **Colunas**:
  - ID (link para detalhes)
  - Data do Pagamento (DD/MM/YYYY)
  - Investidor (nome, email, link para perfil)
  - Asset Code (badge, link para token)
  - Saldo de Tokens (na data do pagamento, formatado)
  - Taxa de Juros (%)
  - Valor de Juros (USDC, formatado, destacado)
  - Hash da Transação (truncado, link para Stellar Explorer)
  - Email Enviado (badge: Sim/Não)
  - Status (badge: Completed/Failed)
- **Ordenação**: Por data (mais recente primeiro, padrão)
- **Ações por Linha**:
  - Ver Detalhes
  - Ver no Stellar Explorer
  - Ver Investidor

##### Paginação
- 50 itens por página
- Navegação completa

##### Exportação
- Botão "Exportar CSV" (topo)
- Incluir todos os dados filtrados
- Formato: CSV com todas as colunas

##### Empty State
- Mensagem: "Nenhum pagamento encontrado"
- Sugestão de ajustar filtros

##### Endpoint
- `GET /api/payments/history`

---

#### 8.3 Estatísticas de Pagamentos (`/admin/payments/statistics`)

##### Layout
- **Título**: "Estatísticas de Pagamentos"
- **Breadcrumb**: Pagamentos > Estatísticas

##### Filtros (Topo)
- **Asset Code** (dropdown, opcional):
  - Lista de asset codes
- **Data Inicial** (date picker, opcional):
  - Placeholder: "Data inicial"
- **Data Final** (date picker, opcional):
  - Placeholder: "Data final"
- **Botões**:
  - "Aplicar Filtros" (primary)
  - "Limpar" (secondary)

##### Gráfico Principal
- **Tipo**: Gráfico de barras ou linha (toggle)
- **Título**: "Evolução de Pagamentos"
- **Eixo X**: Datas de pagamento
- **Eixo Y**: Valores (USDC)
- **Séries**:
  - Total USDC Pago (barras/linha azul)
  - Número de Pagamentos (linha verde, eixo Y secundário)
  - Média por Pagamento (linha pontilhada)
- **Legenda**: Interativa
- **Tooltip**: Mostrar todos os valores

##### Tabela de Dados
- **Título**: "Dados por Data"
- **Colunas**:
  - Data do Pagamento (DD/MM/YYYY)
  - Número de Pagamentos
  - Investidores Únicos
  - Total USDC (formatado)
  - Média USDC (formatado)
  - Mínimo USDC (formatado)
  - Máximo USDC (formatado)
- **Ordenação**: Por data (mais recente primeiro)
- **Exportação**: Botão "Exportar CSV"

##### Resumo Estatístico
- **Card de Resumo**:
  - Maior pagamento (data e valor)
  - Menor pagamento (data e valor)
  - Tendência (crescimento/declínio)

##### Endpoint
- `GET /api/payments/statistics`

---

### 9. Gerenciamento de Administradores

#### 9.1 Lista de Administradores (`/admin/admins`)

##### Layout
- **Título**: "Gerenciamento de Administradores"
- **Acesso**: Apenas para `super_admin`
- **Mensagem de Acesso Negado**: Se não for super_admin, mostrar card com mensagem e botão "Voltar"

##### Tabela
- **Colunas**:
  - ID
  - Email (link mailto)
  - Nome Completo
  - Role (badge: Admin | Manager | Super Admin)
  - Status (badge: Ativo/Inativo)
  - Data de Criação (DD/MM/YYYY)
  - Última Atualização (DD/MM/YYYY)
  - Ações (dropdown)

##### Botão "Criar Admin"
- Visível apenas para super_admin
- Primary, destacado
- Abre modal de criação

##### Ações por Linha (Dropdown)
- Editar (exceto próprio usuário)
- Desativar/Ativar (exceto próprio usuário)
- Não permitir desativar último super_admin (mostrar aviso)

##### Filtros
- Por Role: Todas | Admin | Manager | Super Admin
- Por Status: Todas | Ativas | Inativas
- Busca por nome ou email

##### Paginação
- 20 itens por página

##### Endpoint
- `GET /api/platform-admins`

---

#### 9.2 Criar Administrador (Modal)

##### Layout
- **Título**: "Criar Novo Administrador"
- **Acesso**: Apenas super_admin

##### Formulário
- **Campos**:
  - **Email** (input email, obrigatório):
    - Validação de formato em tempo real
    - Verificação de unicidade (debounce)
    - Mensagem de erro se já existe
  - **Senha** (input password, obrigatório):
    - Mínimo 6 caracteres
    - Indicador de força da senha
    - Validação em tempo real
  - **Confirmar Senha** (input password, obrigatório):
    - Deve coincidir com senha
    - Validação em tempo real
  - **Nome Completo** (input text, obrigatório):
    - Mínimo 3 caracteres
  - **Role** (dropdown, obrigatório):
    - Opções: Admin | Manager | Super Admin
    - Descrição de cada role ao passar o mouse
    - Aviso: "Super Admin tem acesso total ao sistema"

##### Validações
- Email único (verificação em tempo real)
- Senha forte (mínimo 6 caracteres, recomendado: maiúsculas, números, símbolos)
- Confirmação de senha deve coincidir
- Todos os campos obrigatórios preenchidos

##### Botões
- "Criar Admin" (primary, loading durante criação)
- "Cancelar" (secondary, fecha modal)

##### Após Criação
- **Modal de Sucesso**:
  - ✅ Ícone de sucesso
  - Mensagem: "Administrador criado com sucesso!"
  - Email do novo admin
  - Role atribuído
  - Botão "Criar Outro" (fecha e reabre modal)
  - Botão "Fechar"

##### Endpoint
- `POST /api/platform-admins`

---

#### 9.3 Editar Administrador (Modal)

##### Layout
- **Título**: "Editar Administrador"
- **Email**: [Email] (read-only, destacado)

##### Formulário
- **Campos**:
  - **Email** (read-only):
    - Exibido mas não editável
    - Aviso: "Email não pode ser alterado"
  - **Nome Completo** (input text, editável):
    - Valor atual pré-preenchido
  - **Role** (dropdown, editável):
    - Valor atual selecionado
    - Opções: Admin | Manager | Super Admin
    - Restrição: Não permitir editar próprio role (mostrar aviso)
  - **Status** (toggle, editável):
    - Ativo/Inativo
    - Restrição: Não permitir desativar a si mesmo (mostrar aviso)

##### Restrições
- Não permitir editar próprio role (mostrar mensagem)
- Não permitir desativar a si mesmo (mostrar mensagem)
- Não permitir desativar último super_admin (mostrar aviso crítico)

##### Botões
- "Salvar Alterações" (primary, loading)
- "Cancelar" (secondary)

##### Após Salvar
- **Modal de Sucesso**:
  - Mensagem: "Administrador atualizado com sucesso!"
  - Alterações realizadas listadas
  - Botão "Fechar"

##### Endpoint
- `PUT /api/platform-admins/:id`

## Requisitos de UI/UX

### Design System

#### Cores por Portal
- **Investor Portal**: 
  - Primária: Azul confiável (#3B82F6)
  - Sucesso: Verde (#10B981)
- **Company Portal**:
  - Primária: Roxo profissional (#8B5CF6)
  - Sucesso: Verde (#10B981)
- **Platform Admin Portal**:
  - Primária: Vermelho administrativo (#EF4444) ou Cinza escuro (#1F2937)
  - Sucesso: Verde (#10B981)

#### Componentes Comuns
- **Button**: Variantes (primary, secondary, danger, ghost), tamanhos, loading
- **Input**: Com label, placeholder, erro, ícone
- **Select/Dropdown**: Com busca quando necessário
- **Modal**: Overlay, animação, fechar com ESC
- **Table**: Responsiva, ordenável, paginação
- **Card**: Header, body, footer opcionais
- **Badge**: Para status (cores diferentes por tipo)
- **Alert**: Mensagens de sucesso/erro/aviso
- **Loading Spinner**: Estados de carregamento
- **Empty State**: Quando não há dados
- **File Upload**: Para documentos IPFS com preview

### Status Badges

#### Status de Oferta
- `pending_review`: Amarelo/Laranja (#F59E0B)
- `under_review`: Azul (#3B82F6)
- `approved`: Verde (#10B981)
- `rejected`: Vermelho (#EF4444)
- `active`: Verde escuro (#059669)
- `closed`: Cinza (#6B7280)

#### Status de Empresa
- `pending`: Amarelo (#F59E0B)
- `approved`: Verde (#10B981)
- `suspended`: Laranja (#F97316)
- `rejected`: Vermelho (#EF4444)

#### Status KYC
- `pending`: Amarelo (#F59E0B)
- `approved`: Verde (#10B981)
- `rejected`: Vermelho (#EF4444)

### Responsividade
- **Mobile**: Layout adaptável, tabelas scrolláveis horizontalmente
- **Tablet**: Layout em 2 colunas quando apropriado
- **Desktop**: Layout completo

### Acessibilidade
- Labels descritivos
- Navegação por teclado
- Contraste adequado
- ARIA labels
- Foco visível

## Integração com IPFS

### Exibição de Documentos
- **Links IPFS**: Sempre exibir URL completa clicável
- **Hash IPFS**: Mostrar hash completo para verificação
- **Preview**: Tentar mostrar preview de PDFs quando possível
- **Download**: Botão de download para cada documento
- **Verificação**: Link para verificar hash no IPFS gateway

### Formato de Exibição
```typescript
// Exemplo de como exibir documentos
{offer.legal_documents.contract && (
  <div>
    <h3>Contrato</h3>
    <p>Hash: {offer.legal_documents.contract.hash}</p>
    <a href={offer.legal_documents.contract.url} target="_blank">
      Ver Documento
    </a>
    <button onClick={() => downloadFile(offer.legal_documents.contract.url)}>
      Download
    </button>
  </div>
)}
```

## Integração com Stellar Explorer

Sempre que houver `transaction_hash`, criar link:
```
https://stellar.expert/explorer/testnet/tx/{transaction_hash}
```
ou
```
https://stellar.expert/explorer/public/tx/{transaction_hash}
```
(dependendo do ambiente)

## Estrutura de Pastas Sugerida

```
src/
├── api/
│   ├── client.ts              # Configuração do Axios
│   ├── auth.ts                # Endpoints de autenticação
│   ├── investors.ts           # Endpoints de investidores
│   ├── companies.ts           # Endpoints de empresas
│   ├── companyUsers.ts        # Endpoints de usuários de empresa
│   ├── platformAdmins.ts      # Endpoints de admins
│   ├── offers.ts              # Endpoints de ofertas
│   ├── investments.ts         # Endpoints de investimentos
│   ├── tokens.ts              # Endpoints de tokens
│   └── payments.ts             # Endpoints de pagamentos
├── components/
│   ├── ui/                    # Componentes base
│   ├── layout/                # Layout components
│   ├── investor/              # Componentes do portal investidor
│   ├── company/               # Componentes do portal empresa
│   └── admin/                 # Componentes do portal admin
├── pages/
│   ├── investor/
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Portfolio.tsx
│   │   ├── Offers.tsx
│   │   ├── OfferDetail.tsx
│   │   ├── Invest.tsx              # Página de investimento
│   │   ├── InvestmentStatus.tsx     # Status do investimento
│   │   ├── InvestmentHistory.tsx    # Histórico de investimentos
│   │   └── Balance.tsx
│   ├── company/
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Offers/
│   │   │   ├── List.tsx
│   │   │   ├── Create.tsx
│   │   │   └── Detail.tsx
│   │   └── Profile.tsx
│   └── admin/
│       ├── Login.tsx
│       ├── Dashboard.tsx
│       ├── Companies/
│       │   ├── List.tsx
│       │   └── Detail.tsx
│       ├── Offers/
│       │   ├── List.tsx
│       │   ├── Review.tsx
│       │   └── Issue.tsx
│       ├── Investments/
│       │   ├── Metrics.tsx          # Dashboard de métricas
│       │   ├── Statistics.tsx       # Estatísticas temporais
│       │   └── Pending.tsx          # Investimentos pendentes
│       ├── Investors/
│       │   └── List.tsx
│       └── Payments/
│           ├── Process.tsx
│           └── History.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useInvestors.ts
│   ├── useCompanies.ts
│   ├── useOffers.ts
│   └── usePayments.ts
├── types/
│   └── index.ts
├── utils/
│   ├── format.ts
│   ├── validation.ts
│   └── ipfs.ts                # Utilitários para IPFS
└── App.tsx
```

## Sistema de Investimentos

### Processo de Investimento em Dois Passos

O sistema implementa um processo robusto de investimento com detecção automática de pagamentos:

1. **Criação do Investimento** (`POST /api/investments/purchase`):
   - Investidor solicita investimento informando quantidade em USDC
   - Sistema cria registro com status `pending_payment`
   - Retorna instruções de pagamento (endereço Treasury, quantidade, janela de tempo)

2. **Detecção Automática de Pagamento**:
   - PaymentMonitor usa Horizon streaming para detectar pagamentos USDC em tempo real
   - Quando pagamento é detectado, status muda para `payment_received`
   - Memo único é gerado para garantir idempotência

3. **Distribuição Automática de Tokens**:
   - DistributionQueue processa distribuição de forma assíncrona
   - Sistema distribui tokens via Stellar usando memo único
   - Status atualiza para `distributed` após sucesso
   - Em caso de falha, sistema tenta novamente automaticamente (até 3 tentativas)

### Estados do Investimento

- **`pending_payment`**: Aguardando pagamento USDC (investidor deve enviar)
- **`payment_received`**: Pagamento detectado, processando distribuição
- **`distributed`**: Tokens distribuídos com sucesso
- **`failed`**: Falha no processo (exibir mensagem de erro)

### Idempotência

- Cada investimento tem um memo único (máx 28 caracteres)
- Sistema verifica duplicatas por:
  - Hash da transação USDC
  - Memo único
  - Hash da transação de distribuição
- Previne distribuições duplicadas mesmo em caso de retry

### Acompanhamento de Status

- Investidor pode verificar status via `GET /api/investments/:id/status`
- Recomendado usar polling (a cada 2-5 segundos) ou WebSocket para atualização em tempo real
- Exibir indicador visual do status atual
- Mostrar progresso: Pagamento → Processamento → Distribuído

## Requisitos Técnicos Específicos

### 1. Roteamento Multi-Portal
- Rotas separadas por portal: `/investor/*`, `/company/*`, `/admin/*`
- Proteção de rotas baseada em role do token JWT
- Redirecionamento automático baseado em role após login

### 2. Gerenciamento de Estado
- Context API para autenticação global
- React Query ou SWR para cache de dados
- Estado local para formulários

### 3. Interceptores Axios
- Adicionar token automaticamente
- Tratar erros 401 (redirecionar para login do portal correto)
- Tratar erros 403 (mostrar mensagem de permissão)

### 4. Upload de Arquivos IPFS
- Componente de upload com preview
- Validação de tipo de arquivo (PDF, DOC, DOCX)
- Mostrar progresso de upload
- Exibir hash IPFS após upload bem-sucedido
- Validar hash antes de submeter formulário

### 5. Formatação
- Números: Separadores de milhar, casas decimais
- Datas: Formato brasileiro (DD/MM/YYYY) ou ISO conforme contexto
- Moedas: USDC com símbolo $
- Hashes: Primeiros 8 e últimos 8 caracteres com "..."
- IPFS URLs: Links clicáveis com ícone externo

### 6. Performance
- Lazy loading de rotas
- Debounce em buscas
- Paginação eficiente
- Cache de dados quando apropriado
- Code splitting por portal

### 7. Acompanhamento de Investimentos
- **Polling**: Atualizar status a cada 2-5 segundos enquanto `pending_payment` ou `payment_received`
- **WebSocket** (opcional): Para atualização em tempo real
- **Indicadores Visuais**: 
  - Spinner durante processamento
  - Badge de status colorido
  - Progresso visual: Pagamento → Processamento → Distribuído
- **Notificações**: Alertar quando status mudar para `distributed` ou `failed`
- **Timeout**: Se investimento ficar muito tempo em `pending_payment`, sugerir verificar pagamento manualmente

## Fluxos de Usuário Principais

### Fluxo 1: Empresa Cria Oferta
1. Empresa faz login → Dashboard
2. Clica em "Nova Oferta"
3. Preenche formulário completo
4. Faz upload de documentos (contrato, termos)
5. Documentos são enviados para IPFS
6. Hash IPFS é retornado e exibido
7. Submete oferta → Status: pending_review
8. Aguarda aprovação do admin

### Fluxo 2: Admin Revisa e Aprova Oferta
1. Admin faz login → Dashboard
2. Vê oferta pendente na lista
3. Clica em "Revisar"
4. Visualiza todos os documentos IPFS
5. Adiciona notas de due diligence
6. Aprova oferta → Status: approved
7. Emite token → Token criado no Stellar
8. Ativa oferta → Status: active
9. Oferta fica visível para investidores

### Fluxo 3: Investidor Investe em Oferta
1. Investidor faz login → Dashboard
2. Navega para "Ofertas Ativas"
3. Vê lista de ofertas disponíveis
4. Clica em uma oferta
5. Visualiza documentos IPFS (contrato, termos, prospecto)
6. Analisa informações e regras
7. Clica em "Investir Agora"
8. Preenche quantidade em USDC
9. Sistema cria registro de investimento (status: `pending_payment`)
10. Sistema exibe instruções de pagamento:
    - Endereço da conta Treasury
    - Quantidade exata de USDC
    - Janela de tempo (2 minutos)
11. Investidor envia USDC para a conta Treasury (via carteira Stellar)
12. PaymentMonitor detecta pagamento automaticamente
13. Sistema atualiza status para `payment_received`
14. DistributionQueue processa distribuição de tokens automaticamente
15. Sistema atualiza status para `distributed`
16. Investidor vê investimento no portfólio com tokens distribuídos
17. Investidor pode acompanhar status em tempo real via polling ou WebSocket

### Fluxo 4: Investidor Visualiza Portfólio
1. Investidor faz login → Dashboard
2. Vê métricas consolidadas (total investido, juros recebidos)
3. Navega para "Meu Portfólio"
4. Vê lista de ofertas investidas
5. Clica em uma oferta
6. Vê saldo, histórico de distribuições e pagamentos
7. Acessa links para documentos IPFS originais

## Tratamento de Erros

### Erros de API
- **401 Unauthorized**: Redirecionar para login do portal correto
- **403 Forbidden**: Mostrar mensagem de permissão negada
- **404 Not Found**: Mostrar mensagem "Recurso não encontrado"
- **409 Conflict**: Mostrar mensagem específica (ex: "Asset code já existe")
- **400 Bad Request**: Mostrar erros de validação detalhados
- **500 Server Error**: Mostrar mensagem genérica, sugerir tentar novamente

### Validações de Formulário
- Validação em tempo real quando possível
- Mensagens de erro claras e específicas
- Destaque visual de campos com erro
- Prevenir submissão se houver erros

### Estados de Loading
- Spinner ou skeleton durante carregamento
- Desabilitar botões durante ações
- Mostrar "Carregando..." em tabelas

## Checklist de Funcionalidades

### Investor Portal
- [ ] Registro e login de investidor
- [ ] Dashboard com métricas consolidadas
- [ ] Visualização de portfólio (múltiplas ofertas)
- [ ] Lista de ofertas ativas (marketplace)
- [ ] Detalhes da oferta com documentos IPFS
- [ ] **Investir em oferta** (formulário + instruções de pagamento)
- [ ] **Acompanhar status do investimento** (polling/WebSocket)
- [ ] **Histórico de investimentos** (todos os investimentos realizados)
- [ ] Saldo e histórico por asset
- [ ] Histórico de pagamentos de juros
- [ ] Links para Stellar Explorer

### Company Portal
- [ ] Registro de empresa e usuário
- [ ] Login de usuário da empresa
- [ ] Dashboard da empresa
- [ ] Perfil da empresa (visualizar/editar)
- [ ] Lista de ofertas da empresa
- [ ] Criar nova oferta com upload de documentos IPFS
- [ ] Editar oferta (se pending_review)
- [ ] Detalhes da oferta com status e workflow
- [ ] Gerenciar usuários da empresa

### Platform Admin Portal
- [ ] Login de admin
- [ ] Dashboard administrativo
- [ ] Gerenciar empresas (listar, aprovar, suspender)
- [ ] Listar todas as ofertas
- [ ] Revisar oferta (ver documentos IPFS, adicionar notas)
- [ ] Aprovar/rejeitar oferta
- [ ] Emitir token a partir de oferta aprovada
- [ ] Ativar oferta após token emitido
- [ ] Gerenciar investidores
- [ ] **Métricas de investimentos** (dashboard com gráficos)
- [ ] **Estatísticas de investimentos** (evolução temporal)
- [ ] **Investimentos pendentes** (lista e gerenciamento)
- [ ] Processar pagamentos de juros
- [ ] Histórico e estatísticas de pagamentos
- [ ] Gerenciar administradores (apenas super_admin)

### Funcionalidades Comuns
- [ ] Upload de arquivos para IPFS
- [ ] Exibição de links IPFS clicáveis
- [ ] Validação completa de formulários
- [ ] Tratamento de erros em todas as operações
- [ ] Estados de loading em todas as ações
- [ ] Design responsivo
- [ ] Acessibilidade básica
- [ ] Proteção de rotas baseada em role

## Notas Finais

- O sistema deve ser **completo e funcional**, não deixar nenhuma funcionalidade do backend sem interface
- Cada portal deve ter **identidade visual distinta** mas manter consistência de componentes
- Priorizar **usabilidade** e **clareza** sobre complexidade visual
- Todos os dados devem ser **atualizados em tempo real** após operações
- Mensagens de sucesso/erro devem ser **claras e acionáveis**
- O design deve ser **profissional e moderno**, adequado para um sistema financeiro
- **Documentos IPFS** devem ser sempre acessíveis e verificáveis
- **Workflow de aprovação** deve ser claro e intuitivo para admins

---

**IMPORTANTE**: Este prompt deve resultar em **3 portais frontend completamente funcionais** que se conectam perfeitamente com o backend existente. Todas as funcionalidades listadas devem estar implementadas e testadas. Cada portal deve ter sua própria identidade visual mas compartilhar componentes base quando apropriado.
