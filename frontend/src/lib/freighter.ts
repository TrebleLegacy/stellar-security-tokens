/**
 * Freighter Browser Extension Integration
 * 
 * Uses the official @stellar/freighter-api package for type-safe,
 * version-tracked interaction with the Freighter browser extension.
 * 
 * Freighter is a secure Stellar wallet that keeps private keys encrypted
 * and never exposes them to web pages. Users approve transactions
 * within the extension UI.
 * 
 * Security: 
 * - Keys never leave the extension
 * - User sees transaction details in extension before signing
 * - Extension is sandboxed from the webpage
 * - Ledger hardware wallets supported natively through Freighter
 * 
 * Install from: https://freighter.app
 */

import {
    isConnected as freighterIsConnected,
    requestAccess,
    getAddress,
    getNetwork,
    signTransaction,
    signMessage,
} from '@stellar/freighter-api';

export interface FreighterDevice {
    publicKey: string;
    connected: boolean;
    network?: string;
    networkPassphrase?: string;
}

export interface SignatureResult {
    publicKey: string;
    signature: string; // Base64 encoded
    signedXdr: string;
}

/**
 * Check if Freighter extension is installed and available
 */
export async function isFreighterInstalled(): Promise<boolean> {
    try {
        const result = await freighterIsConnected();
        if (result.error) return false;
        return result.isConnected;
    } catch {
        return false;
    }
}

/**
 * Check if Freighter is connected to any account
 */
export async function isFreighterConnected(): Promise<boolean> {
    try {
        const result = await freighterIsConnected();
        if (result.error) return false;
        return result.isConnected;
    } catch {
        return false;
    }
}

/**
 * Get the public key from connected Freighter wallet
 */
export async function getFreighterPublicKey(): Promise<string | null> {
    try {
        const result = await getAddress();
        if (result.error) return null;
        return result.address;
    } catch {
        return null;
    }
}

/**
 * Get the network Freighter is connected to
 */
export async function getFreighterNetwork(): Promise<{ network: string; networkPassphrase: string } | null> {
    try {
        const result = await getNetwork();
        if (result.error) return null;
        return { network: result.network, networkPassphrase: result.networkPassphrase };
    } catch {
        return null;
    }
}

/**
 * Connect to Freighter and get wallet info.
 * Prompts the user to grant access if not already allowed.
 */
export async function connectFreighter(): Promise<FreighterDevice> {
    // First check if extension is available
    const connResult = await freighterIsConnected();
    if (connResult.error || !connResult.isConnected) {
        throw new Error('Freighter extension is not installed. Please install it from https://freighter.app');
    }

    try {
        // Request access (prompts user if not yet allowed)
        const accessResult = await requestAccess();
        if (accessResult.error) {
            const msg = accessResult.error;
            if (typeof msg === 'string' && msg.includes('User declined')) {
                throw new Error('Connection was declined. Please allow access in Freighter.');
            }
            throw new Error(`Failed to connect: ${msg}`);
        }

        const publicKey = accessResult.address;

        // Get network info
        const networkResult = await getNetwork();
        const network = networkResult.error ? undefined : networkResult.network;
        const networkPassphrase = networkResult.error ? undefined : networkResult.networkPassphrase;

        console.log('[Freighter] Connected. Public key:', publicKey.slice(0, 8) + '...');

        return {
            publicKey,
            connected: true,
            network,
            networkPassphrase,
        };
    } catch (error: unknown) {
        if (error instanceof Error) throw error;
        const err = error as { message?: string };
        throw new Error(`Failed to connect to Freighter: ${err.message}`);
    }
}

/**
 * Sign a transaction with Freighter.
 * The user will see transaction details in Freighter's popup and must approve.
 */
