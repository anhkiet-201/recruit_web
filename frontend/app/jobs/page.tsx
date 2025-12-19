import { JobService } from "@/services/jobService";
import JobFeed from "@/components/JobFeed";
import FilterSidebar from "@/components/FilterSidebar";
import JobSearchBar from "@/components/JobSearchBar";
import { Sparkles } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function JobsPage({
    searchParams,
}: {
    searchParams: Promise<{ title?: string; location?: string; jobType?: string }>;
}) {
    const params = await searchParams;
    
    const jobsData = await JobService.searchJobs({
        ...params,
        page: 1,
        limit: 9,
    });

    return (
        <div className="min-h-screen">
            {/* 1. SEARCH HEADER AREA - Seamless Transition */}
            <div className="bg-white pt-12 pb-20 relative z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-12 text-center">
                        <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100/50">
                            <Sparkles size={14} className="fill-blue-600" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Kết quả tìm kiếm</span>
                        </div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight">
                            Tìm thấy <span className="text-blue-600">{jobsData.total}</span> công việc phù hợp
                        </h1>
                    </div>

                    <JobSearchBar 
                        defaultTitle={params.title} 
                        defaultValue={params.location} 
                        currentJobType={params.jobType || "all"}
                        action="/jobs"
                    />
                </div>
                {/* The Soft Melt */}
                <div className="absolute top-full left-0 right-0 h-32 bg-gradient-to-b from-white to-transparent pointer-events-none"></div>
            </div>

            {/* 2. CONTENT AREA */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                    
                    {/* Left Column: Sidebar (Simplified) */}
                    <aside className="lg:col-span-1">
                        <FilterSidebar />
                    </aside>

                    {/* Right Column: Job List */}
                    <main className="lg:col-span-3">
                        <JobFeed initialData={jobsData} filters={params} />
                    </main>
                </div>
            </div>
        </div>
    );
}
