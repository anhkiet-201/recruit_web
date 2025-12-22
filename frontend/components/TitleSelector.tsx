"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Briefcase, Sparkles } from "lucide-react";
import { JobService } from "@/services/jobService";

interface TitleSelectorProps {
    defaultValue?: string;
    value?: string;
    onChange?: (value: string) => void;
}

export default function TitleSelector({ defaultValue = "", value, onChange }: TitleSelectorProps) {
    // Ưu tiên dùng value từ props nếu có (controlled), ngược lại dùng defaultValue
    const [inputValue, setInputValue] = useState(value !== undefined ? value : defaultValue);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Sync input value when prop 'value' changes
    useEffect(() => {
        if (value !== undefined) {
            setInputValue(value);
        }
    }, [value]);

    useEffect(() => {
        // Fetch all available suggestions (titles + tags)
        JobService.getSuggestions().then(setSuggestions).catch(console.error);
    }, []);

    useEffect(() => {
        // Filter based on input
        if (inputValue.trim() === "") {
            setFilteredSuggestions(suggestions.slice(0, 5));
        } else {
            const filtered = suggestions.filter(item => 
                item.toLowerCase().includes(inputValue.toLowerCase())
            );
            setFilteredSuggestions(filtered.slice(0, 8)); // Limit to 8 results
        }
    }, [inputValue, suggestions]);

    useEffect(() => {
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
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
            <input 
                name="title"
                type="text" 
                autoComplete="off"
                value={inputValue}
                onChange={(e) => {
                    const newValue = e.target.value;
                    setInputValue(newValue);
                    if (onChange) onChange(newValue);
                    setIsOpen(true);
                }}
                onFocus={() => setIsOpen(true)}
                placeholder="Tên công việc, vị trí, kỹ năng..." 
                className="w-full pl-12 pr-4 py-4 rounded-xl border-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-transparent"
            />

            {/* Suggestions Dropdown */}
            {isOpen && filteredSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-2 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-gray-400 uppercase px-2 tracking-wider">Đề xuất tìm kiếm</span>
                        <Sparkles size={12} className="text-yellow-500 mr-2" />
                    </div>
                    <ul className="max-h-60 overflow-y-auto">
                        {filteredSuggestions.map((item, index) => (
                            <li key={index}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setInputValue(item);
                                        if (onChange) onChange(item);
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
                                        <Briefcase size={14} className="text-gray-400 group-hover:text-blue-600" />
                                    </div>
                                    <span className="font-medium">{item}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
