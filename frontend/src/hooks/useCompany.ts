import { useState, useEffect } from 'react';
import { companiesApi } from '@/api/companies';
import { offersApi } from '@/api/offers';
import type { Company, Offer } from '@/types';

interface CompanyStats {
    totalRaised: number;
    activeOffers: number;
    totalInvestors: number;
    pendingPayments: number;
}

interface UseCompanyReturn {
    company: Company | null;
    offers: Offer[];
    stats: CompanyStats;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

export function useCompany(): UseCompanyReturn {
    const [company, setCompany] = useState<Company | null>(null);
    const [offers, setOffers] = useState<Offer[]>([]);
    const [stats, setStats] = useState<CompanyStats>({
        totalRaised: 0,
        activeOffers: 0,
        totalInvestors: 0,
        pendingPayments: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);

        try {
            // Fetch company profile
            const profileResponse = await companiesApi.getProfile();
            if (profileResponse.success && profileResponse.data) {
                setCompany(profileResponse.data);

                // Fetch company offers
                const offersResponse = await offersApi.getAll({
                    company_id: profileResponse.data.id,
                });

                if (offersResponse.success && offersResponse.data) {
                    const offersList = offersResponse.data;
                    setOffers(offersList);

                    // Calculate stats from offers
                    const activeOffers = offersList.filter(o => o.status === 'active').length;
                    const totalRaised = offersList
                        .filter(o => o.status === 'active' || o.status === 'closed')
                        .reduce((sum, o) => sum + parseFloat(o.total_supply || '0'), 0);

                    setStats({
                        totalRaised,
                        activeOffers,
                        totalInvestors: 0, // Would need separate API
                        pendingPayments: 0, // Would need separate API
                    });
                }
            }
        } catch (err: any) {
            console.error('Failed to fetch company data:', err);
            setError(err.message || 'Failed to load company data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return {
        company,
        offers,
        stats,
        loading,
        error,
        refetch: fetchData,
    };
}
