"use client";

import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
    noPadding?: boolean;
}

export function Card({ children, className = "", noPadding = false, ...props }: CardProps) {
    return (
        <div 
            className={`bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden ${className}`}
            {...props}
        >
            <div className={noPadding ? "" : "p-6 sm:p-8"}>
                {children}
            </div>
        </div>
    );
}

export function CardHeader({ title, subtitle, action, className = "" }: { title: string; subtitle?: string; action?: React.ReactNode; className?: string }) {
    return (
        <div className={`px-8 py-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/30 ${className}`}>
            <div>
                <h3 className="text-xl font-black text-gray-900 tracking-tight">{title}</h3>
                {subtitle && <p className="text-sm text-gray-500 mt-1 font-medium">{subtitle}</p>}
            </div>
            {action && <div>{action}</div>}
        </div>
    );
}

export function CardFooter({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`px-8 py-5 bg-gray-50/50 border-t border-gray-100 ${className}`}>
            {children}
        </div>
    );
}