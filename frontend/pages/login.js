import { useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Lock, Mail, AlertCircle, Loader2 } from "lucide-react";

const LoginPage = () => {
    const router = useRouter();
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    const validateForm = () => {
        const newErrors = {};

        if (!formData.email) {
            newErrors.email = "Email is required";
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = "Email is invalid";
        }

        if (!formData.password) {
            newErrors.password = "Password is required";
        } else if (formData.password.length < 6) {
            newErrors.password = "Password must be at least 6 characters";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsLoading(true);
        setErrors({});

        try {
            // TODO: Replace with actual API call
            // const response = await api.post('/api/v1/auth/login', formData);
            // localStorage.setItem('token', response.data.token);

            // Mock login for demo
            await new Promise((resolve) => setTimeout(resolve, 1500));

            // Redirect to dashboard
            router.push("/dashboard");
        } catch (error) {
            setErrors({ general: "Invalid email or password" });
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: "" }));
        }
    };

    return (
        <>
            <Head>
                <title>Login | Cashew Forecast AI</title>
            </Head>

            <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-white to-accent/5">
                {/* Background Decorations */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
                </div>

                {/* Login Card */}
                <Card className="glass-card border-none w-full max-w-md relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary" />

                    <CardHeader className="text-center space-y-2 pt-8">
                        {/* Logo/Icon */}
                        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                            <Lock className="h-8 w-8 text-white" />
                        </div>

                        <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
                        <CardDescription>
                            Sign in to access Cashew Forecast AI
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4 px-6 pb-8">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Email Input */}
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => handleInputChange("email", e.target.value)}
                                        placeholder="you@example.com"
                                        className={`w-full pl-10 pr-4 py-3 rounded-lg border ${errors.email
                                                ? "border-accent focus:ring-accent"
                                                : "border-slate-300 focus:ring-primary"
                                            } focus:ring-2 focus:outline-none transition-all bg-white dark:bg-slate-800`}
                                    />
                                </div>
                                {errors.email && (
                                    <p className="mt-1.5 text-sm text-accent flex items-center gap-1">
                                        <AlertCircle className="h-4 w-4" />
                                        {errors.email}
                                    </p>
                                )}
                            </div>

                            {/* Password Input */}
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => handleInputChange("password", e.target.value)}
                                        placeholder="••••••••"
                                        className={`w-full pl-10 pr-4 py-3 rounded-lg border ${errors.password
                                                ? "border-accent focus:ring-accent"
                                                : "border-slate-300 focus:ring-primary"
                                            } focus:ring-2 focus:outline-none transition-all bg-white dark:bg-slate-800`}
                                    />
                                </div>
                                {errors.password && (
                                    <p className="mt-1.5 text-sm text-accent flex items-center gap-1">
                                        <AlertCircle className="h-4 w-4" />
                                        {errors.password}
                                    </p>
                                )}
                            </div>

                            {/* General Error */}
                            {errors.general && (
                                <div className="p-3 bg-accent/10 border border-accent rounded-lg">
                                    <p className="text-sm text-accent flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4" />
                                        {errors.general}
                                    </p>
                                </div>
                            )}

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-6 bg-primary hover:bg-primary/90 text-white font-medium shadow-lg hover:shadow-xl transition-all"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Signing in...
                                    </>
                                ) : (
                                    "Sign In"
                                )}
                            </Button>
                        </form>

                        {/* Footer Links */}
                        <div className="text-center text-sm text-muted-foreground pt-4 border-t">
                            <p>
                                Demo credentials: <br />
                                <span className="font-mono text-xs">admin@cashew.ai / password123</span>
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
};

export default LoginPage;
