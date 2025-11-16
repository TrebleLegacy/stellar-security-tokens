import { Offer } from '../models/Offer.js';
import { Token } from '../models/Token.js';
import { Company } from '../models/Company.js';

/**
 * Serviço para gerenciar ofertas de tokenização
 */
export class OfferService {
  /**
   * Valida código do asset
   * @param {string} assetCode - Código do asset
   * @returns {boolean} True se válido
   */
  static validateAssetCode(assetCode) {
    if (!assetCode || typeof assetCode !== 'string') {
      return false;
    }
    if (assetCode.length > 12 || assetCode.length < 1) {
      return false;
    }
    if (!/^[A-Z0-9]+$/.test(assetCode)) {
      return false;
    }
    return true;
  }

  /**
   * Valida regras da oferta
   * @param {Object} offerRules - Regras da oferta
   * @param {string} offerType - Tipo da oferta ('collateral' ou 'sale')
   * @returns {Object} { valid: boolean, errors: Array<string> }
   */
  static validateOfferRules(offerRules, offerType) {
    const errors = [];

    if (offerType === 'collateral') {
      // Regras para ofertas de captação (colateral)
      if (offerRules.min_investment && typeof offerRules.min_investment !== 'number') {
        errors.push('min_investment must be a number');
      }
      if (offerRules.max_investment && typeof offerRules.max_investment !== 'number') {
        errors.push('max_investment must be a number');
      }
      if (offerRules.min_investment && offerRules.max_investment && 
          offerRules.min_investment > offerRules.max_investment) {
        errors.push('min_investment cannot be greater than max_investment');
      }
      if (offerRules.loan_term && (typeof offerRules.loan_term !== 'number' || offerRules.loan_term < 1)) {
        errors.push('loan_term must be a positive number');
      }
    } else if (offerType === 'sale') {
      // Regras para ofertas de venda
      if (offerRules.min_investment && typeof offerRules.min_investment !== 'number') {
        errors.push('min_investment must be a number');
      }
      if (offerRules.max_investment && typeof offerRules.max_investment !== 'number') {
        errors.push('max_investment must be a number');
      }
      if (offerRules.price_per_token && typeof offerRules.price_per_token !== 'number') {
        errors.push('price_per_token must be a number');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Busca ofertas ativas
   * @param {number} [limit=100] - Limite de resultados
   * @param {number} [offset=0] - Offset
   * @param {string} [offerType] - Filtrar por tipo
   * @returns {Promise<Array>} Array de ofertas ativas
   */
  static async getActiveOffers(limit = 100, offset = 0, offerType = null) {
    return await Offer.findAllActive(limit, offset, offerType);
  }

  /**
   * Busca ofertas por tipo
   * @param {string} offerType - Tipo: 'collateral' ou 'sale'
   * @param {number} [limit=100] - Limite de resultados
   * @param {number} [offset=0] - Offset
   * @returns {Promise<Array>} Array de ofertas
   */
  static async getOffersByType(offerType, limit = 100, offset = 0) {
    return await Offer.getOffersByType(offerType, limit, offset);
  }

  /**
   * Cria uma nova oferta
   * @param {Object} offerData - Dados da oferta
   * @returns {Promise<Object>} Oferta criada
   */
  static async createOffer(offerData) {
    // Validar asset_code
    if (!this.validateAssetCode(offerData.asset_code)) {
      throw new Error('Invalid asset_code. Must be uppercase alphanumeric, max 12 characters');
    }

    // Validar regras
    const rulesValidation = this.validateOfferRules(offerData.offer_rules || {}, offerData.offer_type);
    if (!rulesValidation.valid) {
      throw new Error(`Invalid offer rules: ${rulesValidation.errors.join(', ')}`);
    }

    // Verificar se asset_code já existe
    const existingOffer = await Offer.findByAssetCode(offerData.asset_code);
    if (existingOffer) {
      throw new Error('Asset code already exists');
    }

    return await Offer.create(offerData);
  }

  /**
   * Revisa uma oferta (apenas platform_admin)
   * @param {number} offerId - ID da oferta
   * @param {string} status - Novo status
   * @param {number} reviewedBy - ID do admin que revisou
   * @param {string} [rejectionReason] - Motivo da rejeição
   * @returns {Promise<Object>} Oferta atualizada
   */
  static async reviewOffer(offerId, status, reviewedBy, rejectionReason = null) {
    if (!['approved', 'rejected', 'under_review'].includes(status)) {
      throw new Error('Invalid status. Must be: approved, rejected, or under_review');
    }

    if (status === 'rejected' && !rejectionReason) {
      throw new Error('Rejection reason is required when rejecting an offer');
    }

    return await Offer.updateStatus(offerId, status, reviewedBy, rejectionReason);
  }

  /**
   * Emite token a partir de uma oferta aprovada
   * @param {number} offerId - ID da oferta
   * @param {number} issuedBy - ID do admin que emitiu
   * @param {string} issuerPublicKey - Chave pública do issuer Stellar
   * @returns {Promise<Object>} Token criado
   */
  static async issueTokenFromOffer(offerId, issuedBy, issuerPublicKey) {
    const offer = await Offer.findById(offerId);
    if (!offer) {
      throw new Error('Offer not found');
    }

    if (offer.status !== 'approved') {
      throw new Error('Offer must be approved before issuing token');
    }

    // Verificar se token já foi emitido
    const existingToken = await Token.findByAssetCode(offer.asset_code);
    if (existingToken) {
      throw new Error('Token already issued for this offer');
    }

    // Criar token
    const token = await Token.create({
      asset_code: offer.asset_code,
      issuer_public_key: issuerPublicKey,
      total_supply: offer.total_supply,
      description: offer.description,
      offer_id: offer.id,
      issued_by: issuedBy,
    });

    return token;
  }

  /**
   * Ativa uma oferta após token emitido
   * @param {number} offerId - ID da oferta
   * @returns {Promise<Object>} Oferta atualizada
   */
  static async activateOffer(offerId) {
    const offer = await Offer.findById(offerId);
    if (!offer) {
      throw new Error('Offer not found');
    }

    // Verificar se token foi emitido
    const token = await Token.findByAssetCode(offer.asset_code);
    if (!token) {
      throw new Error('Token must be issued before activating offer');
    }

    if (offer.status !== 'approved') {
      throw new Error('Offer must be approved before activation');
    }

    return await Offer.updateStatus(offerId, 'active');
  }
}

