
import { SmartAccountKit } from 'smart-account-kit';
import { authStorage } from '@/utils/authStorage';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export interface AuthResponse {
    success: boolean;
    message?: string;
    data: {
        token: string;
        investor?: any;
        user?: any;
        userType?: 'investor' | 'company';
    };
}

export class PasskeyClient {
    private kit: SmartAccountKit | null = null;
    private baseUrl: string;

    constructor() {
        this.baseUrl = API_URL;
    }

    /**
     * Initialize the SmartAccountKit with config from backend.
     * Replaces the deprecated PasskeyKit initialization.
     */
    async init(): Promise<void> {
        if (this.kit) return;

        try {
            const response = await fetch(`${this.baseUrl}/auth/config`);
            if (!response.ok) throw new Error('Failed to fetch auth config');

            const config = await response.json();

            this.kit = new SmartAccountKit({
                rpcUrl: config.rpcUrl,
                networkPassphrase: config.networkPassphrase,
                accountWasmHash: config.accountWasmHash,
                webauthnVerifierAddress: config.webauthnVerifierAddress,
                // Use backend as relay proxy for fee-sponsored submissions
                relayerUrl: `${this.baseUrl}/wallets/relay`,
                // Give 5 minutes for the passkey signing flow.
                timeoutInSeconds: 300,
            });
        } catch (error) {
            console.error('Failed to initialize SmartAccountKit:', error);
            throw error;
        }
    }

    /**
     * Login with Passkey (Usernameless / Discoverable Credentials)
     * No email required - browser shows all available passkeys for this site
     */
    async discoverLogin(): Promise<AuthResponse> {
        try {
            // 1. Get challenge from backend
            const challengeResponse = await fetch(`${this.baseUrl}/auth/passkey-login/discover`);

            if (!challengeResponse.ok) {
                throw new Error('Failed to get login challenge');
            }

            const { challenge } = await challengeResponse.json();

            // 2. Trigger WebAuthn with empty allowCredentials
            // This prompts the browser to show all discoverable credentials for this RP
            const credential = await navigator.credentials.get({
                publicKey: {
                    challenge: Uint8Array.from(atob(challenge), c => c.charCodeAt(0)),
                    allowCredentials: [], // Empty = show all discoverable credentials
                    timeout: 60000,
                    userVerification: 'required',
                },
            }) as PublicKeyCredential;

            if (!credential) {
                throw new Error('No passkey selected');
            }

            // Get credential ID as base64url
            const credentialIdBase64 = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)))
                .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

            // 3. Authenticate with Backend using discover endpoint
            // Backend looks up user by credentialId
            const authResponse = await fetch(`${this.baseUrl}/auth/passkey-login/discover`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    credentialId: credentialIdBase64,
                }),
            });

            const data = await authResponse.json();

            if (!authResponse.ok || !data.success) {
                throw new Error(data.error || 'Authentication failed');
            }

            return data;
        } catch (error: any) {
            console.error('Discover login error:', error);
            if (error.name === 'NotAllowedError') {
                throw new Error('Passkey authentication was cancelled or timed out');
            }
            throw error;
        }
    }

    /**
     * Register a new passkey and deploy smart wallet.
     * Uses SmartAccountKit.createWallet() which handles:
     *  - WebAuthn passkey creation
     *  - Builds deployment transaction
     *  - Signs with deployer keypair
     *  - Optionally auto-submits
     */
    async register(username: string): Promise<{ credentialId: string; contractId: string }> {
        await this.init();
        if (!this.kit) throw new Error('SmartAccountKit not initialized');

        try {
            // createWallet handles passkey creation + deploy TX building + signing
            const result = await this.kit.createWallet('Stellar Tokens', username, {
                autoSubmit: true, // Let the SDK submit via relayer (Channels)
            });

            if (!result || !result.credentialId || !result.contractId) {
                throw new Error('Failed to create wallet - missing required data');
            }

            console.log('[SmartAccount] Wallet created successfully');
            console.log('[SmartAccount] Contract ID:', result.contractId);
            console.log('[SmartAccount] Credential ID:', result.credentialId);

            return {
                credentialId: result.credentialId,
                contractId: result.contractId,
            };
        } catch (error: any) {
            console.error('Registration error:', error);
            throw error;
        }
    }

    /**
     * Sign a transaction with the user's Passkey.
     * Uses SmartAccountKit.signAndSubmit() for the full flow:
     *   sign auth entries → re-simulate → assemble → submit
     * 
     * @param xdr - The transaction XDR string to sign
     * @param walletContractId - Optional smart wallet contract ID
     * @returns Signed transaction XDR string
     */
    async signTransaction(xdr: string, walletContractId?: string): Promise<string> {
        await this.init();
        if (!this.kit) throw new Error('SmartAccountKit not initialized');

        // Connect wallet if not already connected
        if (!this.kit.contractId) {
            const user = authStorage.getUser<any>('investor') || authStorage.getUser<any>('company');
            const contractId = walletContractId || user?.stellarContractId;
            if (!contractId) {
                throw new Error('Smart wallet contract ID not found. Cannot sign transaction.');
            }
            console.log('[SmartAccount] Connecting wallet for signing:', contractId);
            await this.kit.connectWallet({ contractId });
        }

        try {
            // Import the bindings Client to parse XDR into AssembledTransaction
            const { Client } = await import('smart-account-kit-bindings');
            const wallet = new Client({
                contractId: this.kit.contractId!,
                networkPassphrase: this.kit.networkPassphrase,
                rpcUrl: this.kit.rpcUrl,
            });

            // Parse the XDR into an AssembledTransaction using fromXDR
            const tx = wallet.fromJSON.execute(xdr);
            
            // Sign the auth entries with passkey
            const signedTx = await this.kit.sign(tx);
            
            return signedTx.toXDR() as string;
        } catch (error: any) {
            console.error('Signing error:', error);
            throw error;
        }
    }
}

export const passkeyClient = new PasskeyClient();
