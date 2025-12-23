"use client";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import AdminSidebar from "@/components/AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, profile, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push("/login");
            } else if (profile?.role !== "admin") {
                router.push("/");
            }
        }
    }, [user, profile, loading, router]);

    if (loading || !user || profile?.role !== "admin") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-500 font-medium">Verifying admin access...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-gray-50/50">
            <AdminSidebar />
            <main className="flex-1 p-8">
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
