import { query } from '../config/database.js';

/**
 * Modelo para gerenciar tokens e distribuições no banco de dados
 */
export class Token {
  /**
   * Cria um novo token no banco de dados
   * @param {Object} tokenData - Dados do token
   * @param {string} tokenData.assetCode - Código do asset (máximo 12 caracteres, único)
   * @param {string} tokenData.issuerPublicKey - Chave pública da conta emissora
   * @param {number|string} tokenData.totalSupply - Supply total do token
   * @param {string} [tokenData.description] - Descrição do token (opcional)
   * @param {number} [tokenData.offerId] - ID da oferta relacionada (opcional)
   * @param {number} [tokenData.issuedBy] - ID do admin que emitiu (opcional)
   * @returns {Promise<Object>} Token criado com todos os campos
   * @throws {Error} Se assetCode já existir (violação de constraint único)
   */
  static async create(tokenData) {
    const { assetCode, issuerPublicKey, totalSupply, description, offerId, issuedBy } = tokenData;
    
    const result = await query(
      `INSERT INTO tokens (asset_code, issuer_public_key, total_supply, description, offer_id, issued_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING *`,
      [assetCode, issuerPublicKey, totalSupply, description, offerId || null, issuedBy || null]
    );
    
    return result.rows[0];
  }

  /**
   * Busca token por código do asset
   * @param {string} assetCode - Código do asset (ex: 'SIN01')
   * @returns {Promise<Object|null>} Token encontrado ou null
   */
  static async findByAssetCode(assetCode) {
    const result = await query(
      'SELECT * FROM tokens WHERE asset_code = $1',
      [assetCode]
    );
    return result.rows[0] || null;
  }

