import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ArrowRight, Check, FileText, Upload, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { offersApi } from "@/api/offers";

interface OfferFormData {
    offer_name: string;
    asset_code: string;
    description: string;
    offer_type: 'collateral' | 'sale';
    total_supply: string;
    annual_interest_rate: string;
    min_investment: string;
    max_investment: string;
    // Legal documents will be handled separately via IPFS
    legal_documents: {
        contract?: { name: string; hash?: string };
        terms?: { name: string; hash?: string };
        prospectus?: { name: string; hash?: string };
    };
}

const initialFormData: OfferFormData = {
    offer_name: '',
    asset_code: '',
    description: '',
    offer_type: 'collateral',
    total_supply: '',
    annual_interest_rate: '',
    min_investment: '100',
    max_investment: '',
    legal_documents: {},
};

export function CreateOffer() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState<OfferFormData>(initialFormData);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const totalSteps = 4;

    const updateFormData = (updates: Partial<OfferFormData>) => {
        setFormData(prev => ({ ...prev, ...updates }));
    };

    const handleNext = () => {
        if (step < totalSteps) {
            setStep(step + 1);
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setError(null);

        try {
            const response = await offersApi.create({
                offer_name: formData.offer_name,
                asset_code: formData.asset_code.toUpperCase(),
                description: formData.description,
                offer_type: formData.offer_type,
                total_supply: formData.total_supply,
                annual_interest_rate: formData.offer_type === 'collateral' ? parseFloat(formData.annual_interest_rate) : undefined,
                offer_rules: {
                    min_investment: formData.min_investment,
                    max_investment: formData.max_investment || undefined,
                },
                legal_documents: formData.legal_documents,
            });

            if (response.success) {
                navigate('/company/offers');
            } else {
                setError(response.error || 'Failed to create offer');
            }
        } catch (err: any) {
            console.error('Failed to create offer:', err);
            setError(err.message || 'Failed to create offer');
        } finally {
            setIsSubmitting(false);
        }
    };

    const isStepValid = () => {
        switch (step) {
            case 1:
                return formData.offer_name && formData.asset_code && formData.description;
            case 2:
                return formData.total_supply &&
                    (formData.offer_type === 'sale' || formData.annual_interest_rate);
            case 3:
                return true; // Documents are optional for now
            case 4:
                return true;
            default:
                return false;
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate('/company/offers')}
                    className="text-muted-foreground hover:text-white"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h2 className="text-2xl font-bold text-white">Create New Offer</h2>
                    <p className="text-muted-foreground">Step {step} of {totalSteps}</p>
                </div>
            </div>

            {/* Progress Indicator */}
            <div className="flex gap-2">
                {Array.from({ length: totalSteps }, (_, i) => (
                    <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors ${i + 1 <= step ? 'bg-teal-500' : 'bg-white/10'
                            }`}
                    />
                ))}
            </div>

            {/* Form Content */}
            <Card className="glass-panel border-white/5 bg-white/5">
                {step === 1 && (
                    <>
                        <CardHeader>
                            <CardTitle>Basic Information</CardTitle>
                            <CardDescription>Enter the basic details of your offer</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white">Offer Name *</label>
                                <Input
                                    placeholder="e.g. Premium Real Estate Fund"
                                    value={formData.offer_name}
                                    onChange={(e) => updateFormData({ offer_name: e.target.value })}
                                    className="bg-white/5 border-white/10 focus:border-teal-500/50"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white">Asset Code *</label>
                                <Input
                                    placeholder="e.g. PRFUND (3-12 characters)"
                                    value={formData.asset_code}
                                    onChange={(e) => updateFormData({ asset_code: e.target.value.toUpperCase().slice(0, 12) })}
                                    className="bg-white/5 border-white/10 focus:border-teal-500/50 uppercase"
                                    maxLength={12}
                                />
                                <p className="text-xs text-muted-foreground">
                                    This will be the token symbol on the Stellar network
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white">Description *</label>
                                <textarea
                                    placeholder="Describe your offer in detail..."
                                    value={formData.description}
                                    onChange={(e) => updateFormData({ description: e.target.value })}
                                    className="w-full min-h-[120px] px-3 py-2 rounded-md bg-white/5 border border-white/10 focus:border-teal-500/50 focus:outline-none text-white resize-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white">Offer Type *</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => updateFormData({ offer_type: 'collateral' })}
                                        className={`p-4 rounded-lg border text-left transition-all ${formData.offer_type === 'collateral'
                                                ? 'border-teal-500 bg-teal-500/10'
                                                : 'border-white/10 bg-white/5 hover:bg-white/10'
                                            }`}
                                    >
                                        <p className="font-medium text-white">Collateral (Debt)</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Fixed interest rate, investors receive periodic payments
                                        </p>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => updateFormData({ offer_type: 'sale' })}
                                        className={`p-4 rounded-lg border text-left transition-all ${formData.offer_type === 'sale'
                                                ? 'border-teal-500 bg-teal-500/10'
                                                : 'border-white/10 bg-white/5 hover:bg-white/10'
                                            }`}
                                    >
                                        <p className="font-medium text-white">Sale (Equity)</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Token represents ownership, dividends based on profits
                                        </p>
                                    </button>
                                </div>
                            </div>
                        </CardContent>
                    </>
                )}

                {step === 2 && (
                    <>
                        <CardHeader>
                            <CardTitle>Financial Details</CardTitle>
                            <CardDescription>Set the financial parameters of your offer</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white">Total Supply (USD) *</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                    <Input
                                        type="number"
                                        placeholder="1000000"
                                        value={formData.total_supply}
                                        onChange={(e) => updateFormData({ total_supply: e.target.value })}
                                        className="pl-8 bg-white/5 border-white/10 focus:border-teal-500/50"
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Total value of tokens to be issued
                                </p>
                            </div>

                            {formData.offer_type === 'collateral' && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-white">Annual Interest Rate (%) *</label>
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            step="0.1"
                                            placeholder="12.5"
                                            value={formData.annual_interest_rate}
                                            onChange={(e) => updateFormData({ annual_interest_rate: e.target.value })}
                                            className="pr-8 bg-white/5 border-white/10 focus:border-teal-500/50"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Annual percentage yield paid to token holders
                                    </p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-white">Minimum Investment (USD)</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                        <Input
                                            type="number"
                                            placeholder="100"
                                            value={formData.min_investment}
                                            onChange={(e) => updateFormData({ min_investment: e.target.value })}
                                            className="pl-8 bg-white/5 border-white/10 focus:border-teal-500/50"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-white">Maximum Investment (USD)</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                        <Input
                                            type="number"
                                            placeholder="No limit"
                                            value={formData.max_investment}
                                            onChange={(e) => updateFormData({ max_investment: e.target.value })}
                                            className="pl-8 bg-white/5 border-white/10 focus:border-teal-500/50"
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </>
                )}

                {step === 3 && (
                    <>
                        <CardHeader>
                            <CardTitle>Legal Documents</CardTitle>
                            <CardDescription>Upload required legal documents (optional for draft)</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                {['contract', 'terms', 'prospectus'].map((docType) => (
                                    <div key={docType} className="p-4 border border-dashed border-white/20 rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <FileText className="w-5 h-5 text-muted-foreground" />
                                                <div>
                                                    <p className="text-sm font-medium text-white capitalize">
                                                        {docType === 'contract' ? 'Investment Contract' :
                                                            docType === 'terms' ? 'Terms & Conditions' : 'Prospectus'}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {formData.legal_documents[docType as keyof typeof formData.legal_documents]?.name || 'No file selected'}
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="border-white/10 hover:bg-white/5"
                                                onClick={() => {
                                                    // TODO: Implement file upload via IPFS
                                                    const mockFileName = `${docType}_document.pdf`;
                                                    updateFormData({
                                                        legal_documents: {
                                                            ...formData.legal_documents,
                                                            [docType]: { name: mockFileName },
                                                        },
                                                    });
                                                }}
                                            >
                                                <Upload className="w-4 h-4 mr-2" />
                                                Upload
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-muted-foreground text-center">
                                Documents will be stored on IPFS for immutability and transparency
                            </p>
                        </CardContent>
                    </>
                )}

                {step === 4 && (
                    <>
                        <CardHeader>
                            <CardTitle>Review & Submit</CardTitle>
                            <CardDescription>Review your offer details before submitting for approval</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {error && (
                                <div className="p-3 bg-red-500/10 text-red-400 rounded-lg border border-red-500/20 text-sm">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="p-4 bg-white/5 rounded-lg space-y-3">
                                    <h4 className="text-sm font-medium text-muted-foreground">Basic Information</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-muted-foreground">Offer Name</p>
                                            <p className="text-white">{formData.offer_name}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Asset Code</p>
                                            <p className="text-white font-mono">{formData.asset_code}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="text-xs text-muted-foreground">Description</p>
                                            <p className="text-white text-sm">{formData.description}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Offer Type</p>
                                            <p className="text-white capitalize">{formData.offer_type}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 bg-white/5 rounded-lg space-y-3">
                                    <h4 className="text-sm font-medium text-muted-foreground">Financial Details</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-muted-foreground">Total Supply</p>
                                            <p className="text-white">
                                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(parseFloat(formData.total_supply || '0'))}
                                            </p>
                                        </div>
                                        {formData.offer_type === 'collateral' && (
                                            <div>
                                                <p className="text-xs text-muted-foreground">Interest Rate</p>
                                                <p className="text-emerald-400">{formData.annual_interest_rate}% APY</p>
                                            </div>
                                        )}
                                        <div>
                                            <p className="text-xs text-muted-foreground">Min Investment</p>
                                            <p className="text-white">${formData.min_investment || '0'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Max Investment</p>
                                            <p className="text-white">{formData.max_investment ? `$${formData.max_investment}` : 'No limit'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 bg-white/5 rounded-lg space-y-3">
                                    <h4 className="text-sm font-medium text-muted-foreground">Legal Documents</h4>
                                    <div className="space-y-2">
                                        {Object.entries(formData.legal_documents).length > 0 ? (
                                            Object.entries(formData.legal_documents).map(([key, doc]) => (
                                                <div key={key} className="flex items-center gap-2 text-sm">
                                                    <Check className="w-4 h-4 text-emerald-400" />
                                                    <span className="text-white capitalize">{key}:</span>
                                                    <span className="text-muted-foreground">{doc?.name}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-muted-foreground text-sm">No documents uploaded</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                                <p className="text-sm text-yellow-400">
                                    <strong>Note:</strong> After submission, your offer will be reviewed by platform administrators.
                                    You will be notified once it's approved or if any changes are required.
                                </p>
                            </div>
                        </CardContent>
                    </>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between p-6 border-t border-white/5">
                    <Button
                        variant="ghost"
                        onClick={handleBack}
                        disabled={step === 1}
                        className="text-muted-foreground hover:text-white"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>

                    {step < totalSteps ? (
                        <Button
                            onClick={handleNext}
                            disabled={!isStepValid()}
                            className="bg-teal-600 hover:bg-teal-500 text-white"
                        >
                            Next
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="bg-teal-600 hover:bg-teal-500 text-white"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <Check className="w-4 h-4 mr-2" />
                                    Submit for Review
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </Card>
        </div>
    );
}
