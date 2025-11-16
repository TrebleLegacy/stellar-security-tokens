import { query } from '../config/database.js';

/**
 * Modelo para gerenciar ofertas de tokenização
 */
export class Offer {
  /**
   * Cria uma nova oferta de tokenização
   * @param {Object} offerData - Dados da oferta
   * @param {number} offerData.company_id - ID da empresa
   * @param {number} offerData.requested_by - ID do usuário que solicitou
   * @param {string} offerData.asset_code - Código único do asset
   * @param {string} offerData.offer_name - Nome da oferta
   * @param {string} offerData.description - Descrição da oferta
   * @param {number|string} offerData.total_supply - Supply total
   * @param {number} [offerData.annual_interest_rate] - Taxa de juros anual
   * @param {string} offerData.offer_type - Tipo: 'collateral' ou 'sale'
   * @param {Object} [offerData.offer_rules] - Regras personalizadas (JSONB)
   * @param {Object} [offerData.legal_documents] - Documentos IPFS (JSONB)
   * @returns {Promise<Object>} Oferta criada
   * @throws {Error} Se asset_code já existir
   */
  static async create(offerData) {
    const {
      company_id,
      requested_by,
      asset_code,
      offer_name,
      description,
      total_supply,
      annual_interest_rate,
      offer_type,
      offer_rules = {},
      legal_documents = {},
    } = offerData;

    const result = await query(
      `INSERT INTO offers (
        company_id, requested_by, asset_code, offer_name, description,
        total_supply, annual_interest_rate, offer_type, offer_rules,
        legal_documents, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending_review', NOW(), NOW())
      RETURNING *`,
      [
        company_id,
        requested_by,
        asset_code,
        offer_name,
        description,
        total_supply,
        annual_interest_rate || null,
        offer_type,
        JSON.stringify(offer_rules),
        JSON.stringify(legal_documents),
      ]
    );

    return result.rows[0];
  }

