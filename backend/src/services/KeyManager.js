import { Keypair } from '@stellar/stellar-sdk';
import dotenv from 'dotenv';

dotenv.config();

/**
 * KeyManager Service
 * 
 * Centralizes the retrieval of sensitive keys.
 * Implements a strategy pattern:
 * - Development: Retrieves directly from process.env (legacy behavior for local dev)
 * - Production: Can be extended to fetch from AWS KMS, HashiCorp Vault, or injected secrets.
 * 
 * SECURITY NOTE: This prevents direct `process.env` access for secrets in consumer code,
 * making future migration to a proper KMS much easier.
 */
class KeyManager {
    constructor() {
        this.env = process.env.NODE_ENV || 'development';
    }

    /**
     * Safe retrieval of a secret key.
     * Throws explicit errors if keys are missing.
     * @param {string} role - The role of the wallet (ISSUER, DISTRIBUTOR, OPERATIONS, TREASURY)
     * @returns {string} The secret key
     */
    getSecretKey(role) {
        const keyName = `${role.toUpperCase()}_SECRET_KEY`;

        // In a real production setup, we would add logic here to fetch from Vault/KMS
        // using an async method if needed (though constructors are sync, so init() might be needed).
        // For now, we wrap the env access.

        const secret = process.env[keyName];

        if (!secret) {
            // Critical security failure - app cannot function without keys
            throw new Error(`[KeyManager] Critical Error: Missing configuration for ${keyName}`);
        }

        return secret;
    }

    getIssuerKeypair() {
        return Keypair.fromSecret(this.getSecretKey('ISSUER'));
    }

    getDistributorKeypair() {
        return Keypair.fromSecret(this.getSecretKey('DISTRIBUTOR'));
    }

    getTreasuryKeypair() {
        return Keypair.fromSecret(this.getSecretKey('TREASURY'));
    }

    getOperationsKeypair() {
        return Keypair.fromSecret(this.getSecretKey('OPERATIONS'));
    }
}

export const keyManager = new KeyManager();