  /**
   * Lista todos os tokens com paginação
   * @param {number} [limit=100] - Número máximo de resultados
   * @param {number} [offset=0] - Número de registros a pular
   * @param {number} [offerId] - Filtrar por ID da oferta (opcional)
   * @returns {Promise<Array>} Array de tokens ordenados por data de criação (mais recentes primeiro)
   */
  static async findAll(limit = 100, offset = 0, offerId = null) {
    if (offerId) {
      const result = await query(
        'SELECT * FROM tokens WHERE offer_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
        [offerId, limit, offset]
      );
      return result.rows;
    }

    const result = await query(
      'SELECT * FROM tokens ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    return result.rows;
  }

  /**
   * Busca tokens por ID da oferta
   * @param {number} offerId - ID da oferta
   * @returns {Promise<Array>} Array de tokens relacionados à oferta
   */
  static async findByOffer(offerId) {
    const result = await query(
      'SELECT * FROM tokens WHERE offer_id = $1 ORDER BY created_at DESC',
      [offerId]
    );
    return result.rows;
  }

  /**
   * Busca tokens ativos (com ofertas ativas)
   * @param {number} [limit=100] - Limite de resultados
   * @param {number} [offset=0] - Offset
   * @returns {Promise<Array>} Array de tokens com ofertas ativas
   */
  static async findActiveTokens(limit = 100, offset = 0) {
    const result = await query(
      `SELECT t.* FROM tokens t
       INNER JOIN offers o ON t.offer_id = o.id
       WHERE o.status = 'active'
       ORDER BY t.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  }

  /**
   * Busca distribuição por hash do pagamento USDC (para idempotência)
   * @param {string} usdcPaymentHash - Hash da transação USDC
   * @returns {Promise<Object|null>} Distribuição encontrada ou null
   */
  static async findDistributionByUSDC(usdcPaymentHash) {
    const result = await query(
      'SELECT * FROM token_distributions WHERE usdc_payment_hash = $1 LIMIT 1',
      [usdcPaymentHash]
    );
    return result.rows[0] || null;
  }

  /**
   * Busca distribuição por memo (para idempotência)
   * @param {string} memo - Memo da transação Stellar
   * @returns {Promise<Object|null>} Distribuição encontrada ou null
   */
  static async findDistributionByMemo(memo) {
    const result = await query(
      'SELECT * FROM token_distributions WHERE memo = $1 LIMIT 1',
      [memo]
    );
    return result.rows[0] || null;
  }

  /**
   * Verifica se distribuição já existe (idempotência)
   * @param {Object} distributionData - Dados da distribuição
   * @returns {Promise<Object|null>} Distribuição existente ou null
   */
  static async findExistingDistribution(distributionData) {
    const { usdcPaymentHash, memo, transactionHash } = distributionData;

    // Verificar por transaction_hash primeiro (mais confiável)
    if (transactionHash) {
      const byTxHash = await query(
        'SELECT * FROM token_distributions WHERE transaction_hash = $1 LIMIT 1',
        [transactionHash]
      );
      if (byTxHash.rows[0]) {
        return byTxHash.rows[0];
      }
    }

    // Verificar por usdc_payment_hash
    if (usdcPaymentHash) {
      const byUSDC = await this.findDistributionByUSDC(usdcPaymentHash);
      if (byUSDC) {
        return byUSDC;
      }
    }

    // Verificar por memo
    if (memo) {
      const byMemo = await this.findDistributionByMemo(memo);
      if (byMemo) {
        return byMemo;
      }
    }

    return null;
  }

  /**
   * Registra uma distribuição de tokens para um investidor
   * Verifica idempotência antes de criar nova distribuição
   * @param {Object} distributionData - Dados da distribuição
   * @param {number} distributionData.investorId - ID do investidor
   * @param {string} distributionData.assetCode - Código do asset distribuído
   * @param {number|string} distributionData.amount - Quantidade distribuída
   * @param {string} distributionData.transactionHash - Hash da transação Stellar
   * @param {string} [distributionData.usdcPaymentHash] - Hash da transação USDC (opcional)
   * @param {number} [distributionData.offerId] - ID da oferta relacionada (opcional)
   * @param {string} [distributionData.memo] - Memo da transação (opcional)
   * @returns {Promise<Object>} Distribuição registrada ou existente (idempotência)
   * @throws {Error} Se investorId ou assetCode não existirem (violação de foreign key)
   */
  static async createDistribution(distributionData) {
    const { investorId, assetCode, amount, transactionHash, usdcPaymentHash, offerId, memo } = distributionData;

    // Verificar idempotência antes de inserir
    const existing = await this.findExistingDistribution({
      usdcPaymentHash,
      memo,
      transactionHash,
    });

    if (existing) {
      console.log('Distribution already exists (idempotency check):', existing.id);
      return existing;
    }
    
    const result = await query(
      `INSERT INTO token_distributions (
        investor_id, asset_code, amount, transaction_hash, 
        usdc_payment_hash, offer_id, memo, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING *`,
      [
        investorId, 
        assetCode, 
        amount, 
        transactionHash, 
        usdcPaymentHash || null, 
        offerId || null,
        memo || null,
      ]
    );
    
    return result.rows[0];
  }

  /**
   * Busca todas as distribuições de um investidor específico
   * @param {number} investorId - ID do investidor
   * @returns {Promise<Array>} Array de distribuições com informações do token, ordenadas por data (mais recentes primeiro)
   */
  static async getDistributionsByInvestor(investorId) {
    const result = await query(
      `SELECT td.*, t.asset_code, t.description 
       FROM token_distributions td
       JOIN tokens t ON td.asset_code = t.asset_code
       WHERE td.investor_id = $1
       ORDER BY td.created_at DESC`,
      [investorId]
    );
    return result.rows;
  }

  /**
   * Busca todas as distribuições de um asset específico
   * @param {string} assetCode - Código do asset
   * @returns {Promise<Array>} Array de distribuições com informações dos investidores, ordenadas por data (mais recentes primeiro)
   */
  static async getDistributionsByAsset(assetCode) {
    const result = await query(
      `SELECT td.*, i.name as investor_name, i.email as investor_email
       FROM token_distributions td
       JOIN investors i ON td.investor_id = i.id
       WHERE td.asset_code = $1
       ORDER BY td.created_at DESC`,
      [assetCode]
    );
    return result.rows;
  }
}