export async function signTransactionWithFreighter(
    xdr: string,
    networkPassphrase: string
): Promise<SignatureResult> {
    // Verify connected
    const connResult = await freighterIsConnected();
    if (connResult.error || !connResult.isConnected) {
        throw new Error('Freighter extension is not installed');
    }

    try {
        // Get the current signing address
        const addrResult = await getAddress();
        if (addrResult.error) {
            throw new Error('Failed to get Freighter address. Is the wallet unlocked?');
        }
        const publicKey = addrResult.address;

        console.log('[Freighter] Please approve the transaction in the Freighter popup...');

        // Sign via official API — returns { signedTxXdr, signerAddress }
        const signResult = await signTransaction(xdr, { networkPassphrase });
        if (signResult.error) {
            console.error('[Freighter] signTransaction error:', JSON.stringify(signResult.error));
            const msg = typeof signResult.error === 'string'
                ? signResult.error
                : (signResult.error as any)?.message || JSON.stringify(signResult.error);
            if (msg.includes('User declined') || msg.includes('cancel')) {
                throw new Error('Transaction was rejected in Freighter.');
            }
            if (msg.includes('network')) {
                throw new Error('Network mismatch. Please switch Freighter to the correct network.');
            }
            throw new Error(`Signing failed: ${msg}`);
        }

        const { signedTxXdr } = signResult;

        // Extract signature from signed XDR for backend submission
        const { TransactionBuilder } = await import('@stellar/stellar-sdk');
        const signedTx = TransactionBuilder.fromXDR(signedTxXdr, networkPassphrase);
        const lastSig = signedTx.signatures[signedTx.signatures.length - 1];
        const signatureBase64 = btoa(
            String.fromCharCode(...new Uint8Array(lastSig.signature()))
        );

        console.log('[Freighter] Transaction signed successfully');

        return {
            publicKey: signResult.signerAddress || publicKey,
            signature: signatureBase64,
            signedXdr: signedTxXdr,
        };
    } catch (error: unknown) {
        if (error instanceof Error) throw error;
        const err = error as { message?: string };
        throw new Error(`Failed to sign transaction: ${err.message}`);
    }
}

/**
 * Sign an arbitrary message with Freighter (for challenge-response auth).
 * Uses signMessage from Freighter API v6+ — signs plain text, not XDR.
 * The account does NOT need to be funded on-chain.
 */
export async function signMessageWithFreighter(
    message: string
): Promise<{ signature: string; publicKey: string }> {
    // Verify connected
    const connResult = await freighterIsConnected();
    if (connResult.error || !connResult.isConnected) {
        throw new Error('Freighter extension is not installed');
    }

    try {
        const addrResult = await getAddress();
        if (addrResult.error) {
            throw new Error('Failed to get Freighter address. Is the wallet unlocked?');
        }
        const publicKey = addrResult.address;

        console.log('[Freighter] Please approve the message signing in the Freighter popup...');

        const result = await signMessage(message, {
            address: publicKey,
        });

        if (result.error) {
            const msg = String(result.error);
            if (msg.includes('User declined') || msg.includes('cancel')) {
                throw new Error('Message signing was declined in Freighter.');
            }
            throw new Error(`Message signing failed: ${msg}`);
        }

        // signMessage returns { signedMessage: Buffer|string, signerAddress }
        const signedMessage = result.signedMessage;
        let signatureBase64: string;

        console.log('[Freighter] signMessage result type:', typeof signedMessage, 'length:', signedMessage?.length ?? 0);

        if (Buffer.isBuffer(signedMessage)) {
            signatureBase64 = signedMessage.toString('base64');
        } else if (typeof signedMessage === 'string') {
            // Freighter v4+ returns a string — check if it's hex-encoded (128 chars = 64 bytes in hex)
            if (/^[0-9a-fA-F]+$/.test(signedMessage) && signedMessage.length === 128) {
                // Convert hex to base64
                const bytes = new Uint8Array(signedMessage.match(/.{2}/g)!.map(b => parseInt(b, 16)));
                signatureBase64 = btoa(String.fromCharCode(...bytes));
                console.log('[Freighter] Converted hex signature to base64');
            } else {
                // Might already be base64
                signatureBase64 = signedMessage;
                console.log('[Freighter] Using signature string as-is (assumed base64)');
            }
        } else {
            throw new Error('Unexpected signature format from Freighter');
        }

        console.log('[Freighter] Message signed successfully, signature length:', signatureBase64.length);

        return {
            signature: signatureBase64,
            publicKey: result.signerAddress || publicKey,
        };
    } catch (error: unknown) {
        if (error instanceof Error) throw error;
        const err = error as { message?: string };
        throw new Error(`Failed to sign message: ${err.message}`);
    }
}

export default {
    isFreighterInstalled,
    isFreighterConnected,
    getFreighterPublicKey,
    getFreighterNetwork,
    connectFreighter,
    signTransactionWithFreighter,
    signMessageWithFreighter,
};
