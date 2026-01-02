"use client";

import { createPortal } from "react-dom";
import { Link } from "@/i18n/routing";
import { LogOut, ShieldCheck, User as UserIcon, X } from "lucide-react";
import Image from "next/image";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import Button from "@/components/ui/Button";
import { UserProfile } from "@/models/User";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  profile: UserProfile | null;
  loading: boolean;
  logout: () => void;
  requestStatus: string | null;
  setIsDialogOpen: (open: boolean) => void;
  t: (key: string) => string;
}

export default function MobileMenu({
  isOpen,
  onClose,
  user,
  profile,
  loading,
  logout,
  requestStatus,
  setIsDialogOpen,
  t,
}: MobileMenuProps) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-9999 lg:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      {/* Drawer Content */}
      <div className="absolute right-0 top-0 bottom-0 w-[80%] max-w-[300px] bg-white shadow-2xl p-6 flex flex-col gap-8 overflow-y-auto animate-in slide-in-from-right duration-200">
        <div className="flex justify-between items-center">
          <span className="text-lg font-black text-gray-900">Menu</span>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-gray-500">Language</span>
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
              <Link href="/dashboard" className="w-full" onClick={onClose}>
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
                  onClick={() => {
                    onClose();
                    setIsDialogOpen(true);
                  }}
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
                <Link href="/admin" onClick={onClose}>
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
                onClick={() => {
                  onClose();
                  logout();
                }}
                className="w-full justify-start text-gray-500 hover:text-red-600 hover:bg-red-50"
              >
                Logout
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <Link href="/login" className="w-full" onClick={onClose}>
                <Button
                  variant="ghost"
                  className="w-full text-gray-500 font-black"
                >
                  {t("login")}
                </Button>
              </Link>
              <Link href="/register" className="w-full" onClick={onClose}>
                <Button className="w-full shadow-blue-200">
                  {t("register")}
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
