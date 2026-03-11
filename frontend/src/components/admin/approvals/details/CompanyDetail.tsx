import { Badge } from '@/components/ui/badge';
import { DetailRow, DetailSection } from '../shared';

export function CompanyDetail({ raw }: { raw: any }) {
    return (
        <>
            <DetailSection title="Company Info">
                <div className="grid grid-cols-2 gap-4">
                    <DetailRow label="Name" value={raw.name} />
                    <DetailRow label="CNPJ" value={raw.cnpj} />
                    <DetailRow label="Email" value={raw.email} />
                    <DetailRow label="Status" value={raw.status} />
                    <DetailRow label="Active Offers" value={raw.activeOffers ?? 0} />
                    <DetailRow label="Total Investments" value={raw.totalInvestments ?? 0} />
                </div>
            </DetailSection>
            <DetailSection title="Wallet">
                <DetailRow
                    label="Stellar Address"
                    value={
                        raw.stellarContractId ? (
                            <code className="text-xs text-emerald-400 bg-black/30 px-2 py-1 rounded break-all">
                                {raw.stellarContractId}
                            </code>
                        ) : (
                            <span className="text-zinc-500">No wallet created</span>
                        )
                    }
                />
            </DetailSection>
            {raw.users && raw.users.length > 0 && (
                <DetailSection title={`Team · ${raw.users.length} members`}>
                    {raw.users.map((u: any) => (
                        <div key={u.id} className="flex items-center justify-between text-sm">
                            <span className="text-white">{u.name}</span>
                            <span className="text-zinc-500">{u.email}</span>
                            <Badge variant="outline" className="text-xs">{u.role}</Badge>
                        </div>
                    ))}
                </DetailSection>
            )}
        </>
    );
}
