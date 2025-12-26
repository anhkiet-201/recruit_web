"use client";
import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/routing";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { ApplicationService } from "@/services/applicationService";
import Button from "@/components/ui/Button";
import { CheckCircle, Zap } from "lucide-react";
import ApplyJobDialog from "./ApplyJobDialog";
import { useTranslations } from "next-intl";

export default function JobActionSection({
  jobId,
  jobTitle,
  jobType = "unskilled",
}: {
  jobId: string;
  jobTitle?: string;
  jobType?: string;
}) {
  const t = useTranslations("JobDetail");
  const { user, loading: authLoading } = useAuth();
  const [isApplied, setIsApplied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsOpen] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  // Default title fallback if none provided
  const displayTitle = jobTitle || t("position");

  useEffect(() => {
    if (user) {
      ApplicationService.getMyApplications().then((apps) => {
        const applied = apps.some((app) => app.jobId === jobId);
        setIsApplied(applied);
        setLoading(false);
      });
    }
  }, [user, jobId]);

  const showLoading = authLoading || (user && loading);

  if (showLoading) {
    return (
      <div className="w-full h-14 bg-gray-100 animate-pulse rounded-2xl"></div>
    );
  }

  if (isApplied) {
    return (
      <Button
        variant="outline"
        className="w-full bg-green-50 border-green-200 text-green-600 hover:bg-green-50 shadow-green-100 cursor-default py-4"
        icon={CheckCircle}
        disabled
      >
        {t("applied")}
      </Button>
    );
  }

  return (
    <>
      <Button
        icon={Zap}
        className="w-full shadow-xl shadow-blue-200 py-4 text-lg"
        onClick={() => {
          if (!user) {
            router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
            return;
          }
          setIsOpen(true);
        }}
      >
        {t("applyNow")}
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
