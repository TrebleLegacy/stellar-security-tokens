import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    X,
    Search,
    Snowflake,
    Flame,
    Sun,
    ExternalLink,
    Loader2,
    AlertCircle,
    Copy,
    Users,
    Coins,
    Shield
} from 'lucide-react';
import api from '@/api/client';

interface TokenHolder {
    publicKey: string;
    balance: string;
    authorized: boolean;
}

interface TokenBalance {
    asset_type: string;
    asset_code?: string;
    asset_issuer?: string;
    balance: string;
}

interface TokenManagementModalProps {
    token: TokenBalance;
    walletName: string;
    onClose: () => void;
}

export function TokenManagementModal({ token, walletName, onClose }: TokenManagementModalProps) {
    const [holders, setHolders] = useState<TokenHolder[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [clawbackAmount, setClawbackAmount] = useState('');
    const [selectedHolder, setSelectedHolder] = useState<string | null>(null);

    const assetCode = token.asset_code || 'XLM';
    const isNative = token.asset_type === 'native';

    const explorerUrl = isNative
        ? 'https://stellar.expert/explorer/testnet/asset/native'
        : `https://stellar.expert/explorer/testnet/asset/${assetCode}-${token.asset_issuer}`;

    useEffect(() => {
        if (!isNative) {
            loadHolders();
        } else {
            setLoading(false);
        }
    }, [assetCode]);

    const loadHolders = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await api.get(`/tokens/${assetCode}/holders`);
            if (response.data.success) {
                setHolders(response.data.data || []);
            }
        } catch (err: any) {
            console.error('Failed to load holders:', err);
            setError(err.response?.data?.error || 'Failed to load token holders');
        } finally {
            setLoading(false);
        }
    };

    const handleFreeze = async (holderAddress: string) => {
        if (!confirm(`Freeze account ${holderAddress.substring(0, 8)}... for ${assetCode}? They won't be able to transfer this token.`)) return;

        setActionLoading(holderAddress);
        setError('');
        setSuccess('');
        try {
            await api.post(`/tokens/freeze`, {
                investorPublicKey: holderAddress,
                assetCode: assetCode
            });
            setSuccess(`Account frozen successfully`);
            loadHolders();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to freeze account');
        } finally {
            setActionLoading(null);
        }
    };

    const handleUnfreeze = async (holderAddress: string) => {
        if (!confirm(`Unfreeze account ${holderAddress.substring(0, 8)}... ? They will be able to transfer ${assetCode} again.`)) return;

        setActionLoading(holderAddress);
        setError('');
        setSuccess('');
        try {
            await api.post(`/tokens/unfreeze`, {
                investorPublicKey: holderAddress,
                assetCode: assetCode
            });
            setSuccess(`Account unfrozen successfully`);
            loadHolders();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to unfreeze account');
        } finally {
            setActionLoading(null);
        }
    };

    const handleClawback = async (holderAddress: string, amount: string) => {
        if (!amount || parseFloat(amount) <= 0) {
            setError('Please enter a valid amount');
            return;
        }

        const confirmMsg = `CLAWBACK ${amount} ${assetCode} from ${holderAddress.substring(0, 8)}...?\n\nThis will BURN the tokens permanently. This action is required for regulatory compliance and cannot be easily undone.`;
        if (!confirm(confirmMsg)) return;

        setActionLoading(holderAddress);
        setError('');
        setSuccess('');
        try {
            await api.post(`/tokens/clawback`, {
                investorPublicKey: holderAddress,
                assetCode: assetCode,
                amount
            });
            setSuccess(`Clawback of ${amount} ${assetCode} successful`);
            setClawbackAmount('');
            setSelectedHolder(null);
            loadHolders();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to clawback tokens');
        } finally {
            setActionLoading(null);
        }
    };

    const filteredHolders = holders.filter(h =>
        h.publicKey.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalCirculating = holders.reduce((sum, h) => sum + parseFloat(h.balance), 0);

    return (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4" onClick={onClose}>
            <div
                className="bg-slate-900 border border-white/10 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10 sticky top-0 bg-slate-900 z-10">
                    <div className="flex items-center gap-3">
                        <Coins className="w-6 h-6 text-emerald-400" />
                        <div>
                            <h3 className="text-xl font-bold text-white">{assetCode} Token Management</h3>
                            <p className="text-sm text-muted-foreground">From {walletName} wallet</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Alerts */}
                    {error && (
                        <div className="p-3 bg-red-500/10 text-red-400 rounded-lg border border-red-500/20 text-sm flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20 text-sm flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            {success}
                        </div>
                    )}

                    {/* Token Info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-black/40 p-4 rounded-lg">
                            <div className="text-sm text-muted-foreground">Asset Code</div>
                            <div className="text-lg font-bold text-emerald-400">{assetCode}</div>
                        </div>
                        <div className="bg-black/40 p-4 rounded-lg">
                            <div className="text-sm text-muted-foreground">This Wallet</div>
                            <div className="text-lg font-bold text-white">
                                {parseFloat(token.balance).toLocaleString(undefined, { maximumFractionDigits: 7 })}
                            </div>
                        </div>
                        <div className="bg-black/40 p-4 rounded-lg">
                            <div className="text-sm text-muted-foreground">Total Holders</div>
                            <div className="text-lg font-bold text-white flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                {isNative ? 'N/A' : holders.length}
                            </div>
                        </div>
                        <div className="bg-black/40 p-4 rounded-lg">
                            <div className="text-sm text-muted-foreground">Circulating</div>
                            <div className="text-lg font-bold text-white">
                                {isNative ? 'N/A' : totalCirculating.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </div>
                        </div>
                    </div>

                    {/* Issuer Info */}
                    {!isNative && token.asset_issuer && (
                        <div className="bg-black/40 p-4 rounded-lg space-y-2">
                            <Label className="text-muted-foreground">Issuer Address</Label>
                            <div className="flex items-center gap-2">
                                <code className="text-sm text-white break-all flex-1">{token.asset_issuer}</code>
                                <Button variant="ghost" size="icon" onClick={() => navigator.clipboard.writeText(token.asset_issuer!)}>
                                    <Copy className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Explorer Link */}
                    <Button variant="outline" className="w-full" onClick={() => window.open(explorerUrl, '_blank')}>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View on Stellar Expert
                    </Button>

                    {/* Holders Section - Only for non-native assets */}
                    {!isNative && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <Users className="w-5 h-5" />
                                    Token Holders
                                </h4>
                                <div className="relative">
                                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by address..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9 w-64"
                                    />
                                </div>
                            </div>

                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                                </div>
                            ) : filteredHolders.length > 0 ? (
                                <div className="bg-black/40 rounded-lg overflow-hidden">
                                    <table className="w-full">
                                        <thead className="border-b border-white/10">
                                            <tr>
                                                <th className="text-left p-3 text-sm text-muted-foreground">Account</th>
                                                <th className="text-right p-3 text-sm text-muted-foreground">Balance</th>
                                                <th className="text-center p-3 text-sm text-muted-foreground">Status</th>
                                                <th className="text-right p-3 text-sm text-muted-foreground">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredHolders.map((holder, i) => (
                                                <tr key={i} className="border-b border-white/5 last:border-0">
                                                    <td className="p-3">
                                                        <code className="text-sm text-white">
                                                            {holder.publicKey.substring(0, 8)}...{holder.publicKey.substring(48)}
                                                        </code>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6 ml-1"
                                                            onClick={() => navigator.clipboard.writeText(holder.publicKey)}
                                                        >
                                                            <Copy className="w-3 h-3" />
                                                        </Button>
                                                    </td>
                                                    <td className="p-3 text-right text-white font-mono">
                                                        {parseFloat(holder.balance).toLocaleString(undefined, { maximumFractionDigits: 7 })}
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        {holder.authorized ? (
                                                            <Badge className="bg-emerald-600">Authorized</Badge>
                                                        ) : (
                                                            <Badge variant="destructive">Frozen</Badge>
                                                        )}
                                                    </td>
                                                    <td className="p-3 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            {holder.authorized ? (
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => handleFreeze(holder.publicKey)}
                                                                    disabled={actionLoading === holder.publicKey}
                                                                >
                                                                    {actionLoading === holder.publicKey ? (
                                                                        <Loader2 className="w-3 h-3 animate-spin" />
                                                                    ) : (
                                                                        <Snowflake className="w-3 h-3 mr-1" />
                                                                    )}
                                                                    Freeze
                                                                </Button>
                                                            ) : (
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => handleUnfreeze(holder.publicKey)}
                                                                    disabled={actionLoading === holder.publicKey}
                                                                >
                                                                    {actionLoading === holder.publicKey ? (
                                                                        <Loader2 className="w-3 h-3 animate-spin" />
                                                                    ) : (
                                                                        <Sun className="w-3 h-3 mr-1" />
                                                                    )}
                                                                    Unfreeze
                                                                </Button>
                                                            )}

                                                            {selectedHolder === holder.publicKey ? (
                                                                <div className="flex items-center gap-1">
                                                                    <Input
                                                                        type="number"
                                                                        placeholder="Amount"
                                                                        value={clawbackAmount}
                                                                        onChange={(e) => setClawbackAmount(e.target.value)}
                                                                        className="w-24 h-8"
                                                                    />
                                                                    <Button
                                                                        variant="destructive"
                                                                        size="sm"
                                                                        onClick={() => handleClawback(holder.publicKey, clawbackAmount)}
                                                                        disabled={actionLoading === holder.publicKey}
                                                                    >
                                                                        {actionLoading === holder.publicKey ? (
                                                                            <Loader2 className="w-3 h-3 animate-spin" />
                                                                        ) : (
                                                                            <Flame className="w-3 h-3" />
                                                                        )}
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => {
                                                                            setSelectedHolder(null);
                                                                            setClawbackAmount('');
                                                                        }}
                                                                    >
                                                                        <X className="w-3 h-3" />
                                                                    </Button>
                                                                </div>
                                                            ) : (
                                                                <Button
                                                                    variant="destructive"
                                                                    size="sm"
                                                                    onClick={() => setSelectedHolder(holder.publicKey)}
                                                                >
                                                                    <Flame className="w-3 h-3 mr-1" />
                                                                    Clawback
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-12 text-muted-foreground">
                                    {searchQuery ? 'No holders match your search' : 'No holders found for this token'}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Native XLM message */}
                    {isNative && (
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-center text-blue-300">
                            XLM is the native Stellar asset. Token management actions (freeze, clawback) are only available for issued assets.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default TokenManagementModal;
