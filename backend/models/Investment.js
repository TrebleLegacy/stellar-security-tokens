import { query } from '../config/database.js';

/**
 * Modelo para gerenciar investimentos no banco de dados
 */
export class Investment {
  /**
   * Cria um novo investimento
   * @param {Object} investmentData - Dados do investimento
   * @param {number} investmentData.investor_id - ID do investidor
   * @param {number} [investmentData.offer_id] - ID da oferta (opcional)
   * @param {string} investmentData.asset_code - Código do asset
   * @param {number|string} investmentData.usdc_amount - Quantidade em USDC
   * @param {number|string} investmentData.token_amount - Quantidade de tokens
   * @param {string} [investmentData.memo] - Memo único para rastreamento
   * @returns {Promise<Object>} Investimento criado
   */
  static async create(investmentData) {
    const {
      investor_id,
      offer_id,
      asset_code,
      usdc_amount,
      token_amount,
      memo,
    } = investmentData;

    const result = await query(
      `INSERT INTO investments (
        investor_id, offer_id, asset_code, usdc_amount, token_amount, 
        status, memo, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, 'pending_payment', $6, NOW(), NOW())
      RETURNING *`,
      [investor_id, offer_id || null, asset_code, usdc_amount, token_amount, memo || null]
    );

    return result.rows[0];
  }

  /**
   * Busca investimento por ID
   * @param {number} id - ID do investimento
   * @returns {Promise<Object|null>} Investimento encontrado ou null
   */
  static async findById(id) {
    const result = await query(
      'SELECT * FROM investments WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Busca investimento por hash do pagamento USDC
   * @param {string} usdcPaymentHash - Hash da transação USDC
   * @returns {Promise<Object|null>} Investimento encontrado ou null
   */
  static async findByUSDC(usdcPaymentHash) {
    const result = await query(
      'SELECT * FROM investments WHERE usdc_payment_hash = $1 ORDER BY created_at DESC LIMIT 1',
      [usdcPaymentHash]
    );
    return result.rows[0] || null;
  }

  /**
   * Busca investimentos por status
   * @param {string} status - Status do investimento
   * @param {number} [limit=100] - Limite de resultados
   * @param {number} [offset=0] - Offset
   * @returns {Promise<Array>} Array de investimentos
   */
  static async findByStatus(status, limit = 100, offset = 0) {
    const result = await query(
      'SELECT * FROM investments WHERE status = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [status, limit, offset]
    );
    return result.rows;
  }

  /**
   * Busca investimentos pendentes de pagamento por investidor
   * @param {string} investorPublicKey - Chave pública do investidor
   * @param {number|string} expectedAmount - Valor esperado (com tolerância)
   * @param {number} [windowMinutes=2] - Janela de tempo em minutos
   * @returns {Promise<Array>} Array de investimentos pendentes
   */
  static async findPendingByInvestor(investorPublicKey, expectedAmount, windowMinutes = 2) {
    const windowStartTime = new Date(Date.now() - windowMinutes * 60 * 1000);
    const expectedAmountFloat = parseFloat(expectedAmount);
    
    const result = await query(
      `SELECT i.*, inv.stellar_public_key 
       FROM investments i
       JOIN investors inv ON i.investor_id = inv.id
       WHERE inv.stellar_public_key = $1
         AND i.status = 'pending_payment'
         AND i.usdc_amount BETWEEN $2 * 0.9999 AND $2 * 1.0001
         AND i.created_at >= $3
       ORDER BY i.created_at DESC
       LIMIT 10`,
      [investorPublicKey, expectedAmountFloat, windowStartTime]
    );
    return result.rows;
  }

  /**
   * Atualiza status do investimento
   * @param {number} id - ID do investimento
   * @param {Object} updateData - Dados para atualizar
   * @param {string} [updateData.status] - Novo status
   * @param {string} [updateData.usdc_payment_hash] - Hash do pagamento USDC
   * @param {string} [updateData.distribution_tx_hash] - Hash da distribuição
   * @param {string} [updateData.error_message] - Mensagem de erro
   * @returns {Promise<Object|null>} Investimento atualizado ou null
   */
  static async updateStatus(id, updateData) {
    const {
      status,
      usdc_payment_hash,
      distribution_tx_hash,
      error_message,
    } = updateData;

    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (status) {
      updates.push(`status = $${paramIndex++}`);
      values.push(status);
    }

    if (usdc_payment_hash !== undefined) {
      updates.push(`usdc_payment_hash = $${paramIndex++}`);
      values.push(usdc_payment_hash);
    }

    if (distribution_tx_hash !== undefined) {
      updates.push(`distribution_tx_hash = $${paramIndex++}`);
      values.push(distribution_tx_hash);
    }

    if (error_message !== undefined) {
      updates.push(`error_message = $${paramIndex++}`);
      values.push(error_message);
    }

    if (updates.length === 0) {
      return await this.findById(id);
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query(
      `UPDATE investments 
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *`,
      values
    );

    return result.rows[0] || null;
  }

  /**
   * Busca investimentos por investidor
   * @param {number} investorId - ID do investidor
   * @param {number} [limit=100] - Limite de resultados
   * @param {number} [offset=0] - Offset
   * @returns {Promise<Array>} Array de investimentos
   */
  static async findByInvestor(investorId, limit = 100, offset = 0) {
    const result = await query(
      `SELECT i.*, o.offer_name, o.description as offer_description
       FROM investments i
       LEFT JOIN offers o ON i.offer_id = o.id
       WHERE i.investor_id = $1
       ORDER BY i.created_at DESC
       LIMIT $2 OFFSET $3`,
      [investorId, limit, offset]
    );
    return result.rows;
  }

  /**
   * Busca investimentos por oferta
   * @param {number} offerId - ID da oferta
   * @param {number} [limit=100] - Limite de resultados
   * @param {number} [offset=0] - Offset
   * @returns {Promise<Array>} Array de investimentos
   */
  static async findByOffer(offerId, limit = 100, offset = 0) {
    const result = await query(
      `SELECT i.*, inv.name as investor_name, inv.email as investor_email
       FROM investments i
       JOIN investors inv ON i.investor_id = inv.id
       WHERE i.offer_id = $1
       ORDER BY i.created_at DESC
       LIMIT $2 OFFSET $3`,
      [offerId, limit, offset]
    );
    return result.rows;
  }
}

