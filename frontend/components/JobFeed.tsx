"use client";

import { useEffect, useState } from "react";
import { Job } from "@/models/Job";
import JobCard from "@/components/JobCard";
import { useAuth } from "@/components/AuthProvider";
import { ApplicationService } from "@/services/applicationService";
import { JobService } from "@/services/jobService";
import { ChevronDown, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";

interface JobFeedProps {
  initialData: { items: Job[]; total: number; lastPage: number };
  filters: { title?: string; location?: string; ai_q?: string };
}

export default function JobFeed({ initialData, filters }: JobFeedProps) {
  const t = useTranslations("HomePage");
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>(initialData.items);
  const [appliedJobIds, setAppliedJobIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(page < initialData.lastPage);
  const [loadingMore, setLoadingMore] = useState(false);

  // Reset when initial data (from server search) changes
  useEffect(() => {
    setJobs(initialData.items);
    setPage(1);
    setHasMore(1 < initialData.lastPage);
  }, [initialData]);

  useEffect(() => {
    if (user) {
      ApplicationService.getMyApplications()
        .then((apps) => setAppliedJobIds(apps.map((app) => app.jobId)))
        .catch(console.error);
    } else {
      setAppliedJobIds([]);
    }
  }, [user]);

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      let result: { items: Job[]; total: number; lastPage: number };
      if (filters.ai_q) {
        result = await JobService.aiSearch(filters.ai_q, nextPage, 6);
      } else {
        result = await JobService.searchJobs({
          ...filters,
          page: nextPage,
          limit: 6,
        });
      }

      setJobs((prev) => [...prev, ...result.items]);
      setPage(nextPage);
      setHasMore(nextPage < result.lastPage);
    } catch (error) {
      console.error("Failed to load more jobs", error);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 md:gap-8">
        {jobs.length > 0 ? (
          jobs.map((job, index) => (
            <JobCard
              key={job.id}
              job={job}
              isApplied={appliedJobIds.includes(job.id)}
              priority={index < 3} // Priority for top 3 jobs
            />
          ))
        ) : (
          <div className="col-span-full text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
            <p className="text-gray-400 font-medium">{t("noJobsFound")}</p>
          </div>
        )}
      </div>

      {hasMore && (
        <div className="flex justify-center">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="group flex items-center gap-3 px-8 py-4 bg-white border border-gray-200 shadow-sm text-sm font-bold text-gray-700 rounded-2xl hover:bg-gray-50 hover:text-blue-600 hover:border-blue-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingMore ? (
              <>
                <RefreshCw size={18} className="animate-spin text-blue-600" />
                {t("loadingMore")}
              </>
            ) : (
              <>
                {t("loadMore")}
                <ChevronDown
                  size={18}
                  className="group-hover:translate-y-0.5 transition-transform"
                />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
