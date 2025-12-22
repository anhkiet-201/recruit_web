"use client";
import { useState } from "react";
import { AuthService } from "@/services/auth";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, User, UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";

export default function RegisterPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();
    const t = useTranslations("Auth");

    const { refreshProfile } = useAuth();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await AuthService.register(email, password, name);
            await AuthService.login(email, password);
            await refreshProfile();
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
                                <UserPlus className="text-white" size={32} />
                            </div>
                            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">{t('registerTitle')}</h2>
                            <p className="text-gray-500 mt-2">{t('registerSubtitle')}</p>
                        </div>

                        <form className="space-y-6" onSubmit={handleRegister}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">{t('nameLabel')}</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <User size={18} className="text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            required
                                            className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 text-sm transition-all"
                                            placeholder={t('namePlaceholder')}
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                        />
                                    </div>
                                </div>
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
                                            placeholder={t('passwordPlaceholder')} // Or passwordMinLength? using passwordPlaceholder for visual
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
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
                                className="w-full flex justify-center py-4 px-4 bg-blue-600 text-white text-sm font-bold rounded-2xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all active:scale-[0.98] shadow-lg shadow-blue-100"
                            >
                                {t('registerButton')}
                            </button>
                        </form>
                    </div>
                    <div className="p-6 bg-gray-50 border-t border-gray-100 text-center">
                        <p className="text-sm text-gray-500">
                            {t('hasAccount')}{" "}
                            <Link href="/login" className="text-blue-600 font-bold hover:underline">
                                {t('loginLink')}
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}