import { query } from '../config/database.js';
import { Investment } from '../models/Investment.js';

/**
 * Serviço para métricas e estatísticas de investimentos
 */
export class InvestmentMetricsService {
  /**
   * Obtém métricas gerais de investimentos
   * @param {Object} [filters] - Filtros opcionais
   * @param {number} [filters.offerId] - Filtrar por oferta
   * @param {string} [filters.startDate] - Data inicial (YYYY-MM-DD)
   * @param {string} [filters.endDate] - Data final (YYYY-MM-DD)
   * @returns {Promise<Object>} Métricas consolidadas
   */
  static async getMetrics(filters = {}) {
    const { offerId, startDate, endDate } = filters;

    let whereClause = '1=1';
    const params = [];
    let paramIndex = 1;

    if (offerId) {
      whereClause += ` AND offer_id = $${paramIndex++}`;
      params.push(offerId);
    }

    if (startDate) {
      whereClause += ` AND created_at >= $${paramIndex++}`;
      params.push(startDate);
    }

    if (endDate) {
      whereClause += ` AND created_at <= $${paramIndex++}`;
      params.push(endDate + ' 23:59:59');
    }

    const result = await query(
      `SELECT 
        COUNT(*) as total_investments,
        COUNT(*) FILTER (WHERE status = 'pending_payment') as pending_payment,
        COUNT(*) FILTER (WHERE status = 'payment_received') as payment_received,
        COUNT(*) FILTER (WHERE status = 'distributed') as distributed,
        COUNT(*) FILTER (WHERE status = 'failed') as failed,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled,
        COALESCE(SUM(usdc_amount) FILTER (WHERE status = 'distributed'), 0) as total_usdc_invested,
        COALESCE(SUM(token_amount) FILTER (WHERE status = 'distributed'), 0) as total_tokens_distributed,
        COALESCE(AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) FILTER (WHERE status = 'distributed'), 0) as avg_processing_time_seconds,
        COUNT(DISTINCT investor_id) FILTER (WHERE status = 'distributed') as unique_investors
      FROM investments
      WHERE ${whereClause}`,
      params
    );

    const metrics = result.rows[0];

    // Calcular taxa de sucesso
    const successRate = metrics.total_investments > 0
      ? (parseFloat(metrics.distributed) / parseFloat(metrics.total_investments)) * 100
      : 0;

    return {
      total: parseInt(metrics.total_investments, 10),
      byStatus: {
        pending_payment: parseInt(metrics.pending_payment, 10),
        payment_received: parseInt(metrics.payment_received, 10),
        distributed: parseInt(metrics.distributed, 10),
        failed: parseInt(metrics.failed, 10),
        cancelled: parseInt(metrics.cancelled, 10),
      },
      totals: {
        usdcInvested: parseFloat(metrics.total_usdc_invested),
        tokensDistributed: parseFloat(metrics.total_tokens_distributed),
      },
      performance: {
        successRate: parseFloat(successRate.toFixed(2)),
        avgProcessingTimeSeconds: parseFloat(metrics.avg_processing_time_seconds),
        uniqueInvestors: parseInt(metrics.unique_investors, 10),
      },
    };
  }

  /**
   * Obtém estatísticas por período (agrupado por dia)
   * @param {string} startDate - Data inicial (YYYY-MM-DD)
   * @param {string} endDate - Data final (YYYY-MM-DD)
   * @param {number} [offerId] - Filtrar por oferta (opcional)
   * @returns {Promise<Array>} Estatísticas por dia
   */
  static async getStatisticsByPeriod(startDate, endDate, offerId = null) {
    let whereClause = 'created_at >= $1 AND created_at <= $2';
    const params = [startDate, endDate + ' 23:59:59'];

    if (offerId) {
      whereClause += ' AND offer_id = $3';
      params.push(offerId);
    }

    const result = await query(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as total_investments,
        COUNT(*) FILTER (WHERE status = 'distributed') as successful,
        COUNT(*) FILTER (WHERE status = 'failed') as failed,
        COALESCE(SUM(usdc_amount) FILTER (WHERE status = 'distributed'), 0) as total_usdc,
        COALESCE(SUM(token_amount) FILTER (WHERE status = 'distributed'), 0) as total_tokens,
        COUNT(DISTINCT investor_id) as unique_investors
      FROM investments
      WHERE ${whereClause}
      GROUP BY DATE(created_at)
      ORDER BY date DESC`,
      params
    );

    return result.rows.map(row => ({
      date: row.date.toISOString().split('T')[0],
      totalInvestments: parseInt(row.total_investments, 10),
      successful: parseInt(row.successful, 10),
      failed: parseInt(row.failed, 10),
      totalUSDC: parseFloat(row.total_usdc),
      totalTokens: parseFloat(row.total_tokens),
      uniqueInvestors: parseInt(row.unique_investors, 10),
    }));
  }

  /**
   * Obtém investimentos pendentes que precisam de atenção
   * @param {number} [limit=50] - Limite de resultados
   * @returns {Promise<Array>} Investimentos pendentes
   */
  static async getPendingInvestments(limit = 50) {
    const result = await query(
      `SELECT i.*, inv.name as investor_name, inv.email as investor_email, inv.stellar_public_key
       FROM investments i
       JOIN investors inv ON i.investor_id = inv.id
       WHERE i.status IN ('pending_payment', 'payment_received')
         AND i.created_at < NOW() - INTERVAL '5 minutes'
       ORDER BY i.created_at ASC
       LIMIT $1`,
      [limit]
    );

    return result.rows;
  }
}

