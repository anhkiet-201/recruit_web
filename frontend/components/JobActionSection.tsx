"use client";
import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import Button from "@/components/ui/Button";
import { CheckCircle, Zap } from "lucide-react";
import ApplyJobDialog from "./ApplyJobDialog";
import { useTranslations } from "next-intl";

interface JobActionSectionProps {
  jobId: string;
  jobTitle?: string;
  jobType?: string;
  isApplied: boolean;
  onApplySuccess: () => void;
  isLoading?: boolean;
}

export default function JobActionSection({
  jobId,
  jobTitle,
  jobType = "unskilled",
  isApplied,
  onApplySuccess,
  isLoading = false,
}: JobActionSectionProps) {
  const t = useTranslations("JobDetail");
  const { user, loading: authLoading } = useAuth();
  const [isDialogOpen, setIsOpen] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  // Default title fallback if none provided
  const displayTitle = jobTitle || t("position");

  const showLoading = authLoading || isLoading;

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
          onApplySuccess();
          setIsOpen(false);
        }}
      />
    </>
  );
}
