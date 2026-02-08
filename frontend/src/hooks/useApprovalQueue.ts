import { useState, useEffect, useCallback, useMemo } from 'react';
import { platformAdminsApi } from '@/api/platformAdmins';
import { offersApi } from '@/api/offers';
import { api } from '@/lib/api';
import type { Investor } from '@/api/platformAdmins';
import type { Offer } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────

export type ApprovalType = 'investor' | 'company' | 'offer' | 'issuance' | 'token' | 'multisig';

export interface ApprovalItem {
    id: string;            // composite: `${type}-${originalId}`
    originalId: number;
    type: ApprovalType;
    label: string;
    subtitle: string;
    status: string;        // raw status from source entity
    normalizedStatus: 'pending' | 'in_progress' | 'resolved';
    createdAt: string;
    raw: any;              // original entity for detail panel
}

export interface ApprovalCounts {
    all: number;
    investor: number;
    company: number;
    offer: number;
    issuance: number;
    token: number;
    multisig: number;
}

// ─── Status normalization ─────────────────────────────────────────────────

function normalizeStatus(type: ApprovalType, status: string): ApprovalItem['normalizedStatus'] {
    const pendingStatuses: Record<ApprovalType, string[]> = {
        investor: ['pending'],
        company: ['pending'],
        offer: ['pending_review', 'under_review'],
        issuance: ['needs_issue', 'needs_verify'],
        token: ['locked'],
        multisig: ['pending'],
    };

    const inProgressStatuses: Record<ApprovalType, string[]> = {
        investor: [],
        company: [],
        offer: [],
        issuance: ['issuing'],
        token: [],
        multisig: ['partially_signed', 'ready'],
    };

    if (pendingStatuses[type]?.includes(status)) return 'pending';
    if (inProgressStatuses[type]?.includes(status)) return 'in_progress';
    return 'resolved';
}

// ─── Normalizers per domain ───────────────────────────────────────────────

function normalizeInvestors(investors: Investor[]): ApprovalItem[] {
    return investors
        .filter((i) => i.status === 'pending')
        .map((inv) => ({
            id: `investor-${inv.id}`,
            originalId: inv.id,
            type: 'investor' as ApprovalType,
            label: inv.name,
            subtitle: inv.email,
            status: inv.status,
            normalizedStatus: normalizeStatus('investor', inv.status),
            createdAt: inv.createdAt,
            raw: inv,
        }));
}

function normalizeCompanies(companies: any[]): ApprovalItem[] {
    return companies
        .filter((c) => c.status === 'pending')
        .map((co) => ({
            id: `company-${co.id}`,
            originalId: co.id,
            type: 'company' as ApprovalType,
            label: co.name,
            subtitle: co.cnpj || co.email || '',
            status: co.status,
            normalizedStatus: normalizeStatus('company', co.status),
            createdAt: co.createdAt || co.created_at || '',
            raw: co,
        }));
}

function normalizeOffers(offers: Offer[]): ApprovalItem[] {
    return offers
        .filter((o) => ['pending_review', 'under_review'].includes(o.status))
        .map((offer) => ({
            id: `offer-${offer.id}`,
            originalId: offer.id,
            type: 'offer' as ApprovalType,
            label: offer.offer_name,
            subtitle: `${offer.asset_code} · ${offer.offer_type}`,
            status: offer.status,
            normalizedStatus: normalizeStatus('offer', offer.status),
            createdAt: offer.created_at,
            raw: offer,
        }));
}

function normalizeIssuances(offers: Offer[], pendingIssuanceIds: number[]): ApprovalItem[] {
    const items: ApprovalItem[] = [];

    for (const offer of offers) {
        if (offer.status !== 'approved') continue;

        const hasToken = !!(offer as any).token;
        const isVerified = !!(offer as any).offer_rules?.admin_verified;
        const isIssuing = pendingIssuanceIds.includes(offer.id);

        if (!hasToken && !isIssuing) {
            // Step 2: Approved, needs token issuance
            items.push({
                id: `issuance-${offer.id}`,
                originalId: offer.id,
                type: 'issuance',
                label: offer.offer_name,
                subtitle: `${offer.asset_code} · Ready to Issue`,
                status: 'needs_issue',
                normalizedStatus: normalizeStatus('issuance', 'needs_issue'),
                createdAt: offer.created_at,
                raw: { ...offer, issuanceStep: 'issue' },
            });
        } else if (isIssuing) {
            // Step 2b: Issuance in-flight (multisig pending)
            items.push({
                id: `issuance-${offer.id}`,
                originalId: offer.id,
                type: 'issuance',
                label: offer.offer_name,
                subtitle: `${offer.asset_code} · Issuing (MultiSig)`,
                status: 'issuing',
                normalizedStatus: normalizeStatus('issuance', 'issuing'),
                createdAt: offer.created_at,
                raw: { ...offer, issuanceStep: 'issuing' },
            });
        } else if (hasToken && !isVerified) {
            // Step 3: Token exists, needs admin verification
            items.push({
                id: `issuance-${offer.id}`,
                originalId: offer.id,
                type: 'issuance',
                label: offer.offer_name,
                subtitle: `${offer.asset_code} · Needs Verification`,
                status: 'needs_verify',
                normalizedStatus: normalizeStatus('issuance', 'needs_verify'),
                createdAt: offer.created_at,
                raw: { ...offer, issuanceStep: 'verify' },
            });
        }
    }

    return items;
}

