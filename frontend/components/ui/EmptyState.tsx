"use client";

import { LucideIcon, Search } from "lucide-react";
import Button from "./Button";

interface EmptyStateProps {
    title: string;
    description?: string;
    icon?: LucideIcon;
    actionLabel?: string;
    onAction?: () => void;
}

export default function EmptyState({ 
    title, 
    description, 
    icon: Icon = Search, 
    actionLabel, 
    onAction 
}: EmptyStateProps) {
    return (
        <div className="py-20 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center">
            <div className="p-4 bg-gray-50 rounded-2xl text-gray-200 mb-4">
                <Icon size={48} />
            </div>
            <h3 className="text-xl font-black text-gray-900 tracking-tight">{title}</h3>
            {description && <p className="text-gray-400 font-medium mt-2 max-w-xs mx-auto">{description}</p>}
            {actionLabel && onAction && (
                <Button className="mt-6" variant="outline" onClick={onAction}>
                    {actionLabel}
                </Button>
            )}
        </div>
    );
}
