
import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, ArrowDownLeft, ShoppingCart, Wallet, Coins, Clock, Receipt, ExternalLink } from 'lucide-react';
import { api } from '@/lib/api';
import { authStorage } from '@/utils/authStorage';

interface Transaction {
    id: string;
    type: 'Interest Payment' | 'Token Purchase' | 'USDC Deposit' | 'Token Distribution';
    amount: number;
    date: string;
    status: string;
    assetCode?: string;
    txHash?: string | null;
    details?: {
        offerName?: string;
        tokenAmount?: number;
        paymentType?: string;
        isBullet?: boolean;
    } | null;
}

type FilterType = 'all' | 'interest' | 'purchase' | 'deposit' | 'distribution';

const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'purchase', label: 'Purchases' },
    { value: 'deposit', label: 'Deposits' },
    { value: 'interest', label: 'Interest' },
    { value: 'distribution', label: 'Distributions' },
];

const TYPE_CONFIG: Record<string, { icon: typeof ArrowDownLeft; color: string; bg: string; sign: string }> = {
    'Interest Payment': {
        icon: ArrowDownLeft,
        color: 'text-[hsl(160_60%_40%)]',
        bg: 'bg-[hsl(160_60%_40%/0.15)]',
        sign: '+',
    },
    'Token Purchase': {
        icon: ShoppingCart,
        color: 'text-[hsl(217_91%_60%)]',
        bg: 'bg-[hsl(217_91%_60%/0.15)]',
        sign: '-',
    },
    'USDC Deposit': {
        icon: Wallet,
        color: 'text-[hsl(180_60%_45%)]',
        bg: 'bg-[hsl(180_60%_45%/0.15)]',
        sign: '+',
    },
    'Token Distribution': {
        icon: Coins,
        color: 'text-[hsl(280_60%_60%)]',
        bg: 'bg-[hsl(280_60%_60%/0.15)]',
        sign: '+',
    },
};

const EXPLORER_BASE = 'https://stellar.expert/explorer/testnet/tx/';

