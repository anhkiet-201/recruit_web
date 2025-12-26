"use client";

import { JobService } from "@/services/jobService";
import { addTagToJob } from "@/services/tagService";
import { useRouter } from "next/navigation";
import JobForm from "@/components/admin/JobForm";
import { Job } from "@/models/Job";

export default function NewJobPage() {
  const router = useRouter();

  const handleSubmit = async (
    formData: Partial<Job>,
    selectedTags: string[],
  ) => {
    try {
      const newJob = await JobService.createJob(formData);
      for (const tagId of selectedTags) {
        await addTagToJob(newJob.id, tagId);
      }
      router.push("/admin/jobs");
    } catch (error) {
      console.error("Create job failed", error);
      alert("Failed to create job");
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <JobForm
        title="Create New Recruitment"
        submitLabel="Post Job Now"
        onSubmit={handleSubmit}
      />
    </div>
  );
}
