import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { passkeyClient } from '@/lib/passkey';
import { api } from '@/lib/api';
import { Building2 } from 'lucide-react';

export function CompanyRegister() {
    const [formData, setFormData] = useState({
        companyName: '',
        email: '',
        legalRepresentative: '',
        address: '',
        phone: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            // 1. Create Passkey AND Deploy Smart Wallet (Client-side via Launchtube)
            const { credentialId, publicKey, contractId } = await passkeyClient.register(formData.companyName);

            // 2. Send to Backend (register company with passkey)
            const response = await api.post('/companies/register', {
                name: formData.companyName,
                email: formData.email,
                legal_representative: formData.legalRepresentative,
                address: formData.address || undefined,
                phone: formData.phone || undefined,
                credentialId,
                publicKey,
                contractId,
            });

            if (!response.success) {
                throw new Error(response.error || 'Registration failed');
            }

            // Redirect to pending approval page (not dashboard)
            navigate('/company/pending-approval');

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to register');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
            <div className="w-full max-w-lg space-y-8 relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-teal-500/20 rounded-full blur-3xl -z-10" />

                <div className="text-center space-y-2">
                    <div className="flex justify-center mb-4">
                        <div className="p-3 bg-teal-500/20 rounded-xl">
                            <Building2 className="w-8 h-8 text-teal-400" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tighter text-white">Company Registration</h1>
                    <p className="text-muted-foreground">Register your company on the platform</p>
                </div>

                <Card className="border-slate-800 bg-slate-900/90 backdrop-blur-xl">
                    <CardHeader>
                        <CardTitle className="text-white">Company Account</CardTitle>
                        <CardDescription className="text-slate-400">
                            Fill in your company details to create an account. After registration, your account will be reviewed by our team.
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleRegister}>
                        <CardContent className="space-y-4">
                            {/* Company Name */}
                            <div className="space-y-2">
                                <Label htmlFor="companyName" className="text-slate-200">Company Name *</Label>
                                <Input
                                    id="companyName"
                                    placeholder="ABC Construction Inc."
                                    value={formData.companyName}
                                    onChange={handleChange}
                                    required
                                    className="bg-slate-950 border-slate-800 text-white"
                                />
                            </div>

                            {/* Email */}
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-slate-200">Corporate Email *</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="contato@empresa.com.br"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    className="bg-slate-950 border-slate-800 text-white"
                                />
                            </div>

                            {/* Legal Representative */}
                            <div className="space-y-2">
                                <Label htmlFor="legalRepresentative" className="text-slate-200">Legal Representative *</Label>
                                <Input
                                    id="legalRepresentative"
                                    placeholder="Full name of the legal representative"
                                    value={formData.legalRepresentative}
                                    onChange={handleChange}
                                    required
                                    className="bg-slate-950 border-slate-800 text-white"
                                />
                            </div>

                            {/* Address (optional) */}
                            <div className="space-y-2">
                                <Label htmlFor="address" className="text-slate-200">Address</Label>
                                <Input
                                    id="address"
                                    placeholder="Company address (optional)"
                                    value={formData.address}
                                    onChange={handleChange}
                                    className="bg-slate-950 border-slate-800 text-white"
                                />
                            </div>

                            {/* Phone (optional) */}
                            <div className="space-y-2">
                                <Label htmlFor="phone" className="text-slate-200">Phone</Label>
                                <Input
                                    id="phone"
                                    placeholder="(00) 00000-0000"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="bg-slate-950 border-slate-800 text-white"
                                />
                            </div>

                            {error && (
                                <div className="text-sm text-red-400 bg-red-900/20 p-2 rounded">
                                    {error}
                                </div>
                            )}

                            <p className="text-xs text-slate-500">
                                By registering, a secure Passkey will be created for your company's wallet.
                            </p>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-4">
                            <Button
                                type="submit"
                                className="w-full bg-teal-600 hover:bg-teal-500 text-white font-semibold shadow-lg shadow-teal-900/20"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Creating Account...' : 'Register Company'}
                            </Button>
                            <p className="text-xs text-center text-slate-500">
                                Already have an account? <a href="/login" className="text-teal-400 hover:underline">Log in</a>
                            </p>
                            <p className="text-xs text-center text-slate-500">
                                Are you an investor? <a href="/register" className="text-blue-400 hover:underline">Register as investor</a>
                            </p>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    );
}
