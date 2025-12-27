"use client";

import Link from "next/link";
import { useAuth } from "./AuthProvider";
import { useRouter, usePathname } from "next/navigation";
import Button from "@/components/ui/Button";
import { LogOut, ShieldCheck, User as UserIcon, Briefcase, Menu, X } from "lucide-react";
import Image from "next/image";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useTranslations } from "next-intl";
import { useState } from "react";

export default function Navbar() {
    const { user, profile, loading, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const t = useTranslations("Navigation");
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleLogout = async () => {
        logout();
        setIsMenuOpen(false);
        router.push("/");
    };

    // Check if on admin page to hide nav if needed, or change style
    const isAdminPage = pathname?.includes('/admin');

    if (isAdminPage) return null;

    return (
        <nav className="sticky top-0 z-[100] w-full bg-white/70 backdrop-blur-xl border-b border-gray-100/50 transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-20">

                    {/* Logo Section */}
                    <div className="flex items-center">
                        <Link href="/" className="flex items-center gap-2.5 group">
                            <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform duration-500">
                                <Briefcase className="text-white" size={20} />
                            </div>
                            <span className="text-xl font-black text-gray-900 tracking-tighter group-hover:text-blue-600 transition-colors">
                                Recruit<span className="text-blue-600">Web</span>
                            </span>
                        </Link>
                    </div>

                    {/* Desktop Right Action Section */}
                    <div className="hidden lg:flex items-center gap-4">
                        <LanguageSwitcher />

                        {loading ? (
                            <div className="flex gap-2">
                                <div className="w-20 h-9 bg-gray-100 animate-pulse rounded-xl"></div>
                                <div className="w-24 h-9 bg-gray-100 animate-pulse rounded-xl"></div>
                            </div>
                        ) : user ? (
                            <div className="flex items-center gap-3">
                                {/* Admin Shortcut */}
                                {profile?.role === 'admin' && (
                                    <Link href="/admin">
                                        <Button variant="ghost" size="sm" icon={ShieldCheck} className="hidden sm:flex text-blue-600 font-black">
                                            Admin
                                        </Button>
                                    </Link>
                                )}

                                {/* Profile Shortcut */}
                                <Link href="/dashboard">
                                    <div className="flex items-center gap-3 pl-3 pr-1 py-1 bg-gray-50 hover:bg-blue-50 rounded-2xl border border-gray-100 transition-all group cursor-pointer">
                                        <div className="hidden sm:block">
                                            <p className="text-xs font-black text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1 max-w-[100px]">
                                                {profile?.name || "Member"}
                                            </p>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                                                {profile?.role || "Candidate"}
                                            </p>
                                        </div>
                                        <div className="w-9 h-9 bg-white rounded-[0.9rem] flex items-center justify-center border border-gray-100 shadow-sm relative overflow-hidden">
                                            {profile?.avatarUrl ? (
                                                <Image src={profile.avatarUrl} alt="Avatar" fill className="object-cover" unoptimized />
                                            ) : (
                                                <UserIcon size={18} className="text-gray-400" />
                                            )}
                                        </div>
                                    </div>
                                </Link>

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    icon={LogOut}
                                    onClick={handleLogout}
                                    className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl"
                                />
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <Link href="/login">
                                    <Button variant="ghost" className="text-gray-500 font-black">
                                        {t('login')}
                                    </Button>
                                </Link>
                                <Link href="/register">
                                    <Button className="shadow-blue-200">
                                        {t('register')}
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="flex items-center lg:hidden gap-3">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
                            aria-label="Toggle menu"
                        >
                            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Drawer */}
            {isMenuOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                        onClick={() => setIsMenuOpen(false)}
                    />
                    {/* Drawer */}
                    <div className="fixed top-0 right-0 h-full w-[280px] bg-white z-50 shadow-2xl p-6 flex flex-col gap-6 lg:hidden animate-in slide-in-from-right duration-300">
                        <div className="flex justify-between items-center mb-4">
                             <span className="text-xl font-black text-gray-900 tracking-tighter">
                                Recruit<span className="text-blue-600">Web</span>
                            </span>
                            <button
                                onClick={() => setIsMenuOpen(false)}
                                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex flex-col gap-4 flex-1">
                            <div className="flex justify-center mb-4">
                                <LanguageSwitcher />
                            </div>

                            {loading ? (
                                <div className="space-y-3">
                                    <div className="h-10 bg-gray-100 rounded-xl animate-pulse"></div>
                                    <div className="h-10 bg-gray-100 rounded-xl animate-pulse"></div>
                                </div>
                            ) : user ? (
                                <div className="flex flex-col gap-3">
                                    {/* Profile Info */}
                                    <Link href="/dashboard" onClick={() => setIsMenuOpen(false)}>
                                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-gray-100 shadow-sm relative overflow-hidden shrink-0">
                                                {profile?.avatarUrl ? (
                                                    <Image src={profile.avatarUrl} alt="Avatar" fill className="object-cover" unoptimized />
                                                ) : (
                                                    <UserIcon size={20} className="text-gray-400" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-gray-900 line-clamp-1">
                                                    {profile?.name || "Member"}
                                                </p>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                    {profile?.role || "Candidate"}
                                                </p>
                                            </div>
                                        </div>
                                    </Link>

                                    {profile?.role === 'admin' && (
                                        <Link href="/admin" onClick={() => setIsMenuOpen(false)}>
                                            <Button variant="ghost" className="w-full justify-start text-blue-600 font-black" icon={ShieldCheck}>
                                                Admin Dashboard
                                            </Button>
                                        </Link>
                                    )}

                                    <Button
                                        variant="ghost"
                                        icon={LogOut}
                                        onClick={handleLogout}
                                        className="w-full justify-start text-gray-500 hover:text-red-600 hover:bg-red-50"
                                    >
                                        {t('logout') || 'Log Out'}
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                                        <Button variant="ghost" className="w-full justify-center text-gray-500 font-black">
                                            {t('login')}
                                        </Button>
                                    </Link>
                                    <Link href="/register" onClick={() => setIsMenuOpen(false)}>
                                        <Button className="w-full justify-center shadow-blue-200">
                                            {t('register')}
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </nav>
    );
}