  /**
   * Busca oferta por ID
   * @param {number} id - ID da oferta
   * @returns {Promise<Object|null>} Oferta encontrada ou null
   */
  static async findById(id) {
    const result = await query('SELECT * FROM offers WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  /**
   * Busca oferta por código do asset
   * @param {string} assetCode - Código do asset
   * @returns {Promise<Object|null>} Oferta encontrada ou null
   */
  static async findByAssetCode(assetCode) {
    const result = await query('SELECT * FROM offers WHERE asset_code = $1', [assetCode]);
    return result.rows[0] || null;
  }

  /**
   * Busca ofertas de uma empresa
   * @param {number} companyId - ID da empresa
   * @param {number} [limit=100] - Limite de resultados
   * @param {number} [offset=0] - Offset
   * @returns {Promise<Array>} Array de ofertas
   */
  static async findByCompany(companyId, limit = 100, offset = 0) {
    const result = await query(
      'SELECT * FROM offers WHERE company_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [companyId, limit, offset]
    );
    return result.rows;
  }

  /**
   * Lista todas as ofertas
   * @param {number} [limit=100] - Limite de resultados
   * @param {number} [offset=0] - Offset
   * @param {string} [status] - Filtrar por status
   * @returns {Promise<Array>} Array de ofertas
   */
  static async findAll(limit = 100, offset = 0, status = null) {
    if (status) {
      const result = await query(
        'SELECT * FROM offers WHERE status = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
        [status, limit, offset]
      );
      return result.rows;
    }

    const result = await query(
      'SELECT * FROM offers ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    return result.rows;
  }

  /**
   * Busca ofertas ativas (para investidores)
   * @param {number} [limit=100] - Limite de resultados
   * @param {number} [offset=0] - Offset
   * @param {string} [offerType] - Filtrar por tipo
   * @returns {Promise<Array>} Array de ofertas ativas
   */
  static async findAllActive(limit = 100, offset = 0, offerType = null) {
    if (offerType) {
      const result = await query(
        `SELECT * FROM offers 
         WHERE status = 'active' AND offer_type = $1 
         ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
        [offerType, limit, offset]
      );
      return result.rows;
    }

    const result = await query(
      `SELECT * FROM offers 
       WHERE status = 'active' 
       ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  }

  /**
   * Busca ofertas por tipo
   * @param {string} offerType - Tipo: 'collateral' ou 'sale'
   * @param {number} [limit=100] - Limite de resultados
   * @param {number} [offset=0] - Offset
   * @returns {Promise<Array>} Array de ofertas
   */
  static async getOffersByType(offerType, limit = 100, offset = 0) {
    const result = await query(
      'SELECT * FROM offers WHERE offer_type = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [offerType, limit, offset]
    );
    return result.rows;
  }

  /**
   * Atualiza status da oferta
   * @param {number} id - ID da oferta
   * @param {string} status - Novo status
   * @param {number} [reviewedBy] - ID do admin que revisou
   * @param {string} [rejectionReason] - Motivo da rejeição (se aplicável)
   * @returns {Promise<Object|null>} Oferta atualizada ou null
   */
  static async updateStatus(id, status, reviewedBy = null, rejectionReason = null) {
    const fields = ['status = $1', 'updated_at = NOW()'];
    const values = [status];
    let paramCount = 2;

    if (reviewedBy) {
      fields.push(`reviewed_by = $${paramCount++}`);
      fields.push(`reviewed_at = NOW()`);
      values.push(reviewedBy);
    }

    if (rejectionReason !== null) {
      fields.push(`rejection_reason = $${paramCount++}`);
      values.push(rejectionReason);
    }

    values.push(id);

    const result = await query(
      `UPDATE offers SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    return result.rows[0] || null;
  }

  /**
   * Adiciona notas de due diligence
   * @param {number} id - ID da oferta
   * @param {string} notes - Notas de due diligence
   * @returns {Promise<Object|null>} Oferta atualizada ou null
   */
  static async addDueDiligenceNotes(id, notes) {
    const result = await query(
      'UPDATE offers SET due_diligence_notes = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [notes, id]
    );
    return result.rows[0] || null;
  }

  /**
   * Adiciona documentos legais (hashes IPFS)
   * @param {number} id - ID da oferta
   * @param {Object} legalDocuments - Documentos em formato JSONB
   * @returns {Promise<Object|null>} Oferta atualizada ou null
   */
  static async addLegalDocuments(id, legalDocuments) {
    const result = await query(
      'UPDATE offers SET legal_documents = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [JSON.stringify(legalDocuments), id]
    );
    return result.rows[0] || null;
  }

  /**
   * Atualiza regras da oferta
   * @param {number} id - ID da oferta
   * @param {Object} offerRules - Regras personalizadas
   * @returns {Promise<Object|null>} Oferta atualizada ou null
   */
  static async updateOfferRules(id, offerRules) {
    const result = await query(
      'UPDATE offers SET offer_rules = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [JSON.stringify(offerRules), id]
    );
    return result.rows[0] || null;
  }

  /**
   * Atualiza dados da oferta
   * @param {number} id - ID da oferta
   * @param {Object} offerData - Dados a atualizar
   * @returns {Promise<Object|null>} Oferta atualizada ou null
   */
  static async update(id, offerData) {
    const {
      offer_name,
      description,
      total_supply,
      annual_interest_rate,
      offer_rules,
    } = offerData;

    const fields = [];
    const values = [];
    let paramCount = 1;

    if (offer_name !== undefined) {
      fields.push(`offer_name = $${paramCount++}`);
      values.push(offer_name);
    }
    if (description !== undefined) {
      fields.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (total_supply !== undefined) {
      fields.push(`total_supply = $${paramCount++}`);
      values.push(total_supply);
    }
    if (annual_interest_rate !== undefined) {
      fields.push(`annual_interest_rate = $${paramCount++}`);
      values.push(annual_interest_rate);
    }
    if (offer_rules !== undefined) {
      fields.push(`offer_rules = $${paramCount++}`);
      values.push(JSON.stringify(offer_rules));
    }

    if (fields.length === 0) {
      return await this.findById(id);
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query(
      `UPDATE offers SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    return result.rows[0] || null;
  }
}

