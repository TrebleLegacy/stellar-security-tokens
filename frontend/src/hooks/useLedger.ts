import { useState, useCallback, useEffect } from 'react';
import { LedgerWallet, getLedgerWallet } from '../lib/ledger';
import type { LedgerDevice, SignatureResult } from '../lib/ledger';

interface UseLedgerReturn {
    // State
    device: LedgerDevice | null;
    isConnecting: boolean;
    isSigning: boolean;
    error: string | null;
    isSupported: boolean;

    // Actions
    connect: () => Promise<LedgerDevice | null>;
    disconnect: () => Promise<void>;
    signTransaction: (xdr: string, networkPassphrase: string) => Promise<SignatureResult | null>;
    clearError: () => void;
}

/**
 * React hook for Ledger hardware wallet integration
 * 
 * @example
 * ```tsx
 * const { device, connect, signTransaction, isConnecting, error } = useLedger();
 * 
 * const handleConnect = async () => {
 *   const dev = await connect();
 *   if (dev) {
 *     console.log('Connected:', dev.publicKey);
 *   }
 * };
 * 
 * const handleSign = async () => {
 *   const result = await signTransaction(xdr, networkPassphrase);
 *   if (result) {
 *     console.log('Signed:', result.signature);
 *   }
 * };
 * ```
 */
export function useLedger(): UseLedgerReturn {
    const [device, setDevice] = useState<LedgerDevice | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isSigning, setIsSigning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [wallet] = useState<LedgerWallet>(() => getLedgerWallet());

    const isSupported = LedgerWallet.isSupported();

    // Check initial connection state
    useEffect(() => {
        const info = wallet.getDeviceInfo();
        if (info) {
            setDevice(info);
        }
    }, [wallet]);

    const connect = useCallback(async (): Promise<LedgerDevice | null> => {
        if (isConnecting) return null;

        setIsConnecting(true);
        setError(null);

        try {
            const deviceInfo = await wallet.connect();
            setDevice(deviceInfo);
            return deviceInfo;
        } catch (err: any) {
            setError(err.message);
            setDevice(null);
            return null;
        } finally {
            setIsConnecting(false);
        }
    }, [wallet, isConnecting]);

    const disconnect = useCallback(async (): Promise<void> => {
        await wallet.disconnect();
        setDevice(null);
        setError(null);
    }, [wallet]);

    const signTransaction = useCallback(async (
        xdr: string,
        networkPassphrase: string
    ): Promise<SignatureResult | null> => {
        if (!device || isSigning) return null;

        setIsSigning(true);
        setError(null);

        try {
            const result = await wallet.signTransaction(xdr, networkPassphrase);
            return result;
        } catch (err: any) {
            setError(err.message);
            return null;
        } finally {
            setIsSigning(false);
        }
    }, [wallet, device, isSigning]);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        device,
        isConnecting,
        isSigning,
        error,
        isSupported,
        connect,
        disconnect,
        signTransaction,
        clearError,
    };
}

export default useLedger;
