import { DetailRow, DetailSection } from '../shared';
import { OfferPipelineStepper } from '../OfferPipelineStepper';

export function OfferDetail({ raw }: { raw: any }) {
    return (
        <>
            <OfferPipelineStepper currentStep="review" offerName={raw.offer_name} assetCode={raw.asset_code} />
            <DetailSection title="Offer Info">
                <div className="grid grid-cols-2 gap-4">
                    <DetailRow label="Name" value={raw.offer_name} />
                    <DetailRow label="Asset Code" value={raw.asset_code} />
                    <DetailRow label="Type" value={raw.offer_type} />
                    <DetailRow label="Status" value={raw.status?.replace(/_/g, ' ')} />
                    <DetailRow label="Total Supply" value={raw.total_supply} />
                    <DetailRow
                        label="Interest Rate"
                        value={raw.annual_interest_rate != null ? `${raw.annual_interest_rate}%` : '—'}
                    />
                    {raw.payment_type && <DetailRow label="Payment Type" value={raw.payment_type} />}
                    {raw.maturity_date && (
                        <DetailRow label="Maturity" value={new Date(raw.maturity_date).toLocaleDateString()} />
                    )}
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
            {raw.description && (
                <DetailSection title="Description">
                    <p className="text-sm text-zinc-300 whitespace-pre-wrap">{raw.description}</p>
                </DetailSection>
            )}
            {raw.due_diligence_notes && (
                <DetailSection title="Due Diligence Notes">
                    <p className="text-sm text-zinc-300 whitespace-pre-wrap">{raw.due_diligence_notes}</p>
                </DetailSection>
            )}
        </>
    );
}
