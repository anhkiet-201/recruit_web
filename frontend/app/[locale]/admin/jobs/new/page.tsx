"use client";

import { JobService } from "@/services/jobService";
import { addTagToJob } from "@/services/tagService";
import { useRouter } from "next/navigation";
import JobForm from "@/components/admin/JobForm";
import { Job } from "@/models/Job";
import { useEffect, useState } from "react";

export default function NewJobPage() {
  const router = useRouter();
  const [prefilledData, setPrefilledData] = useState<Partial<Job> | undefined>(
    undefined
  );

  useEffect(() => {
    const rawData = sessionStorage.getItem("PREFILL_JOB_DATA");
    if (rawData) {
      try {
        const data = JSON.parse(rawData);
        // Using requestAnimationFrame to move the state update out of the synchronous render path
        requestAnimationFrame(() => {
          setPrefilledData(data);
        });
        // Clear after reading to prevent accidental pre-fill on next manual visit
        sessionStorage.removeItem("PREFILL_JOB_DATA");
      } catch (e) {
        console.error("Failed to parse prefill data", e);
      }
    }
  }, []);

  const handleSubmit = async (
    formData: Partial<Job>,
    selectedTags: string[]
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
        key={prefilledData ? "prefilled" : "new"}
        initialData={prefilledData}
        title="Create New Recruitment"
        submitLabel="Post Job Now"
        onSubmit={handleSubmit}
      />
    </div>
  );
}
