import { JobService } from "@/services/jobService";
import { notFound } from "next/navigation";
import JobDetailClient from "./JobDetailClient";
import { SeoHelper } from "@/utils/SeoHelper";
import { Metadata, ResolvingMetadata } from "next";

type Props = {
    params: Promise<{ id: string; locale: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata(
    { params, searchParams }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const { id } = await params;

    // IncrementView: false because crawlers/metadata generation shouldn't count as a view
    const job = await JobService.getJobById(id, { incrementView: false });

    if (!job) {
        return {
            title: "Job Not Found",
        };
    }

    return SeoHelper.generateSeoMetadata({
        title: job.title,
        description: job.content ? job.content.substring(0, 160) + "..." : undefined,
        ogImage: job.imageUrl,
    });
}

export default async function JobDetailPage({ params }: Props) {
    const { id } = await params;

    try {
        const job = await JobService.getJobById(id, { incrementView: false });

        if (!job) {
            notFound();
        }

        return <JobDetailClient initialJob={job} />;
    } catch (error) {
        console.error("Error fetching job:", error);
        notFound();
    }
}
