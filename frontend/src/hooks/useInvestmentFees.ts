import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface FeeSchedule {
    blockchainFee: number;
    investmentFeePercent: number;
}

export function useInvestmentFees() {
    const [fees, setFees] = useState<FeeSchedule>({ blockchainFee: 5, investmentFeePercent: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchFees() {
            try {
                const response = await api.get('/investments/fee-schedule');
                const data = response.data || response;
                setFees({
                    blockchainFee: data.blockchainFee ?? 5,
                    investmentFeePercent: data.investmentFeePercent ?? 0,
                });
            } catch {
                // Use defaults on error
            } finally {
                setLoading(false);
            }
        }

        fetchFees();
    }, []);

    return { ...fees, loading };
}
