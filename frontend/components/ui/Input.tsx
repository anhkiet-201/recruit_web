"use client";

import React from "react";
import { LucideIcon } from "lucide-react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
    label?: string;
    icon?: LucideIcon;
    error?: string;
    isTextArea?: boolean;
    helperText?: React.ReactNode;
    rows?: number;
    inputClassName?: string;
}

export default function Input({
    label,
    icon: Icon,
    error,
    isTextArea = false,
    helperText,
    rows,
    className = "",
    inputClassName = "",
    ...props
}: InputProps) {
    const Component = isTextArea ? "textarea" : "input";

    return (
        <div className={`w-full space-y-2 ${className}`}>
            {label && (
                <label className="block text-xs font-black text-gray-400 uppercase tracking-[0.15em] ml-2">
                    {label}
                </label>
            )}
            <div className="relative group">
                {Icon && (
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-focus-within:text-blue-600 transition-colors">
                        <Icon size={20} />
                    </div>
                )}
                <Component
                    className={`
                        block w-full bg-white text-gray-900 text-sm font-medium
                        rounded-2xl border-none shadow-xl shadow-gray-100/50
                        px-5 py-4 transition-all duration-300
                        placeholder:text-gray-300 placeholder:font-bold
                        focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:bg-white focus:shadow-2xl focus:shadow-blue-100/50
                        ${Icon ? "pl-14" : ""} 
                        ${error ? "ring-4 ring-red-500/5 shadow-red-50" : ""}
                        ${props.readOnly ? "bg-gray-50/50 shadow-none cursor-default" : ""}
                        ${inputClassName}
                    `}
                    {...(props as any)}
                />
            </div>
            {error && <p className="text-[10px] text-red-600 font-black uppercase tracking-wider ml-2">{error}</p>}
            {helperText && <div className="ml-2">{helperText}</div>}
        </div>
    );
}