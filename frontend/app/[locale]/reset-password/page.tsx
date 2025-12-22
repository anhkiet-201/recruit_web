"use client";
import { useState, useEffect } from "react";
import { AuthService } from "@/services/auth";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Lock, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";

export default function ResetPasswordPage() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const t = useTranslations("Auth");
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    useEffect(() => {
        if (!token) {
            setError("Invalid reset token. Please request a new one.");
        }
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }
        if (password.length < 6) {
            setError(t('passwordMinLength'));
            return;
        }

        setLoading(true);
        setError("");
        try {
            await AuthService.resetPassword(token as string, password);
            setSuccess(true);
            setTimeout(() => {
                router.push("/login");
            }, 3000);
        } catch (err: any) {
            setError(err.message || "Failed to reset password");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50/50 py-20 px-4">
                <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 sm:p-10 text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="text-green-600" size={40} />
                    </div>
                    <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-4">{t('resetSuccess')}</h2>
                    <p className="text-gray-500 mb-8">Redirecting to login page...</p>
                    <Link href="/login" className="inline-flex items-center gap-2 text-blue-600 font-bold hover:underline">
                        <ArrowLeft size={18} />
                        {t('backToLogin')}
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50/50 py-20 px-4">
            <div className="max-w-md w-full">
                <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
                    <div className="p-8 sm:p-10">
                        <div className="text-center mb-10">
                            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-50">
                                <Lock className="text-blue-600" size={32} />
                            </div>
                            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">{t('resetPasswordTitle')}</h2>
                            <p className="text-gray-500 mt-2">{t('resetPasswordSubtitle')}</p>
                        </div>

                        {!token ? (
                            <div className="text-center py-6">
                                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <AlertCircle className="text-red-600" size={24} />
                                </div>
                                <p className="text-red-600 mb-6">{error}</p>
                                <Link href="/forgot-password" title="Request New Link" className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold">
                                    Request New Link
                                </Link>
                            </div>
                        ) : (
                            <form className="space-y-6" onSubmit={handleSubmit}>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">{t('newPasswordLabel')}</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <Lock size={18} className="text-gray-400" />
                                            </div>
                                            <input
                                                type="password"
                                                required
                                                className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 text-sm transition-all"
                                                placeholder="••••••••"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">{t('confirmPasswordLabel')}</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <Lock size={18} className="text-gray-400" />
                                            </div>
                                            <input
                                                type="password"
                                                required
                                                className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 text-sm transition-all"
                                                placeholder="••••••••"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-3 rounded-xl bg-red-50 text-red-600 text-xs font-medium border border-red-100 animate-in fade-in">
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex justify-center py-4 px-4 bg-blue-600 text-white text-sm font-bold rounded-2xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all active:scale-[0.98] shadow-lg shadow-blue-100 disabled:opacity-50"
                                >
                                    {loading ? "Updating..." : t('resetPasswordButton')}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
