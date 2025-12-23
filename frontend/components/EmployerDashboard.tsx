"use client";

import { useState, useEffect, Fragment, useRef } from "react";
import { JobService } from "@/services/jobService";
import { ApplicationService } from "@/services/applicationService";
import { Job } from "@/models/Job";
import { Application } from "@/models/User";
import { useAuth } from "@/components/AuthProvider";
import {
    Briefcase, FileText, Plus, Search, MapPin,
    Eye, Edit, Clock, CheckCircle,
    XCircle, Mail, Filter, User as UserIcon, Camera, Save, X, HelpCircle
} from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import ApplicationTableRow from "@/components/ApplicationTableRow";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { formatDate, formatSalaryRange } from "@/lib/utils";
import { JobStatus } from "@/models/JobStatus";
import { getJobStatusColor } from "@/utils/jobUtils";
import { UserService } from "@/services/userService";
import Image from "next/image";

export default function EmployerDashboard() {
    const { profile, refreshProfile } = useAuth();
    const [activeTab, setActiveTab] = useState<'jobs' | 'applications' | 'profile'>('jobs');
    const [jobs, setJobs] = useState<Job[]>([]);
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    // Profile Editing State
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [profileFormData, setProfileFormData] = useState({ name: "", phone: "", address: "" });
    const [savingProfile, setSavingProfile] = useState(false);
    const [avatarUploading, setAvatarUploading] = useState(false);
    const avatarInputRef = useRef<HTMLInputElement>(null);

    const statusOptions = [
        { value: "pending", label: "Pending", icon: Clock },
        { value: "reviewed", label: "Reviewed", icon: HelpCircle },
        { value: "accepted", label: "Accepted", icon: CheckCircle },
        { value: "rejected", label: "Rejected", icon: XCircle },
        { value: "expired", label: "Expired", icon: XCircle },
    ];

    useEffect(() => {
        if (activeTab !== 'profile') {
            loadData();
        } else if (profile) {
            setProfileFormData({
                name: profile.name || "",
                phone: profile.phone || "",
                address: profile.address || ""
            });
        }
    }, [activeTab, profile]);

    const loadData = async () => {
        if (!profile?.id) return;
        setLoading(true);
        try {
            if (activeTab === 'jobs') {
                const data = await JobService.getAllJobs({ authorId: profile.id, limit: 100 });
                setJobs(data.items);
            } else if (activeTab === 'applications') {
                const data = await ApplicationService.getEmployerApplications();
                setApplications(data);
            }
        } catch (error) {
            console.error("Failed to load employer data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        if (!profile?.id) return;
        setSavingProfile(true);
        try {
            await UserService.updateProfile(profile.id, profileFormData);
            await refreshProfile();
            setIsEditingProfile(false);
            alert("Cập nhật thông tin thành công!");
        } catch (error) {
            alert("Không thể cập nhật thông tin.");
        } finally {
            setSavingProfile(false);
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && profile?.id) {
            setAvatarUploading(true);
            try {
                await UserService.uploadAvatar(e.target.files[0]);
                await refreshProfile();
            } catch (error) {
                alert("Không thể tải ảnh lên.");
            } finally {
                setAvatarUploading(false);
            }
        }
    };

    const handleApplicationStatus = async (id: string, status: any) => {
        try {
            await ApplicationService.updateStatus(id, status);
            setApplications(prev => prev.map(app => app.id === id ? { ...app, status } : app));
        } catch (error) {
            alert("Failed to update status");
        }
    };

    const toggleRow = (id: string) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(id)) newExpanded.delete(id);
        else newExpanded.add(id);
        setExpandedRows(newExpanded);
    };

    const filteredJobs = jobs.filter(j => j.title.toLowerCase().includes(searchTerm.toLowerCase()));
    const filteredApps = applications.filter(app =>
    (app.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.job?.title?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="space-y-8 pb-10">
            {/* Header & Title */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    {activeTab === 'jobs' && (
                        <Link href="/dashboard/jobs/new">
                            <Button icon={Plus} size="sm">Đăng tin mới</Button>
                        </Link>
                    )}
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "Tổng tin đăng", value: jobs.length, icon: Briefcase, color: "blue" },
                    { label: "Tin đang tuyển", value: jobs.filter(j => j.status === JobStatus.ACTIVE).length, icon: CheckCircle, color: "emerald" },
                    { label: "Tổng hồ sơ", value: applications.length, icon: FileText, color: "indigo" },
                    { label: "Hồ sơ mới", value: applications.filter(a => a.status === 'pending').length, icon: Clock, color: "orange" },
                ].map((stat, i) => (
                    <Card key={i} className={`relative overflow-hidden border-none shadow-xl hover:shadow-2xl transition-all group`}>
                        <div className={`absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 bg-${stat.color}-500/5 rounded-full blur-3xl group-hover:bg-${stat.color}-500/10 transition-colors`}></div>
                        <div className="flex items-center gap-5 relative z-10">
                            <div className={`w-14 h-14 bg-${stat.color}-50 flex items-center justify-center rounded-2xl text-${stat.color}-600 border border-${stat.color}-100 shadow-sm`}>
                                <stat.icon size={28} />
                            </div>
                            <div>
                                <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">{stat.label}</p>
                                <h3 className="text-3xl font-black text-gray-900">{stat.value}</h3>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Main Content Area */}
            <Card noPadding className="border-none shadow-2xl overflow-hidden bg-white/80 backdrop-blur-xl">
                {/* Custom Tabs */}
                <div className="flex bg-gray-50/50 p-1.5 gap-1.5 border-b border-gray-100">
                    <button
                        onClick={() => { setActiveTab('jobs'); setSearchTerm(""); }}
                        className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'jobs' ? 'bg-white text-blue-600 shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                    >
                        <Briefcase size={16} /> Quản lý Tin tuyển dụng
                    </button>
                    <button
                        onClick={() => { setActiveTab('applications'); setSearchTerm(""); }}
                        className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'applications' ? 'bg-white text-blue-600 shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                    >
                        <FileText size={16} /> Quản lý Hồ sơ ứng tuyển
                    </button>
                    <button
                        onClick={() => { setActiveTab('profile'); setSearchTerm(""); }}
                        className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'profile' ? 'bg-white text-blue-600 shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                    >
                        <UserIcon size={16} /> Thông tin cá nhân
                    </button>
                </div>

                {activeTab === 'profile' ? (
                    <div className="p-8 lg:p-12">
                        <div className="max-w-4xl mx-auto">
                            <div className="flex flex-col md:flex-row gap-12 items-start">
                                {/* Avatar Section */}
                                <div className="shrink-0 flex flex-col items-center">
                                    <div className="relative group">
                                        <div className="w-40 h-40 bg-gray-50 rounded-[3rem] overflow-hidden border-4 border-white shadow-2xl relative">
                                            {profile?.avatarUrl ? (
                                                <Image src={profile.avatarUrl} alt="Avatar" fill className="object-cover" unoptimized />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-4xl font-black text-blue-600 bg-blue-50 uppercase">
                                                    {profile?.name?.charAt(0)}
                                                </div>
                                            )}
                                            {avatarUploading && (
                                                <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-20">
                                                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => avatarInputRef.current?.click()}
                                            className="absolute -bottom-2 -right-2 w-12 h-12 bg-white rounded-2xl shadow-xl border border-gray-100 flex items-center justify-center text-blue-600 hover:bg-blue-600 hover:text-white transition-all transform hover:scale-110 active:scale-95"
                                        >
                                            <Camera size={20} />
                                        </button>
                                        <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                                    </div>
                                    <p className="mt-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Ảnh đại diện</p>
                                </div>

                                {/* Form Section */}
                                <div className="flex-1 space-y-8 w-full">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Hồ sơ Nhà tuyển dụng</h2>
                                            <p className="text-gray-500 text-sm font-medium">Thông tin này sẽ hiển thị trên các tin tuyển dụng của bạn.</p>
                                        </div>
                                        <Button
                                            variant={isEditingProfile ? "ghost" : "outline"}
                                            size="sm"
                                            icon={isEditingProfile ? X : Edit}
                                            onClick={() => setIsEditingProfile(!isEditingProfile)}
                                        >
                                            {isEditingProfile ? "Hủy" : "Chỉnh sửa"}
                                        </Button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Input
                                            label="Họ và tên / Tên tổ chức"
                                            value={isEditingProfile ? profileFormData.name : (profile?.name || "N/A")}
                                            readOnly={!isEditingProfile}
                                            onChange={e => setProfileFormData({ ...profileFormData, name: e.target.value })}
                                            className={!isEditingProfile ? "opacity-80" : ""}
                                        />
                                        <Input
                                            label="Số điện thoại liên hệ"
                                            value={isEditingProfile ? profileFormData.phone : (profile?.phone || "N/A")}
                                            readOnly={!isEditingProfile}
                                            onChange={e => setProfileFormData({ ...profileFormData, phone: e.target.value })}
                                            className={!isEditingProfile ? "opacity-80" : ""}
                                        />
                                        <div className="md:col-span-2">
                                            <Input
                                                label="Địa chỉ văn phòng / Công ty"
                                                value={isEditingProfile ? profileFormData.address : (profile?.address || "N/A")}
                                                readOnly={!isEditingProfile}
                                                onChange={e => setProfileFormData({ ...profileFormData, address: e.target.value })}
                                                className={!isEditingProfile ? "opacity-80" : ""}
                                            />
                                        </div>
                                    </div>

                                    {isEditingProfile && (
                                        <div className="pt-4 flex justify-end">
                                            <Button
                                                icon={Save}
                                                className="px-8 shadow-lg shadow-blue-200"
                                                onClick={handleSaveProfile}
                                                isLoading={savingProfile}
                                            >
                                                Lưu thay đổi
                                            </Button>
                                        </div>
                                    )}

                                    {!isEditingProfile && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                                            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-4">
                                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm"><Mail size={18} /></div>
                                                <div>
                                                    <p className="text-[9px] font-black text-gray-400 uppercase">Email đăng nhập</p>
                                                    <p className="text-sm font-bold text-gray-700">{profile?.email}</p>
                                                </div>
                                            </div>
                                            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-4">
                                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm"><CheckCircle size={18} /></div>
                                                <div>
                                                    <p className="text-[9px] font-black text-gray-400 uppercase">Trạng thái tài khoản</p>
                                                    <p className="text-sm font-bold text-emerald-600">Đã xác thực</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Toolbar */}
                        <div className="p-6 flex flex-col md:flex-row gap-4 items-center border-b border-gray-100">
                            <div className="flex-1 w-full relative">
                                <Input
                                    icon={Search}
                                    placeholder={activeTab === 'jobs' ? "Tìm kiếm theo tiêu đề công việc..." : "Tìm tên ứng viên hoặc vị trí ứng tuyển..."}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="bg-gray-50/50 border-gray-100 focus:bg-white transition-all"
                                />
                            </div>
                            <div className="flex gap-2 w-full md:w-auto">
                                <Button variant="outline" size="sm" icon={Filter} className="flex-1 md:flex-none">Bộ lọc</Button>
                            </div>
                        </div>

                        {/* Table Section */}
                        <div className="overflow-x-auto">
                            {loading ? (
                                <div className="py-32 flex flex-col items-center justify-center gap-4">
                                    <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
                                    <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Đang tải dữ liệu...</p>
                                </div>
                            ) : activeTab === 'jobs' ? (
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-gray-50/30 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100">
                                            <th className="px-8 py-5">Công việc & Thông tin</th>
                                            <th className="px-6 py-5">Mức lương</th>
                                            <th className="px-6 py-5 text-center">Hiệu quả</th>
                                            <th className="px-6 py-5">Thời hạn</th>
                                            <th className="px-6 py-5">Trạng thái</th>
                                            <th className="px-8 py-5 text-right">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {filteredJobs.length === 0 ? (
                                            <tr><td colSpan={6} className="py-20 text-center text-gray-400 font-bold italic">Không tìm thấy tin đăng nào phù hợp.</td></tr>
                                        ) : filteredJobs.map(job => (
                                            <tr key={job.id} className="hover:bg-blue-50/20 transition-colors group">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-2xl overflow-hidden border border-gray-100 shrink-0 shadow-sm transition-transform group-hover:scale-105">
                                                            <img src={job.imageUrl || "https://placehold.co/100?text=Job"} alt="" className="w-full h-full object-cover" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="font-black text-gray-900 group-hover:text-blue-600 transition-colors">{job.title}</p>
                                                            <div className="flex items-center gap-3">
                                                                <p className="text-[10px] font-bold text-gray-400 flex items-center gap-1 uppercase tracking-wider">
                                                                    <MapPin size={10} /> {job.location}
                                                                </p>
                                                                {job.jobType && (
                                                                    <span className="text-[10px] py-0.5 px-2 bg-gray-100 text-gray-500 rounded-md font-bold uppercase tracking-widest italic">{job.jobType}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6">
                                                    <p className="text-sm font-black text-emerald-600 whitespace-nowrap">
                                                        {formatSalaryRange(job.salaryMin, job.salaryMax)}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-6 text-center">
                                                    <div className="flex items-center justify-center gap-6">
                                                        <div className="text-center">
                                                            <p className="text-[10px] font-black text-gray-400 uppercase">CV</p>
                                                            <p className="text-lg font-black text-blue-600 leading-none">{(job as any)._count?.applications || 0}</p>
                                                        </div>
                                                        <div className="text-center border-l border-gray-100 pl-6">
                                                            <p className="text-[10px] font-black text-gray-400 uppercase">Xem</p>
                                                            <p className="text-lg font-black text-gray-700 leading-none">{job.views || 0}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 whitespace-nowrap">
                                                            <Clock size={12} className="text-gray-400" /> {formatDate(job.deadline)}
                                                        </div>
                                                        <p className="text-[10px] text-gray-300 font-bold uppercase">Hết hạn</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6">
                                                    <Badge variant={getJobStatusColor(job.status)} isDot className="px-3 py-1 text-[9px] shadow-sm">{job.status}</Badge>
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Link href={`/jobs/${job.id}`} target="_blank"><Button variant="ghost" size="sm" icon={Eye} className="p-2"></Button></Link>
                                                        <Link href={`/dashboard/jobs/edit/${job.id}`}><Button variant="ghost" size="sm" icon={Edit} className="p-2 text-orange-500"></Button></Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50/30 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100">
                                            <th className="px-8 py-5 w-16"></th>
                                            <th className="px-6 py-5">Ứng viên</th>
                                            <th className="px-6 py-5">Vị trí ứng tuyển</th>
                                            <th className="px-6 py-5">Ngày nộp</th>
                                            <th className="px-6 py-5 text-center">Trạng thái</th>
                                            <th className="px-8 py-5 text-right">CV</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {filteredApps.length === 0 ? (
                                            <tr><td colSpan={6} className="py-20 text-center text-gray-400 font-bold italic">Chưa có hồ sơ ứng tuyển nào.</td></tr>
                                        ) : filteredApps.map(app => (
                                            <ApplicationTableRow
                                                key={app.id}
                                                application={app}
                                                isExpanded={expandedRows.has(app.id)}
                                                onToggle={() => toggleRow(app.id)}
                                                statusOptions={statusOptions}
                                                onStatusChange={(val) => handleApplicationStatus(app.id, val)}
                                            />
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </>
                )}
            </Card>
        </div>
    );
}