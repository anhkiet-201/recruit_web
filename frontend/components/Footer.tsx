"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

export default function Footer() {
    const pathname = usePathname();
    const t = useTranslations("Footer");
    const isAdminPage = pathname?.startsWith('/admin');

    if (isAdminPage) return null;

    return (
        <footer className="bg-white border-t border-gray-200 mt-auto">
            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                <p className="text-center text-sm text-gray-500">
                    {t('copyright', { year: new Date().getFullYear() })}
                </p>
            </div>
        </footer>
    );
}
