import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface WalletStatus {
    name: string;
    publicKey: string;
    balances: Array<{
        asset_type: string;
        asset_code?: string;
        asset_issuer?: string;
        balance: string;
    }>;
    exists: boolean;
    error?: string;
}

export interface MultiSigTransaction {
    id: number;
    xdr: string;
    description: string;
    status: 'pending' | 'executed' | 'rejected' | 'failed';
    initiator_id: number;
    signatures: any[];
    network: string;
    threshold_met: boolean;
    hash?: string;
    error_message?: string;
    createdAt: string;
}

export const walletsApi = {
    getWalletStatuses: async () => {
        const token = localStorage.getItem('token');
        return axios.get<WalletStatus[]>(`${API_URL}/wallets`, {
            headers: { Authorization: `Bearer ${token}` }
        });
    },

    getTransactionProposals: async (status?: string) => {
        const token = localStorage.getItem('token');
        return axios.get<MultiSigTransaction[]>(`${API_URL}/wallets/transactions`, {
            params: { status },
            headers: { Authorization: `Bearer ${token}` }
        });
    },

    createTransactionProposal: async (data: {
        sourceWallet: string;
        destination: string;
        amount: string;
        assetCode?: string;
        description: string;
    }) => {
        const token = localStorage.getItem('token');
        return axios.post(`${API_URL}/wallets/transactions`, data, {
            headers: { Authorization: `Bearer ${token}` }
        });
    },

    submitTransaction: async (id: number, signedXDR: string) => {
        const token = localStorage.getItem('token');
        return axios.post(`${API_URL}/wallets/transactions/${id}/submit`, { signedXDR }, {
            headers: { Authorization: `Bearer ${token}` }
        });
    }
};
