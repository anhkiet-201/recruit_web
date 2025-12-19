import React from "react";
import { LucideIcon } from "lucide-react";

interface BadgeProps {
    children: React.ReactNode;
    variant?: "blue" | "green" | "purple" | "red" | "gray" | "yellow";
    icon?: LucideIcon;
    className?: string;
    isDot?: boolean;
}

export default function Badge({
    children,
    variant = "gray",
    icon: Icon,
    className = "",
    isDot = false
}: BadgeProps) {
    const variants = {
        blue: "bg-blue-50 text-blue-700 border-blue-100",
        green: "bg-green-50 text-green-700 border-green-100",
        purple: "bg-purple-50 text-purple-700 border-purple-100",
        red: "bg-red-50 text-red-700 border-red-100",
        gray: "bg-gray-50 text-gray-700 border-gray-100",
        yellow: "bg-yellow-50 text-yellow-700 border-yellow-100",
    };

    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase border tracking-wider ${variants[variant]} ${className}`}>
            {isDot && <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                variant === 'green' ? 'bg-green-500' : 
                variant === 'blue' ? 'bg-blue-500' : 'bg-current'
            }`}></div>}
            {Icon && <Icon size={12} />}
            {children}
        </span>
    );
}