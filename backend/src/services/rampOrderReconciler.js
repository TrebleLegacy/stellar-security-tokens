/**
 * RampOrderReconciler — periodic background sweep for stale ramp orders.
 *
 * Why this exists:
 *   The primary path for status updates is EtherFuse webhooks. If a webhook
 *   delivery is dropped (tunnel down, network blip, HMAC mismatch, EtherFuse
 *   retry exhaustion), the local order row stays at whatever state was
 *   captured before the missed delivery. The frontend's lazy reconcile in
 *   listOrders / getOrder catches up on user interaction — but if the user
 *   closes the app and never returns to that order's view, the row sits
 *   stale forever.
 *
 *   This cron is the third line of defense: scan all non-terminal orders
 *   older than STALE_THRESHOLD_MS, fetch fresh state from EtherFuse, apply
 *   the same transition the webhook would have. Idempotent — late webhooks
 *   that DO arrive will no-op via the state machine's transition guards.
 *
 * Tuning:
 *   POLL_INTERVAL_MS — how often we sweep. 5 min is enough to catch most
 *     dropped webhooks without hammering EtherFuse for orders that just got
 *     created and are still propagating internally.
 *   STALE_THRESHOLD_MS — how old an order must be (since last update) before
 *     we consider it stale enough to reconcile. Avoids racing with the
 *     normal create-funded transition window (~30s).
 *   BATCH_SIZE — max orders touched per sweep, to bound upstream load.
 *
 * Failure handling:
 *   Errors per-order are logged at debug and skipped — one stuck order
 *   shouldn't break the sweep. Errors in the sweep loop are logged at
 *   error and the loop continues next tick.
 */
import prisma from '../config/prisma.js';
import logger from '../utils/logger.js';
import EtherFuseClient from './etherfuse.service.js';
import RampOrderService from './rampOrder.service.js';

const log = logger.scope('RampOrderReconciler');

const TERMINAL_STATUSES = ['completed', 'finalized', 'failed', 'refunded', 'canceled', 'expired'];
const POLL_INTERVAL_MS = 5 * 60 * 1000;       // 5 min
const STALE_THRESHOLD_MS = 2 * 60 * 1000;     // 2 min — only sweep orders not touched recently
const BATCH_SIZE = 50;
const STARTUP_DELAY_MS = 45_000;              // wait for other services to initialize

export class RampOrderReconciler {
    /**
     * One sweep: find non-terminal orders older than STALE_THRESHOLD_MS,
     * fetch upstream state for each, apply transition if changed.
     * @returns {Promise<{scanned: number, advanced: number, errors: number}>}
     */
    static async reconcile() {
        const cutoff = new Date(Date.now() - STALE_THRESHOLD_MS);
        const stale = await prisma.rampOrder.findMany({
            where: {
                status: { notIn: TERMINAL_STATUSES },
                updatedAt: { lt: cutoff },
            },
            orderBy: { updatedAt: 'asc' },
            take: BATCH_SIZE,
        });

        const stats = { scanned: stale.length, advanced: 0, errors: 0 };
        if (stale.length === 0) return stats;

        log.info(`[reconcile] scanning ${stale.length} stale order(s)`);

        for (const order of stale) {
            try {
                const efOrder = await EtherFuseClient.Orders.get(order.etherfuseOrderId);
                if (!efOrder?.status || efOrder.status === order.status) continue;
                log.info(`[reconcile] order ${order.id} (${order.etherfuseOrderId.slice(0, 8)}…): ${order.status} → ${efOrder.status}`);
                const result = await RampOrderService.applyWebhookTransition('order_updated', efOrder);
                if (result?.handled) stats.advanced += 1;
            } catch (err) {
                stats.errors += 1;
                log.debug(`[reconcile] order ${order.id}: ${err.message}`);
            }
        }

        if (stats.advanced > 0 || stats.errors > 0) {
            log.info(`[reconcile] swept: ${stats.scanned} scanned, ${stats.advanced} advanced, ${stats.errors} errors`);
        }
        return stats;
    }

    static start() {
        if (this._task) {
            log.warn('[start] Reconciler already running');
            return;
        }
        log.info(`[start] Starting ramp order reconciler (every ${POLL_INTERVAL_MS / 60_000} min)`);
        this._task = setInterval(() => {
            this.reconcile().catch((err) => log.errorFromException('[cron] sweep failed', err));
        }, POLL_INTERVAL_MS);

        setTimeout(() => {
            this.reconcile().catch((err) => log.errorFromException('[start] initial sweep failed', err));
        }, STARTUP_DELAY_MS);
    }

    static stop() {
        if (this._task) {
            clearInterval(this._task);
            this._task = null;
            log.info('[stop] Reconciler stopped');
        }
    }
}

export default RampOrderReconciler;
