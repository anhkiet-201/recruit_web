"use client";

import { useEffect, useState } from "react";
import { JobService } from "@/services/jobService";
import { useRouter, useParams } from "next/navigation";
import JobActionSection from "@/components/JobActionSection";
import { MapPin, DollarSign, Briefcase, Calendar, ChevronLeft, Building2, Eye, Users, Clock, Share2, RefreshCw } from "lucide-react";
import Image from "next/image";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { Job } from "@/models/Job";

export default function JobDetailPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;

    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            JobService.getJobById(id, { incrementView: true }) // Increment view for users
                .then(data => {
                    setJob(data);
                    setLoading(false);
                })
                .catch(err => {
                    console.error(err);
                    setLoading(false);
                });
        }
    }, [id]);

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return "N/A";
        const date = new Date(dateStr);
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <RefreshCw size={40} className="animate-spin text-blue-600" />
            </div>
        );
    }

    if (!job) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
                <h2 className="text-2xl font-black text-gray-900">Không tìm thấy công việc</h2>
                <Button onClick={() => router.push('/')}>Quay lại trang chủ</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 pb-32">
            
            {/* 1. PREMIUM STICKY HEADER */}
            <header className="bg-white/70 backdrop-blur-xl border-b border-gray-100/50 sticky top-0 z-30 transition-all duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            icon={ChevronLeft} 
                            onClick={() => router.back()}
                            className="text-gray-500 hover:text-blue-600 font-black uppercase tracking-widest text-[10px]"
                        >
                            Quay lại
                        </Button>
                        <div className="hidden md:block h-8 w-px bg-gray-100"></div>
                        <div className="hidden md:flex items-center gap-3">
                            <h2 className="text-sm font-black text-gray-900 line-clamp-1 max-w-[300px]">{job.title}</h2>
                            <Badge variant="blue" className="text-[9px]">{job.jobType || 'Tuyển dụng'}</Badge>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex items-center gap-6 mr-4 text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">
                            <div className="flex items-center gap-1.5">
                                <Eye size={14} className="text-blue-500" />
                                <span>{job.views} Views</span>
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
                                <Image
                                    src={job.imageUrl || "https://placehold.co/1200x600?text=Job+Cover"}
                                    alt={job.title}
                                    fill
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
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Địa điểm</p>
                                            <p className="text-sm font-bold text-gray-700">{job.location}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 bg-blue-50/50 px-5 py-3 rounded-2xl border border-blue-100 shadow-sm">
                                        <div className="p-1.5 bg-blue-600 rounded-lg text-white"><DollarSign size={18} /></div>
                                        <div>
                                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Mức lương</p>
                                            <p className="text-sm font-black text-blue-700">{job.salaryMin ? `${job.salaryMin} - ${job.salaryMax}` : 'Thỏa thuận'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="prose max-w-none">
                                    <div className="flex items-center gap-3 mb-8">
                                        <div className="w-2 h-8 bg-blue-600 rounded-full shadow-lg shadow-blue-200"></div>
                                        <h3 className="text-2xl font-black text-gray-900 tracking-tight">Chi tiết tuyển dụng</h3>
                                    </div>
                                    <div className="whitespace-pre-wrap text-gray-600 text-lg leading-relaxed font-medium">
                                        {job.content}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 3. SIDEBAR - FIXED STICKY GROUP */}
                    <div className="relative">
                        <div className="sticky top-32 space-y-8">
                            
                            {/* Summary Card */}
                            <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-gray-200/50 border border-gray-100 p-8">
                                <div className="mb-10">
                                    <h3 className="font-black text-gray-900 mb-8 uppercase tracking-[0.2em] text-[10px] opacity-40">Thông tin tóm tắt</h3>
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 shadow-inner">
                                                <Briefcase size={20} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Kinh nghiệm</p>
                                                <p className="text-sm font-bold text-gray-700">{job.experienceYears ? `${job.experienceYears} năm` : 'Không yêu cầu'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-green-50 rounded-2xl text-green-600 shadow-inner">
                                                <Users size={20} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Loại nhân lực</p>
                                                <p className="text-sm font-bold text-gray-700 capitalize">{job.jobType || 'Chưa phân loại'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-red-50 rounded-2xl text-red-600 shadow-inner">
                                                <Clock size={20} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Hạn nộp</p>
                                                <p className="text-sm font-bold text-gray-700">{job.deadline ? formatDate(job.deadline) : 'Đang cập nhật'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                                                                        <div className="pt-8 border-t border-gray-50">
                                                                                            <JobActionSection jobId={job.id} jobTitle={job.title} jobType={job.jobType || 'unskilled'} />
                                                                                        </div>                                <p className="text-[10px] text-gray-400 text-center mt-8 font-medium leading-relaxed uppercase tracking-wider">
                                    Recruited via <span className="text-blue-600 font-black">RecruitWeb</span>
                                </p>
                            </div>

                            {/* Company Card - Inside Sticky Wrapper */}
                            <div className="bg-gradient-to-br from-gray-900 to-black rounded-[2.5rem] shadow-2xl p-10 text-white relative overflow-hidden group">
                                <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-blue-600/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/30 shadow-xl">
                                            <Building2 size={28} />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-xl tracking-tight">RecruitWeb Partner</h4>
                                            <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest">Verified Employer</p>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-400 leading-relaxed mb-8 font-medium">
                                        Nhà tuyển dụng này đã cam kết tuân thủ các tiêu chuẩn chất lượng.
                                    </p>
                                    <button className="w-full py-4 bg-white text-black rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all hover:bg-blue-600 hover:text-white shadow-xl">
                                        Hồ sơ công ty
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
