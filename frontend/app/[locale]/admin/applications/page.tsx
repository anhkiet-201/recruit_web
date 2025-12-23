"use client";
import { useEffect, useState, Fragment } from "react";
import { ApplicationService } from "@/services/applicationService";
import { Application } from "@/models/User";
import { FileText, Calendar, User, Briefcase, ExternalLink, Search, Filter, XCircle, CheckCircle, Clock, HelpCircle, ChevronDown, ChevronUp, Phone, MapPin, Mail } from "lucide-react";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Dropdown from "@/components/ui/Dropdown";
import { formatDate } from "@/lib/utils";

export default function AdminApplicationsPage() {
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [jobFilter, setJobFilter] = useState("all");

    useEffect(() => { loadApplications(); }, []);

    const loadApplications = async () => {
        setLoading(true);
        try {
            const data = await ApplicationService.getAllApplications();
            setApplications(data);
        } catch (error) { console.error(error); } finally { setLoading(false); }
    };

    const handleStatusChange = async (id: string, newStatus: string) => {
        setApplications(apps => apps.map(app => app.id === id ? { ...app, status: newStatus as any } : app));
        try { await ApplicationService.updateStatus(id, newStatus as any); } catch (e) { loadApplications(); }
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
        { value: "expired", label: "Expired", icon: XCircle },
    ];

    const uniqueJobOptions = [
        { value: "all", label: "Tất cả công việc", icon: Briefcase },
        ...Array.from(new Set(applications.map(app => app.job?.title).filter((t): t is string => !!t)))
            .map(title => ({ value: title, label: title, icon: Briefcase }))
    ];

    const filteredApplications = applications.filter(app => {
        const name = app.user?.name?.toLowerCase() || "";
        const email = app.user?.email?.toLowerCase() || "";
        const search = searchTerm.toLowerCase();
        return (name.includes(search) || email.includes(search)) &&
            (statusFilter === "all" || app.status === statusFilter) &&
            (jobFilter === "all" || app.job?.title === jobFilter);
    });

    if (loading) return <div className="min-h-[400px] flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

    return (
        <div className="space-y-8 pb-20">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Manage Applications</h1>
                    <p className="text-gray-500 font-medium mt-1">Review and manage candidate recruitment records</p>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="w-full md:flex-1"><Input icon={Search} placeholder="Tìm ứng viên..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
                <div className="w-full md:w-72"><Dropdown icon={Briefcase} options={uniqueJobOptions} value={jobFilter} onChange={setJobFilter} /></div>
                <div className="w-full md:w-64"><Dropdown icon={Filter} options={statusOptions} value={statusFilter} onChange={setStatusFilter} /></div>
            </div>

            <Card noPadding className="border-none shadow-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr className="bg-gray-50/50 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100">
                                <th className="px-6 py-4 text-center w-12">#</th>
                                <th className="px-6 py-4 text-left">Ứng viên</th>
                                <th className="px-6 py-4 text-left">Công việc</th>
                                <th className="px-6 py-4 text-left">Ngày nộp</th>
                                <th className="px-6 py-4 text-left">Trạng thái</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredApplications.map((app) => {
                                const isExpanded = expandedRows.has(app.id);
                                return (
                                    <Fragment key={app.id}>
                                        <tr onClick={() => toggleRow(app.id)} className={`transition-colors cursor-pointer ${isExpanded ? 'bg-blue-50/30' : 'hover:bg-gray-50/50'}`}>
                                            <td className="px-6 py-5 text-center">
                                                <button className="p-1 rounded-full hover:bg-gray-200 text-gray-400 transition-colors">
                                                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                </button>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-600 font-bold overflow-hidden border border-white shadow-sm">
                                                        {app.user?.avatarUrl ? <img src={app.user.avatarUrl} alt="" className="h-full w-full object-cover" /> : <User size={18} />}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-gray-900">{app.user?.name || 'Unknown'}</p>
                                                        <p className="text-xs text-gray-400">{app.user?.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5"><p className="text-sm font-bold text-gray-700">{app.job?.title}</p></td>
                                            <td className="px-6 py-5"><p className="text-sm text-gray-500 font-medium">{formatDate(app.createdAt)}</p></td>
                                            <td className="px-6 py-5">
                                                <div onClick={e => e.stopPropagation()}>
                                                    <Dropdown variant="small" value={app.status} options={statusOptions.filter(o => o.value !== 'all')} onChange={(val) => handleStatusChange(app.id, val)} />
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                {app.cvUrl ? (
                                                    <a href={app.cvUrl} target="_blank" onClick={e => e.stopPropagation()} className="inline-block">
                                                        <Button variant="outline" size="sm" icon={FileText} className="text-xs h-8">CV</Button>
                                                    </a>
                                                ) : <span className="text-xs text-gray-300 italic">No CV</span>}
                                            </td>
                                        </tr>
                                        {isExpanded && (
                                            <tr className="bg-blue-50/10">
                                                <td colSpan={6} className="px-6 py-0 border-b border-gray-100">
                                                    <div className="py-6 pl-14 grid grid-cols-1 md:grid-cols-3 gap-8">
                                                        <div className="space-y-4">
                                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Thông tin liên hệ</h4>
                                                            <div className="space-y-3">
                                                                <div className="flex items-center gap-3 group">
                                                                    <div className="p-2 bg-white border border-gray-100 rounded-lg text-gray-400 group-hover:text-blue-500 group-hover:border-blue-100 transition-colors"><Mail size={16} /></div>
                                                                    <span className="text-sm font-medium text-gray-700 select-all">{app.user?.email || 'N/A'}</span>
                                                                </div>
                                                                <div className="flex items-center gap-3 group">
                                                                    <div className="p-2 bg-white border border-gray-100 rounded-lg text-gray-400 group-hover:text-green-500 group-hover:border-green-100 transition-colors"><Phone size={16} /></div>
                                                                    <span className="text-sm font-medium text-gray-700 select-all">{app.user?.phone || 'Chưa cập nhật SĐT'}</span>
                                                                </div>
                                                                <div className="flex items-center gap-3 group">
                                                                    <div className="p-2 bg-white border border-gray-100 rounded-lg text-gray-400 group-hover:text-red-500 group-hover:border-red-100 transition-colors"><MapPin size={16} /></div>
                                                                    <span className="text-sm font-medium text-gray-700">{app.user?.address || 'Chưa cập nhật địa chỉ'}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Can add more details here like Education, Skills if available in backend response */}
                                                        <div className="md:col-span-2 space-y-4">
                                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Quick Actions</h4>
                                                            <div className="flex gap-3">
                                                                <a href={`mailto:${app.user?.email}`} className="bg-white border border-gray-200 hover:border-blue-300 hover:text-blue-600 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm">Gửi Email</a>
                                                                {app.user?.phone && <a href={`tel:${app.user.phone}`} className="bg-white border border-gray-200 hover:border-green-300 hover:text-green-600 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm">Gọi điện</a>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}