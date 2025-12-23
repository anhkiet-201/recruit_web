"use client";

import Link from "next/link";
import { Job } from "@/models/Job";
import { MapPin, DollarSign, Zap, GraduationCap, Award, ChevronRight, Clock, Briefcase, Eye, Sparkles, ArrowRight, Calendar } from "lucide-react";
import SafeImage from "./ui/SafeImage";
import { formatDate } from "@/lib/utils";
import { useTranslations, useLocale } from "next-intl";
import { formatSalaryRange } from "@/utils/currency";
import { JobStatus } from "@/models/JobStatus";

export default function JobCard({ job, isApplied = false, priority = false }: { job: Job; isApplied?: boolean; priority?: boolean; }) {
    const t = useTranslations("JobCard");
    const tDetail = useTranslations("JobDetail");
    const locale = useLocale();

    const placeholderImage = job.status === JobStatus.DRAFT
        ? "https://placehold.co/400x200?text=DRAFT"
        : "https://placehold.co/400x200?text=No+Image";

    const getJobTypeLabel = (type?: string) => {
        switch (type) {
            case 'unskilled': return { label: tDetail('types.unskilled'), icon: Zap, color: 'text-emerald-600 bg-emerald-50/80 border-emerald-100/50' };
            case 'professional': return { label: tDetail('types.professional'), icon: Award, color: 'text-blue-600 bg-blue-50/80 border-blue-100/50' };
            case 'skilled': return { label: tDetail('types.skilled'), icon: GraduationCap, color: 'text-fuchsia-600 bg-fuchsia-50/80 border-fuchsia-100/50' };
            default: return { label: tDetail('types.default'), icon: Zap, color: 'text-gray-600 bg-gray-50/80 border-gray-100/50' };
        }
    };

    const typeInfo = getJobTypeLabel(job.jobType);
    const TypeIcon = typeInfo.icon;

    const isNew = (new Date().getTime() - new Date(job.createdAt).getTime()) < (3 * 24 * 60 * 60 * 1000);

    return (
        <Link href={`/jobs/${job.id}`} className="group block h-full">
            <div className="h-full bg-white rounded-[2.5rem] p-3.5 shadow-xl shadow-gray-200/40 border border-gray-100/60 hover:shadow-2xl hover:shadow-blue-200/50 hover:-translate-y-2.5 transition-all duration-500 flex flex-col relative overflow-hidden">
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-50/50 to-transparent rounded-bl-full -z-0 opacity-50 group-hover:scale-150 transition-transform duration-700"></div>

                {/* Header Image Section */}
                <div className="relative aspect-[16/10] w-full rounded-[2.2rem] overflow-hidden shadow-sm bg-gray-50 z-10">
                    <SafeImage src={job.imageUrl} fallback={placeholderImage} alt={job.title} priority={priority} />

                    <div className="absolute top-4 left-4 flex flex-col gap-2 z-20">
                        {isApplied && (
                            <div className="bg-emerald-600/90 backdrop-blur-md text-white text-[9px] font-black px-3.5 py-1.5 rounded-full shadow-lg uppercase tracking-widest flex items-center gap-1.5 border border-white/20">
                                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse shadow-[0_0_8px_white]"></div>
                                {t('applied')}
                            </div>
                        )}
                        {isNew && (
                            <div className="bg-amber-400/90 backdrop-blur-md text-white text-[9px] font-black px-3.5 py-1.5 rounded-full shadow-lg uppercase tracking-widest flex items-center gap-1.5 border border-white/20">
                                <Sparkles size={10} className="fill-white" />
                                {t('new')}
                            </div>
                        )}
                    </div>

                    <div className="absolute bottom-4 left-4 z-20">
                        <div className={`${typeInfo.color} backdrop-blur-md px-3.5 py-1.5 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm border w-fit`}>
                            <TypeIcon size={12} />
                            {typeInfo.label}
                        </div>
                    </div>

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-6">
                        <span className="text-white text-xs font-bold flex items-center gap-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                            {tDetail('applyNow')} <ArrowRight size={14} />
                        </span>
                    </div>
                </div>

                {/* Content Section */}
                <div className="px-5 pt-7 pb-4 flex flex-col flex-1 z-10">
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-5 h-[3.5rem] flex items-start leading-[1.75rem]">
                        {job.title}
                    </h3>

                    {/* Salary Highlight */}
                    <div className="mb-6 bg-blue-50/40 rounded-2xl px-4 py-3 border border-blue-100/50 group-hover:bg-blue-600 group-hover:border-blue-600 transition-all duration-500">
                        <div className="flex items-center gap-2">
                            <DollarSign size={16} className="text-blue-600 group-hover:text-white transition-colors" />
                            <span className="text-sm font-black text-blue-700 group-hover:text-white transition-colors">
                                {formatSalaryRange(job.salaryMin || 0, job.salaryMax || 0, locale, t('negotiable'))}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-y-4 gap-x-2 mb-6">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 bg-gray-50 group-hover:bg-white rounded-xl text-gray-400 group-hover:text-blue-500 transition-colors shadow-sm border border-gray-100/50">
                                <MapPin size={14} />
                            </div>
                            <span className="text-[11px] font-bold text-gray-500 group-hover:text-gray-700 truncate uppercase tracking-tight transition-colors">
                                {job.location}
                            </span>
                        </div>
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 bg-gray-50 group-hover:bg-white rounded-xl text-gray-400 group-hover:text-indigo-500 transition-colors shadow-sm border border-gray-100/50">
                                <Briefcase size={14} />
                            </div>
                            <span className="text-[11px] font-bold text-gray-500 group-hover:text-gray-700 uppercase tracking-tight transition-colors">
                                {job.experienceYears ? t('yearsExp', { count: job.experienceYears }) : t('noExp')}
                            </span>
                        </div>
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 bg-gray-50 group-hover:bg-white rounded-xl text-gray-400 group-hover:text-orange-500 transition-colors shadow-sm border border-gray-100/50">
                                <Eye size={14} />
                            </div>
                            <span className="text-[11px] font-bold text-gray-500 group-hover:text-gray-700 uppercase tracking-tight transition-colors">
                                {t('views', { count: job.views || 0 })}
                            </span>
                        </div>
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 bg-gray-50 group-hover:bg-white rounded-xl text-gray-400 group-hover:text-blue-500 transition-colors shadow-sm border border-gray-100/50">
                                <Calendar size={14} />
                            </div>
                            <span className="text-[11px] font-bold text-gray-500 group-hover:text-gray-700 uppercase tracking-tight transition-colors">
                                {formatDate(job.createdAt)}
                            </span>
                        </div>
                    </div>

                    {/* Tags */}
                    {(job as any).jobTags && (job as any).jobTags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-8">
                            {(job as any).jobTags.slice(0, 3).map((jt: any) => (
                                <span key={jt.tagId} className="px-2.5 py-1 bg-gray-100/80 text-[10px] font-bold text-gray-400 group-hover:text-gray-500 group-hover:bg-white border border-transparent group-hover:border-gray-100 rounded-lg tracking-wide transition-all shadow-sm">
                                    #{jt.tag.name}
                                </span>
                            ))}
                            {(job as any).jobTags.length > 3 && (
                                <span className="text-[10px] font-black text-gray-300 px-1 py-1">...</span>
                            )}
                        </div>
                    )}

                    {/* Footer */}
                    <div className="mt-auto flex items-center justify-between bg-gray-50/50 rounded-3xl p-2.5 pl-5 border border-gray-100/50 group-hover:bg-blue-50/50 transition-colors duration-500">
                        <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 group-hover:text-blue-600/70 uppercase tracking-[0.1em] transition-colors">
                            <Clock size={12} />
                            <span>{job.deadline ? t('deadline', { date: formatDate(job.deadline) }) : t('noDeadline')}</span>
                        </div>
                        <div className="h-10 w-10 bg-white shadow-md rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 group-hover:rotate-[360deg]">
                            <ChevronRight size={20} />
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}
