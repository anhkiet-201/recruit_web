"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface DialogProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
}

export default function Dialog({
    isOpen,
    onClose,
    title,
    children,
    maxWidth = "md"
}: DialogProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
        return () => setMounted(false);
    }, []);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    if (!mounted || !isOpen) return null;

    const maxWidthClass = {
        sm: "max-w-sm",
        md: "max-w-md",
        lg: "max-w-lg",
        xl: "max-w-xl",
        "2xl": "max-w-2xl",
    }[maxWidth];

    const dialogContent = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200">
            <div 
                className={`bg-white rounded-[2rem] shadow-2xl w-full ${maxWidthClass} overflow-hidden transform transition-all scale-100 border border-gray-100 animate-in zoom-in-95 duration-200 relative`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header if title exists */}
                {title && (
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                        <h3 className="text-lg font-black text-gray-900 tracking-tight">{title}</h3>
                        <button 
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl p-2 transition-all"
                        >
                            <X size={20} />
                        </button>
                    </div>
                )}

                {/* Close button if no title (absolute) */}
                {!title && (
                    <button 
                        onClick={onClose}
                        className="absolute top-4 right-4 z-10 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl p-2 transition-all"
                    >
                        <X size={20} />
                    </button>
                )}

                {children}
            </div>
        </div>
    );

    return createPortal(dialogContent, document.body);
}
