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
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
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
        { value: 'pending_review', label: '🟡 Under Review' },
        { value: 'approved', label: '🔵 Approved' },
        { value: 'active', label: '🟢 Active' },
        { value: 'funding', label: '🟣 Funding' },
        { value: 'rejected', label: '🔴 Declined' },
        { value: 'closed', label: '⚫ Completed' },
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
                    className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
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
                        className="pl-10 glass-panel bg-black/20 border-white/10 focus:border-primary/50 text-foreground"
                    />
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="pl-10 pr-8 py-2 rounded-md glass-panel bg-black/20 border border-white/10 text-white appearance-none cursor-pointer focus:border-primary/50 focus:outline-none"
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
                                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <FileText className="w-5 h-5 text-primary" />
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
                                            <p className="text-success">{offer.annual_interest_rate}% APY</p>
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
                                className="bg-primary hover:bg-primary/90 text-primary-foreground"
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
    const getStatusConfig = () => {
        switch (status) {
            case 'pending_review':
            case 'draft':
                return {
                    label: 'Under Review',
                    bg: 'bg-amber-500/15',
                    text: 'text-amber-400',
                    border: 'border-amber-500/30',
                    dot: 'bg-amber-400',
                };
            case 'under_review':
                return {
                    label: 'Under Review',
                    bg: 'bg-amber-500/15',
                    text: 'text-amber-400',
                    border: 'border-amber-500/30',
                    dot: 'bg-amber-400',
                };
            case 'approved':
                return {
                    label: 'Approved',
                    bg: 'bg-blue-500/15',
                    text: 'text-blue-400',
                    border: 'border-blue-500/30',
                    dot: 'bg-blue-400',
                };
            case 'active':
                return {
                    label: 'Active',
                    bg: 'bg-emerald-500/15',
                    text: 'text-emerald-400',
                    border: 'border-emerald-500/30',
                    dot: 'bg-emerald-400 animate-pulse',
                };
            case 'funding':
            case 'in_progress':
                return {
                    label: 'Funding',
                    bg: 'bg-purple-500/15',
                    text: 'text-purple-400',
                    border: 'border-purple-500/30',
                    dot: 'bg-purple-400 animate-pulse',
                };
            case 'rejected':
            case 'declined':
                return {
                    label: 'Declined',
                    bg: 'bg-red-500/15',
                    text: 'text-red-400',
                    border: 'border-red-500/30',
                    dot: 'bg-red-400',
                };
            case 'closed':
            case 'completed':
            case 'finished':
                return {
                    label: 'Completed',
                    bg: 'bg-slate-500/15',
                    text: 'text-slate-400',
                    border: 'border-slate-500/30',
                    dot: 'bg-slate-400',
                };
            case 'paused':
                return {
                    label: 'Paused',
                    bg: 'bg-orange-500/15',
                    text: 'text-orange-400',
                    border: 'border-orange-500/30',
                    dot: 'bg-orange-400',
                };
            default:
                return {
                    label: status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                    bg: 'bg-slate-500/15',
                    text: 'text-slate-400',
                    border: 'border-slate-500/30',
                    dot: 'bg-slate-400',
                };
        }
    };

    const config = getStatusConfig();

    return (
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${config.bg} ${config.text} ${config.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
            {config.label}
        </span>
    );
}

