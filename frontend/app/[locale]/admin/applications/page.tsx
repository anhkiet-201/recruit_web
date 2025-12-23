"use client";
import { useEffect, useState, Fragment } from "react";
import { ApplicationService } from "@/services/applicationService";
import { Application } from "@/models/User";
import { FileText, Calendar, User, Briefcase, ExternalLink, Search, Filter, XCircle, CheckCircle, Clock, HelpCircle, ChevronDown, ChevronUp, Phone, MapPin, Mail } from "lucide-react";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Dropdown from "@/components/ui/Dropdown";
import ApplicationTableRow from "@/components/ApplicationTableRow";
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
                            {filteredApplications.map((app) => (
                                <ApplicationTableRow
                                    key={app.id}
                                    application={app}
                                    isExpanded={expandedRows.has(app.id)}
                                    onToggle={() => toggleRow(app.id)}
                                    statusOptions={statusOptions.filter(o => o.value !== 'all')}
                                    onStatusChange={(val) => handleStatusChange(app.id, val)}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}