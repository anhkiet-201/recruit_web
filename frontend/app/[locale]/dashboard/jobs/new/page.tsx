"use client";

import { useRouter } from "next/navigation";
import JobForm from "@/components/admin/JobForm";
import { JobService } from "@/services/jobService";
import { ArrowLeft } from "lucide-react";
import { Job } from "@/models/Job";
import Button from "@/components/ui/Button";

export default function EmployerCreateJobPage() {
  const router = useRouter();

  const handleSubmit = async (data: Partial<Job>, selectedTags: string[]) => {
    try {
      await JobService.createJob({
        ...data,
        tags: selectedTags,
      });
      alert("Tin tuyển dụng đã được gửi và đang chờ Admin duyệt!");
      router.push("/dashboard");
    } catch (error) {
      console.error("Failed to create job", error);
      alert("Có lỗi xảy ra khi đăng tin.");
    }
  };

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
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">
          Đăng tin tuyển dụng mới
        </h1>
        <p className="text-gray-500 mt-1 font-medium">
          Hoàn thành form bên dưới để tạo tin tuyển dụng.
        </p>
      </div>

      <JobForm
        onSubmit={handleSubmit}
        submitLabel="Gửi duyệt tin đăng"
        title="Thông tin tuyển dụng"
      />
    </div>
  );
}
