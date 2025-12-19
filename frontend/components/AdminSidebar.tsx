"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Briefcase, FileText, Users, Settings, LogOut } from "lucide-react";

export default function AdminSidebar() {
    const pathname = usePathname();

    const menuItems = [
        { name: "Overview", href: "/admin", icon: LayoutDashboard },
        { name: "Jobs", href: "/admin/jobs", icon: Briefcase },
        { name: "Applications", href: "/admin/applications", icon: FileText },
        { name: "Users", href: "/admin/users", icon: Users },
        // { name: "Settings", href: "/admin/settings", icon: Settings },
    ];

    return (
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
            <div className="p-6 border-b border-gray-100 flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-xl">A</span>
                </div>
                <h2 className="text-xl font-bold text-gray-800 tracking-tight">Admin Portal</h2>
            </div>
            
            <nav className="flex-1 px-4 py-6 space-y-1">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
                    const Icon = item.icon;
                    
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-2xl transition-all duration-200 ${
                                isActive
                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-100 -translate-x-1"
                                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                            }`}
                        >
                            <Icon size={20} className={isActive ? "text-white" : "text-gray-400"} />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-gray-100">
                <div className="flex items-center gap-3 px-4 py-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                        AD
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-700">Admin User</p>
                        <p className="text-xs text-gray-500">admin@example.com</p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
