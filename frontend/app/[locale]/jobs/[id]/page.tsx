import { JobService } from "@/services/jobService";
import { notFound } from "next/navigation";
import JobDetailClient from "./JobDetailClient";
import { SeoHelper } from "@/utils/SeoHelper";
import { getJobBreadcrumbSchema } from "@/constants/SeoConstants";
import { Metadata } from "next";

type Props = {
  params: Promise<{ id: string; locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, locale } = await params;
  // IncrementView: false because crawlers/metadata generation shouldn't count as a view
  const job = await JobService.getJobById(id, { incrementView: false });

  if (!job) {
    return {
      title: "Job Not Found",
    };
  }

  return SeoHelper.generateSeoMetadata(
    {
      title: job.title,
      description: job.content
        ? job.content.substring(0, 160) + "..."
        : undefined,
      ogImage: job.imageUrl,
    },
    locale
  );
}

export default async function JobDetailPage({ params }: Props) {
  const { id, locale } = await params;
  let job;

  try {
    job = await JobService.getJobById(id, { incrementView: false });

    if (!job) {
      notFound();
    }
  } catch (error) {
    console.error("Error fetching job:", error);
    notFound();
  }

  const jsonLd = getJobBreadcrumbSchema(job, locale);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <JobDetailClient initialJob={job} />
    </>
  );
}
