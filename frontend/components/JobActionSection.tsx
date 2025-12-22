"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { ApplicationService } from "@/services/applicationService";
import Button from "@/components/ui/Button";
import { CheckCircle, Zap } from "lucide-react";
import ApplyJobDialog from "./ApplyJobDialog";
import { useTranslations } from "next-intl";

export default function JobActionSection({ jobId, jobTitle, jobType = "unskilled" }: { jobId: string; jobTitle?: string; jobType?: string }) {
    const t = useTranslations("JobDetail");
    const { user } = useAuth();
    const [isApplied, setIsApplied] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsOpen] = useState(false);

    // Default title fallback if none provided
    const displayTitle = jobTitle || t('position');

    useEffect(() => {
        if (user) {
            ApplicationService.getMyApplications(user.uid).then((apps) => {
                const applied = apps.some(app => app.jobId === jobId);
                setIsApplied(applied);
                setLoading(false);
            });
        } else {
            setLoading(false);
        }
    }, [user, jobId]);

    if (loading) {
        return <div className="w-full h-14 bg-gray-100 animate-pulse rounded-2xl"></div>;
    }

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
                    setIsApplied(true);
                    setIsOpen(false);
                }}
            />
        </>
    );
}
