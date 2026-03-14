
import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { passkeyClient } from '@/lib/passkey';
import { api } from '@/lib/api';
import { Cloud, Smartphone, Key, Mail, ArrowLeft, Loader2, CheckCircle2, AlertTriangle, Monitor, Fingerprint } from 'lucide-react';
import { authStorage } from '@/utils/authStorage';

// ============ Ecosystem Detection ============
// Detects the user's platform to provide passkey-specific guidance.
//
//   navigator.userAgent
//         │
//         ▼
//   ┌─ Platform? ────────────────────────────────┐
//   │ iOS/macOS/Safari  → apple (iCloud Keychain) │
//   │ Android/Chrome    → google (Google PM)       │
//   │ Windows + Chrome  → google (Chrome saves)    │
//   │ Windows + Other   → windows_local (⚠️ RISK) │
//   │ Anything else     → other                    │
//   └─────────────────────────────────────────────┘

type Ecosystem = 'apple' | 'google' | 'windows_local' | 'other';
type Step = 'email' | 'code' | 'details' | 'passkey';

interface EcosystemInfo {
    id: Ecosystem;
    label: string;
    icon: typeof Cloud;
    syncMessage: string;
    isRisky: boolean;
}

function detectEcosystem(): Ecosystem {
    const ua = navigator.userAgent;
    const isApple = /Macintosh|iPhone|iPad|iPod/.test(ua) || /Safari/.test(ua) && !/Chrome/.test(ua);
    const isAndroid = /Android/.test(ua);
    const isChrome = /Chrome/.test(ua) && !/Edg/.test(ua); // Chrome but not Edge
    const isWindows = /Windows/.test(ua);

    if (isApple) return 'apple';
    if (isAndroid) return 'google';
    if (isWindows && isChrome) return 'google'; // Chrome on Windows saves to Google PM
    if (isWindows) return 'windows_local'; // Edge/Firefox on Windows → TPM only
    return 'other';
}

const ECOSYSTEM_INFO: Record<Ecosystem, EcosystemInfo> = {
    apple: {
        id: 'apple',
        label: 'iCloud Keychain',
        icon: Cloud,
        syncMessage: 'Your passkey syncs automatically across all your Apple devices via iCloud.',
        isRisky: false,
    },
    google: {
        id: 'google',
        label: 'Google Password Manager',
        icon: Smartphone,
        syncMessage: 'Your passkey syncs across all devices where you\'re signed into Chrome or your Google account.',
        isRisky: false,
    },
    windows_local: {
        id: 'windows_local',
        label: 'Windows Hello (Local)',
        icon: Monitor,
        syncMessage: '',
        isRisky: true,
    },
    other: {
        id: 'other',
        label: 'Other / Hardware Key',
        icon: Key,
        syncMessage: 'Make sure your passkey manager syncs across your devices (e.g. 1Password, Bitwarden).',
        isRisky: false,
    },
};

