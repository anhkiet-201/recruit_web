"use client";
import { useState } from "react";
import { AuthService } from "@/services/auth";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, LogIn, Chrome } from "lucide-react";
import { useTranslations } from "next-intl";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();
    const t = useTranslations("Auth");

    const { refreshProfile } = useAuth();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await AuthService.login(email, password);
            await refreshProfile();
            router.push("/");
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            await AuthService.loginWithGoogle();
            router.push("/");
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className="min-h-[calc(100-64px)] flex items-center justify-center bg-gray-50/50 py-20 px-4">
            <div className="max-w-md w-full">
                <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
                    <div className="p-8 sm:p-10">
                        <div className="text-center mb-10">
                            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
                                <LogIn className="text-white" size={32} />
                            </div>
                            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">{t('loginTitle')}</h2>
                            <p className="text-gray-500 mt-2">{t('loginSubtitle')}</p>
                        </div>

                        <form className="space-y-6" onSubmit={handleLogin}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">{t('emailLabel')}</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Mail size={18} className="text-gray-400" />
                                        </div>
                                        <input
                                            type="email"
                                            required
                                            className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 text-sm transition-all"
                                            placeholder={t('emailPlaceholder')}
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">{t('passwordLabel')}</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Lock size={18} className="text-gray-400" />
                                        </div>
                                        <input
                                            type="password"
                                            required
                                            className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 text-sm transition-all"
                                            placeholder={t('passwordPlaceholder')}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex justify-end mt-2">
                                        <Link href="/forgot-password" title={t('forgotPasswordLink')} className="text-xs text-blue-600 font-bold hover:underline tracking-tight">
                                            {t('forgotPasswordLink')}
                                        </Link>
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
                                className="w-full flex justify-center py-4 px-4 bg-blue-600 text-white text-sm font-bold rounded-2xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all active:scale-[0.98] shadow-lg shadow-blue-100"
                            >
                                {t('loginButton')}
                            </button>
                        </form>

                        <div className="relative my-8">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-100"></div>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white px-4 text-gray-400 font-medium tracking-widest">{t('orContinueWith')}</span>
                            </div>
                        </div>

                        <button
                            onClick={handleGoogleLogin}
                            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 border border-gray-200 rounded-2xl text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 transition-all active:scale-[0.98]"
                        >
                            <Chrome size={20} className="text-red-500" />
                            {t('googleButton')}
                        </button>
                    </div>
                    <div className="p-6 bg-gray-50 border-t border-gray-100 text-center">
                        <p className="text-sm text-gray-500">
                            {t('noAccount')}{" "}
                            <Link href="/register" className="text-blue-600 font-bold hover:underline">
                                {t('registerLink')}
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}