"use client";

import { useState, useEffect, useRef } from "react";
import { MapPin, Search } from "lucide-react";
import { JobService } from "@/services/jobService";
import { useTranslations } from "next-intl";

interface LocationSelectorProps {
    defaultValue?: string;
}

export default function LocationSelector({ defaultValue = "" }: LocationSelectorProps) {
    const t = useTranslations("JobSearchBar");
    const [inputValue, setInputValue] = useState(defaultValue);
    const [locations, setLocations] = useState<string[]>([]);
    const [filteredLocations, setFilteredLocations] = useState<string[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Fetch all available locations once
        JobService.getLocations().then(setLocations).catch(console.error);
    }, []);

    useEffect(() => {
        // Filter locations based on input
        if (inputValue.trim() === "") {
            setFilteredLocations(locations.slice(0, 5)); // Show first 5 if empty
        } else {
            const filtered = locations.filter(loc =>
                loc.toLowerCase().includes(inputValue.toLowerCase())
            );
            setFilteredLocations(filtered);
        }
    }, [inputValue, locations]);

    useEffect(() => {
        // Handle click outside to close dropdown
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div ref={containerRef} className="flex-1 relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
            <input
                name="location"
                type="text"
                autoComplete="off"
                value={inputValue}
                onChange={(e) => {
                    setInputValue(e.target.value);
                    setIsOpen(true);
                }}
                onFocus={() => setIsOpen(true)}
                placeholder={t('locationPlaceholder')}
                className="w-full pl-12 pr-4 py-4 rounded-xl border-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-transparent"
            />

            {/* Suggestions Dropdown */}
            {isOpen && filteredLocations.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-2 border-b border-gray-50 bg-gray-50/50">
                        <span className="text-[10px] font-bold text-gray-400 uppercase px-2 tracking-wider">{t('locationSuggestionsTitle')}</span>
                    </div>
                    <ul className="max-h-60 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        {filteredLocations.map((loc, index) => (
                            <li key={index}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setInputValue(loc);
                                        setIsOpen(false);
                                        // Auto submit parent form
                                        setTimeout(() => {
                                            const form = containerRef.current?.closest('form');
                                            if (form) form.requestSubmit();
                                        }, 10);
                                    }}
                                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-3 transition-colors group"
                                >
                                    <div className="p-1.5 bg-gray-100 rounded-lg group-hover:bg-blue-100 transition-colors">
                                        <MapPin size={14} className="text-gray-400 group-hover:text-blue-600" />
                                    </div>
                                    <span className="font-medium">{loc}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
