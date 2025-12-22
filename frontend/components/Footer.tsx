"use client";

import { usePathname } from "next/navigation";

export default function Footer() {
    const pathname = usePathname();
    const isAdminPage = pathname?.startsWith('/admin');

    if (isAdminPage) return null;

    return (
        <footer className="bg-white border-t border-gray-200 mt-auto">
            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                <p className="text-center text-sm text-gray-500">
                    &copy; {new Date().getFullYear()} RecruitWeb. All rights reserved.
                </p>
            </div>
        </footer>
    );
}
