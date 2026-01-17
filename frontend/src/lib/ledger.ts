/**
 * Ledger Hardware Wallet Integration
 * 
 * This module provides integration with Ledger hardware wallets for signing
 * Stellar transactions. It uses WebUSB for direct communication with the device.
 * 
 * The Ledger packages are OPTIONAL and loaded at runtime. If not installed,
 * the connect() method will throw a helpful error message.
 * 
 * Requirements:
 * - User must have Ledger device connected via USB
 * - Stellar app must be installed and open on the device
 * - Browser must support WebUSB (Chrome, Edge, Opera)
 * 
 * Installation (when ready):
 * npm install @ledgerhq/hw-transport-webusb @ledgerhq/hw-app-str
 */

import { TransactionBuilder } from '@stellar/stellar-sdk';

// Types for Ledger integration
export interface LedgerDevice {
    publicKey: string;
    connected: boolean;
    appVersion?: string;
}

export interface SignatureResult {
    publicKey: string;
    signature: string; // Base64 encoded
    signedXdr: string;
}

// Stellar BIP44 path: m/44'/148'/account'
const STELLAR_BIP44_PATH = "44'/148'/0'";

// Runtime module cache
let TransportWebUSB: any = null;
let StellarApp: any = null;
let modulesLoaded = false;
let moduleLoadError: string | null = null;

/**
 * Attempt to load Ledger modules (must be called before connect)
 * This is separated to allow graceful degradation
 */
async function loadLedgerModules(): Promise<void> {
    if (modulesLoaded) return;
    if (moduleLoadError) throw new Error(moduleLoadError);

    try {
        // These will be bundled if installed, or fail gracefully if not
        const [transportModule, appModule] = await Promise.all([
            import('@ledgerhq/hw-transport-webusb').catch(() => null),
            import('@ledgerhq/hw-app-str').catch(() => null),
        ]);

        if (!transportModule || !appModule) {
            moduleLoadError = 'Ledger packages not installed. Please run: npm install @ledgerhq/hw-transport-webusb @ledgerhq/hw-app-str';
            throw new Error(moduleLoadError);
        }

        TransportWebUSB = transportModule.default;
        StellarApp = appModule.default;
        modulesLoaded = true;
    } catch (err: any) {
        if (!moduleLoadError) {
            moduleLoadError = `Failed to load Ledger modules: ${err.message}`;
        }
        throw new Error(moduleLoadError);
    }
}

/**
 * LedgerWallet class for managing Ledger device connections and signing
 */
export class LedgerWallet {
    private transport: unknown = null;
    private stellar: unknown = null;
    private _publicKey: string | null = null;
    private _connected: boolean = false;

    /**
     * Check if WebUSB is supported in the current browser
     */
    static isSupported(): boolean {
        return typeof navigator !== 'undefined' && 'usb' in navigator;
    }

    /**
     * Get current connection status
     */
    get connected(): boolean {
        return this._connected;
    }

    /**
     * Get the public key of the connected device
     */
    get publicKey(): string | null {
        return this._publicKey;
    }

    /**
     * Connect to a Ledger device
     * @returns The device info including public key
     * @throws Error if connection fails or Stellar app not open
     */
    async connect(): Promise<LedgerDevice> {
        if (!LedgerWallet.isSupported()) {
            throw new Error('WebUSB is not supported in this browser. Please use Chrome, Edge, or Opera.');
        }

        // Load modules first
        await loadLedgerModules();

        try {
            // Create WebUSB transport
            this.transport = await TransportWebUSB.create();

            // Initialize Stellar app
            this.stellar = new StellarApp(this.transport as any);

            // Get public key from device (user may need to confirm on device)
            const result = await (this.stellar as any).getPublicKey(STELLAR_BIP44_PATH);
            this._publicKey = result.publicKey;
            this._connected = true;

            console.log('[Ledger] Connected successfully. Public key:', this._publicKey?.slice(0, 8) + '...');

            return {
                publicKey: this._publicKey!,
                connected: true,
                appVersion: result.appVersion,
            };
        } catch (error: unknown) {
            this._connected = false;
            this._publicKey = null;
            const err = error as { message?: string; statusCode?: number };

            // Parse common Ledger errors
            if (err.message?.includes('denied')) {
                throw new Error('User denied USB device access. Please try again and grant permission.');
            }
            if (err.statusCode === 0x6e00) {
                throw new Error('Stellar app is not open on your Ledger. Please open the Stellar app and try again.');
            }
            if (err.statusCode === 0x6d00) {
                throw new Error('Incorrect Ledger app. Please ensure the Stellar app is open.');
            }
            if (err.message?.includes('No device selected')) {
                throw new Error('No Ledger device selected. Please connect your Ledger and select it.');
            }

            throw new Error(`Failed to connect to Ledger: ${err.message}`);
        }
    }

