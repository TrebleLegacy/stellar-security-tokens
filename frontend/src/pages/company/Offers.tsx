import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Plus, Search, Filter, Loader2 } from "lucide-react";
import { useCompany } from "@/hooks/useCompany";
import { useNavigate } from "react-router-dom";

export function Offers() {
    const { offers, loading, error } = useCompany();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

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
                Failed to load offers: {error}
            </div>
        );
    }

    const filteredOffers = offers.filter(offer => {
        const matchesSearch = offer.offer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            offer.asset_code.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || offer.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const statusOptions = [
        { value: 'all', label: 'All Status' },
        { value: 'pending_review', label: 'Pending Review' },
        { value: 'under_review', label: 'Under Review' },
        { value: 'approved', label: 'Approved' },
        { value: 'active', label: 'Active' },
        { value: 'rejected', label: 'Rejected' },
        { value: 'closed', label: 'Closed' },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white">My Offers</h2>
                    <p className="text-muted-foreground">Manage your tokenized asset offers</p>
                </div>
                <Button
                    onClick={() => navigate('/company/offers/new')}
                    className="bg-teal-600 hover:bg-teal-500 text-white shadow-lg shadow-teal-900/20"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Offer
                </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search offers..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-white/5 border-white/10 focus:border-teal-500/50"
                    />
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="pl-10 pr-8 py-2 rounded-md bg-white/5 border border-white/10 text-white appearance-none cursor-pointer focus:border-teal-500/50 focus:outline-none"
                        >
                            {statusOptions.map(option => (
                                <option key={option.value} value={option.value} className="bg-slate-900">
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Offers Grid */}
            {filteredOffers.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredOffers.map((offer) => (
                        <Card
                            key={offer.id}
                            className="glass-panel border-white/5 bg-white/5 cursor-pointer hover:bg-white/10 transition-all hover:border-teal-500/30"
                            onClick={() => navigate(`/company/offers/${offer.id}`)}
                        >
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-teal-500/20 flex items-center justify-center">
                                            <FileText className="w-5 h-5 text-teal-400" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base">{offer.offer_name}</CardTitle>
                                            <p className="text-xs text-muted-foreground font-mono">{offer.asset_code}</p>
                                        </div>
                                    </div>
                                    <StatusBadge status={offer.status} />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                                    {offer.description || 'No description provided'}
                                </p>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-muted-foreground">Type</p>
                                        <p className="text-white capitalize">{offer.offer_type}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Supply</p>
                                        <p className="text-white">
                                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(parseFloat(offer.total_supply || '0'))}
                                        </p>
                                    </div>
                                    {offer.annual_interest_rate && (
                                        <div>
                                            <p className="text-muted-foreground">Interest Rate</p>
                                            <p className="text-emerald-400">{offer.annual_interest_rate}% APY</p>
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-muted-foreground">Created</p>
                                        <p className="text-white">
                                            {new Date(offer.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card className="glass-panel border-white/5 bg-white/5">
                    <CardContent className="py-12 text-center">
                        <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <h3 className="text-lg font-medium text-white mb-2">
                            {searchTerm || statusFilter !== 'all' ? 'No offers found' : 'No offers yet'}
                        </h3>
                        <p className="text-muted-foreground mb-6">
                            {searchTerm || statusFilter !== 'all'
                                ? 'Try adjusting your search or filters'
                                : 'Create your first tokenized asset offer to get started'}
                        </p>
                        {!searchTerm && statusFilter === 'all' && (
                            <Button
                                onClick={() => navigate('/company/offers/new')}
                                className="bg-teal-600 hover:bg-teal-500 text-white"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Create Your First Offer
                            </Button>
                        )}
                    </CardContent>
                </Card>
            )}
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
        <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${getStatusStyles()}`}>
            {getStatusLabel()}
        </span>
    );
}
