"use client";
import { useEffect, useState } from "react";
import { ApplicationService } from "@/services/applicationService";
import { Application } from "@/models/User";
import { FileText, Calendar, User, Briefcase, ExternalLink, Search, Filter, XCircle, CheckCircle, Clock, HelpCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Dropdown from "@/components/ui/Dropdown";
import { formatDate } from "@/lib/utils";

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

    const handleStatusChange = async (id: string, newStatus: string) => {
        setApplications(apps => apps.map(app => app.id === id ? { ...app, status: newStatus as any } : app));
        try { await ApplicationService.updateStatus(id, newStatus as any); } catch (e) { loadApplications(); }
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
        <div className="space-y-8">
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
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead>
                            <tr className="bg-gray-50/30 text-[10px] font-black uppercase tracking-widest text-gray-400">
                                <th className="px-8 py-4 text-left">Ứng viên</th><th className="px-6 py-4 text-left">Công việc</th><th className="px-6 py-4 text-left">Ngày ứng tuyển</th><th className="px-6 py-4 text-left">Hồ sơ</th><th className="px-8 py-4 text-left">Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredApplications.map((app) => (
                                <tr key={app.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-8 py-5"><p className="text-sm font-black text-gray-900">{app.user?.name || 'Unknown'}</p></td>
                                    <td className="px-6 py-5"><p className="text-sm text-gray-700">{app.job?.title}</p></td>
                                    <td className="px-6 py-5"><p className="text-sm text-gray-500">{formatDate(app.createdAt)}</p></td>
                                    <td className="px-6 py-5">{app.cvUrl ? <a href={app.cvUrl} target="_blank"><Button variant="outline" size="sm" icon={FileText}>View CV</Button></a> : <span className="text-xs text-gray-300 italic">N/A</span>}</td>
                                    <td className="px-8 py-5"><Dropdown variant="small" value={app.status} options={statusOptions.filter(o => o.value !== 'all')} onChange={(val) => handleStatusChange(app.id, val)} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}