"use client";

import { memo } from "react";
import Link from "next/link";
import { Job } from "@/models/Job";
import { MapPin, DollarSign, Zap, GraduationCap, Award, Clock, Briefcase, Eye, Sparkles, ArrowRight } from "lucide-react";
import SafeImage from "./ui/SafeImage";
import { formatDate } from "@/lib/utils";
import { useTranslations, useLocale } from "next-intl";
import { formatSalaryRange } from "@/utils/currency";
import { JobStatus } from "@/models/JobStatus";

const JobCard = memo(function JobCard({ job, isApplied = false, priority = false }: { job: Job; isApplied?: boolean; priority?: boolean; }) {
    const t = useTranslations("JobCard");
    const tDetail = useTranslations("JobDetail");
    const locale = useLocale();

    const placeholderImage = job.status === JobStatus.DRAFT
        ? "https://placehold.co/400x200?text=DRAFT"
        : "https://placehold.co/400x200?text=No+Image";

    const getJobTypeLabel = (type?: string) => {
        switch (type) {
            case 'unskilled': return { label: tDetail('types.unskilled'), icon: Zap, color: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-700/10' };
            case 'professional': return { label: tDetail('types.professional'), icon: Award, color: 'bg-blue-50 text-blue-700 ring-1 ring-blue-700/10' };
            case 'skilled': return { label: tDetail('types.skilled'), icon: GraduationCap, color: 'bg-fuchsia-50 text-fuchsia-700 ring-1 ring-fuchsia-700/10' };
            default: return { label: tDetail('types.default'), icon: Zap, color: 'bg-gray-50 text-gray-700 ring-1 ring-gray-700/10' };
        }
    };

    const typeInfo = getJobTypeLabel(job.jobType);
    const TypeIcon = typeInfo.icon;

    const isNew = (new Date().getTime() - new Date(job.createdAt).getTime()) < (3 * 24 * 60 * 60 * 1000);

    return (
        <Link href={`/jobs/${job.id}`} className="group block h-full">
            <div className="h-full bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col relative overflow-hidden">

                {/* Header Image Section */}
                <div className="relative aspect-[16/10] w-full rounded-lg overflow-hidden shadow-sm bg-gray-50 z-10 mb-4">
                    <SafeImage src={job.imageUrl} fallback={placeholderImage} alt={job.title} priority={priority} />

                    <div className="absolute top-3 left-3 flex flex-col gap-2 z-20">
                        {isApplied && (
                            <div className="bg-emerald-600/90 backdrop-blur-md text-white text-[9px] font-bold px-2.5 py-1 rounded-full shadow-sm uppercase tracking-wider flex items-center gap-1.5 border border-white/20">
                                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                                {t('applied')}
                            </div>
                        )}
                        {isNew && (
                            <div className="bg-amber-400/90 backdrop-blur-md text-white text-[9px] font-bold px-2.5 py-1 rounded-full shadow-sm uppercase tracking-wider flex items-center gap-1.5 border border-white/20">
                                <Sparkles size={10} className="fill-white" />
                                {t('new')}
                            </div>
                        )}
                    </div>

                    <div className="absolute bottom-3 left-3 z-20">
                        <div className={`${typeInfo.color} backdrop-blur-md px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm`}>
                            <TypeIcon size={12} />
                            {typeInfo.label}
                        </div>
                    </div>

                    {/* Apply Now Button Variant - Hidden on Mobile */}
                    <div className="hidden lg:flex absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 items-center justify-center backdrop-blur-[2px]">
                        <span className="bg-white text-blue-600 px-4 py-2 rounded-full text-xs font-bold shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 flex items-center gap-2 hover:bg-blue-50">
                            {tDetail('applyNow')} <ArrowRight size={14} />
                        </span>
                    </div>
                </div>

                {/* Content Section */}
                <div className="flex flex-col flex-1 z-10">
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-3 tracking-tight leading-snug min-h-[3rem]">
                        {job.title}
                    </h3>

                    {/* Salary Highlight - Green/Primary */}
                    <div className="mb-4">
                        <div className="flex items-center gap-1.5">
                            <DollarSign size={16} className="text-emerald-600" />
                            <span className="text-sm font-bold text-emerald-600">
                                {formatSalaryRange(job.salaryMin || 0, job.salaryMax || 0, locale, t('negotiable'))}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-y-3 gap-x-2 mb-4">
                        <div className="flex items-center gap-2">
                            <MapPin size={14} className="text-gray-400 shrink-0" />
                            <span className="text-xs font-medium text-gray-500 truncate">
                                {job.location}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Briefcase size={14} className="text-gray-400 shrink-0" />
                            <span className="text-xs font-medium text-gray-500">
                                {job.experienceYears ? t('yearsExp', { count: job.experienceYears }) : t('noExp')}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                             <Clock size={14} className="text-gray-400 shrink-0" />
                             <span className="text-xs font-medium text-gray-500 truncate">
                                {job.deadline ? t('deadline', { date: formatDate(job.deadline) }) : t('noDeadline')}
                             </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Eye size={14} className="text-gray-400 shrink-0" />
                            <span className="text-xs font-medium text-gray-500">
                                {t('views', { count: job.views || 0 })}
                            </span>
                        </div>
                    </div>

                    {/* Tags - Soft Backgrounds */}
                    {job.jobTags && job.jobTags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2 mt-auto">
                            {job.jobTags.slice(0, 3).map((jt) => (
                                <span key={jt.tagId} className="px-2.5 py-0.5 bg-gray-50 text-gray-600 ring-1 ring-gray-200 rounded-full text-[10px] font-medium tracking-wide">
                                    #{jt.tag.name}
                                </span>
                            ))}
                            {job.jobTags.length > 3 && (
                                <span className="text-[10px] font-medium text-gray-400 px-1">...</span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
});

export default JobCard;
