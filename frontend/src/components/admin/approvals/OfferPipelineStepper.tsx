export type PipelineStep = 'review' | 'issue' | 'issuing' | 'verify' | 'unlock';

const STEPS = [
    { key: 'review', label: 'Review' },
    { key: 'issue', label: 'Issue' },
    { key: 'verify', label: 'Verify' },
    { key: 'unlock', label: 'Unlock' },
] as const;

// 'issuing' maps to the same visual position as 'issue' but with a pulsing indicator
function resolveIndex(step: PipelineStep): number {
    if (step === 'issuing') return 1;
    return STEPS.findIndex((s) => s.key === step);
}

const STEP_DESCRIPTIONS: Record<PipelineStep, string> = {
    review: 'Pending admin review — approve or reject this offer.',
    issue: 'Approved. Create the token on the Stellar network.',
    issuing: 'Token issuance in progress — pending multisig signatures.',
    verify: 'Token issued. Verify issuance to enable launch.',
    unlock: 'Offer is active. Unlock the token for DEX trading.',
};

export function OfferPipelineStepper({
    currentStep,
    offerName,
    assetCode,
}: {
    currentStep: PipelineStep;
    offerName?: string;
    assetCode?: string;
}) {
    const currentIdx = resolveIndex(currentStep);
    const isPulsing = currentStep === 'issuing';

    return (
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 space-y-3">
            {/* Context line */}
            {(offerName || assetCode) && (
                <p className="text-[11px] text-zinc-500 uppercase tracking-wider font-medium">
                    {assetCode && <span className="text-zinc-400">{assetCode}</span>}
                    {assetCode && offerName && ' · '}
                    {offerName}
                </p>
            )}

            {/* Stepper */}
            <div className="flex items-center gap-1">
                {STEPS.map((step, i) => {
                    const isCompleted = i < currentIdx;
                    const isCurrent = i === currentIdx;

                    return (
                        <div key={step.key} className="flex items-center gap-1 flex-1">
                            {/* Dot */}
                            <div className="flex items-center gap-1.5 shrink-0">
                                <div
                                    className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                                        isCompleted
                                            ? 'bg-emerald-400'
                                            : isCurrent
                                                ? isPulsing
                                                    ? 'bg-amber-400 ring-[3px] ring-amber-400/20 animate-pulse'
                                                    : 'bg-blue-400 ring-[3px] ring-blue-400/20'
                                                : 'bg-zinc-700'
                                    }`}
                                />
                                <span
                                    className={`text-[11px] font-medium ${
                                        isCompleted
                                            ? 'text-emerald-400'
                                            : isCurrent
                                                ? isPulsing ? 'text-amber-400' : 'text-blue-400'
                                                : 'text-zinc-600'
                                    }`}
                                >
                                    {step.label}
                                </span>
                            </div>
                            {/* Connector line */}
                            {i < STEPS.length - 1 && (
                                <div
                                    className={`flex-1 h-px mx-1 ${
                                        isCompleted ? 'bg-emerald-400/50' : 'bg-zinc-700/50'
                                    }`}
                                />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Description */}
            <p className="text-xs text-zinc-400">{STEP_DESCRIPTIONS[currentStep]}</p>
        </div>
    );
}
