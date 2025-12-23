"use client";

import { useEffect, useState, Fragment } from "react";
import { useAuth } from "@/components/AuthProvider";
import { ApplicationService } from "@/services/applicationService";
import { Application } from "@/models/User";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import {
    Briefcase, Clock, ChevronLeft,
    FileText, ExternalLink, RefreshCw,
    Search, Filter, XCircle, CheckCircle,
    HelpCircle, ChevronDown, ChevronUp, MapPin, DollarSign, Award, Calendar, Zap, GraduationCap
} from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import Input from "@/components/ui/Input";
import Dropdown from "@/components/ui/Dropdown";
import { formatSalaryRange } from "@/utils/currency";
import { formatDate } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function MyApplicationsPage() {
    const t = useTranslations("Dashboard");
    const locale = useLocale();
    const { user, profile, loading } = useAuth();
    const router = useRouter();
    const [applications, setApplications] = useState<Application[]>([]);
    const [fetching, setFetching] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (!loading) {
            if (!user) router.push("/login");
            else {
                loadApplications();
            }
        }
    }, [user, loading, router]);

    const loadApplications = async () => {
        setFetching(true);
        try {
            const userId = profile?.id || user?.uid;
            if (userId) {
                const data = await ApplicationService.getMyApplications(userId);
                setApplications(data);
            }
        } catch (error) {
            console.error("Failed to load applications:", error);
        } finally {
            setFetching(false);
        }
    };

    const toggleRow = (id: string) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(id)) newExpanded.delete(id);
        else newExpanded.add(id);
        setExpandedRows(newExpanded);
    };

    const statusOptions = [
        { value: "all", label: "Tất cả trạng thái", icon: Filter },
        { value: "pending", label: "Pending", icon: Clock },
        { value: "reviewed", label: "Reviewed", icon: HelpCircle },
        { value: "accepted", label: "Accepted", icon: CheckCircle },
        { value: "rejected", label: "Rejected", icon: XCircle },
    ];

    const filteredApplications = applications.filter(app => {
        const title = (app.job as any)?.title?.toLowerCase() || "";
        const search = searchTerm.toLowerCase();
        return title.includes(search) && (statusFilter === "all" || app.status === statusFilter);
    });

    if (loading || (fetching && !applications.length)) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <RefreshCw className="animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Header / Breadcrumb */}
            <div className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="flex items-center gap-2 text-slate-400 hover:text-blue-600 font-bold mb-4 transition-colors group"
                    >
                        <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        Trở lại Dashboard
                    </button>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                        <div className="w-2.5 h-10 bg-blue-600 rounded-full"></div>
                        {t('recentApplications')}
                    </h1>
                    <p className="text-slate-500 font-medium mt-2 pl-6">
                        Theo dõi trạng thái và quản lý các công việc bạn đã ứng tuyển
                    </p>
                </div>
            </div>

            {/* Filters */}
            <Card className="mb-8 border-none shadow-sm bg-slate-50/50 p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <Input
                            icon={Search}
                            placeholder="Tìm kiếm công việc..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-white border-slate-200"
                        />
                    </div>
                    <div className="w-full md:w-64">
                        <Dropdown
                            icon={Filter}
                            options={statusOptions}
                            value={statusFilter}
                            onChange={setStatusFilter}
                            className="bg-white border-slate-200"
                        />
                    </div>
                </div>
            </Card>

            {/* List */}
            <div className="space-y-4">
                {filteredApplications.length > 0 ? filteredApplications.map((app) => {
                    const isExpanded = expandedRows.has(app.id);
                    return (
                        <Fragment key={app.id}>
                            <Card noPadding className={`group transition-all duration-500 border-none shadow-[0_8px_30px_-5px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] overflow-hidden cursor-pointer ${isExpanded ? 'ring-2 ring-blue-500/20' : 'hover:-translate-y-1.5'}`} onClick={() => toggleRow(app.id)}>
                                <div className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                                    <div className="flex items-center gap-6">
                                        <div className={`h-16 w-16 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-inner ${isExpanded ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-blue-600 group-hover:text-white'}`}>
                                            <Briefcase size={28} />
                                        </div>
                                        <div>
                                            <h4 className={`font-bold text-xl transition-colors ${isExpanded ? 'text-blue-600' : 'text-slate-800 group-hover:text-blue-600'}`}>
                                                {(app.job as any)?.title || t('jobApplication')}
                                            </h4>
                                            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 mt-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                                                <span className="flex items-center gap-1.5">
                                                    <Clock size={14} className="text-slate-300" />
                                                    Đã nộp: {new Date(app.createdAt).toLocaleDateString('vi-VN')}
                                                </span>
                                                <span className="hidden sm:block w-1 h-1 bg-slate-200 rounded-full"></span>
                                                <span className="flex items-center gap-1.5">
                                                    <FileText size={14} className="text-slate-300" />
                                                    ID: <span className="font-mono text-slate-500">{app.id.slice(0, 8)}</span>
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between sm:justify-end gap-6">
                                        <Badge
                                            variant={app.status === 'accepted' ? 'green' : app.status === 'rejected' ? 'red' : 'yellow'}
                                            isDot
                                            className="px-5 py-2.5 text-[11px] font-black uppercase tracking-widest bg-white shadow-sm border border-slate-100"
                                        >
                                            {app.status}
                                        </Badge>
                                        <div className={`h-10 w-10 rounded-full flex items-center justify-center transition-colors ${isExpanded ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-300 group-hover:bg-blue-50 group-hover:text-blue-600'}`}>
                                            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                        </div>
                                    </div>
                                </div>

                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="overflow-hidden bg-slate-50/50 border-t border-slate-100"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                                                {/* Left Column: Job Info */}
                                                <div className="space-y-6">
                                                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Thông tin công việc</h5>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-white rounded-xl text-blue-600 shadow-sm border border-slate-100"><MapPin size={16} /></div>
                                                            <div className="flex flex-col">
                                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Địa điểm</span>
                                                                <span className="text-sm font-bold text-slate-700">{app.job?.location || '---'}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-white rounded-xl text-emerald-600 shadow-sm border border-slate-100"><DollarSign size={16} /></div>
                                                            <div className="flex flex-col">
                                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mức lương</span>
                                                                <span className="text-sm font-bold text-slate-700">
                                                                    {formatSalaryRange(app.job?.salaryMin || 0, app.job?.salaryMax || 0, locale, t('negotiable'))}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-white rounded-xl text-indigo-600 shadow-sm border border-slate-100"><Award size={16} /></div>
                                                            <div className="flex flex-col">
                                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kinh nghiệm</span>
                                                                <span className="text-sm font-bold text-slate-700">
                                                                    {app.job?.experienceYears ? `${app.job.experienceYears} năm` : 'Không yêu cầu'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-white rounded-xl text-orange-600 shadow-sm border border-slate-100"><Calendar size={16} /></div>
                                                            <div className="flex flex-col">
                                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hạn nộp</span>
                                                                <span className="text-sm font-bold text-slate-700">
                                                                    {app.job?.deadline ? formatDate(app.job.deadline) : 'Không thời hạn'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Right Column: Application Actions */}
                                                <div className="flex flex-col justify-between">
                                                    <div>
                                                        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Thao tác nhanh</h5>
                                                        <div className="flex flex-wrap gap-4">
                                                            <Button
                                                                variant="outline"
                                                                className="rounded-xl border-slate-200 hover:border-blue-600 hover:text-blue-600 bg-white"
                                                                icon={Briefcase}
                                                                onClick={() => router.push(`/jobs/${app.jobId}`)}
                                                            >
                                                                Xem chi tiết công việc
                                                            </Button>
                                                            {app.cvUrl !== "unskilled-no-cv" && (
                                                                <a href={app.cvUrl} target="_blank" rel="noopener noreferrer">
                                                                    <Button
                                                                        variant="outline"
                                                                        className="rounded-xl border-slate-200 hover:border-emerald-600 hover:text-emerald-600 bg-white"
                                                                        icon={ExternalLink}
                                                                    >
                                                                        Xem CV đã nộp
                                                                    </Button>
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Status progress or similar info could go here */}
                                                    <div className="mt-8 p-4 bg-white/50 border border-slate-200/50 rounded-2xl">
                                                        <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                                            <HelpCircle size={14} className="inline mr-1.5 text-blue-500 mb-0.5" />
                                                            Đơn ứng tuyển của bạn hiện đang ở trạng thái <span className="font-bold text-blue-600">{app.status}</span>.
                                                            Nhà tuyển dụng sẽ xem xét hồ sơ của bạn và liên hệ nếu phù hợp.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Decorative background element on hover */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-l from-blue-50/0 to-transparent rounded-bl-full -z-10 opacity-0 group-hover:from-blue-50/50 group-hover:opacity-100 transition-all duration-700"></div>
                            </Card>
                        </Fragment>
                    );
                }) : (
                    <div className="py-24 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100 flex flex-col items-center shadow-sm">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-6 group hover:scale-110 transition-transform">
                            <Briefcase size={32} />
                        </div>
                        <p className="text-slate-500 font-bold text-lg">{t('noApplicationsYet')}</p>
                        <p className="text-slate-400 text-sm mt-2 mb-8 max-w-xs">
                            Khám phá hàng ngàn công việc hấp dẫn và nộp đơn ngay hôm nay!
                        </p>
                        <Button
                            variant="primary"
                            className="rounded-2xl px-8 py-4 shadow-xl shadow-blue-200"
                            onClick={() => router.push('/')}
                        >
                            {t('browseJobs')}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
