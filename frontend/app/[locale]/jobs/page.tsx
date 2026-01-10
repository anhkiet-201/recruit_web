import { JobService } from "@/services/jobService";
import JobFeed from "@/components/JobFeed";
import FilterSidebar from "@/components/FilterSidebar";
import JobSearchBar from "@/components/JobSearchBar";
import { Sparkles, Wand2 } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import { getCompanyInfo } from "@/constants/CompanyConstants";
import { SeoHelper } from "@/utils/SeoHelper";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    title?: string;
    location?: string;
    jobType?: string;
    ai_q?: string;
  }>;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  const { locale } = await params;
  const resolvedParams = await searchParams;
  const t = await getTranslations({ locale, namespace: "JobsPage" });
  const companyInfo = getCompanyInfo(locale);

  // Xác định canonical URL
  let canonicalUrl = `${companyInfo.baseUrl}/jobs`;

  // Nếu có bất kỳ filter nào → self-referencing canonical
  const hasFilters = !!(
    resolvedParams.title ||
    resolvedParams.location ||
    resolvedParams.jobType ||
    resolvedParams.ai_q
  );

  if (hasFilters) {
    const query = new URLSearchParams();
    // Thêm params theo thứ tự alphabet để chuẩn hóa
    if (resolvedParams.ai_q) query.append("ai_q", resolvedParams.ai_q);
    if (resolvedParams.jobType) query.append("jobType", resolvedParams.jobType);
    if (resolvedParams.location)
      query.append("location", resolvedParams.location);
    if (resolvedParams.title) query.append("title", resolvedParams.title);

    canonicalUrl = `${companyInfo.baseUrl}/jobs?${query.toString()}`;
  }

  return SeoHelper.generateSeoMetadata(
    {
      title: t("metaTitle") || "Tuyển dụng việc làm HOT - TTN HR",
      description:
        t("metaDescription") ||
        "Tìm việc làm nhanh chóng, uy tín tại Bình Dương, TP.HCM. Hàng ngàn đầu việc hấp dẫn từ các nhà tuyển dụng hàng đầu.",
      canonicalUrl,
      keywords: [
        "Tuyển dụng",
        "Việc làm",
        "Tìm việc làm",
        "Việc làm Bình Dương",
        "Việc làm TP.HCM",
        "Tuyển dụng nhân sự",
        "TTN HR",
      ],
    },
    locale
  );
}

export default async function JobsPage({ searchParams }: Props) {
  const resolvedParams = await searchParams;
  const isAiSearch = !!resolvedParams.ai_q;
  const t = await getTranslations("JobsPage");

  let jobsData;
  if (isAiSearch) {
    // AI Search returns a paginated response
    jobsData = await JobService.aiSearch(resolvedParams.ai_q!, 1, 9);
  } else {
    jobsData = await JobService.searchJobs({
      ...resolvedParams,
      page: 1,
      limit: 9,
    });
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="bg-white pt-12 pb-20 border-b border-gray-100 relative z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100/50">
              {isAiSearch ? <Wand2 size={14} /> : <Sparkles size={14} />}
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">
                {isAiSearch ? t("aiAnalysis") : t("searchResults")}
              </span>
            </div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">
              {isAiSearch ? (
                <>
                  {t("suggestedResultsFor")}{" "}
                  <span className="text-blue-600">
                    &quot;{resolvedParams.ai_q}&quot;
                  </span>
                </>
              ) : (
                <>
                  {t.rich("foundJobsMatching", {
                    count: jobsData.total,
                    span: (chunks) => (
                      <span className="text-blue-600">{chunks}</span>
                    ),
                  })}
                </>
              )}
            </h1>
          </div>

          <JobSearchBar
            defaultTitle={resolvedParams.ai_q || resolvedParams.title}
            defaultValue={resolvedParams.location}
            currentJobType={resolvedParams.jobType || "all"}
            action="/jobs"
            initialAiMode={isAiSearch}
          />
        </div>
        <div className="absolute top-full left-0 right-0 h-32 bg-linear-to-b from-white to-transparent pointer-events-none"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          <aside className="lg:col-span-1">
            <FilterSidebar />
          </aside>
          <main className="lg:col-span-3">
            <JobFeed initialData={jobsData} filters={resolvedParams} />
          </main>
        </div>
      </div>
    </div>
  );
}
