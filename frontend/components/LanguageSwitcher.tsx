"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import { ChangeEvent, useState, useTransition, useRef, useEffect } from "react";
import { Globe, Check } from "lucide-react";

export default function LanguageSwitcher() {
    const [isPending, startTransition] = useTransition();
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const languages = [
        { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
        { code: 'en', label: 'English', flag: '🇺🇸' },
        { code: 'zh', label: '中文', flag: '🇨🇳' },
    ];

    const handleSelect = (nextLocale: string) => {
        setIsOpen(false);
        startTransition(() => {
            // With next-intl/navigation, we just pass the new locale and pathname
            // It automatically handles the prefixing logic (including as-needed)
            router.replace({ pathname }, { locale: nextLocale });
        });
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const currentLang = languages.find(l => l.code === locale) || languages[0];

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors text-sm font-bold text-gray-700"
            >
                <Globe size={18} className="text-gray-500" />
                <span className="hidden sm:inline">{currentLang.label}</span>
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-40 bg-white rounded-xl shadow-xl border border-gray-100 p-1 z-50 animate-in fade-in slide-in-from-top-2">
                    {languages.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => handleSelect(lang.code)}
                            disabled={isPending}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-bold flex items-center justify-between transition-colors ${locale === lang.code
                                ? 'bg-blue-50 text-blue-700'
                                : 'text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            <span className="flex items-center gap-2">
                                <span>{lang.flag}</span>
                                {lang.label}
                            </span>
                            {locale === lang.code && <Check size={14} />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
