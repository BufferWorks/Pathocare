"use client";

import { Suspense, useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Activity, Mail, Lock, ArrowRight, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { signIn, getSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
    const searchParams = useSearchParams();
    const urlError = searchParams.get("error");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (urlError) {
            setError(urlError);
        }
    }, [urlError]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            console.log("Attempting login for:", email.trim());
            const res = await signIn("credentials", {
                redirect: false,
                email: email.trim(),
                password,
            });

            console.log("SignIn response:", res);

            if (res?.error) {
                setError(res.error === "CredentialsSignin" ? "Invalid email or password" : res.error);
                alert("Login Failed: " + res.error);
            } else {
                alert("Login Success! Redirecting...");
                const session: any = await getSession();
                if (session?.user?.role === "SUPER_ADMIN") {
                    router.push("/admin/dashboard");
                } else {
                    router.push("/center/dashboard");
                }
            }
        } catch (err: any) {
            console.error("Login error:", err);
            setError("An error occurred: " + err.message);
            alert("System Error: " + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 relative overflow-hidden">
            {/* Decorative Orbs */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 blur-[120px] rounded-full -mr-48 -mt-48" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/10 blur-[120px] rounded-full -ml-48 -mb-48" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md"
            >
                <div className="glass p-10 rounded-[2.5rem] shadow-2xl relative z-10">
                    <div className="flex flex-col items-center mb-10">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                            <Activity className="text-primary w-8 h-8" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome Back</h1>
                        <p className="text-secondary text-sm">Enter your credentials to access PathoCare</p>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-8 p-4 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-xs font-bold uppercase tracking-tight"
                        >
                            <AlertCircle size={16} />
                            {error}
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold ml-1">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary pointer-events-none" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="name@center.com"
                                    className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-2xl py-3.5 pl-12 pr-4 focus:ring-2 focus:ring-primary/50 transition-all outline-none"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between ml-1">
                                <label className="text-sm font-semibold">Password</label>
                                <Link href="#" className="text-xs text-primary hover:underline font-medium">Forgot Password?</Link>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary pointer-events-none" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-2xl py-3.5 pl-12 pr-4 focus:ring-2 focus:ring-primary/50 transition-all outline-none"
                                    required
                                />
                            </div>
                        </div>

                        <Button type="submit" size="lg" className="w-full py-4 text-lg">
                            Sign In <ArrowRight className="ml-2 w-5 h-5" />
                        </Button>
                    </form>

                    <p className="text-center text-sm text-secondary mt-8">
                        Don't have an account? <Link href="/" className="text-primary font-bold hover:underline">Get started here</Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
        }>
            <LoginForm />
        </Suspense>
    );
}
