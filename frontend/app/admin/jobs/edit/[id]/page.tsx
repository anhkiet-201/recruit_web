"use client";

import { useEffect, useState } from "react";
import { JobService } from "@/services/jobService";
import { addTagToJob, removeTagFromJob } from "@/services/tagService";
import { useRouter, useParams } from "next/navigation";
import JobForm from "@/components/admin/JobForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function EditJobPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;
    const [job, setJob] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            JobService.getJobById(id, { incrementView: false })
                .then(data => { setJob(data); setLoading(false); })
                .catch(() => { router.push("/admin/jobs"); });
        }
    }, [id, router]);

    const handleSubmit = async (formData: any, selectedTags: string[], initialTags: string[]) => {
        try {
            await JobService.updateJob(id, formData);
            const tagsToAdd = selectedTags.filter(tId => !initialTags.includes(tId));
            const tagsToRemove = initialTags.filter(tId => !selectedTags.includes(tId));

            for (const tId of tagsToAdd) await addTagToJob(id, tId);
            for (const tId of tagsToRemove) await removeTagFromJob(id, tId);

            router.push("/admin/jobs");
        } catch (error) { alert("Failed to update job"); }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

    return (
        <div className="max-w-6xl mx-auto py-10 px-4">
            <div className="mb-10 flex items-center gap-4">
                <Link href="/admin/jobs" className="p-2 text-gray-400 hover:text-blue-600 bg-white rounded-xl shadow-md border border-gray-100 transition-all"><ArrowLeft size={20}/></Link>
                <h1 className="text-xl font-black text-gray-900 tracking-tight uppercase text-xs opacity-40">Edit Mode</h1>
            </div>
            <JobForm 
                title="Edit Job Posting"
                submitLabel="Update Information"
                jobId={id}
                initialData={job}
                onSubmit={handleSubmit}
            />
        </div>
    );
}
