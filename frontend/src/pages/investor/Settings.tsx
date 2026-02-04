
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, User, Mail, Check, Plus, Trash2, HardDrive, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';
import { authStorage } from '@/utils/authStorage';
import { useLedger } from '@/hooks/useLedger';
import { useRecoverySigners } from '@/hooks/useRecoverySigners';

export function Settings() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [resending, setResending] = useState(false);
    const [resendMessage, setResendMessage] = useState<string | null>(null);


    // Ledger recovery management
    const { connect: connectLedger, isConnecting: ledgerConnecting, isSupported: ledgerSupported, error: ledgerError, clearError: clearLedgerError } = useLedger();
    const { signers: recoverySigners, isLoading: signersLoading, addSigner: addRecoverySigner, removeSigner: removeRecoverySigner, isAdding: addingRecovery, isRemoving: removingRecovery } = useRecoverySigners();
    const [removingSignerId, setRemovingSignerId] = useState<number | null>(null);

    useEffect(() => {
        async function fetchSettings() {
            try {
                const storedUser = authStorage.getUser<any>('investor') || {};

                if (storedUser.id) {
                    try {
                        const userResponse = await api.get(`/investors/${storedUser.id}`);
                        const freshUser = userResponse.data || userResponse;
                        const updatedUser = { ...storedUser, ...freshUser };
                        authStorage.setUser(updatedUser, 'investor');
                        setUser(updatedUser);
                        return;
                    } catch (err) {
                        console.log('Could not fetch fresh user data, using cached');
                    }
                }

                setUser(storedUser);
            } catch (err) {
                console.error('Failed to fetch settings:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchSettings();
    }, []);

    const handleResendVerification = async () => {
        if (!user?.email) return;

        setResending(true);
        setResendMessage(null);

        try {
            await api.post('/investors/resend-verification', { email: user.email });
            setResendMessage('Verification email sent! Check your inbox.');
        } catch (err: any) {
            setResendMessage(err.message || 'Failed to send verification email');
        } finally {
            setResending(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-[hsl(43_45%_55%)]" />
                    <p className="text-muted-foreground text-sm">Loading settings...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-2xl">
            {/* Header */}
            <div className="space-y-1 animate-fade-in">
                <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
                <p className="text-muted-foreground">Manage your account and preferences</p>
            </div>

            {/* Account Information - Read Only */}
            <Card className="glass-panel rounded-2xl animate-fade-in-up animate-delay-1">
                <CardHeader>
                    <div>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <User className="w-5 h-5 text-[hsl(43_45%_55%)]" />
                            Account Information
                        </CardTitle>
                        <CardDescription>Your verified personal details</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Name</p>
                            <p className="font-medium">{user?.name || 'N/A'}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Email</p>
                            <p className="font-medium">{user?.email || 'N/A'}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Document</p>
                            <p className="font-medium font-mono">{user?.document || 'N/A'}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">KYC Status</p>
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${user?.kycStatus === 'approved'
                                ? 'bg-[hsl(160_60%_40%/0.15)] text-[hsl(160_60%_40%)] border-[hsl(160_60%_40%/0.3)]'
                                : 'bg-[hsl(35_90%_50%/0.15)] text-[hsl(35_90%_50%)] border-[hsl(35_90%_50%/0.3)]'
                                }`}>
                                {user?.kycStatus === 'approved' && <Check className="w-3 h-3" />}
                                {user?.kycStatus || 'pending'}
                            </span>
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground pt-2 border-t border-border/50">
                        🔒 Your KYC data is verified and cannot be changed. Contact support if you need to update your information.
                    </p>
                </CardContent>
            </Card>

            {/* Email Verification */}
            <Card className="glass-panel rounded-2xl animate-fade-in-up animate-delay-2">
                <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                        <Mail className="w-5 h-5 text-[hsl(43_45%_55%)]" />
                        Email Verification
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Status</p>
                            <span className={`inline-flex items-center gap-1 text-sm ${user?.emailVerified ? 'text-[hsl(160_60%_40%)]' : 'text-[hsl(35_90%_50%)]'
                                }`}>
                                {user?.emailVerified ? (
                                    <>
                                        <Check className="w-4 h-4" />
                                        Verified
                                    </>
                                ) : 'Pending verification'}
                            </span>
                        </div>
                        {!user?.emailVerified && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleResendVerification}
                                disabled={resending}
                                className="rounded-xl"
                            >
                                {resending ? (
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                ) : null}
                                Resend Email
                            </Button>
                        )}
                    </div>
                    {resendMessage && (
                        <p className={`text-sm ${resendMessage.includes('sent') ? 'text-[hsl(160_60%_40%)]' : 'text-red-400'}`}>
                            {resendMessage}
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Security section hidden for MVP - multi-device passkey management coming later
            <Card className="glass-panel rounded-2xl animate-fade-in-up animate-delay-3">
                ...
            </Card>
            */}

            {/* Ledger Recovery */}
            <Card className="glass-panel rounded-2xl animate-fade-in-up animate-delay-4">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <HardDrive className="w-5 h-5 text-[hsl(43_45%_55%)]" />
                                Ledger Recovery
                            </CardTitle>
                            <CardDescription>Add your Ledger hardware wallet as a backup recovery method</CardDescription>
                        </div>
                        {ledgerSupported && (
                            <Button
                                size="sm"
                                onClick={async () => {
                                    clearLedgerError();
                                    const connectedDevice = await connectLedger();
                                    if (connectedDevice?.publicKey) {
                                        await addRecoverySigner(connectedDevice.publicKey, 'Ledger');
                                    }
                                }}
                                disabled={ledgerConnecting || addingRecovery}
                                className="bg-[hsl(43_45%_55%)] hover:bg-[hsl(43_45%_50%)] text-white rounded-xl"
                            >
                                {ledgerConnecting || addingRecovery ? (
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                ) : (
                                    <Plus className="w-4 h-4 mr-2" />
                                )}
                                Connect Ledger
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {!ledgerSupported && (
                        <div className="p-3 rounded-xl text-sm bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span>
                                Ledger requires <strong>Chrome</strong> or <strong>Edge</strong> browser.
                                Please switch browsers to add a Ledger recovery key.
                            </span>
                        </div>
                    )}

                    {ledgerError && (
                        <div className="p-3 rounded-xl text-sm bg-red-500/10 text-red-400 border border-red-500/20">
                            {ledgerError}
                        </div>
                    )}

                    {signersLoading ? (
                        <div className="flex justify-center py-4">
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : recoverySigners.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            No recovery signers registered. Connect your Ledger to add a backup.
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {recoverySigners.map((signer) => (
                                <div
                                    key={signer.id}
                                    className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50"
                                >
                                    <div className="flex items-center gap-3">
                                        <HardDrive className="w-5 h-5 text-muted-foreground" />
                                        <div>
                                            <p className="font-medium">{signer.name}</p>
                                            <p className="text-xs text-muted-foreground font-mono">
                                                {signer.publicKey.slice(0, 8)}...{signer.publicKey.slice(-8)}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Added {new Date(signer.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={async () => {
                                            setRemovingSignerId(signer.id);
                                            try {
                                                await removeRecoverySigner(signer.id);
                                            } finally {
                                                setRemovingSignerId(null);
                                            }
                                        }}
                                        disabled={removingSignerId === signer.id || removingRecovery}
                                        className="text-red-400 hover:text-red-500 hover:bg-red-500/10"
                                    >
                                        {removingSignerId === signer.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Trash2 className="w-4 h-4" />
                                        )}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}

                    <p className="text-xs text-muted-foreground mt-4">
                        🔐 Your Ledger's 24-word seed phrase is the true backup. If you lose all passkeys,
                        you can recover using your Ledger.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}