function normalizeTokens(offers: Offer[]): ApprovalItem[] {
    return offers
        .filter((o) => o.isTokenLocked === true && o.status === 'active')
        .map((offer) => ({
            id: `token-${offer.id}`,
            originalId: offer.id,
            type: 'token' as ApprovalType,
            label: offer.asset_code,
            subtitle: `${offer.offer_name} · Locked`,
            status: 'locked',
            normalizedStatus: normalizeStatus('token', 'locked'),
            createdAt: offer.created_at,
            raw: offer,
        }));
}

function normalizeMultisig(transactions: any[]): ApprovalItem[] {
    return transactions.map((tx) => ({
        id: `multisig-${tx.id}`,
        originalId: tx.id,
        type: 'multisig' as ApprovalType,
        label: tx.operationType?.replace(/_/g, ' ') || `Tx #${tx.id}`,
        subtitle: tx.description || `${tx.signatureStatus?.collected || 0}/${tx.thresholdRequired} signatures`,
        status: tx.status,
        normalizedStatus: normalizeStatus('multisig', tx.status),
        createdAt: tx.createdAt,
        raw: tx,
    }));
}

// ─── Hook ─────────────────────────────────────────────────────────────────

export function useApprovalQueue() {
    const [items, setItems] = useState<ApprovalItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const [investorsRes, companiesRes, offersRes, txRes] = await Promise.allSettled([
                platformAdminsApi.getInvestors(),
                api.get('/platform-admins/companies?status=pending'),
                offersApi.getAllAdmin(),
                api.get('/admin/transactions/pending'),
            ]);

            const merged: ApprovalItem[] = [];

            // Investors
            if (investorsRes.status === 'fulfilled' && investorsRes.value?.data) {
                merged.push(...normalizeInvestors(investorsRes.value.data));
            }

            // Companies
            if (companiesRes.status === 'fulfilled') {
                const data = companiesRes.value?.data || companiesRes.value;
                merged.push(...normalizeCompanies(data || []));
            }

            // Pending multisig issuance IDs (for cross-ref)
            let pendingIssuanceIds: number[] = [];
            if (txRes.status === 'fulfilled') {
                const txData = txRes.value?.data?.transactions || txRes.value?.transactions || [];
                pendingIssuanceIds = txData
                    .filter((tx: any) => tx.operationType === 'token_issue' && tx.status !== 'executed')
                    .map((tx: any) => tx.metadata?.offerId)
                    .filter(Boolean);
                merged.push(...normalizeMultisig(txData));
            }

            // Offers (pending review)
            if (offersRes.status === 'fulfilled' && offersRes.value?.data) {
                const allOffers = offersRes.value.data;
                merged.push(...normalizeOffers(allOffers));
                merged.push(...normalizeIssuances(allOffers, pendingIssuanceIds));
                merged.push(...normalizeTokens(allOffers));
            }

            // Sort: pending first, then by creation date (oldest first within group)
            merged.sort((a, b) => {
                const order = { pending: 0, in_progress: 1, resolved: 2 };
                const statusDiff = order[a.normalizedStatus] - order[b.normalizedStatus];
                if (statusDiff !== 0) return statusDiff;
                return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            });

            setItems(merged);
        } catch (err: any) {
            setError(err.message || 'Failed to load approvals');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    const counts = useMemo<ApprovalCounts>(() => {
        const c: ApprovalCounts = { all: 0, investor: 0, company: 0, offer: 0, issuance: 0, token: 0, multisig: 0 };
        for (const item of items) {
            if (item.normalizedStatus !== 'resolved') {
                c.all++;
                c[item.type]++;
            }
        }
        return c;
    }, [items]);

    return { items, counts, loading, error, refresh: fetchAll };
}
