"use client";

import React from "react";
import { LucideIcon, ChevronDown } from "lucide-react";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    icon?: LucideIcon;
    error?: string;
    containerClassName?: string;
}

export default function Select({
    label,
    icon: Icon,
    error,
    children,
    containerClassName = "",
    className = "",
    ...props
}: SelectProps) {
    return (
        <div className={`w-full space-y-2 ${containerClassName}`}>
            {label && (
                <label className="block text-xs font-black text-gray-400 uppercase tracking-[0.15em] ml-2">
                    {label}
                </label>
            )}
            <div className="relative group">
                {Icon && (
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-focus-within:text-blue-600 transition-colors z-10">
                        <Icon size={20} />
                    </div>
                )}
                
                <select
                    className={`
                        appearance-none block w-full bg-white text-gray-900 text-sm font-bold
                        rounded-2xl border border-gray-100 shadow-xl shadow-gray-100/50
                        px-5 py-4 pr-12 transition-all duration-300 cursor-pointer
                        focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-200 focus:shadow-2xl focus:shadow-blue-100/50
                        ${Icon ? "pl-14" : ""} 
                        ${error ? "border-red-200 ring-4 ring-red-500/5 shadow-red-50" : ""}
                        ${className}
                    `}
                    {...props}
                >
                    {children}
                </select>

                <div className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-focus-within:text-blue-600 transition-colors">
                    <ChevronDown size={18} />
                </div>
            </div>
            {error && <p className="text-[10px] text-red-600 font-black uppercase tracking-wider ml-2">{error}</p>}
        </div>
    );
}
