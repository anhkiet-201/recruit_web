"use client";

import { Link, useRouter, usePathname } from "@/i18n/routing";
import { useAuth } from "./AuthProvider";
import Button from "@/components/ui/Button";
import { LogOut, ShieldCheck, User as UserIcon, Menu, X } from "lucide-react";
import Image from "next/image";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import BecomeEmployerDialog from "./BecomeEmployerDialog";
import { UserService } from "@/services/userService";

export default function Navbar() {
  const { user, profile, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("Navigation");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [requestStatus, setRequestStatus] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Close menu when route changes
  useEffect(() => {
    // This effect handles closing the menu when navigating
    const handleRouteChange = () => {
      setIsMenuOpen(false);
    };
    handleRouteChange();
  }, [pathname]);

  useEffect(() => {
    if (user && profile?.role === "candidate") {
      UserService.getEmployerRequestStatus().then((req) => {
        if (req) setRequestStatus(req.status);
      });
    }
  }, [user, profile]);

  const handleLogout = async () => {
    logout();
    router.push("/");
  };

  // Kiểm tra xem có đang ở trang admin không để ẩn nav nếu cần, hoặc thay đổi style
  const isAdminPage = pathname?.includes("/admin");

  if (isAdminPage) return null;

  return (
    <nav className="w-full bg-white/80 backdrop-blur-md border-b border-gray-100/50 transition-all duration-300 h-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          {/* Logo Section */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="relative w-10 h-10 group-hover:scale-110 transition-transform duration-500">
                <Image
                  src="/logo.webp"
                  alt="TTN HR Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="text-xl font-black text-[#9a3709] tracking-tighter group-hover:text-[#0c2251] transition-colors">
                TTN
                <span className="text-[#0c2251]"> HR</span>
              </span>
            </Link>
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-4">
            <LanguageSwitcher />

            {loading ? (
              <div className="flex gap-2">
                <div className="w-20 h-9 bg-gray-100 animate-pulse rounded-xl"></div>
                <div className="w-24 h-9 bg-gray-100 animate-pulse rounded-xl"></div>
              </div>
            ) : user ? (
              <div className="flex items-center gap-3">
                {/* Become Employer Button */}
                {profile?.role === "candidate" && !requestStatus && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex text-blue-600 font-bold"
                    onClick={() => setIsDialogOpen(true)}
                  >
                    Tuyển dụng
                  </Button>
                )}

                {requestStatus === "pending" && (
                  <span className="block px-3 py-1 bg-yellow-50 text-yellow-600 text-[10px] font-black uppercase rounded-lg border border-yellow-100">
                    Đang chờ duyệt
                  </span>
                )}

                {/* Admin Shortcut */}
                {profile?.role === "admin" && (
                  <Link href="/admin">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={ShieldCheck}
                      className="flex text-blue-600 font-black"
                    >
                      Admin
                    </Button>
                  </Link>
                )}

                {/* Profile Shortcut */}
                <Link href="/dashboard">
                  <div className="flex items-center gap-3 pl-3 pr-1 py-1 bg-gray-50 hover:bg-blue-50 rounded-2xl border border-gray-100 transition-all group cursor-pointer">
                    <div className="block">
                      <p className="text-xs font-black text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1 max-w-[100px]">
                        {profile?.name || "Member"}
                      </p>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest text-right">
                        {profile?.role || "Candidate"}
                      </p>
                    </div>
                    <div className="w-9 h-9 bg-white rounded-[0.9rem] flex items-center justify-center border border-gray-100 shadow-sm relative overflow-hidden">
                      {profile?.avatarUrl ? (
                        <Image
                          src={profile.avatarUrl}
                          alt="Avatar"
                          fill
                          className="object-cover"
                          unoptimized
                        />
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
                    {t("login")}
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="shadow-blue-200">{t("register")}</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(true)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-xl"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMenuOpen(false)}
          ></div>
          {/* Drawer Content */}
          <div className="absolute right-0 top-0 bottom-0 w-[80%] max-w-[300px] bg-white shadow-2xl p-6 flex flex-col gap-8 overflow-y-auto animate-in slide-in-from-right duration-200">
            <div className="flex justify-between items-center">
              <span className="text-lg font-black text-gray-900">Menu</span>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex flex-col gap-6">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-gray-500">
                  Language
                </span>
                <LanguageSwitcher />
              </div>

              <div className="h-px bg-gray-100 w-full"></div>

              {loading ? (
                <div className="flex flex-col gap-4">
                  <div className="w-full h-10 bg-gray-100 animate-pulse rounded-xl"></div>
                  <div className="w-full h-10 bg-gray-100 animate-pulse rounded-xl"></div>
                </div>
              ) : user ? (
                <div className="flex flex-col gap-4">
                  <Link href="/dashboard" className="w-full">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-blue-50 rounded-2xl border border-gray-100 transition-all group">
                      <div className="w-10 h-10 bg-white rounded-[0.9rem] flex items-center justify-center border border-gray-100 shadow-sm relative overflow-hidden">
                        {profile?.avatarUrl ? (
                          <Image
                            src={profile.avatarUrl}
                            alt="Avatar"
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <UserIcon size={20} className="text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-black text-gray-900 group-hover:text-blue-600 transition-colors">
                          {profile?.name || "Member"}
                        </p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          {profile?.role || "Candidate"}
                        </p>
                      </div>
                    </div>
                  </Link>

                  {profile?.role === "candidate" && !requestStatus && (
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-blue-600 font-bold"
                      onClick={() => setIsDialogOpen(true)}
                    >
                      Tuyển dụng
                    </Button>
                  )}

                  {requestStatus === "pending" && (
                    <div className="px-4 py-2 bg-yellow-50 text-yellow-600 text-xs font-black uppercase rounded-xl border border-yellow-100 text-center">
                      Đang chờ duyệt
                    </div>
                  )}

                  {profile?.role === "admin" && (
                    <Link href="/admin">
                      <Button
                        variant="ghost"
                        icon={ShieldCheck}
                        className="w-full justify-start text-blue-600 font-black"
                      >
                        Admin
                      </Button>
                    </Link>
                  )}

                  <Button
                    variant="ghost"
                    icon={LogOut}
                    onClick={handleLogout}
                    className="w-full justify-start text-gray-500 hover:text-red-600 hover:bg-red-50"
                  >
                    Logout
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <Link href="/login" className="w-full">
                    <Button
                      variant="ghost"
                      className="w-full text-gray-500 font-black"
                    >
                      {t("login")}
                    </Button>
                  </Link>
                  <Link href="/register" className="w-full">
                    <Button className="w-full shadow-blue-200">
                      {t("register")}
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <BecomeEmployerDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSuccess={() => setRequestStatus("pending")}
      />
    </nav>
  );
}
