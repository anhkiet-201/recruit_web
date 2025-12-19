"use client";

import React, { useState, useRef, useEffect } from "react";
import { LucideIcon, ChevronDown, Check } from "lucide-react";

interface DropdownOption {
    value: string;
    label: string;
    icon?: LucideIcon;
}

interface DropdownProps {
    label?: string;
    icon?: LucideIcon;
    options: DropdownOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    variant?: "default" | "small";
}

export default function Dropdown({
    label,
    icon: Icon,
    options,
    value,
    onChange,
    placeholder = "Select option",
    className = "",
    variant = "default"
}: DropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const py = variant === "small" ? "py-2" : "py-4";
    const px = variant === "small" ? "px-4" : "px-5";
    const rounded = variant === "small" ? "rounded-xl" : "rounded-2xl";

    return (
        <div ref={containerRef} className={`w-full space-y-2 relative ${className}`}>
            {label && (
                <label className="block text-xs font-black text-gray-400 uppercase tracking-[0.15em] ml-2">
                    {label}
                </label>
            )}
            
            <div className="relative">
                {/* Trigger Button */}
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={`
                        flex items-center justify-between w-full bg-white text-gray-900 text-sm font-bold
                        ${rounded} border border-gray-100 shadow-xl shadow-gray-100/50
                        ${px} ${py} transition-all duration-300
                        hover:bg-gray-50 active:scale-[0.98]
                        focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-200
                        ${isOpen ? "ring-4 ring-blue-500/5 border-blue-200 shadow-2xl" : ""}
                    `}
                >
                    <div className="flex items-center gap-3 truncate mr-2">
                        {Icon && <Icon size={variant === "small" ? 16 : 20} className={isOpen ? "text-blue-600" : "text-gray-400"} />}
                        <span className={selectedOption ? "text-gray-900" : "text-gray-400"}>
                            {selectedOption ? selectedOption.label : placeholder}
                        </span>
                    </div>
                    <ChevronDown size={18} className={`text-gray-400 transition-transform duration-300 ${isOpen ? "rotate-180 text-blue-600" : ""}`} />
                </button>

                {/* Dropdown Menu */}
                {isOpen && (
                    <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                        <ul className="max-h-60 overflow-y-auto p-1.5">
                            {options.map((option) => {
                                const isSelected = option.value === value;
                                const OptionIcon = option.icon;
                                return (
                                    <li key={option.value}>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                onChange(option.value);
                                                setIsOpen(false);
                                            }}
                                            className={`
                                                w-full text-left px-4 py-3 text-sm font-bold rounded-[0.9rem]
                                                flex items-center justify-between transition-all group
                                                ${isSelected 
                                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-200" 
                                                    : "text-gray-600 hover:bg-blue-50 hover:text-blue-700"}
                                            `}
                                        >
                                            <div className="flex items-center gap-3">
                                                {OptionIcon && <OptionIcon size={16} />}
                                                <span>{option.label}</span>
                                            </div>
                                            {isSelected && <Check size={16} className="text-white" />}
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}
