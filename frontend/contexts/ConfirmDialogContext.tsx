"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import ConfirmDialog from "@/components/ConfirmDialog";

interface ConfirmOptions {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDanger?: boolean;
}

interface ConfirmDialogContextType {
    confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmDialogContext = createContext<ConfirmDialogContextType | undefined>(undefined);

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [options, setOptions] = useState<ConfirmOptions>({
        title: "",
        message: "",
        confirmText: "Confirm",
        cancelText: "Cancel",
        isDanger: false,
    });
    const [resolveRef, setResolveRef] = useState<((value: boolean) => void) | null>(null);

    const confirm = useCallback((opts: ConfirmOptions) => {
        setOptions({
            confirmText: "Confirm",
            cancelText: "Cancel",
            isDanger: false,
            ...opts,
        });
        setIsOpen(true);

        return new Promise<boolean>((resolve) => {
            setResolveRef(() => resolve);
        });
    }, []);

    const handleCancel = () => {
        setIsOpen(false);
        if (resolveRef) {
            resolveRef(false);
            setResolveRef(null);
        }
    };

    const handleConfirm = () => {
        setIsOpen(false);
        if (resolveRef) {
            resolveRef(true);
            setResolveRef(null);
        }
    };

    return (
        <ConfirmDialogContext.Provider value={{ confirm }}>
            {children}
            <ConfirmDialog
                isOpen={isOpen}
                onClose={handleCancel}
                onConfirm={handleConfirm}
                title={options.title}
                message={options.message}
                confirmText={options.confirmText}
                cancelText={options.cancelText}
                isDanger={options.isDanger}
            />
        </ConfirmDialogContext.Provider>
    );
}

export function useConfirm() {
    const context = useContext(ConfirmDialogContext);
    if (context === undefined) {
        throw new Error("useConfirm must be used within a ConfirmDialogProvider");
    }
    return context;
}
