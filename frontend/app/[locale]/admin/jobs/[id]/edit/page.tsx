"use client";
import { useEffect, useState } from "react";
import { JobService } from "@/services/jobService";
import { useRouter, useParams } from "next/navigation";
import { JobStatus } from "@/models/JobStatus";

export default function EditJobPage() {
    const router = useRouter();
    const params = useParams();
    const [formData, setFormData] = useState({
        title: "",
        content: "",
        location: "",
        salaryMin: 0,
        salaryMax: 0,
        experienceYears: 0,
        jobStatus: JobStatus.DRAFT,
        imageUrl: ""
    });

    const [uploading, setUploading] = useState(false);
    const [oldImageUrl, setOldImageUrl] = useState<string | undefined>(undefined);

    useEffect(() => {
        if (params.id) {
            JobService.getJobById(params.id as string).then((job) => {
                if (job) {
                    setFormData({
                        title: job.title,
                        content: job.content,
                        location: job.location,
                        salaryMin: job.salaryMin || 0,
                        salaryMax: job.salaryMax || 0,
                        experienceYears: job.experienceYears || 0,
                        jobStatus: job.status,
                        imageUrl: job.imageUrl || ""
                    });
                    setOldImageUrl(job.imageUrl);
                }
            });
        }
    }, [params.id]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setUploading(true);
            try {
                const url = await JobService.uploadJobImage(e.target.files[0]);
                setFormData({ ...formData, imageUrl: url });
            } catch (error) {
                console.error("Error uploading image:", error);
                alert("Failed to upload image");
            } finally {
                setUploading(false);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // If image URL changed and there was an old one, delete the old one
        if (oldImageUrl && formData.imageUrl !== oldImageUrl) {
            await JobService.deleteJobImage(oldImageUrl);
        }
        await JobService.updateJob(params.id as string, formData);
        router.push("/admin/jobs");
    };

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Job</h1>
            <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 shadow rounded-lg">
                {/* Same fields as New Job, plus isActive */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">Job Title</label>
                    <input
                        type="text"
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Job Image</label>
                    <div className="mt-1 flex items-center space-x-4">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        {uploading && <span className="text-sm text-gray-500">Uploading...</span>}
                    </div>
                    {formData.imageUrl && (
                        <div className="mt-2">
                            <img src={formData.imageUrl} alt="Preview" className="h-32 w-auto rounded-md object-cover" />
                        </div>
                    )}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Location</label>
                    <input
                        type="text"
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Min Salary</label>
                        <input
                            type="number"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            value={formData.salaryMin}
                            onChange={(e) => setFormData({ ...formData, salaryMin: Number(e.target.value) })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Max Salary</label>
                        <input
                            type="number"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            value={formData.salaryMax}
                            onChange={(e) => setFormData({ ...formData, salaryMax: Number(e.target.value) })}
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Experience (Years)</label>
                    <input
                        type="number"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={formData.experienceYears}
                        onChange={(e) => setFormData({ ...formData, experienceYears: Number(e.target.value) })}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                        rows={4}
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    />
                </div>
                <div className="flex items-center">
                    <input
                        id="isActive"
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        checked={formData.jobStatus === JobStatus.ACTIVE || formData.jobStatus === JobStatus.ACCEPTED}
                        onChange={(e) => setFormData({ ...formData, jobStatus: e.target.checked ? JobStatus.ACTIVE : JobStatus.DRAFT })}
                    />
                    <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                        Active
                    </label>
                </div>
                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={uploading}
                        className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                        Update Job
                    </button>
                </div>
            </form>
        </div>
    );
}
