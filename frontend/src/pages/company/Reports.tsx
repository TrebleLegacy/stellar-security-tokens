import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Users, FileText, Loader2 } from "lucide-react";
import { useCompany } from "@/hooks/useCompany";

export function Reports() {
    const { offers, stats, loading, error } = useCompany();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-500/10 text-red-400 rounded-lg border border-red-500/20">
                Failed to load reports: {error}
            </div>
        );
    }

    // Calculate summary stats
    const activeOffers = offers.filter(o => o.status === 'active').length;
    const pendingOffers = offers.filter(o => ['pending_review', 'under_review'].includes(o.status)).length;
    const approvedOffers = offers.filter(o => o.status === 'approved').length;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-white">Reports</h2>
                <p className="text-muted-foreground">Overview of your company's performance</p>
            </div>

            {/* Summary Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="glass-panel border-white/5 bg-white/5">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Supply</CardTitle>
                        <TrendingUp className="h-4 w-4 text-emerald-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(stats.totalRaised)}
                        </div>
                        <p className="text-xs text-muted-foreground">From all offers</p>
                    </CardContent>
                </Card>

                <Card className="glass-panel border-white/5 bg-white/5">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Offers</CardTitle>
                        <FileText className="h-4 w-4 text-teal-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{offers.length}</div>
                        <p className="text-xs text-muted-foreground">All time</p>
                    </CardContent>
                </Card>

                <Card className="glass-panel border-white/5 bg-white/5">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Offers</CardTitle>
                        <BarChart3 className="h-4 w-4 text-blue-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeOffers}</div>
                        <p className="text-xs text-muted-foreground">Currently live</p>
                    </CardContent>
                </Card>

                <Card className="glass-panel border-white/5 bg-white/5">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Investors</CardTitle>
                        <Users className="h-4 w-4 text-purple-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalInvestors}</div>
                        <p className="text-xs text-muted-foreground">Unique investors</p>
                    </CardContent>
                </Card>
            </div>

            {/* Offers by Status */}
            <Card className="glass-panel border-white/5 bg-white/5">
                <CardHeader>
                    <CardTitle>Offers by Status</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <StatusBar label="Active" count={activeOffers} total={offers.length} color="bg-emerald-500" />
                        <StatusBar label="Approved" count={approvedOffers} total={offers.length} color="bg-blue-500" />
                        <StatusBar label="Pending Review" count={pendingOffers} total={offers.length} color="bg-yellow-500" />
                        <StatusBar
                            label="Closed/Rejected"
                            count={offers.filter(o => ['closed', 'rejected'].includes(o.status)).length}
                            total={offers.length}
                            color="bg-gray-500"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Offers Table */}
            <Card className="glass-panel border-white/5 bg-white/5">
                <CardHeader>
                    <CardTitle>All Offers Summary</CardTitle>
                </CardHeader>
                <CardContent>
                    {offers.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/10">
                                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Offer Name</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Asset Code</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Type</th>
                                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Supply</th>
                                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Interest</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Created</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {offers.map((offer) => (
                                        <tr key={offer.id} className="border-b border-white/5 hover:bg-white/5">
                                            <td className="py-3 px-4 text-sm text-white">{offer.offer_name}</td>
                                            <td className="py-3 px-4 text-sm text-white font-mono">{offer.asset_code}</td>
                                            <td className="py-3 px-4 text-sm text-white capitalize">{offer.offer_type}</td>
                                            <td className="py-3 px-4 text-sm text-white text-right">
                                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(parseFloat(offer.total_supply || '0'))}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-right">
                                                {offer.annual_interest_rate ? (
                                                    <span className="text-emerald-400">{offer.annual_interest_rate}%</span>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4">
                                                <StatusBadge status={offer.status} />
                                            </td>
                                            <td className="py-3 px-4 text-sm text-muted-foreground">
                                                {new Date(offer.created_at).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No offers to display</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function StatusBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
    const percentage = total > 0 ? (count / total) * 100 : 0;

    return (
        <div className="space-y-2">
            <div className="flex justify-between text-sm">
                <span className="text-white">{label}</span>
                <span className="text-muted-foreground">{count} ({percentage.toFixed(0)}%)</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                    className={`h-full ${color} transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const getStatusStyles = () => {
        switch (status) {
            case 'active':
                return 'bg-emerald-500/20 text-emerald-400';
            case 'approved':
                return 'bg-blue-500/20 text-blue-400';
            case 'pending_review':
            case 'under_review':
                return 'bg-yellow-500/20 text-yellow-400';
            case 'rejected':
                return 'bg-red-500/20 text-red-400';
            case 'closed':
                return 'bg-gray-500/20 text-gray-400';
            default:
                return 'bg-gray-500/20 text-gray-400';
        }
    };

    const getStatusLabel = () => {
        switch (status) {
            case 'pending_review': return 'Pending';
            case 'under_review': return 'Review';
            default: return status.charAt(0).toUpperCase() + status.slice(1);
        }
    };

    return (
        <span className={`text-xs px-2 py-1 rounded-full ${getStatusStyles()}`}>
            {getStatusLabel()}
        </span>
    );
}
