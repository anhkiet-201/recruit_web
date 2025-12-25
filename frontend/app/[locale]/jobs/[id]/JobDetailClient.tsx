"use client";

import { useEffect, useState } from "react";
import { JobService } from "@/services/jobService";
import { useRouter } from "next/navigation";
import JobActionSection from "@/components/JobActionSection";
import { MapPin, DollarSign, Briefcase, Calendar, ChevronLeft, Building2, Eye, Users, Clock, Share2, RefreshCw, Languages, Phone } from "lucide-react";
import { api } from "@/lib/api";
import ImageComponent from "@/components/ui/ImageComponent";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { Job } from "@/models/Job";
import JobCard from "@/components/JobCard";
import { useTranslations, useLocale } from "next-intl";
import { formatSalaryRange } from "@/utils/currency";

interface JobDetailClientProps {
    initialJob: Job;
}

export default function JobDetailClient({ initialJob }: JobDetailClientProps) {
    const router = useRouter();
    const t = useTranslations("JobDetail");
    const locale = useLocale();

    // We use initialJob as the starting state, but might still need to update it if we want live view counts
    // or if the server data is stale (though usually server data is fresh enough).
    // For now, let's trust initialJob is good.
    const [job, setJob] = useState<Job>(initialJob);
    const [relatedJobs, setRelatedJobs] = useState<Job[]>([]);
    const [translatedContent, setTranslatedContent] = useState<string | null>(null);
    const [isTranslating, setIsTranslating] = useState(false);
    const [showTranslated, setShowTranslated] = useState(false);

    const getJobTypeLabel = (type?: string) => {
        switch (type) {
            case 'unskilled': return t('types.unskilled');
            case 'professional': return t('types.professional');
            case 'skilled': return t('types.skilled');
            default: return t('types.default');
        }
    };

    // Increment view count on mount
    useEffect(() => {
        if (job?.id) {
            // Fire and forget view increment
            JobService.getJobById(job.id, { incrementView: true }).catch(console.error);
        }
    }, [job.id]);

    useEffect(() => {
        if (job) {
            JobService.searchJobs({ jobType: job.jobType, limit: 4 })
                .then(res => {
                    const related = res.items.filter(j => j.id !== job.id).slice(0, 3);
                    setRelatedJobs(related);
                })
                .catch(console.error);
        }
    }, [job]);

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return "N/A";
        const date = new Date(dateStr);
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    };

    const handleTranslate = async () => {
        if (showTranslated) {
            setShowTranslated(false);
            return;
        }

        if (translatedContent) {
            setShowTranslated(true);
            return;
        }

        if (!job?.content) return;

        setIsTranslating(true);
        try {
            const prompt = `Translate the following job description to ${locale === 'vi' ? 'Vietnamese' : locale === 'zh' ? 'Chinese' : 'English'}. Keep the formatting (markdown/HTML) if possible. Do not add any conversational text, just the translation.\n\n${job.content}`;

            const res = await api.post<{ response: string }>("/ai/chat", {
                message: prompt,
                history: []
            });

            setTranslatedContent(res.response);
            setShowTranslated(true);
        } catch (error) {
            console.error("Translation failed:", error);
            alert("Translation failed. Please try again.");
        } finally {
            setIsTranslating(false);
        }
    };

    return (
        <article className="min-h-screen bg-gray-50/50 pb-32">

            {/* 1. PREMIUM STICKY HEADER */}
            <header className="bg-white/70 backdrop-blur-xl border-b border-gray-100/50 sticky top-0 z-30 transition-all duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <nav className="flex items-center gap-6">
                        <Button
                            variant="ghost"
                            size="sm"
                            icon={ChevronLeft}
                            onClick={() => router.back()}
                            className="text-gray-500 hover:text-blue-600 font-black uppercase tracking-widest text-[10px]"
                        >
                            {t('back')}
                        </Button>
                        <div className="hidden md:block h-8 w-px bg-gray-100"></div>
                        <div className="hidden md:flex items-center gap-3">
                            <h2 className="text-sm font-black text-gray-900 line-clamp-1 max-w-[300px]">{job.title}</h2>
                            <Badge variant="blue" className="text-[9px]">{getJobTypeLabel(job.jobType)}</Badge>
                        </div>
                    </nav>

                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex items-center gap-6 mr-4 text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">
                            <div className="flex items-center gap-1.5">
                                <Eye size={14} className="text-blue-500" />
                                <span>{job.views || 0} {t('views')}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Calendar size={14} className="text-indigo-500" />
                                <span>{formatDate(job.createdAt)}</span>
                            </div>
                        </div>
                        <Button variant="outline" size="sm" icon={Share2} className="p-2.5 rounded-xl"></Button>
                    </div>
                </div>
            </header>

            {/* 2. PAGE CONTENT */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

                    {/* Main Content Card */}
                    <div className="lg:col-span-2 space-y-10">
                        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-gray-200/50 border border-gray-100 overflow-hidden relative group">
                            {/* Image Container - Fixed Overflow */}
                            <div className="relative h-72 sm:h-[400px] w-full bg-gray-100 overflow-hidden">
                                <ImageComponent
                                    src={job.imageUrl || "https://placehold.co/1200x600?text=Job+Cover"}
                                    alt={job.title}
                                    fill
                                    priority={true}
                                    className="object-cover group-hover:scale-105 transition-transform duration-[2000ms] ease-out"
                                    unoptimized
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent z-10 pointer-events-none"></div>
                                <div className="absolute bottom-8 left-8 right-8 z-20">
                                    <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight tracking-tight drop-shadow-2xl">
                                        {job.title}
                                    </h1>
                                </div>
                            </div>

                            <div className="p-8 sm:p-12 relative z-10">
                                <div className="flex flex-wrap gap-4 mb-12">
                                    <div className="flex items-center gap-3 bg-gray-50 px-5 py-3 rounded-2xl border border-gray-100 shadow-sm">
                                        <div className="p-1.5 bg-blue-100 rounded-lg text-blue-600"><MapPin size={18} /></div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('location')}</p>
                                            <p className="text-sm font-bold text-gray-700">{job.location}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 bg-blue-50/50 px-5 py-3 rounded-2xl border border-blue-100 shadow-sm">
                                        <div className="p-1.5 bg-blue-600 rounded-lg text-white"><DollarSign size={18} /></div>
                                        <div>
                                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{t('salary')}</p>
                                            <p className="text-sm font-black text-blue-700">{formatSalaryRange(job.salaryMin || 0, job.salaryMax || 0, locale, t('negotiable'))}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="prose max-w-none">
                                    <div className="flex items-center justify-between gap-4 mb-8">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-8 bg-blue-600 rounded-full shadow-lg shadow-blue-200"></div>
                                            <h3 className="text-2xl font-black text-gray-900 tracking-tight">{t('jobDetails')}</h3>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleTranslate}
                                            disabled={isTranslating}
                                            className="text-blue-600 hover:bg-blue-50"
                                            icon={isTranslating ? RefreshCw : Languages}
                                        >
                                            {isTranslating ? t('translating') : (showTranslated ? t('originalContent') : t('translateTo'))}
                                        </Button>
                                    </div>
                                    <div className="whitespace-pre-wrap text-gray-600 text-lg leading-relaxed font-medium">
                                        {showTranslated ? translatedContent : job.content}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 3. SIDEBAR - FIXED STICKY GROUP */}
                    <aside className="relative">
                        <div className="sticky top-32 space-y-8">

                            {/* Summary Card */}
                            <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-gray-200/50 border border-gray-100 p-8">
                                <div className="mb-10">
                                    <h3 className="font-black text-gray-900 mb-8 uppercase tracking-[0.2em] text-[10px] opacity-40">{t('summaryInfo')}</h3>
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 shadow-inner">
                                                <Briefcase size={20} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{t('experience')}</p>
                                                <p className="text-sm font-bold text-gray-700">{job.experienceYears ? `${job.experienceYears} ${t('years')}` : t('noExperienceRequired')}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-green-50 rounded-2xl text-green-600 shadow-inner">
                                                <Users size={20} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{t('manpowerType')}</p>
                                                <p className="text-sm font-bold text-gray-700">{getJobTypeLabel(job.jobType)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-red-50 rounded-2xl text-red-600 shadow-inner">
                                                <Clock size={20} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{t('deadline')}</p>
                                                <p className="text-sm font-bold text-gray-700">{job.deadline ? formatDate(job.deadline) : t('noDeadline')}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-8 border-t border-gray-50">
                                    <JobActionSection jobId={job.id} jobTitle={job.title} jobType={job.jobType || 'unskilled'} />
                                </div>                                <p className="text-[10px] text-gray-400 text-center mt-8 font-medium leading-relaxed uppercase tracking-wider">
                                    {t('recruitedVia')} <span className="text-blue-600 font-black">RecruitWeb</span>
                                </p>
                            </div>

                            {/* Company Card - Inside Sticky Wrapper */}
                            <div className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100 p-10 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-blue-50 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-4 mb-10">
                                        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center border border-blue-100 shadow-sm overflow-hidden flex-shrink-0">
                                            {job.author?.avatarUrl ? (
                                                <img
                                                    src={job.author.avatarUrl}
                                                    alt={job.author.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <Building2 size={32} />
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="font-black text-xl text-gray-900 tracking-tight leading-tight mb-1">
                                                {job.author?.name || "RecruitWeb Partner"}
                                            </h4>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="blue" className="text-[9px] px-2 py-0.5">{t('verifiedEmployer')}</Badge>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-5 mb-10">
                                        <div className="group/item flex items-start gap-4">
                                            <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100 text-gray-400 group-hover/item:text-blue-600 group-hover/item:bg-blue-50 group-hover/item:border-blue-100 transition-all">
                                                <Languages size={16} />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Email</p>
                                                <p className="text-sm font-bold text-gray-700 break-all">{job.author?.email || "contact@recruitweb.com"}</p>
                                            </div>
                                        </div>

                                        {job.author?.phone && (
                                            <div className="group/item flex items-start gap-4">
                                                <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100 text-gray-400 group-hover/item:text-blue-600 group-hover/item:bg-blue-50 group-hover/item:border-blue-100 transition-all">
                                                    <Phone size={16} />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{t('phone') || 'Phone'}</p>
                                                    <p className="text-sm font-bold text-gray-700">{job.author.phone}</p>
                                                </div>
                                            </div>
                                        )}

                                        {job.author?.address && (
                                            <div className="group/item flex items-start gap-4">
                                                <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100 text-gray-400 group-hover/item:text-blue-600 group-hover/item:bg-blue-50 group-hover/item:border-blue-100 transition-all">
                                                    <MapPin size={16} />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{t('location')}</p>
                                                    <p className="text-sm font-bold text-gray-700 leading-relaxed">{job.author.address}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <p className="text-xs text-gray-400 leading-relaxed mb-8 font-medium italic">
                                        "{t('qualityCommitment')}"
                                    </p>

                                    <button
                                        onClick={() => job.author?.id && router.push(`/${locale}/employers/${job.author.id}`)}
                                        className="w-full py-4 bg-gray-900 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all hover:bg-blue-600 shadow-xl shadow-gray-200"
                                    >
                                        {t('companyProfile')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </aside>

                </div>

                {/* 4. RELATED JOBS */}
                {relatedJobs.length > 0 && (
                    <section className="mt-20 border-t border-gray-200 pt-16">
                        <div className="flex items-center gap-3 mb-10">
                            <div className="w-2 h-8 bg-blue-600 rounded-full shadow-lg shadow-blue-200"></div>
                            <h2 className="text-2xl font-black text-gray-900 tracking-tight">{t('relatedJobs')}</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {relatedJobs.map(relatedJob => (
                                <div key={relatedJob.id} className="h-full">
                                    <JobCard job={relatedJob} />
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </article>
    );
}