export function Transactions() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');

    useEffect(() => {
        async function fetchTransactions() {
            try {
                const user = authStorage.getUser<{ id: number }>('investor');
                if (!user?.id) throw new Error('User not found');

                const params = new URLSearchParams({ limit: '100' });
                if (activeFilter !== 'all') params.set('type', activeFilter);

                const response = await api.get(`/investors/${user.id}/payments?${params}`);

                // Unwrap the envelope: axios gives { data: { success, data: { transactions } } }
                const envelope = response.data;
                const txList = envelope?.data?.transactions ?? envelope?.transactions ?? [];

                setTransactions(txList);
            } catch (err: any) {
                console.error('Failed to fetch transactions:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        setLoading(true);
        fetchTransactions();
    }, [activeFilter]);

    const stats = useMemo(() => {
        const total = transactions.length;
        const totalAmount = transactions
            .filter(t => t.type !== 'Token Purchase')
            .reduce((s, t) => s + t.amount, 0);
        return { total, totalAmount };
    }, [transactions]);

    const getStatusColor = (status: string) => {
        const s = status.toLowerCase().replace(/_/g, ' ');
        if (['completed', 'distributed', 'confirmed'].includes(s))
            return 'text-[hsl(160_60%_40%)] bg-[hsl(160_60%_40%/0.1)] border border-[hsl(160_60%_40%/0.3)]';
        if (['pending', 'pending payment', 'pending distribution'].includes(s))
            return 'text-[hsl(35_90%_50%)] bg-[hsl(35_90%_50%/0.1)] border border-[hsl(35_90%_50%/0.3)]';
        if (['failed', 'expired', 'cancelled'].includes(s))
            return 'text-red-400 bg-red-500/10 border border-red-500/30';
        if (['payment received', 'payment_received'].includes(s))
            return 'text-[hsl(217_91%_60%)] bg-[hsl(217_91%_60%/0.1)] border border-[hsl(217_91%_60%/0.3)]';
        return 'text-muted-foreground bg-muted/50 border border-white/10';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-[hsl(43_45%_55%)]" />
                    <p className="text-muted-foreground text-sm">Loading transactions...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-500/10 text-red-400 rounded-xl border border-red-500/20 animate-fade-in">
                Failed to load transactions: {error}
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="space-y-1 animate-fade-in">
                <h2 className="text-3xl font-bold tracking-tight">Transactions</h2>
                <p className="text-muted-foreground">Your complete activity history</p>
            </div>

            {/* Filter chips */}
            <div className="flex flex-wrap gap-2 animate-fade-in-up">
                {FILTER_OPTIONS.map(opt => (
                    <button
                        key={opt.value}
                        onClick={() => setActiveFilter(opt.value)}
                        className={`
                            px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200
                            ${activeFilter === opt.value
                                ? 'bg-[hsl(43_45%_55%)] text-white shadow-md'
                                : 'bg-muted/40 text-muted-foreground hover:bg-muted/60 border border-white/10'
                            }
                        `}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>

            <Card className="glass-panel rounded-2xl animate-fade-in-up">
                <CardHeader>
                    <CardTitle className="text-xl">Transaction History</CardTitle>
                    <CardDescription>
                        {stats.total} transaction{stats.total !== 1 ? 's' : ''}{' '}
                        {stats.totalAmount > 0 && (
                            <span className="text-[hsl(160_60%_40%)]">
                                · {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(stats.totalAmount)} received
                            </span>
                        )}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {transactions.length > 0 ? (
                        <div className="space-y-3">
                            {transactions.map((tx, idx) => {
                                const cfg = TYPE_CONFIG[tx.type] || TYPE_CONFIG['Interest Payment'];
                                const Icon = cfg.icon;
                                const formattedStatus = tx.status.replace(/_/g, ' ');

                                return (
                                    <div
                                        key={tx.id}
                                        className="activity-item flex items-center justify-between p-4 rounded-xl"
                                        style={{ animationDelay: `${idx * 0.04}s` }}
                                    >
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg}`}>
                                                <Icon className={`w-5 h-5 ${cfg.color}`} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-medium truncate">
                                                    {tx.type}
                                                    {tx.details?.offerName && (
                                                        <span className="text-muted-foreground font-normal"> — {tx.details.offerName}</span>
                                                    )}
                                                </p>
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <Clock className="w-3 h-3 shrink-0" />
                                                    <span className="truncate">
                                                        {new Date(tx.date).toLocaleDateString()} at {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    {tx.txHash && (
                                                        <a
                                                            href={`${EXPLORER_BASE}${tx.txHash}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1 text-[hsl(217_91%_60%)] hover:underline shrink-0"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <ExternalLink className="w-3 h-3" />
                                                            <span className="hidden sm:inline">View</span>
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0 ml-4">
                                            <p className={`font-semibold ${cfg.sign === '+' ? 'value-success' : ''}`}>
                                                {cfg.sign}{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(tx.amount)}
                                            </p>
                                            {tx.details?.tokenAmount ? (
                                                <p className="text-xs text-muted-foreground">
                                                    {tx.details.tokenAmount.toLocaleString()} {tx.assetCode} tokens
                                                </p>
                                            ) : tx.assetCode && tx.assetCode !== 'USDC' ? (
                                                <p className="text-xs text-muted-foreground">{tx.assetCode}</p>
                                            ) : null}
                                            <span className={`text-xs px-2 py-0.5 rounded-full capitalize inline-block mt-1 ${getStatusColor(tx.status)}`}>
                                                {formattedStatus}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="p-5 rounded-2xl bg-muted/30 mb-4">
                                <Receipt className="w-10 h-10 text-muted-foreground/50" />
                            </div>
                            <p className="text-lg font-medium mb-1">No transactions yet</p>
                            <p className="text-sm text-muted-foreground">Your activity history will appear here.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
