import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { authStorage } from '@/utils/authStorage';

const CACHE_KEY_PREFIX = 'investor_wallet_balance_';

export function useWalletBalance() {
    const [usdcBalance, setUsdcBalance] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        async function fetchBalance() {
            const user = authStorage.getUser<{ id: number }>('investor');
            if (!user?.id) {
                setLoading(false);
                return;
            }

            // Try cache first for instant display
            try {
                const cached = localStorage.getItem(`${CACHE_KEY_PREFIX}${user.id}`);
                if (cached) {
                    const { usdc } = JSON.parse(cached);
                    setUsdcBalance(Number(usdc));
                }
            } catch { /* ignore */ }

            try {
                const response = await api.get(`/investors/${user.id}/wallet-status`);
                const data = response.data || response;

                if (data.balances?.usdc !== undefined) {
                    const balance = Number(data.balances.usdc);
                    setUsdcBalance(balance);
                    localStorage.setItem(`${CACHE_KEY_PREFIX}${user.id}`, JSON.stringify({ usdc: balance }));
                }
            } catch {
                setError(true);
            } finally {
                setLoading(false);
            }
        }

        fetchBalance();
    }, []);

    return { usdcBalance, loading, error };
}
