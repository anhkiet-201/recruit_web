import ApplyForm from "@/components/ApplyForm";
import { JobService } from "@/services/jobService";
import { notFound } from "next/navigation";

export default async function ApplyPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const job = await JobService.getJobById(id);

    if (!job) {
        notFound();
    }

    return (
        <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Apply for {job.title}</h1>
                <p className="mt-2 text-gray-600">{job.location}</p>
            </div>
            <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                <ApplyForm jobId={id} />
            </div>
        </div>
    );
}
