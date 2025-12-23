"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { UserService } from "@/services/userService";
import { JobService } from "@/services/jobService";
import { UserProfile } from "@/models/User";
import { Job } from "@/models/Job";
import { Building2, Mail, Phone, MapPin, Briefcase, RefreshCw, ChevronLeft, Calendar, Eye } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import JobCard from "@/components/JobCard";
import { useTranslations } from "next-intl";

export default function EmployerProfilePage() {
    const { id } = useParams();
    const router = useRouter();
    const t = useTranslations("EmployerProfile");
    const tJob = useTranslations("JobDetail");

    const [employer, setEmployer] = useState<UserProfile | null>(null);
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            Promise.all([
                UserService.getPublicProfile(id as string),
                JobService.getAllJobs({ authorId: id as string, status: 'ACTIVE' })
            ]).then(([profile, jobsRes]) => {
                setEmployer(profile);
                setJobs(jobsRes.items);
                setLoading(false);
            }).catch(err => {
                console.error(err);
                setLoading(false);
            });
        }
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <RefreshCw size={40} className="animate-spin text-blue-600" />
            </div>
        );
    }

    if (!employer) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <h2 className="text-2xl font-black">{t('notFound')}</h2>
                <Button onClick={() => router.push('/')}>{t('backHome')}</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20">
            {/* Header / Cover */}
            <div className="h-64 sm:h-80 relative">
                {/* Background Layer with clipping for blobs */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-800 overflow-hidden">
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl"></div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-end relative z-10">
                    <div className="flex flex-col sm:flex-row items-center sm:items-end gap-8 -mb-20 pb-6 w-full">
                        <div className="relative group">
                            <div className="absolute -inset-1.5 bg-gradient-to-tr from-white/50 to-white/20 rounded-[2.5rem] blur opacity-75 group-hover:opacity-100 transition duration-500"></div>
                            <div className="w-40 h-40 sm:w-48 sm:h-48 bg-white rounded-[2.2rem] shadow-2xl relative flex items-center justify-center overflow-hidden border-4 border-white">
                                {employer.avatarUrl ? (
                                    <img src={employer.avatarUrl} alt={employer.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-blue-50 flex items-center justify-center">
                                        <Building2 size={80} className="text-blue-200" />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 text-center sm:text-left pb-4">
                            <div className="flex flex-col gap-3">
                                <h1 className="text-4xl sm:text-5xl font-black text-white drop-shadow-xl tracking-tight">{employer.name}</h1>
                                <div className="flex flex-wrap justify-center sm:justify-start items-center gap-3">
                                    <div className="bg-emerald-600/90 backdrop-blur-md text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg uppercase tracking-widest flex items-center gap-2 border border-white/30">
                                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse shadow-[0_0_8px_white]"></div>
                                        {t('verifiedPartner')}
                                    </div>

                                    <button
                                        onClick={() => document.getElementById('jobs-section')?.scrollIntoView({ behavior: 'smooth' })}
                                        className="bg-gray-900/80 backdrop-blur-md hover:bg-gray-900 text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg uppercase tracking-widest flex items-center gap-2 border border-white/10 transition-all active:scale-95"
                                    >
                                        <Briefcase size={12} className="text-blue-300" />
                                        {jobs.length} {t('activeJobs')}
                                    </button>

                                    {employer.createdAt && (
                                        <div className="bg-gray-900/80 backdrop-blur-md text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg uppercase tracking-widest flex items-center gap-2 border border-white/10">
                                            <Calendar size={12} className="text-blue-300" />
                                            {t('memberSince')} {new Date(employer.createdAt).getFullYear()}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="pb-8 flex flex-wrap gap-4 justify-center sm:justify-start">
                            <Button
                                variant="outline"
                                icon={Mail}
                                onClick={() => window.location.href = `mailto:${employer.email}`}
                                className="bg-white text-blue-600 border-none hover:bg-blue-50 shadow-2xl shadow-blue-900/20 px-8 py-3 rounded-2xl font-black"
                            >
                                {t('contactNow')}
                            </Button>
                            <Button
                                variant="outline"
                                icon={ChevronLeft}
                                onClick={() => router.back()}
                                className="bg-white/10 backdrop-blur-md border border-white/30 text-white hover:bg-white/20 px-6 py-3 rounded-2xl font-bold"
                            >
                                {t('back')}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-32 sm:mt-40">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Sidebar: Info */}
                    <div className="space-y-8">
                        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100 p-10 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-blue-50/50 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>

                            <div className="relative z-10">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-10 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                                    {t('contactInfo')}
                                </h3>

                                <div className="space-y-6">
                                    <div className="group/item flex items-start gap-4">
                                        <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100 text-gray-400 group-hover/item:text-blue-600 group-hover/item:bg-blue-50 group-hover/item:border-blue-100 transition-all">
                                            <Mail size={16} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{t('email') || 'Email'}</p>
                                            <p className="text-sm font-bold text-gray-700 break-all leading-tight">{employer.email}</p>
                                        </div>
                                    </div>

                                    {employer.phone && (
                                        <div className="group/item flex items-start gap-4">
                                            <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100 text-gray-400 group-hover/item:text-blue-600 group-hover/item:bg-blue-50 group-hover/item:border-blue-100 transition-all">
                                                <Phone size={16} />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{t('phone')}</p>
                                                <p className="text-sm font-bold text-gray-700 leading-tight">{employer.phone}</p>
                                            </div>
                                        </div>
                                    )}

                                    {employer.address && (
                                        <div className="group/item flex items-start gap-4">
                                            <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100 text-gray-400 group-hover/item:text-blue-600 group-hover/item:bg-blue-50 group-hover/item:border-blue-100 transition-all">
                                                <MapPin size={16} />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{t('address')}</p>
                                                <p className="text-sm font-bold text-gray-700 leading-relaxed">{employer.address}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-10 pt-10 border-t border-gray-50">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4">{t('aboutCompany')}</h4>
                                    <p className="text-sm text-gray-500 leading-relaxed font-medium italic">
                                        "{t('commitmentText')}"
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main: Jobs List */}
                    <div id="jobs-section" className="lg:col-span-2 space-y-10 scroll-mt-20">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-4">
                            <div className="flex items-center gap-4">
                                <div className="w-2.5 h-10 bg-blue-600 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.4)]"></div>
                                <div>
                                    <h2 className="text-3xl font-black text-gray-900 tracking-tight leading-none mb-1">{t('openingJobs')}</h2>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{t('totalOfLine')} {jobs.length} {t('listings')}</p>
                                </div>
                            </div>
                        </div>

                        {jobs.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {jobs.map(job => (
                                    <div key={job.id} className="transform hover:-translate-y-2 transition-transform duration-300">
                                        <JobCard job={job} />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white rounded-[3rem] border-2 border-dashed border-gray-200 p-24 text-center flex flex-col items-center gap-6 group">
                                <div className="p-8 bg-gray-50 rounded-full text-gray-300 group-hover:scale-110 transition-transform duration-500">
                                    <Briefcase size={64} strokeWidth={1} />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-bold text-gray-800">{t('noJobs')}</h3>
                                    <p className="text-sm text-gray-400 font-medium max-w-xs mx-auto">{t('noJobsDescription') || 'Check back later for exciting opportunities.'}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