export function Register() {
    const [step, setStep] = useState<Step>('email');
    const [email, setEmail] = useState('');
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [registrationToken, setRegistrationToken] = useState('');
    const [formData, setFormData] = useState({ name: '', document: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [ecosystem, setEcosystem] = useState<Ecosystem | null>(null);
    const [resendCooldown, setResendCooldown] = useState(0);
    const navigate = useNavigate();
    const codeInputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Auto-detect ecosystem on mount
    const detectedEcosystem = useMemo(() => detectEcosystem(), []);

    // Resend cooldown timer
    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    // Step 1: Send verification code
    const handleSendCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await api.post('/investors/initiate-registration', { email });
            if (!response.success) {
                throw new Error(response.error || 'Failed to send verification code');
            }
            setStep('code');
            setResendCooldown(60);
        } catch (err: any) {
            setError(err.message || 'Failed to send verification code');
        } finally {
            setIsLoading(false);
        }
    };

    // Step 2: Verify code
    const handleVerifyCode = async () => {
        const fullCode = code.join('');
        if (fullCode.length !== 6) return;

        setIsLoading(true);
        setError('');

        try {
            const response = await api.post('/investors/verify-email-code', { email, code: fullCode });
            if (!response.success) {
                throw new Error(response.error || 'Invalid verification code');
            }
            setRegistrationToken(response.data.registrationToken);
            setStep('details');
        } catch (err: any) {
            setError(err.message || 'Invalid verification code');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle code input
    const handleCodeChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;
        if (error) setError('');

        const newCode = [...code];

        if (value.length > 1) {
            const chars = value.replace(/\D/g, '').slice(0, 6 - index);
            for (let i = 0; i < chars.length; i++) {
                if (index + i < 6) newCode[index + i] = chars[i];
            }
            setCode(newCode);
            const nextIndex = Math.min(index + chars.length, 5);
            codeInputRefs.current[nextIndex]?.focus();
            if (newCode.every(c => c)) setTimeout(handleVerifyCode, 100);
            return;
        }

        newCode[index] = value.slice(-1);
        setCode(newCode);
        if (value && index < 5) codeInputRefs.current[index + 1]?.focus();
        if (newCode.every(c => c) && newCode.join('').length === 6) setTimeout(handleVerifyCode, 100);
    };

    const handleCodePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pastedData.length === 0) return;
        if (error) setError('');

        const newCode = [...code];
        for (let i = 0; i < pastedData.length; i++) newCode[i] = pastedData[i];
        setCode(newCode);
        const focusIndex = Math.min(pastedData.length, 5);
        codeInputRefs.current[focusIndex]?.focus();
        if (pastedData.length === 6) setTimeout(handleVerifyCode, 100);
    };

    const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            codeInputRefs.current[index - 1]?.focus();
        }
    };

    const handleResendCode = async () => {
        if (resendCooldown > 0) return;
        setIsLoading(true);
        setError('');
        try {
            await api.post('/investors/resend-code', { email });
            setResendCooldown(60);
            setCode(['', '', '', '', '', '']);
        } catch (err: any) {
            setError(err.message || 'Failed to resend code');
        } finally {
            setIsLoading(false);
        }
    };

    // Step 3 → Step 4: Continue to passkey creation
    const handleContinueToPasskey = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.document) {
            setError('Please fill in all fields');
            return;
        }
        setError('');
        // Pre-select detected ecosystem
        if (!ecosystem) setEcosystem(detectedEcosystem);
        setStep('passkey');
    };

    // Step 4: Complete registration
    const handleRegister = async () => {
        setIsLoading(true);
        setError('');

        try {
            const { credentialId, contractId } = await passkeyClient.register(formData.name);

            const response = await api.post('/investors/register', {
                ...formData,
                registrationToken,
                credentialId,
                contractId,
                passkeyEcosystem: ecosystem || detectedEcosystem,
            });

            if (!response.success) {
                throw new Error(response.error || response.message || 'Registration failed');
            }

            if (response.data?.token) {
                authStorage.setToken(response.data.token, 'investor');
                authStorage.setUser(response.data.investor, 'investor');
            }

            navigate('/registration-success');
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to register');
        } finally {
            setIsLoading(false);
        }
    };

    // ============ STEP 1: Email ============
    if (step === 'email') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
                <div className="w-full max-w-md space-y-8 relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-3xl -z-10" />

                    <div className="text-center space-y-2">
                        <h1 className="text-3xl font-bold tracking-tighter text-white">Join Radox</h1>
                        <p className="text-muted-foreground">Create your Smart Wallet in seconds</p>
                    </div>

                    <Card className="border-slate-800 bg-slate-900/90 backdrop-blur-xl">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <Mail className="w-5 h-5" />
                                Verify Your Email
                            </CardTitle>
                            <CardDescription className="text-slate-400">
                                Step 1 of 4: We'll send you a verification code
                            </CardDescription>
                        </CardHeader>
                        <form onSubmit={handleSendCode}>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-slate-200">Email Address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="john@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="bg-slate-950 border-slate-800 text-white"
                                        autoFocus
                                    />
                                </div>

                                {error && (
                                    <div className="text-sm text-red-400 bg-red-900/20 p-2 rounded">
                                        {error}
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter className="flex flex-col gap-4">
                                <Button
                                    type="submit"
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg"
                                    disabled={isLoading || !email}
                                >
                                    {isLoading ? (
                                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</>
                                    ) : (
                                        'Send Verification Code'
                                    )}
                                </Button>
                                <p className="text-xs text-center text-slate-500">
                                    Already have an account? <a href="/login" className="text-blue-400 hover:underline">Log in</a>
                                </p>
                            </CardFooter>
                        </form>
                    </Card>
                </div>
            </div>
        );
    }

    // ============ STEP 2: Code Verification ============
    if (step === 'code') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
                <div className="w-full max-w-md space-y-8 relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-3xl -z-10" />

                    <div className="text-center space-y-2">
                        <h1 className="text-3xl font-bold tracking-tighter text-white">Check Your Email</h1>
                        <p className="text-muted-foreground">We sent a code to <span className="text-blue-400">{email}</span></p>
                    </div>

                    <Card className="border-slate-800 bg-slate-900/90 backdrop-blur-xl">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-green-400" />
                                Enter Verification Code
                            </CardTitle>
                            <CardDescription className="text-slate-400">
                                Step 2 of 4: Enter the 6-digit code from your email
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex justify-center gap-2" onPaste={handleCodePaste}>
                                {code.map((digit, index) => (
                                    <Input
                                        key={index}
                                        ref={el => { codeInputRefs.current[index] = el; }}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={6}
                                        value={digit}
                                        onChange={(e) => handleCodeChange(index, e.target.value)}
                                        onKeyDown={(e) => handleCodeKeyDown(index, e)}
                                        onPaste={handleCodePaste}
                                        className="w-12 h-14 text-center text-2xl font-bold bg-slate-950 border-slate-700 text-white focus:border-blue-500"
                                        autoFocus={index === 0}
                                    />
                                ))}
                            </div>

                            {error && (
                                <div className="text-sm text-red-400 bg-red-900/20 p-2 rounded text-center">
                                    {error}
                                </div>
                            )}

                            <div className="text-center">
                                <button
                                    type="button"
                                    onClick={handleResendCode}
                                    disabled={resendCooldown > 0 || isLoading}
                                    className="text-sm text-blue-400 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
                                </button>
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-4">
                            <Button
                                onClick={handleVerifyCode}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg"
                                disabled={isLoading || code.some(c => !c)}
                            >
                                {isLoading ? (
                                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying...</>
                                ) : (
                                    'Verify Code'
                                )}
                            </Button>
                            <button
                                type="button"
                                onClick={() => { setStep('email'); setError(''); }}
                                className="text-sm text-slate-400 hover:text-white flex items-center justify-center gap-1"
                            >
                                <ArrowLeft className="w-4 h-4" /> Use a different email
                            </button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        );
    }

    // ============ STEP 3: Profile Details (NEW — separated from passkey) ============
    if (step === 'details') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
                <div className="w-full max-w-md space-y-8 relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-3xl -z-10" />

                    <div className="text-center space-y-2">
                        <div className="flex justify-center mb-2">
                            <div className="p-2 bg-green-500/20 rounded-full">
                                <CheckCircle2 className="w-6 h-6 text-green-400" />
                            </div>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tighter text-white">Email Verified!</h1>
                        <p className="text-muted-foreground">Now let's set up your profile</p>
                    </div>

                    <Card className="border-slate-800 bg-slate-900/90 backdrop-blur-xl">
                        <CardHeader>
                            <CardTitle className="text-white">Your Details</CardTitle>
                            <CardDescription className="text-slate-400">
                                Step 3 of 4: Enter your name and document
                            </CardDescription>
                        </CardHeader>
                        <form onSubmit={handleContinueToPasskey}>
                            <CardContent className="space-y-4">
                                <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-3">
                                    <Mail className="w-5 h-5 text-green-400 flex-shrink-0" />
                                    <span className="text-sm text-green-200">{email}</span>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-slate-200">Full Name</Label>
                                    <Input
                                        id="name"
                                        placeholder="John Doe"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                        className="bg-slate-950 border-slate-800 text-white"
                                        autoFocus
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="document" className="text-slate-200">CPF / Document ID</Label>
                                    <Input
                                        id="document"
                                        placeholder="000.000.000-00"
                                        value={formData.document}
                                        onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                                        required
                                        className="bg-slate-950 border-slate-800 text-white"
                                    />
                                </div>

                                {error && (
                                    <div className="text-sm text-red-400 bg-red-900/20 p-2 rounded">
                                        {error}
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter className="flex flex-col gap-4">
                                <Button
                                    type="submit"
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg"
                                    disabled={!formData.name || !formData.document}
                                >
                                    Continue
                                </Button>
                                <button
                                    type="button"
                                    onClick={() => { setStep('email'); setError(''); setRegistrationToken(''); }}
                                    className="text-sm text-slate-400 hover:text-white flex items-center justify-center gap-1"
                                >
                                    <ArrowLeft className="w-4 h-4" /> Start over
                                </button>
                            </CardFooter>
                        </form>
                    </Card>
                </div>
            </div>
        );
    }

    // ============ STEP 4: Passkey Creation (NEW — dedicated screen) ============
    const activeEcosystem = ecosystem || detectedEcosystem;
    const ecoInfo = ECOSYSTEM_INFO[activeEcosystem];

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
            <div className="w-full max-w-md space-y-8 relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-3xl -z-10" />

                <div className="text-center space-y-2">
                    <div className="flex justify-center mb-2">
                        <div className="p-3 bg-blue-500/20 rounded-full">
                            <Fingerprint className="w-8 h-8 text-blue-400" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tighter text-white">Create Your Passkey</h1>
                    <p className="text-muted-foreground">Your passkey is your wallet key — keep it safe</p>
                </div>

                <Card className="border-slate-800 bg-slate-900/90 backdrop-blur-xl">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <Fingerprint className="w-5 h-5" />
                            Secure Your Wallet
                        </CardTitle>
                        <CardDescription className="text-slate-400">
                            Step 4 of 4: Use biometrics to create your passkey
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Device type selector */}
                        <div className="space-y-3">
                            <Label className="text-slate-200">What devices do you use?</Label>
                            <div className="grid grid-cols-1 gap-2">
                                {([
                                    { id: 'apple' as const, icon: Cloud, label: 'iPhone / Mac', sub: 'Passkey syncs via iCloud' },
                                    { id: 'google' as const, icon: Smartphone, label: 'Android / Chrome', sub: 'Passkey syncs via Google' },
                                    { id: 'other' as const, icon: Key, label: '1Password / Hardware Key', sub: 'Passkey syncs via your vault' },
                                ]).map(({ id, icon: Icon, label, sub }) => (
                                    <button
                                        key={id}
                                        type="button"
                                        onClick={() => setEcosystem(id)}
                                        className={`p-3 rounded-lg border flex items-center gap-3 transition-all text-left ${activeEcosystem === id
                                            ? 'bg-blue-500/20 border-blue-500 text-white'
                                            : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                                            }`}
                                    >
                                        <Icon className="w-5 h-5" />
                                        <div>
                                            <p className="text-sm font-medium">{label}</p>
                                            <p className="text-xs opacity-70">{sub}</p>
                                        </div>
                                        {activeEcosystem === id && detectedEcosystem === id && (
                                            <span className="ml-auto text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">Detected</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Windows Hello WARNING — only shows for windows_local detection or if no ecosystem selected on Windows */}
                        {detectedEcosystem === 'windows_local' && activeEcosystem !== 'google' && activeEcosystem !== 'other' && (
                            <div className="p-4 bg-red-500/10 border border-red-500/40 rounded-lg space-y-2">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm">
                                        <p className="font-semibold text-red-300">Windows stores passkeys locally</p>
                                        <p className="text-red-200/70 text-xs leading-relaxed mt-1">
                                            Windows Hello saves your passkey only on this computer. If this computer is lost or
                                            reset, <strong>your wallet will be permanently inaccessible</strong>.
                                        </p>
                                        <p className="text-red-200/80 text-xs mt-2 font-medium">
                                            → We strongly recommend using <strong>Google Chrome</strong> (signed into your Google account)
                                            or a password manager like <strong>1Password</strong>.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Ecosystem-specific reassurance (for safe ecosystems) */}
                        {!ecoInfo.isRisky && ecoInfo.syncMessage && (
                            <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex items-start gap-3">
                                <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-green-200/80 leading-relaxed">
                                    {ecoInfo.syncMessage}
                                </p>
                            </div>
                        )}

                        {/* Simplified disclaimer */}
                        <p className="text-xs text-slate-500 text-center leading-relaxed">
                            Your passkey uses biometrics (Face ID, Touch ID, or fingerprint) to secure your wallet.
                            Make sure it's saved in a cloud-synced service so you don't lose access.
                        </p>

                        {error && (
                            <div className="text-sm text-red-400 bg-red-900/20 p-2 rounded">
                                {error}
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4">
                        <Button
                            onClick={handleRegister}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating Wallet...</>
                            ) : (
                                'Create Smart Wallet'
                            )}
                        </Button>
                        <button
                            type="button"
                            onClick={() => { setStep('details'); setError(''); }}
                            className="text-sm text-slate-400 hover:text-white flex items-center justify-center gap-1"
                        >
                            <ArrowLeft className="w-4 h-4" /> Back
                        </button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
