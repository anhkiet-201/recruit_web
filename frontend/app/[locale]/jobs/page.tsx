import { JobService } from "@/services/jobService";
import JobFeed from "@/components/JobFeed";
import FilterSidebar from "@/components/FilterSidebar";
import JobSearchBar from "@/components/JobSearchBar";
import { Sparkles, Wand2 } from "lucide-react";
import { getTranslations } from "next-intl/server";

export const dynamic = 'force-dynamic';

export default async function JobsPage({
    searchParams,
}: {
    searchParams: Promise<{ title?: string; location?: string; jobType?: string; ai_q?: string }>;
}) {
    const params = await searchParams;
    const isAiSearch = !!params.ai_q;
    const t = await getTranslations("JobsPage");

    let jobsData;
    if (isAiSearch) {
        // AI Search returns a flat array of jobs based on similarity
        const items = await JobService.aiSearch(params.ai_q!);
        jobsData = {
            items,
            total: items.length,
            lastPage: 1
        };
    } else {
        jobsData = await JobService.searchJobs({
            ...params,
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
                                {isAiSearch ? t('aiAnalysis') : t('searchResults')}
                            </span>
                        </div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight">
                            {isAiSearch
                                ? <>{t('suggestedResultsFor')} <span className="text-blue-600">"{params.ai_q}"</span></>
                                : <>{t.rich('foundJobsMatching', {
                                    count: jobsData.total,
                                    span: (chunks) => <span className="text-blue-600">{chunks}</span>
                                })}</>
                            }
                        </h1>
                    </div>

                    <JobSearchBar
                        defaultTitle={params.ai_q || params.title}
                        defaultValue={params.location}
                        currentJobType={params.jobType || "all"}
                        action="/jobs"
                        initialAiMode={isAiSearch}
                    />
                </div>
                <div className="absolute top-full left-0 right-0 h-32 bg-gradient-to-b from-white to-transparent pointer-events-none"></div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                    <aside className="lg:col-span-1">
                        <FilterSidebar />
                    </aside>
                    <main className="lg:col-span-3">
                        <JobFeed initialData={jobsData} filters={params} />
                    </main>
                </div>
            </div>
        </div>
    );
}