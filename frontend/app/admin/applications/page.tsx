"use client";
import { useEffect, useState } from "react";
import { ApplicationService } from "@/services/applicationService";
import { Application } from "@/models/User";
import { FileText, Calendar, User, Briefcase, ExternalLink, Search, Filter, XCircle, Clock, CheckCircle, XCircle as RedXCircle, HelpCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Dropdown from "@/components/ui/Dropdown";

export default function AdminApplicationsPage() {
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);

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

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    };

    const handleStatusChange = async (id: string, newStatus: string) => {
        setApplications(apps => apps.map(app => app.id === id ? { ...app, status: newStatus as any } : app));
        try { await ApplicationService.updateStatus(id, newStatus as any); } catch (e) { loadApplications(); }
    };

    const statusOptions = [
        { value: "all", label: "Tất cả trạng thái", icon: Filter },
        { value: "pending", label: "Pending", icon: Clock },
        { value: "reviewed", label: "Reviewed", icon: HelpCircle },
        { value: "accepted", label: "Accepted", icon: CheckCircle },
        { value: "rejected", label: "Rejected", icon: RedXCircle },
        { value: "expired", label: "Expired", icon: XCircle },
    ];

    const uniqueJobOptions = [
        { value: "all", label: "Tất cả công việc", icon: Briefcase },
        ...Array.from(new Set(applications.map(app => app.job?.title).filter(Boolean)))
            .map(title => ({ value: title, label: title, icon: Briefcase }))
    ];

    const filteredApplications = applications.filter(app => {
        const name = (app.user as any)?.name?.toLowerCase() || "";
        const email = (app.user as any)?.email?.toLowerCase() || "";
        const search = searchTerm.toLowerCase();
        return (name.includes(search) || email.includes(search)) && 
               (statusFilter === "all" || app.status === statusFilter) && 
               (jobFilter === "all" || app.job?.title === jobFilter);
    });

    if (loading) return <div className="min-h-[400px] flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Manage Applications</h1>
                    <p className="text-gray-500 font-medium mt-1">Review and manage candidate recruitment records</p>
                </div>
                <div className="bg-white px-6 py-2.5 rounded-2xl shadow-xl shadow-gray-100/50 border border-gray-100 flex items-center gap-2">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Tổng số hồ sơ:</span>
                    <span className="text-sm font-black text-blue-600">{filteredApplications.length}</span>
                    <span className="text-gray-200">/</span>
                    <span className="text-sm font-black text-gray-900">{applications.length}</span>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="w-full md:flex-1">
                    <Input icon={Search} placeholder="Tìm ứng viên..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <div className="w-full md:w-72">
                    <Dropdown 
                        icon={Briefcase} 
                        options={uniqueJobOptions} 
                        value={jobFilter} 
                        onChange={setJobFilter} 
                    />
                </div>
                <div className="w-full md:w-64">
                    <Dropdown 
                        icon={Filter} 
                        options={statusOptions} 
                        value={statusFilter} 
                        onChange={setStatusFilter} 
                    />
                </div>
                {(searchTerm || statusFilter !== 'all' || jobFilter !== 'all') && (
                    <Button variant="ghost" icon={XCircle} onClick={() => {setSearchTerm(""); setStatusFilter("all"); setJobFilter("all");}}>Clear</Button>
                )}
            </div>

            <Card noPadding className="border-none shadow-2xl overflow-visible">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead>
                            <tr className="bg-gray-50/30 text-[10px] font-black uppercase tracking-widest text-gray-400">
                                <th className="px-8 py-4 text-left">Ứng viên</th>
                                <th className="px-6 py-4 text-left">Công việc</th>
                                <th className="px-6 py-4 text-left">Ngày ứng tuyển</th>
                                <th className="px-6 py-4 text-left">Hồ sơ</th>
                                <th className="px-8 py-4 text-left">Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredApplications.map((app) => (
                                <tr key={app.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 font-bold shadow-inner">
                                                <User size={18} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-gray-900">{(app.user as any)?.name || 'Unknown'}</p>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{(app.user as any)?.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                                            <Briefcase size={14} className="text-gray-300" /> {app.job?.title}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2 text-sm font-bold text-gray-500">
                                            <Calendar size={14} className="text-gray-300" /> {formatDate(app.createdAt)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        {app.cvUrl ? (
                                            <a href={app.cvUrl} target="_blank" rel="noopener noreferrer">
                                                <Button variant="outline" size="sm" icon={FileText} className="text-[10px] h-8 shadow-md">View CV</Button>
                                            </a>
                                        ) : <span className="text-xs text-gray-300 italic">No CV</span>}
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="w-40">
                                            <Dropdown
                                                variant="small"
                                                value={app.status}
                                                options={statusOptions.filter(o => o.value !== 'all')}
                                                onChange={(val) => handleStatusChange(app.id, val)}
                                                className="shadow-md"
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}