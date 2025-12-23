"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { JobService } from "@/services/jobService";
import { useConfirm } from "@/contexts/ConfirmDialogContext";
import ImportJobDialog from "@/components/ImportJobDialog";
import { Card, CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Dropdown from "@/components/ui/Dropdown";
import Badge from "@/components/ui/Badge";
import {
    Plus, Search, MapPin, DollarSign,
    Trash2, Edit, Eye, Users, Filter, XCircle, Upload, Calendar, X,
    CheckCircle, Clock, FileText, HelpCircle, Briefcase
} from "lucide-react";
import { JobStatus } from "@/models/JobStatus";
import { getJobStatusColor } from "@/utils/jobUtils";

export default function ManageJobsPage() {
    const { confirm } = useConfirm();
    const [jobs, setJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedJobIds, setSelectedJobIds] = useState<string[]>([]);
    const [showImportDialog, setShowImportDialog] = useState(false);

    // Ref to prevent double fetch in Strict Mode
    const isMounted = useRef(false);

    const [searchTerm, setSearchTerm] = useState("");
    const [authorSearchTerm, setAuthorSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [locationFilter, setLocationFilter] = useState("all");

    useEffect(() => {
        if (!isMounted.current) {
            loadJobs();
            isMounted.current = true;
        }
    }, []);

    const loadJobs = async () => {
        setLoading(true);
        try {
            const data = await JobService.getAllJobs({ limit: 100 });
            setJobs(data.items || []);
        } catch (error) {
            console.error("Failed to load jobs", error);
            setJobs([]);
        } finally {
            setLoading(false);
        }
    };

    const filteredJobs = jobs.filter(job => {
        const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase());
        const authorName = job.author?.name || 'Admin';
        const authorEmail = job.author?.email || 'System';
        const matchesAuthor =
            authorName.toLowerCase().includes(authorSearchTerm.toLowerCase()) ||
            authorEmail.toLowerCase().includes(authorSearchTerm.toLowerCase());

        let matchesStatus = true;
        if (statusFilter !== 'all') matchesStatus = job.status === statusFilter;

        const matchesLocation = locationFilter === 'all' || job.location === locationFilter;
        return matchesSearch && matchesAuthor && matchesStatus && matchesLocation;
    });

    const locationOptions = [
        { value: "all", label: "All Locations", icon: MapPin },
        ...Array.from(new Set(jobs.map(j => j.location).filter((t): t is string => !!t)))
            .map(loc => ({ value: loc, label: loc, icon: MapPin }))
    ];

    const statusOptions = [
        { value: "all", label: "All Status", icon: Filter },
        { value: JobStatus.ACTIVE, label: "Active", icon: CheckCircle },
        { value: JobStatus.REVIEWING, label: "Reviewing", icon: Clock },
        { value: JobStatus.DRAFT, label: "Draft", icon: FileText },
        { value: JobStatus.EXPIRED, label: "Expired", icon: Clock },
    ];

    const handleApprove = async (id: string, status: JobStatus) => {
        try {
            await JobService.approveJob(id, status as any);
            setJobs(prev => prev.map(j => j.id === id ? { ...j, status } : j));
        } catch (error) {
            alert("Failed to update status");
        }
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedJobIds(e.target.checked ? filteredJobs.map(job => job.id) : []);
    };

    const handleSelectJob = (id: string) => {
        setSelectedJobIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleDelete = async (id: string) => {
        const job = jobs.find(j => j.id === id);
        if (!job) return;

        const applicationCount = job._count?.applications || 0;

        if (applicationCount > 0) {
            const ok = await confirm({
                title: "Cannot Delete Job",
                message: "This job has generated applications and cannot be deleted. Would you like to mark it as expired instead to stop receiving new applications?",
                confirmText: "Expire Job",
                isDanger: false
            });

            if (ok) {
                try {
                    // Set status to EXPIRED
                    await JobService.updateJob(id, { status: JobStatus.EXPIRED });
                    setJobs(prev => prev.map(j => j.id === id ? { ...j, status: JobStatus.EXPIRED } : j));
                } catch (e) { console.error(e); alert("Failed to expire job"); }
            }
        } else {
            const ok = await confirm({
                title: "Delete Job",
                message: "Are you sure? This cannot be undone.",
                confirmText: "Delete Job",
                isDanger: true
            });
            if (!ok) return;
            try {
                await JobService.deleteJob(id);
                setJobs(prev => prev.filter(job => job.id !== id));
            } catch (e) { alert("Failed to delete"); }
        }
    };

    const handleBulkStatus = async (status: JobStatus) => {
        try {
            setJobs(prev => prev.map(job => selectedJobIds.includes(job.id) ? { ...job, status: status } : job));
            await Promise.all(selectedJobIds.map(id => JobService.updateJob(id, { status: status })));
        } catch (e) { loadJobs(); }
    };

    const handleToggleStatus = async (job: any) => {
        // Toggle logic: If ACTIVE -> DRAFT, If DRAFT -> ACTIVE, If EXPIRED -> DRAFT (or ACTIVE?)
        // Let's assume standard toggle is Active <-> Draft. Expired -> Draft.
        let newStatus = JobStatus.ACTIVE;
        if (job.status === JobStatus.ACTIVE) newStatus = JobStatus.DRAFT;

        const ok = await confirm({
            title: "Update Job Status",
            message: `Change status from ${job.status} to ${newStatus}?`,
            confirmText: "Update",
            isDanger: false
        });
        if (!ok) return;
        try {
            setJobs(jobs.map(j => j.id === job.id ? { ...j, status: newStatus } : j));
            await JobService.updateJob(job.id, { status: newStatus });
        } catch (e) { loadJobs(); }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading jobs...</div>;

    return (
        <div className="space-y-8 pb-24">
            <ImportJobDialog isOpen={showImportDialog} onClose={() => setShowImportDialog(false)} onSuccess={() => { setShowImportDialog(false); loadJobs(); }} />

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Manage Jobs</h1>
                    <p className="text-gray-500 font-medium">Create and manage your recruitment postings</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" icon={Upload} onClick={() => setShowImportDialog(true)}>Import Excel</Button>
                    <Link href="/admin/jobs/new">
                        <Button icon={Plus}>Post New Job</Button>
                    </Link>
                </div>
            </div>

            <Card noPadding className="border-none shadow-2xl">
                <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex flex-col md:flex-row gap-4 items-center">
                    <div className="w-full md:w-80">
                        <Input
                            icon={Search}
                            placeholder="Search job title..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="w-full md:w-64">
                        <Input
                            icon={Users}
                            placeholder="Author name or email..."
                            value={authorSearchTerm}
                            onChange={(e) => setAuthorSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                        <div className="w-full md:w-48">
                            <Dropdown
                                icon={MapPin}
                                options={locationOptions}
                                value={locationFilter}
                                onChange={setLocationFilter}
                            />
                        </div>
                        <div className="w-full md:w-48">
                            <Dropdown
                                icon={Filter}
                                options={statusOptions}
                                value={statusFilter}
                                onChange={setStatusFilter}
                            />
                        </div>
                        {(searchTerm || authorSearchTerm || statusFilter !== 'all' || locationFilter !== 'all') && (
                            <Button variant="ghost" size="sm" icon={XCircle} onClick={() => { setSearchTerm(""); setAuthorSearchTerm(""); setStatusFilter("all"); setLocationFilter("all"); }}>Clear</Button>
                        )}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr className="bg-gray-50/30">
                                <th className="px-8 py-4 text-left"><input type="checkbox" className="rounded-md border-gray-300 text-blue-600" checked={selectedJobIds.length === filteredJobs.length && filteredJobs.length > 0} onChange={handleSelectAll} /></th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Job Information</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Author</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Stats</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Deadline</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                                <th className="px-8 py-4 text-right text-[10px] font-black uppercase tracking-widest text-gray-400">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="">
                            {filteredJobs.map((job) => (
                                <tr key={job.id} className={`hover:bg-blue-50/30 transition-colors ${selectedJobIds.includes(job.id) ? "bg-blue-50/50" : ""}`}>
                                    <td className="px-8 py-5 text-left"><input type="checkbox" className="rounded-md border-gray-300 text-blue-600" checked={selectedJobIds.includes(job.id)} onChange={() => handleSelectJob(job.id)} /></td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-2xl overflow-hidden border border-gray-100 shadow-sm relative flex-shrink-0">
                                                <img src={job.imageUrl || "https://placehold.co/100?text=Job"} alt="" className="object-cover h-full w-full" />
                                            </div>
                                            <div>
                                                <p className="font-black text-gray-900 line-clamp-1">{job.title}</p>
                                                <p className="text-xs text-gray-400 font-bold flex items-center gap-1 mt-0.5 uppercase"><MapPin size={10} /> {job.location}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col">
                                            <button
                                                className="text-left hover:text-blue-600 transition-colors"
                                                onClick={() => setAuthorSearchTerm(job.author?.name || 'Admin')}
                                            >
                                                <p className="text-sm font-bold text-gray-700">{job.author?.name || 'Admin'}</p>
                                            </button>
                                            <button
                                                className="text-left hover:text-blue-600 transition-colors"
                                                onClick={() => setAuthorSearchTerm(job.author?.email || '')}
                                            >
                                                <p className="text-[10px] font-bold text-gray-400 uppercase">{job.author?.email || 'System'}</p>
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex gap-4">
                                            <div className="flex items-center gap-1.5 text-blue-600"><Users size={16} /> <span className="text-sm font-black">{job._count?.applications || 0}</span></div>
                                            <div className="flex items-center gap-1.5 text-gray-400"><Eye size={16} /> <span className="text-sm font-bold">{job.views || 0}</span></div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <p className="text-sm font-bold text-gray-700">{job.deadline ? new Date(job.deadline).toLocaleDateString('en-GB') : 'No Limit'}</p>
                                    </td>
                                    <td className="px-6 py-5">
                                        {(() => {
                                            return (
                                                <button onClick={() => handleToggleStatus(job)}>
                                                    <Badge variant={getJobStatusColor(job.status)} isDot>{job.status}</Badge>
                                                </button>
                                            );
                                        })()}
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex justify-end gap-2">
                                            {job.status === JobStatus.REVIEWING && (
                                                <>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        icon={CheckCircle}
                                                        className="p-2 text-green-600 hover:bg-green-50"
                                                        onClick={() => handleApprove(job.id, JobStatus.ACTIVE)}
                                                    />
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        icon={XCircle}
                                                        className="p-2 text-red-600 hover:bg-red-50"
                                                        onClick={() => handleApprove(job.id, JobStatus.REJECTED)}
                                                    />
                                                </>
                                            )}
                                            <Link href={`/jobs/${job.id}`} target="_blank"><Button variant="ghost" size="sm" icon={Eye} className="p-2"></Button></Link>
                                            <Link href={`/admin/jobs/edit/${job.id}`}><Button variant="ghost" size="sm" icon={Edit} className="p-2 text-orange-500 hover:bg-orange-50"></Button></Link>
                                            <Button variant="ghost" size="sm" icon={Trash2} onClick={() => handleDelete(job.id)} className="p-2 text-red-500 hover:bg-red-50"></Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {selectedJobIds.length > 0 && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white rounded-3xl shadow-2xl p-2.5 pl-6 flex items-center gap-6 animate-in slide-in-from-bottom-10 duration-500">
                    <span className="text-sm font-black tracking-widest uppercase">{selectedJobIds.length} Selected</span>
                    <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="text-green-400 hover:bg-white/10" onClick={() => handleBulkStatus(JobStatus.ACTIVE)}>Activate</Button>
                        <Button variant="ghost" size="sm" className="text-gray-400 hover:bg-white/10" onClick={() => handleBulkStatus(JobStatus.DRAFT)}>Draft</Button>
                        <Button variant="ghost" size="sm" icon={Trash2} className="text-red-400 hover:bg-white/10" onClick={() => handleDelete(selectedJobIds[0]) /* TODO: implement bulk delete */}>Delete</Button>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => setSelectedJobIds([])} className="bg-white/10 hover:bg-white/20 border-none p-2 rounded-2xl"><X size={18} /></Button>
                </div>
            )}
        </div>
    );
}