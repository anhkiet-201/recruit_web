"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import JobForm from "@/components/admin/JobForm";
import { JobService } from "@/services/jobService";
import { ArrowLeft } from "lucide-react";
import Button from "@/components/ui/Button";
import { useAuth } from "@/components/AuthProvider";

export default function EmployerEditJobPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { profile, loading } = useAuth();
    const [job, setJob] = useState<any>(null);
    const [pageLoading, setPageLoading] = useState(true);

    useEffect(() => {
        const fetchJob = async () => {
            try {
                const resolvedParams = await params;
                const data = await JobService.getJobById(resolvedParams.id, { incrementView: false });
                
                // Check ownership
                if (data && profile && data.authorId !== profile.id) {
                    alert("Bạn không có quyền chỉnh sửa tin này.");
                    router.push("/dashboard");
                    return;
                }
                
                setJob(data);
            } catch (error) {
                console.error("Failed to load job", error);
            } finally {
                setPageLoading(false);
            }
        };

        if (!loading && profile) {
            fetchJob();
        }
    }, [params, profile, loading, router]);

    const handleSubmit = async (data: any, selectedTags: string[]) => {
        if (!job) return;
        try {
            await JobService.updateJob(job.id, {
                ...data,
                tags: selectedTags,
                // If editing, it might go back to REVIEWING or stay same depending on logic.
                // Currently backend doesn't auto-reset status on update, but we might want to?
                // For now, keep as is.
            });
            alert("Cập nhật tin tuyển dụng thành công!");
            router.push("/dashboard");
        } catch (error) {
            console.error("Failed to update job", error);
            alert("Có lỗi xảy ra khi cập nhật tin.");
        }
    };

    if (loading || pageLoading) return <div className="p-8 text-center text-gray-500">Đang tải...</div>;
    if (!job) return <div className="p-8 text-center text-gray-500">Không tìm thấy tin tuyển dụng.</div>;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-6">
                <Button 
                    variant="ghost" 
                    icon={ArrowLeft} 
                    onClick={() => router.back()}
                    className="mb-4 text-gray-500 hover:text-gray-900 pl-0"
                >
                    Quay lại Dashboard
                </Button>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Chỉnh sửa tin tuyển dụng</h1>
            </div>
            
            <JobForm 
                initialData={job}
                jobId={job.id}
                onSubmit={handleSubmit}
                submitLabel="Lưu thay đổi"
                title="Thông tin tuyển dụng"
            />
        </div>
    );
}
