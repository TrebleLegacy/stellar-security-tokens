import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface FeeSchedule {
    processingFee: number;
}

export function useInvestmentFees() {
    const [fees, setFees] = useState<FeeSchedule>({ processingFee: 5 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchFees() {
            try {
                const response = await api.get('/investments/fee-schedule');
                const data = response.data || response;
                setFees({
                    processingFee: data.processingFee ?? 5,
                });
            } catch {
                // Use defaults on error ($5 processing fee)
            } finally {
                setLoading(false);
            }
        }

        fetchFees();
    }, []);

    return { ...fees, loading };
}
