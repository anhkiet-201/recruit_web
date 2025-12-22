import { JobService } from "@/services/jobService";
import JobFeed from "@/components/JobFeed";
import JobCard from "@/components/JobCard";
import { Search, Briefcase, Users, Building2, MapPin, TrendingUp, Flame, Sparkles, Zap, Award, GraduationCap } from "lucide-react";
import Link from "next/link";
import JobSearchBar from "@/components/JobSearchBar";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";

export const dynamic = 'force-dynamic';

export default async function HomePage({
    searchParams,
}: {
    searchParams: Promise<{ title?: string; location?: string; jobType?: string }>;
}) {
    const params = await searchParams;
    const currentJobType = params.jobType || 'all';
    const t = await getTranslations("HomePage");

    const [jobsData, trendingJobs, hotJobs] = await Promise.all([
        JobService.searchJobs({ ...params, page: 1, limit: 6 }),
        JobService.getTrendingJobs(3),
        JobService.getHotJobs(3)
    ]);

    const getFilterUrl = (type: string) => {
        const query = new URLSearchParams();
        if (params.title) query.append('title', params.title);
        if (params.location) query.append('location', params.location);
        if (type !== 'all') query.append('jobType', type);
        return `/?${query.toString()}`;
    };

    const isSearching = !!(params.title || params.location);

    return (
        <div className="flex flex-col min-h-screen">

            {/* 1. HERO SECTION - Explicit White */}
            <header className="relative bg-white pt-20 pb-32 z-30">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[500px] h-[500px] bg-blue-50/50 rounded-full blur-[100px] opacity-50"></div>
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[500px] h-[500px] bg-indigo-50/50 rounded-full blur-[100px] opacity-50"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl mb-8 border border-blue-100">
                            <Sparkles size={14} className="fill-blue-600" />
                            {t('title')}
                        </div>
                        <h1 className="text-5xl sm:text-7xl font-black text-gray-900 tracking-tight mb-8 leading-[1.1]">
                            {t('heroTitle')}
                        </h1>
                        <p className="text-xl text-gray-400 font-medium leading-relaxed max-w-2xl mx-auto">
                            {t('heroSubtitle')}
                        </p>
                    </div>

                    <JobSearchBar
                        defaultTitle={params.title}
                        defaultValue={params.location}
                        currentJobType={currentJobType}
                        action="/jobs"
                    />
                </div>
            </header>

            {/* 2. MAIN CONTENT SECTION - Unified background */}
            <main className="relative">
                <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-white to-transparent pointer-events-none"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
                    <div className="space-y-32">
                        {!isSearching && (
                            <>
                                <section>
                                    <div className="flex items-center gap-4 mb-12">
                                        <div className="p-4 bg-white rounded-[1.5rem] shadow-xl text-blue-600 border border-gray-100"><TrendingUp size={28} /></div>
                                        <div>
                                            <h2 className="text-3xl font-black text-gray-900 tracking-tight">{t('trendingTitle')}</h2>
                                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-1 ml-0.5">{t('trendingSubtitle')}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                                        {trendingJobs.map(job => <JobCard key={job.id} job={job} />)}
                                    </div>
                                </section>

                                <section>
                                    <div className="flex items-center gap-4 mb-12">
                                        <div className="p-4 bg-white rounded-[1.5rem] shadow-xl text-orange-600 border border-gray-100"><Flame size={28} /></div>
                                        <div>
                                            <h2 className="text-3xl font-black text-gray-900 tracking-tight">{t('hotTitle')}</h2>
                                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-1 ml-0.5">{t('hotSubtitle')}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                                        {hotJobs.map(job => <JobCard key={job.id} job={job} />)}
                                    </div>
                                </section>
                            </>
                        )}

                        <section>
                            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-8">
                                <div className="flex items-center gap-4 w-full md:w-auto">
                                    <div className="p-4 bg-white rounded-[1.5rem] shadow-xl text-indigo-600 border border-gray-100">
                                        <Briefcase size={28} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                                            {isSearching ? t('searchResults') : t('jobsForYou')}
                                        </h2>
                                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-1 ml-0.5">
                                            {isSearching ? t('foundResults', { count: jobsData.total }) : t('bestSuggestions')}
                                        </p>
                                    </div>
                                </div>

                                <div className="w-full md:w-auto relative">
                                    <div className="p-1 bg-white/60 backdrop-blur-xl rounded-[1.5rem] md:rounded-[2rem] shadow-xl border border-gray-100 flex items-center overflow-x-auto no-scrollbar scroll-smooth">
                                        <div className="flex items-center gap-1 md:gap-2 px-1">
                                            {[
                                                { id: 'all', label: 'tabs.all', icon: Briefcase },
                                                { id: 'unskilled', label: 'tabs.unskilled', icon: Zap },
                                                { id: 'skilled', label: 'tabs.skilled', icon: Award },
                                                { id: 'professional', label: 'tabs.professional', icon: GraduationCap }
                                            ].map((tab) => {
                                                const Icon = tab.icon;
                                                const isActive = currentJobType === tab.id;
                                                return (
                                                    <Link key={tab.id} href={getFilterUrl(tab.id)} scroll={false}
                                                        className={`flex items-center gap-2 px-6 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl md:rounded-[1.5rem] transition-all whitespace-nowrap ${isActive ? "bg-blue-600 text-white shadow-xl" : "text-gray-400 hover:text-gray-900 hover:bg-white/50"
                                                            }`}
                                                    >
                                                        <Icon size={14} /> {t(tab.label)}
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <JobFeed initialData={jobsData} filters={params} />
                        </section>
                    </div>
                </div>

                <div className="h-64 bg-gradient-to-b from-transparent to-blue-600 mt-20"></div>
            </main>

            <section className="bg-blue-600 py-32 relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="bg-white/10 backdrop-blur-3xl rounded-[4rem] p-12 md:p-24 border border-white/20 shadow-2xl">
                        <div className="flex flex-col lg:flex-row items-center justify-between gap-16">
                            <div className="text-center lg:text-left">
                                <h2 className="text-5xl md:text-7xl font-black text-white mb-8 tracking-tighter leading-[1]">{t('employerSection.title')}</h2>
                                <p className="text-blue-100 text-xl md:text-2xl mb-12 max-w-xl font-medium leading-relaxed opacity-90">
                                    {t('employerSection.subtitle')}
                                </p>
                                <div className="flex flex-wrap gap-6 justify-center lg:justify-start">
                                    <Link href="/admin/jobs/new" className="bg-white text-blue-600 font-black px-12 py-5 rounded-[2.5rem] hover:bg-blue-50 transition-all shadow-2xl active:scale-95 text-lg">
                                        {t('employerSection.postJob')}
                                    </Link>
                                    <button className="bg-white/10 border-2 border-white/20 text-white font-black px-12 py-5 rounded-[2.5rem] hover:bg-white/20 transition-all active:scale-95 text-lg backdrop-blur-md">
                                        {t('employerSection.learnMore')}
                                    </button>
                                </div>
                            </div>
                            <div className="hidden lg:block transform rotate-6 scale-125 opacity-20">
                                <Building2 size={300} className="text-white" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