    /**
     * Sign a transaction with the connected Ledger device
     * @param xdr - Unsigned transaction XDR
     * @param networkPassphrase - Stellar network passphrase
     * @returns Signature result including signed XDR
     */
    async signTransaction(xdr: string, networkPassphrase: string): Promise<SignatureResult> {
        if (!this._connected || !this.stellar) {
            throw new Error('Ledger is not connected. Please call connect() first.');
        }

        if (!this._publicKey) {
            throw new Error('Public key not available. Please reconnect the device.');
        }

        try {
            // Parse the transaction from XDR
            const transaction = TransactionBuilder.fromXDR(xdr, networkPassphrase);

            // Get the signature base (the bytes that need to be signed)
            const signatureBase = transaction.signatureBase();

            // Sign with Ledger (user must confirm on device)
            console.log('[Ledger] Please confirm the transaction on your Ledger device...');
            const result = await (this.stellar as any).signTransaction(STELLAR_BIP44_PATH, signatureBase);

            // Convert signature to base64 for backend submission
            const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(result.signature)));

            // Add the signature to transaction using the SDK method
            transaction.addSignature(this._publicKey, result.signature);

            // Get signed XDR
            const signedXdr = transaction.toXDR();

            console.log('[Ledger] Transaction signed successfully');

            return {
                publicKey: this._publicKey,
                signature: signatureBase64,
                signedXdr,
            };
        } catch (error: unknown) {
            const err = error as { message?: string; statusCode?: number };

            // Handle user rejection
            if (err.statusCode === 0x6985) {
                throw new Error('Transaction was rejected on the Ledger device.');
            }
            if (err.statusCode === 0x6a80) {
                throw new Error('Invalid transaction data. Please check the transaction format.');
            }

            throw new Error(`Failed to sign transaction: ${err.message}`);
        }
    }

    /**
     * Disconnect from the Ledger device
     */
    async disconnect(): Promise<void> {
        try {
            if (this.transport) {
                await (this.transport as any).close();
            }
        } catch {
            // Ignore close errors
        } finally {
            this.transport = null;
            this.stellar = null;
            this._publicKey = null;
            this._connected = false;
            console.log('[Ledger] Disconnected');
        }
    }

    /**
     * Get device info (requires connection)
     */
    getDeviceInfo(): LedgerDevice | null {
        if (!this._connected || !this._publicKey) {
            return null;
        }
        return {
            publicKey: this._publicKey,
            connected: true,
        };
    }
}

// Singleton instance for app-wide use
let ledgerInstance: LedgerWallet | null = null;

/**
 * Get the singleton LedgerWallet instance
 */
export function getLedgerWallet(): LedgerWallet {
    if (!ledgerInstance) {
        ledgerInstance = new LedgerWallet();
    }
    return ledgerInstance;
}

/**
 * Check if Ledger is currently connected
 */
export function isLedgerConnected(): boolean {
    return ledgerInstance?.connected ?? false;
}

/**
 * Get the connected Ledger's public key
 */
export function getLedgerPublicKey(): string | null {
    return ledgerInstance?.publicKey ?? null;
}

export default LedgerWallet;
