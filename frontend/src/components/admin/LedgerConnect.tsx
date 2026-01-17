import { useLedger } from '../../hooks/useLedger';
import { Loader2, Usb, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface LedgerConnectProps {
    onConnected?: (publicKey: string) => void;
    onDisconnected?: () => void;
    className?: string;
}

/**
 * LedgerConnect Component
 * 
 * Provides a UI for connecting to a Ledger hardware wallet.
 * Shows connection status, public key, and handles errors gracefully.
 */
export function LedgerConnect({ onConnected, onDisconnected, className = '' }: LedgerConnectProps) {
    const { device, isConnecting, error, isSupported, connect, disconnect, clearError } = useLedger();

    const handleConnect = async () => {
        const dev = await connect();
        if (dev && onConnected) {
            onConnected(dev.publicKey);
        }
    };

    const handleDisconnect = async () => {
        await disconnect();
        if (onDisconnected) {
            onDisconnected();
        }
    };

    if (!isSupported) {
        return (
            <div className={`bg-amber-900/20 border border-amber-500/30 rounded-lg p-4 ${className}`}>
                <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                    <div>
                        <h4 className="text-amber-300 font-medium">WebUSB Not Supported</h4>
                        <p className="text-sm text-amber-200/70 mt-1">
                            Your browser doesn't support WebUSB. Please use Chrome, Edge, or Opera to connect a Ledger device.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`bg-zinc-900/50 border border-zinc-700/50 rounded-lg p-4 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Usb className="w-5 h-5 text-zinc-400" />
                    <h3 className="font-medium text-white">Ledger Hardware Wallet</h3>
                </div>

                {device && (
                    <span className="flex items-center gap-1.5 text-sm text-emerald-400">
                        <CheckCircle className="w-4 h-4" />
                        Connected
                    </span>
                )}
            </div>

            {/* Error Display */}
            {error && (
                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 mb-4">
                    <div className="flex items-start gap-2">
                        <XCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                            <p className="text-sm text-red-300">{error}</p>
                            <button
                                onClick={clearError}
                                className="text-xs text-red-400 hover:text-red-300 mt-1 underline"
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Connected State */}
            {device ? (
                <div className="space-y-3">
                    <div className="bg-zinc-800/50 rounded-lg p-3">
                        <p className="text-xs text-zinc-400 mb-1">Signing Key</p>
                        <p className="font-mono text-sm text-white break-all">{device.publicKey}</p>
                    </div>

                    <button
                        onClick={handleDisconnect}
                        className="w-full px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors text-sm"
                    >
                        Disconnect
                    </button>
                </div>
            ) : (
                /* Disconnected State */
                <div className="space-y-3">
                    <p className="text-sm text-zinc-400">
                        Connect your Ledger to sign transactions securely. Make sure the Stellar app is open.
                    </p>

                    <button
                        onClick={handleConnect}
                        disabled={isConnecting}
                        className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-zinc-600 disabled:to-zinc-600 text-white rounded-lg transition-all text-sm font-medium flex items-center justify-center gap-2"
                    >
                        {isConnecting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Connecting...
                            </>
                        ) : (
                            <>
                                <Usb className="w-4 h-4" />
                                Connect Ledger
                            </>
                        )}
                    </button>

                    <p className="text-xs text-zinc-500 text-center">
                        Chrome, Edge, or Opera required
                    </p>
                </div>
            )}
        </div>
    );
}

export default LedgerConnect;
