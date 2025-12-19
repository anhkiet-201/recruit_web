"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Job } from "@/models/Job";
import { MapPin, DollarSign, Calendar, Zap, GraduationCap, Award, ChevronRight, Clock, Briefcase, Eye, Sparkles } from "lucide-react";
import SafeImage from "./ui/SafeImage";

export default function JobCard({ 
    job, 
    isApplied = false,
    priority = false 
}: { 
    job: Job; 
    isApplied?: boolean;
    priority?: boolean;
}) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const placeholderImage = job.isActive 
        ? "https://placehold.co/400x200?text=No+Image" 
        : "https://placehold.co/400x200?text=DRAFT";

    const getJobTypeLabel = (type?: string) => {
        switch (type) {
            case 'unskilled': return { label: 'Phổ thông', icon: Zap, color: 'text-green-600 bg-green-50' };
            case 'skilled': return { label: 'Chất lượng cao', icon: Award, color: 'text-blue-600 bg-blue-50' };
            case 'professional': return { label: 'Có bằng cấp', icon: GraduationCap, color: 'text-purple-600 bg-purple-50' };
            default: return { label: 'Tuyển dụng', icon: Zap, color: 'text-gray-600 bg-gray-50' };
        }
    };

    const typeInfo = getJobTypeLabel(job.jobType);
    const TypeIcon = typeInfo.icon;

    const formatDate = (dateStr: string) => {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        const d = date.getUTCDate().toString().padStart(2, '0');
        const m = (date.getUTCMonth() + 1).toString().padStart(2, '0');
        const y = date.getUTCFullYear();
        return `${d}/${m}/${y}`;
    };

    const isNew = (new Date().getTime() - new Date(job.createdAt).getTime()) < (3 * 24 * 60 * 60 * 1000);

    return (
        <Link href={`/jobs/${job.id}`} className="group block h-full">
            <div className="h-full bg-white rounded-[2.5rem] p-3 shadow-xl shadow-gray-200/40 border border-gray-100/50 hover:shadow-2xl hover:shadow-blue-200/40 hover:-translate-y-2 transition-all duration-500 flex flex-col relative">
                
                {/* 1. Image Section */}
                <div className="relative aspect-[16/9] w-full rounded-[2rem] overflow-hidden shadow-inner bg-gray-50">
                    <SafeImage
                        src={job.imageUrl}
                        fallback={placeholderImage}
                        alt={job.title}
                        priority={priority}
                    />
                    
                    {/* Floating Badges */}
                    <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                        {isApplied && (
                            <div className="bg-green-600 text-white text-[9px] font-black px-3 py-1 rounded-full shadow-lg uppercase tracking-widest flex items-center gap-1.5 w-fit border border-white/20">
                                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                                Applied
                            </div>
                        )}
                        {isNew && (
                            <div className="bg-amber-400 text-white text-[9px] font-black px-3 py-1 rounded-full shadow-lg uppercase tracking-widest flex items-center gap-1.5 w-fit border border-white/20">
                                <Sparkles size={10} className="fill-white" />
                                New
                            </div>
                        )}
                    </div>

                    <div className="absolute bottom-4 left-4 z-10">
                        <div className={`${typeInfo.color} backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm border border-white/20 w-fit`}>
                            <TypeIcon size={10} />
                            {typeInfo.label}
                        </div>
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>

                {/* 2. Content Section */}
                <div className="px-5 pt-6 pb-4 flex flex-col flex-1">
                    <h3 className="text-lg font-black text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1 mb-4 tracking-tight">
                        {job.title}
                    </h3>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-y-4 gap-x-2 mb-6">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-gray-50 rounded-xl text-gray-400">
                                <MapPin size={14} />
                            </div>
                            <span className="text-[11px] font-bold text-gray-500 truncate uppercase tracking-tight">{job.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-blue-50 rounded-xl text-blue-600">
                                <DollarSign size={14} />
                            </div>
                            <span className="text-[11px] font-black text-blue-700">
                                {job.salaryMin ? `${job.salaryMin}-${job.salaryMax}` : 'T.Thuận'}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-indigo-50 rounded-xl text-indigo-600">
                                <Briefcase size={14} />
                            </div>
                            <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-tight">
                                {job.experienceYears ? `${job.experienceYears} Năm KN` : 'Không KN'}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-orange-50 rounded-xl text-orange-600">
                                <Eye size={14} />
                            </div>
                            <span className="text-[11px] font-bold text-orange-700 uppercase tracking-tight">
                                {job.views || 0} Lượt xem
                            </span>
                        </div>
                    </div>

                    {/* Tags Section */}
                    {(job as any).jobTags && (job as any).jobTags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-6">
                            {(job as any).jobTags.slice(0, 3).map((jt: any) => (
                                <span key={jt.tagId} className="px-2 py-0.5 bg-gray-100 text-[9px] font-black text-gray-400 uppercase rounded-md tracking-wider">
                                    #{jt.tag.name}
                                </span>
                            ))}
                            {(job as any).jobTags.length > 3 && (
                                <span className="text-[9px] font-black text-gray-300 uppercase">...</span>
                            )}
                        </div>
                    )}

                    {/* 3. Footer Section */}
                    <div className="mt-auto flex items-center justify-between bg-gray-50/50 rounded-3xl p-2 pl-4 border border-gray-100/50">
                        <div className="flex items-center gap-2 text-[9px] font-black text-gray-400 uppercase tracking-[0.1em]">
                            <Clock size={12} />
                            <span>Hạn: {!mounted ? "..." : formatDate(job.deadline)}</span>
                        </div>
                        <div className="h-9 w-9 bg-white shadow-md rounded-[1.2rem] flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 group-hover:rotate-[360deg]">
                            <ChevronRight size={18} />
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}