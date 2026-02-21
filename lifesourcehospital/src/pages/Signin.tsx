import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Shield } from 'lucide-react';
import { toast } from 'sonner';
import Logo from "@/assets/logo.svg";
import LogoText from "@/assets/logo-text.svg";

interface LoginForm {
    email: string;
    password: string
}

export default function Signin() {
    const apiURL = import.meta.env.VITE_REACT_APP_BASE_URL;
    const navigate = useNavigate();
    const { handleSubmit } = useForm<LoginForm>();
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const [loginDetails, setLoginDetails] = useState<LoginForm>({
        email: "",
        password: "",
    });

    const { email, password } = loginDetails;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setLoginDetails((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const togglePasswordVisibility = () => {
        setShowPassword((prev) => !prev);
    };

    const onSubmit = async () => {
        setIsLoading(true);
        setErrorMessage(null);

        const url = `${apiURL}/auth/login`;

        try {
            const response = await axios.post(url, loginDetails);
            console.log(response.data.data, "response");

            const accessToken = response.data.data.accessToken;
            localStorage.setItem("hospitalToken", accessToken);

            navigate("/dashboard");
        } catch (error) {
            console.error("Login error:", error);
            setErrorMessage("Login failed. Please check your credentials.");
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
            <div className="w-full max-w-md space-y-6">
                <div className="text-center space-y-2">
                    <div className="flex justify-center items-center gap-3">
                        <img src={Logo} alt="LifeSource" className="w-16 h-16" />
                        <img src={LogoText} alt="LifeSource" className="w-[120px]" />
                    </div>
                    <p className="text-muted-foreground">
                        Hospital Blood Bank Management System
                    </p>
                </div>

                <Card className="shadow-lg border-secondary/20">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl text-center">Welcome Back</CardTitle>
                        <CardDescription className="text-center">
                            Sign in to manage your blood bank operations
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="admin@hospital.com"
                                    value={email}
                                    name='email'
                                    onChange={handleChange}
                                    required
                                    className="border-secondary/30 focus:border-secondary"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    name='password'
                                    onChange={handleChange}
                                    required
                                    className="border-secondary/30 focus:border-secondary"
                                />
                            </div>
                            <Button type="submit" className="w-full bg-secondary hover:bg-secondary/90" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Sign In
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <div className="text-center text-sm text-muted-foreground">
                    <div className="flex items-center justify-center gap-1 mb-2">
                        <Shield className="w-4 h-4 text-secondary" />
                        <span>Secure & HIPAA Compliant</span>
                    </div>
                    <p>Your data is protected with enterprise-grade security</p>
                </div>
            </div>
        </div>
    );
}
