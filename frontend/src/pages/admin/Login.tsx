import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Loader2, Fingerprint, Wallet } from 'lucide-react';
import { platformAdminsApi } from '@/api/platformAdmins';
import api from '@/api/client';
import { authStorage } from '@/utils/authStorage';
import { connectFreighter, signTransactionWithFreighter } from '@/lib/freighter';

export function AdminLogin() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState<'login' | 'mfa'>('login');
    const [mfaToken, setMfaToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [passkeyLoading, setPasskeyLoading] = useState(false);
    const [freighterLoading, setFreighterLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await platformAdminsApi.login(email, password);
            if (response.success) {
                if (response.mfaRequired && response.data?.mfaToken) {
                    setMfaToken(response.data.mfaToken);
                    setStep('mfa');
                } else if (response.data?.token) {
                    // This case shouldn't happen with the new backend but keeping for compatibility
                    authStorage.setToken(response.data.token, 'admin');
                    authStorage.setUser(response.data.admin, 'admin');
                    navigate('/admin/dashboard');
                }
            } else {
                setError('Login failed. Please check your credentials.');
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyMfa = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Set the temporary mfaToken for the API call (needed if middleware requires it)
            authStorage.setToken(mfaToken, 'admin');

            const response = await platformAdminsApi.verifyMfa(otp, mfaToken);

            if (response.success && response.data) {
                authStorage.setToken(response.data.token, 'admin');
                authStorage.setUser(response.data.admin, 'admin');
                navigate('/admin/dashboard');
            } else {
                setError(response.error || 'Invalid or expired OTP.');
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'MFA verification failed.');
            // If it failed, we usually stay on the MFA screen unless the error is critical
        } finally {
            setLoading(false);
        }
    };

    const handlePasskeyLogin = async () => {
        setError('');
        setPasskeyLoading(true);

        try {
            // Get authentication options
            const optionsResponse = await api.get('/platform-admins/passkey-login');
            const { challenge, rpId, timeout } = optionsResponse.data;

            // Trigger browser passkey authentication
            const credential = await navigator.credentials.get({
                publicKey: {
                    challenge: Uint8Array.from(atob(challenge.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)),
                    rpId,
                    timeout,
                    userVerification: 'required',
                }
            }) as PublicKeyCredential;

            if (!credential) {
                throw new Error('Passkey authentication cancelled');
            }

            // Send credential ID to backend
            const loginResponse = await api.post('/platform-admins/passkey-login', {
                credentialId: credential.id
            });

            if (loginResponse.data.success && loginResponse.data.data) {
                // Use authStorage with explicit 'admin' type for multi-session support
                authStorage.setToken(loginResponse.data.data.token, 'admin');
                authStorage.setUser(loginResponse.data.data.admin, 'admin');
                navigate('/admin/dashboard');
            } else {
                throw new Error(loginResponse.data.error || 'Passkey authentication failed');
            }
        } catch (err: any) {
            console.error('Passkey login error:', err);
            setError(err.message || 'Passkey login failed. Try password login.');
        } finally {
            setPasskeyLoading(false);
        }
    };

    const handleFreighterLogin = async () => {
        setError('');
        setFreighterLoading(true);

        try {
            // 1. Connect to Freighter and get the active public key
            const device = await connectFreighter();
            const publicKey = device.publicKey;

            // 2. Request a challenge transaction XDR from the backend
            const challengeResponse = await platformAdminsApi.freighterChallenge(publicKey);
            if (!challengeResponse.success || !challengeResponse.data) {
                throw new Error(challengeResponse.error || 'Failed to get challenge');
            }

            // 3. Sign the challenge transaction with Freighter
            const { challengeXdr, networkPassphrase } = challengeResponse.data;
            const { signedXdr } = await signTransactionWithFreighter(
                challengeXdr,
                networkPassphrase
            );

            // 4. Verify the signed transaction on the backend and get JWT
            const verifyResponse = await platformAdminsApi.freighterVerify(publicKey, signedXdr);
            if (!verifyResponse.success || !verifyResponse.data) {
                throw new Error(verifyResponse.error || 'Freighter verification failed');
            }

            // 5. Store session and navigate
            authStorage.setToken(verifyResponse.data.token, 'admin');
            authStorage.setUser(verifyResponse.data.admin, 'admin');
            navigate('/admin/dashboard');
        } catch (err: any) {
            console.error('Freighter login error:', err);
            setError(err.response?.data?.error || err.message || 'Freighter login failed.');
        } finally {
            setFreighterLoading(false);
        }
    };


    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <Card className="w-full max-w-md glass-panel border-white/5 bg-white/5">
                <CardHeader className="text-center">
                    <div className="mx-auto w-12 h-12 rounded-full bg-red-600 flex items-center justify-center mb-4">
                        <Shield className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-2xl text-white">Admin Portal</CardTitle>
                    <CardDescription>
                        {step === 'login' ? 'Platform Administrator Access' : 'Security Verification Needed'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {error && (
                        <div className="p-3 bg-red-500/10 text-red-400 rounded-lg border border-red-500/20 text-sm">
                            {error}
                        </div>
                    )}

                    {step === 'login' ? (
                        <>

                            {/* Passkey Login Button */}
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full border-white/10 hover:bg-white/5"
                                onClick={handlePasskeyLogin}
                                disabled={passkeyLoading || loading || freighterLoading}
                            >
                                {passkeyLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Authenticating...
                                    </>
                                ) : (
                                    <>
                                        <Fingerprint className="mr-2 h-4 w-4" />
                                        Login with Passkey
                                    </>
                                )}
                            </Button>

                            {/* Freighter Login Button */}
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full border-white/10 hover:bg-white/5"
                                onClick={handleFreighterLogin}
                                disabled={freighterLoading || loading || passkeyLoading}
                            >
                                {freighterLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Connecting to Freighter...
                                    </>
                                ) : (
                                    <>
                                        <Wallet className="mr-2 h-4 w-4" />
                                        Sign in with Freighter
                                    </>
                                )}
                            </Button>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-white/10" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-slate-950 px-2 text-muted-foreground">or</span>
                                </div>
                            </div>

                            <form onSubmit={handleLogin} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="admin@tokenizadora.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="bg-white/5 border-white/10"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="bg-white/5 border-white/10"
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full bg-red-600 hover:bg-red-700"
                                    disabled={loading || passkeyLoading}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Signing in...
                                        </>
                                    ) : (
                                        'Sign In with Password'
                                    )}
                                </Button>
                            </form>
                        </>
                    ) : (
                        <form onSubmit={handleVerifyMfa} className="space-y-6">
                            <div className="space-y-2 text-center">
                                <p className="text-sm text-muted-foreground">
                                    We've sent a 6-digit verification code to
                                    <br />
                                    <span className="text-white font-medium">{email}</span>
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="otp">Verification Code</Label>
                                <Input
                                    id="otp"
                                    type="text"
                                    placeholder="123456"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    maxLength={6}
                                    required
                                    className="bg-white/5 border-white/10 text-center text-2xl tracking-[0.5em] font-mono"
                                />
                            </div>

                            <div className="space-y-3">
                                <Button
                                    type="submit"
                                    className="w-full bg-red-600 hover:bg-red-700 font-semibold"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Verifying...
                                        </>
                                    ) : (
                                        'Verify & Login'
                                    )}
                                </Button>

                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="w-full text-xs text-muted-foreground"
                                    onClick={() => setStep('login')}
                                    disabled={loading}
                                >
                                    Cancel and try again
                                </Button>
                            </div>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
