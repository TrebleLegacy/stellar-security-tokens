import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, FileText, Users, Clock, Loader2, Plus, BarChart3, AlertCircle } from "lucide-react";
import { useCompany } from "@/hooks/useCompany";
import { useNavigate } from "react-router-dom";

export function CompanyDashboard() {
    const { company, offers, stats, loading, error } = useCompany();
    const navigate = useNavigate();

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
                Failed to load dashboard data: {error}. Is the backend running?
            </div>
        );
    }

    // Get recent offers for activity
    const recentOffers = offers.slice(0, 5);

    return (
        <div className="space-y-6">
            {/* KYC/Status Alerts */}
            {company?.kyc_status === 'pending' && (
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-center gap-3">
                    <Clock className="w-5 h-5 text-yellow-500" />
                    <div>
                        <h4 className="font-medium text-yellow-500">KYC Pending</h4>
                        <p className="text-sm text-yellow-500/80">
                            Your KYC is under review. You can create offers, but they won't be approved until your KYC is verified.
                        </p>
                    </div>
                </div>
            )}

            {company?.status === 'pending' && (
                <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-orange-500" />
                    <div>
                        <h4 className="font-medium text-orange-500">Account Pending Approval</h4>
                        <p className="text-sm text-orange-500/80">
                            Your company account is pending approval from the platform administrators.
                        </p>
                    </div>
                </div>
            )}

            {/* Quick Actions */}
            <div className="flex gap-4">
                <Button
                    onClick={() => navigate('/company/offers/new')}
                    className="bg-teal-600 hover:bg-teal-500 text-white shadow-lg shadow-teal-900/20"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Offer
                </Button>
                <Button
                    variant="outline"
                    onClick={() => navigate('/company/reports')}
                    className="border-white/10 hover:bg-white/5"
                >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    View Reports
                </Button>
            </div>

            {/* Stats Row */}
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
                        <CardTitle className="text-sm font-medium">Active Offers</CardTitle>
                        <FileText className="h-4 w-4 text-teal-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.activeOffers}</div>
                        <p className="text-xs text-muted-foreground">Currently accepting investments</p>
                    </CardContent>
                </Card>

                <Card className="glass-panel border-white/5 bg-white/5">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Offers</CardTitle>
                        <FileText className="h-4 w-4 text-blue-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{offers.length}</div>
                        <p className="text-xs text-muted-foreground">All time</p>
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

            {/* Main Content Area */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Recent Offers */}
                <Card className="col-span-4 glass-panel border-white/5 bg-white/5">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Recent Offers</CardTitle>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate('/company/offers')}
                            className="text-muted-foreground hover:text-white"
                        >
                            View All
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentOffers.length > 0 ? (
                                recentOffers.map((offer) => (
                                    <div
                                        key={offer.id}
                                        className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10 transition-colors"
                                        onClick={() => navigate(`/company/offers/${offer.id}`)}
                                    >
                                        <div className="w-10 h-10 rounded-lg bg-teal-500/20 flex items-center justify-center">
                                            <FileText className="w-5 h-5 text-teal-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-white truncate">{offer.offer_name}</p>
                                            <p className="text-xs text-muted-foreground">{offer.asset_code}</p>
                                        </div>
                                        <div className="text-right">
                                            <StatusBadge status={offer.status} />
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {new Date(offer.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p>No offers yet</p>
                                    <Button
                                        variant="link"
                                        className="text-teal-400 mt-2"
                                        onClick={() => navigate('/company/offers/new')}
                                    >
                                        Create your first offer
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Company Info */}
                <Card className="col-span-3 glass-panel border-white/5 bg-white/5">
                    <CardHeader>
                        <CardTitle>Company Profile</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <p className="text-xs text-muted-foreground">Company Name</p>
                                <p className="text-sm font-medium text-white">{company?.name}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">CNPJ</p>
                                <p className="text-sm font-medium text-white">{company?.cnpj}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Legal Representative</p>
                                <p className="text-sm font-medium text-white">{company?.legal_representative}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Email</p>
                                <p className="text-sm font-medium text-white">{company?.email}</p>
                            </div>
                            <div className="pt-2 border-t border-white/10">
                                <Button
                                    variant="outline"
                                    className="w-full border-white/10 hover:bg-white/5"
                                    onClick={() => navigate('/company/settings')}
                                >
                                    Edit Profile
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
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
            case 'pending_review': return 'Pending Review';
            case 'under_review': return 'Under Review';
            default: return status.charAt(0).toUpperCase() + status.slice(1);
        }
    };

    return (
        <span className={`text-xs px-2 py-1 rounded-full ${getStatusStyles()}`}>
            {getStatusLabel()}
        </span>
    );
}
