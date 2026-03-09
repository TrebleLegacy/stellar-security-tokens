import { TransactionBuilder } from '@stellar/stellar-sdk';
import { keyManager } from './KeyManager.js';
import { MultiSigTransactionService } from './multiSigTransaction.service.js';
import { signAndSubmitTransaction, getNetworkPassphrase } from '../config/stellar.js';
import logger from '../utils/logger.js';
const log = logger.scope('TxManager');

/**
 * TransactionManager Service
 * 
 * Provides a unified interface for submitting Stellar transactions that
 * automatically branches between direct signing (ENV/Dev mode) and 
 * MultiSig queueing (Production mode).
 *
 * Accepts both `{ transaction }` (Transaction object) and `{ xdr }` (base64 string).
 */
export class TransactionManager {
    /**
     * Submits or queues a transaction based on the current environment and operation type.
     * 
     * @param {Object} params - Submission parameters
     * @param {Transaction} [params.transaction] - The built, unsigned Stellar transaction (object)
     * @param {string} [params.xdr] - Pre-serialized transaction XDR (base64 string)
     * @param {string} params.signingRole - Role for signing: 'ISSUER', 'DISTRIBUTOR', 'TREASURY', 'OPERATIONS'
     * @param {string} params.operationType - Type of operation for threshold checking (e.g., 'token_issue')
     * @param {Object} [params.metadata={}] - Context metadata for multisig records
     * @param {string} [params.description] - Description for admins in multisig queue
     * @param {string} [params.initiatorId] - ID of the admin who triggered the action
     * @returns {Promise<Object>} Result with either success hash or pending_multisig status
     */
    static async submit({
        transaction,
        xdr: rawXdr,
        signingRole,
        operationType,
        metadata = {},
        description = null,
        initiatorId = null,
    }) {
        if (!transaction && !rawXdr) {
            throw new Error('[TransactionManager] Either transaction or xdr must be provided');
        }

        const requiresMultisig = keyManager.requiresMultisigApproval(operationType);

        if (!requiresMultisig) {
            // --- DIRECT SIGNING (ENV MODE) ---
            // Needs Transaction object to sign with keypair
            const txObj = transaction ||
                TransactionBuilder.fromXDR(rawXdr, getNetworkPassphrase());
            log.info(`[TransactionManager] Direct signing ${operationType} (Auto-signing enabled)`);
            const signingKeypair = keyManager.getKeypairForRole(signingRole);
            return await signAndSubmitTransaction(txObj, signingKeypair);
        }

        // --- MULTISIG QUEUEING (PRODUCTION MODE) ---
        // Needs XDR string to store in DB for Freighter signing
        const xdr = rawXdr || transaction.toXDR();
        log.info(`[TransactionManager] Queueing ${operationType} for MultiSig approval`);

        const requiredSigners = keyManager.getRequiredSigners(operationType);
        const threshold = keyManager.getSignatureThreshold(operationType);
        const signerRoles = keyManager.getSignerRoles(operationType);

        const pendingTx = await MultiSigTransactionService.create({
            operationType,
            xdr,
            requiredSigners,
            thresholdRequired: threshold,
            metadata: { ...metadata, signerRoles },
            description: description || `Automated ${operationType} request`,
            initiatorId,
        });

        return {
            success: true,
            status: 'pending_multisig',
            multiSigTransactionId: pendingTx.id,
            requiredSigners,
            thresholdRequired: threshold,
            message: 'Transaction queued for MultiSig approval',
        };
    }
}

export default TransactionManager;
