"use client";
import { useState } from "react";
import Button from "@/components/ui/Button";
import { CheckCircle, Zap } from "lucide-react";
import ApplyJobDialog from "./ApplyJobDialog";
import { useTranslations } from "next-intl";

interface JobActionSectionProps {
    jobId: string;
    jobTitle?: string;
    jobType?: string;
    isApplied?: boolean;
    onApplySuccess?: () => void;
}

export default function JobActionSection({
    jobId,
    jobTitle,
    jobType = "unskilled",
    isApplied = false,
    onApplySuccess
}: JobActionSectionProps) {
    const t = useTranslations("JobDetail");
    const [isDialogOpen, setIsOpen] = useState(false);

    // Default title fallback if none provided
    const displayTitle = jobTitle || t('position');

    if (isApplied) {
        return (
            <Button
                variant="outline"
                className="w-full bg-green-50 border-green-200 text-green-600 hover:bg-green-50 shadow-green-100 cursor-default py-4"
                icon={CheckCircle}
                disabled
            >
                {t('applied')}
            </Button>
        );
    }

    return (
        <>
            <Button
                icon={Zap}
                className="w-full shadow-xl shadow-blue-200 py-4 text-lg"
                onClick={() => setIsOpen(true)}
            >
                {t('applyNow')}
            </Button>

            <ApplyJobDialog
                jobId={jobId}
                jobTitle={displayTitle}
                jobType={jobType}
                isOpen={isDialogOpen}
                onClose={() => setIsOpen(false)}
                onSuccess={() => {
                    if (onApplySuccess) onApplySuccess();
                    setIsOpen(false);
                }}
            />
        </>
    );
}
