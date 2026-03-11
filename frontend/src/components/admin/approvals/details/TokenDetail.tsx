import { Badge } from '@/components/ui/badge';
import { DetailRow, DetailSection } from '../shared';
import { OfferPipelineStepper } from '../OfferPipelineStepper';

export function TokenDetail({ raw }: { raw: any }) {
    return (
        <>
            <OfferPipelineStepper currentStep="unlock" offerName={raw.offer_name} assetCode={raw.asset_code} />
            <DetailSection title="Token Info">
                <div className="grid grid-cols-2 gap-4">
                    <DetailRow label="Asset Code" value={raw.asset_code} />
                    <DetailRow label="Offer" value={raw.offer_name} />
                    <DetailRow label="Type" value={raw.offer_type} />
                    <DetailRow label="Total Supply" value={raw.total_supply} />
                    <DetailRow
                        label="Token Status"
                        value={
                            <Badge variant="outline" className="bg-yellow-500/15 text-yellow-400 border-yellow-500/30">
                                🔒 Locked
                            </Badge>
                        }
                    />
                    <DetailRow
                        label="Interest Rate"
                        value={raw.annual_interest_rate != null ? `${raw.annual_interest_rate}%` : '—'}
                    />
                </div>
            </DetailSection>
            <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                <p className="text-sm text-amber-300">
                    <strong>Unlocking this token</strong> will allow it to be traded on the DEX.
                    This action is irreversible.
                </p>
            </div>
        </>
    );
}
