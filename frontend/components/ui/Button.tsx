"use client";

import React from "react";
import { LucideIcon } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
    size?: "sm" | "md" | "lg";
    icon?: LucideIcon;
    isLoading?: boolean;
    children: React.ReactNode;
}

export default function Button({
    variant = "primary",
    size = "md",
    icon: Icon,
    isLoading = false,
    className = "",
    children,
    disabled,
    ...props
}: ButtonProps) {
    const baseStyles = "inline-flex items-center justify-center font-bold transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100";
    
    const variants = {
        primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-xl shadow-blue-100 border border-transparent",
        secondary: "bg-gray-900 text-white hover:bg-black shadow-xl border border-transparent",
        outline: "bg-white text-gray-700 border border-gray-100 shadow-xl hover:bg-gray-50",
        danger: "bg-red-600 text-white hover:bg-red-700 shadow-xl shadow-red-100 border border-transparent",
        ghost: "bg-transparent text-gray-600 hover:bg-gray-100 border border-transparent shadow-none",
    };

    const sizes = {
        sm: "px-4 py-2 text-xs rounded-xl gap-1.5",
        md: "px-6 py-2.5 text-sm rounded-2xl gap-2",
        lg: "px-8 py-3.5 text-base rounded-[1.5rem] gap-2.5",
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            ) : Icon && (
                <Icon size={size === "sm" ? 16 : 20} className={variant === "outline" ? "text-blue-600" : "text-current"} />
            )}
            {children}
        </button>
    );
}
