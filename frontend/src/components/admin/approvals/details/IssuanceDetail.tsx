import { DetailRow, DetailSection } from '../shared';
import { OfferPipelineStepper, type PipelineStep } from '../OfferPipelineStepper';

export function IssuanceDetail({ raw }: { raw: any }) {
    const step: PipelineStep = raw.issuanceStep === 'verify' ? 'verify'
        : raw.issuanceStep === 'issuing' ? 'issuing'
        : 'issue';

    return (
        <>
            <OfferPipelineStepper currentStep={step} offerName={raw.offer_name} assetCode={raw.asset_code} />
            <DetailSection title="Offer Info">
                <div className="grid grid-cols-2 gap-4">
                    <DetailRow label="Name" value={raw.offer_name} />
                    <DetailRow label="Asset Code" value={raw.asset_code} />
                    <DetailRow label="Type" value={raw.offer_type} />
                    <DetailRow label="Total Supply" value={raw.total_supply} />
                    <DetailRow
                        label="Interest Rate"
                        value={raw.annual_interest_rate != null ? `${raw.annual_interest_rate}%` : '—'}
                    />
                    {raw.payment_type && <DetailRow label="Payment Type" value={raw.payment_type} />}
                </div>
            </DetailSection>
            {raw.company && (
                <DetailSection title="Issuing Company">
                    <div className="grid grid-cols-2 gap-4">
                        <DetailRow label="Company" value={raw.company.name} />
                        <DetailRow label="CNPJ" value={raw.company.cnpj} />
                    </div>
                </DetailSection>
            )}
            {raw.token && (
                <DetailSection title="Token Details">
                    <div className="grid grid-cols-2 gap-4">
                        <DetailRow label="Asset Code" value={raw.token.assetCode || raw.asset_code} />
                        {raw.token.sacContractId && (
                            <DetailRow
                                label="SAC Contract"
                                value={
                                    <code className="text-xs text-emerald-400 bg-black/30 px-2 py-1 rounded break-all">
                                        {raw.token.sacContractId}
                                    </code>
                                }
                            />
                        )}
                    </div>
                </DetailSection>
            )}
        </>
    );
}
