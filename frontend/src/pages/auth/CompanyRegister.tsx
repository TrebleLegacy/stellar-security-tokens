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
        name: '',
        email: '',
        companyId: '',
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
            // Validate company ID
            if (!formData.companyId || isNaN(parseInt(formData.companyId))) {
                throw new Error('Invalid company ID');
            }

            // 1. Create Passkey AND Deploy Smart Wallet (Client-side via Launchtube)
            const { credentialId, publicKey, contractId } = await passkeyClient.register(formData.name);

            // 2. Send to Backend (register company user with passkey)
            const response = await api.post('/company-users/register-passkey', {
                company_id: parseInt(formData.companyId),
                email: formData.email,
                name: formData.name,
                credentialId,
                publicKey,
                contractId,
            });

            if (!response.success) {
                throw new Error(response.error || 'Registration failed');
            }

            // 3. Store token for immediate login
            if (response.data && response.data.token) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                localStorage.setItem('company', JSON.stringify(response.data.company));
                localStorage.setItem('userType', 'company');
            }

            // Redirect to company dashboard
            navigate('/company/dashboard');

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to register');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
            <div className="w-full max-w-md space-y-8 relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-teal-500/20 rounded-full blur-3xl -z-10" />

                <div className="text-center space-y-2">
                    <div className="flex justify-center mb-4">
                        <div className="p-3 bg-teal-500/20 rounded-xl">
                            <Building2 className="w-8 h-8 text-teal-400" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tighter text-white">Company Registration</h1>
                    <p className="text-muted-foreground">Create your company account with Passkey</p>
                </div>

                <Card className="border-slate-800 bg-slate-900/90 backdrop-blur-xl">
                    <CardHeader>
                        <CardTitle className="text-white">Company User Account</CardTitle>
                        <CardDescription className="text-slate-400">
                            Enter your details to create a company user account with Passkey authentication.
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleRegister}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="companyId" className="text-slate-200">Company ID</Label>
                                <Input
                                    id="companyId"
                                    type="number"
                                    placeholder="Enter your company ID"
                                    value={formData.companyId}
                                    onChange={handleChange}
                                    required
                                    className="bg-slate-950 border-slate-800 text-white"
                                />
                                <p className="text-xs text-slate-500">
                                    Contact your platform administrator to get your company ID
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-slate-200">Full Name</Label>
                                <Input
                                    id="name"
                                    placeholder="John Doe"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    className="bg-slate-950 border-slate-800 text-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-slate-200">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="john@company.com"
                                    value={formData.email}
                                    onChange={handleChange}
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
                                className="w-full bg-teal-600 hover:bg-teal-500 text-white font-semibold shadow-lg shadow-teal-900/20"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Creating Account...' : 'Create Company Account'}
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
