/**
 * usePasskeys Hook
 * Manages passkey operations for multi-device support
 */

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

interface Passkey {
    id: number;
    credentialId: string;
    deviceName: string;
    createdAt: string;
    lastUsedAt: string | null;
    isPrimary: boolean;
}

interface UsePasskeysReturn {
    passkeys: Passkey[];
    loading: boolean;
    error: string | null;
    addPasskey: (deviceName?: string) => Promise<void>;
    removePasskey: (passkeyId: number) => Promise<void>;
    refetch: () => Promise<void>;
}

export function usePasskeys(): UsePasskeysReturn {
    const [passkeys, setPasskeys] = useState<Passkey[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPasskeys = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get('/security/passkeys');
            setPasskeys(response.data?.data || []);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch passkeys');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPasskeys();
    }, [fetchPasskeys]);

    const addPasskey = useCallback(async (deviceName?: string) => {
        try {
            setError(null);

            // STEP 1: Get verification challenge for existing passkey
            const verifyResponse = await api.post('/security/passkeys/verify/challenge', {});
            const verifyOptions = verifyResponse.data?.data?.options;

            if (!verifyOptions) {
                throw new Error('Failed to get verification challenge');
            }

            // STEP 2: Authenticate with existing passkey (proves identity)
            const verifyCredential = await navigator.credentials.get({
                publicKey: {
                    ...verifyOptions,
                    challenge: base64ToArrayBuffer(verifyOptions.challenge),
                    allowCredentials: verifyOptions.allowCredentials?.map((cred: any) => ({
                        ...cred,
                        id: base64ToArrayBuffer(cred.id),
                    })) || [],
                },
            }) as PublicKeyCredential;

            if (!verifyCredential) {
                throw new Error('Identity verification cancelled');
            }

            // STEP 3: Get registration options for new passkey
            const optionsResponse = await api.post('/security/passkeys/add/options', {
                deviceName: deviceName || getDeviceName(),
            });

            const { options } = optionsResponse.data?.data || {};

            if (!options) {
                throw new Error('Failed to get registration options');
            }

            // STEP 4: Create new credential using WebAuthn API
            const credential = await navigator.credentials.create({
                publicKey: {
                    ...options,
                    challenge: base64ToArrayBuffer(options.challenge),
                    user: {
                        ...options.user,
                        id: base64ToArrayBuffer(options.user.id),
                    },
                    excludeCredentials: options.excludeCredentials?.map((cred: any) => ({
                        ...cred,
                        id: base64ToArrayBuffer(cred.id),
                    })) || [],
                },
            }) as PublicKeyCredential;

            if (!credential) {
                throw new Error('Failed to create credential');
            }

            const response = credential.response as AuthenticatorAttestationResponse;

            // STEP 5: Send new credential + verification assertion to server
            await api.post('/security/passkeys/add', {
                credentialId: arrayBufferToBase64(credential.rawId),
                publicKey: arrayBufferToBase64(response.getPublicKey()!),
                deviceName: deviceName || getDeviceName(),
                verificationAssertion: {
                    credentialId: arrayBufferToBase64(verifyCredential.rawId),
                    authenticatorData: arrayBufferToBase64((verifyCredential.response as AuthenticatorAssertionResponse).authenticatorData),
                    signature: arrayBufferToBase64((verifyCredential.response as AuthenticatorAssertionResponse).signature),
                },
            });

            // STEP 6: Refresh list
            await fetchPasskeys();
        } catch (err: any) {
            let message = err.message || 'Failed to add passkey';
            if (err.name === 'NotAllowedError') {
                message = 'Passkey operation was cancelled';
            }
            setError(message);
            throw new Error(message);
        }
    }, [fetchPasskeys]);

    const removePasskey = useCallback(async (passkeyId: number) => {
        try {
            setError(null);
            await api.delete(`/security/passkeys/${passkeyId}`);
            await fetchPasskeys();
        } catch (err: any) {
            const message = err.message || 'Failed to remove passkey';
            setError(message);
            throw new Error(message);
        }
    }, [fetchPasskeys]);

    return {
        passkeys,
        loading,
        error,
        addPasskey,
        removePasskey,
        refetch: fetchPasskeys,
    };
}

// Helper functions
function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function getDeviceName(): string {
    const ua = navigator.userAgent;
    if (ua.includes('iPhone')) return 'iPhone';
    if (ua.includes('iPad')) return 'iPad';
    if (ua.includes('Mac')) return 'MacBook';
    if (ua.includes('Windows')) return 'Windows PC';
    if (ua.includes('Android')) return 'Android Device';
    if (ua.includes('Linux')) return 'Linux PC';
    return 'Unknown Device';
}
