"use client";

import { useEffect, useState } from "react";
import { JobService } from "@/services/jobService";
import { ApplicationService } from "@/services/applicationService";
import { UserService } from "@/services/userService";
import { Card } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import StatCard from "@/components/ui/StatCard";
import { Briefcase, FileText, Users, ChevronRight, MapPin, DollarSign } from "lucide-react";
import Link from "next/link";
import { getJobStatusColor } from "@/utils/jobUtils";

export default function AdminDashboardPage() {
    const [stats, setStats] = useState({ jobs: 0, applications: 0, users: 0 });
    const [recentJobs, setRecentJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [jobsData, apps, users] = await Promise.all([
                    JobService.getAllJobs().catch(() => ({ items: [], total: 0 })),
                    ApplicationService.getAllApplications().catch(() => []),
                    UserService.getAllUsers().catch(() => [])
                ]);

                setStats({ jobs: jobsData.total || 0, applications: apps.length, users: users.length });
                const sortedJobs = [...(jobsData.items || [])].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
                setRecentJobs(sortedJobs);
            } catch (e) { console.error(e); } finally { setLoading(false); }
        };
        fetchData();
    }, []);

    if (loading) return <div className="min-h-[400px] flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

    return (
        <div className="space-y-10">
            <div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Dashboard Overview</h1>
                <p className="text-gray-500 font-medium mt-1">Chào mừng trở lại! Đây là tóm tắt hoạt động hệ thống.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <StatCard title="Tổng việc làm" value={stats.jobs} icon={Briefcase} color="bg-blue-600 shadow-blue-200" trend={12} />
                <StatCard title="Hồ sơ ứng tuyển" value={stats.applications} icon={FileText} color="bg-purple-600 shadow-purple-200" trend={8} />
                <StatCard title="Người dùng" value={stats.users} icon={Users} color="bg-green-600 shadow-green-200" trend={24} />
            </div>

            <section className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Việc làm mới đăng</h2>
                    <Link href="/admin/jobs" className="text-sm font-bold text-blue-600 hover:underline flex items-center gap-1">Xem tất cả <ChevronRight size={16} /></Link>
                </div>
                
                <Card noPadding className="border-none shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead>
                                <tr className="bg-gray-50/30 text-[10px] font-black uppercase tracking-widest text-gray-400"><th className="px-8 py-4 text-left">Công việc</th><th className="px-6 py-4 text-left">Địa điểm</th><th className="px-6 py-4 text-left">Lương</th><th className="px-6 py-4 text-left">Trạng thái</th></tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {recentJobs.map((job) => (
                                    <tr key={job.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-8 py-5 text-sm font-bold text-gray-900">{job.title}</td>
                                        <td className="px-6 py-5 text-sm text-gray-500 font-medium">{job.location}</td>
                                        <td className="px-6 py-5 text-sm text-blue-600 font-black tracking-tight">{job.salaryMin ? `${job.salaryMin} - ${job.salaryMax}` : 'T.Thuận'}</td>
                                        <td className="px-6 py-5"><Badge variant={getJobStatusColor(job.status)} isDot>{job.status}</Badge></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </section>
        </div>
    );
}
