import { JobService } from "@/services/jobService";
import { notFound } from "next/navigation";
import JobDetailClient from "./JobDetailClient";
import { SeoHelper } from "@/utils/SeoHelper";
import { getJobBreadcrumbSchema } from "@/constants/SeoConstants";
import { Metadata } from "next";
import JobPostingSchema from "@/components/seo/JobPostingSchema";

type Props = {
  params: Promise<{ id: string; locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

import { getCompanyInfo } from "@/constants/CompanyConstants";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, locale } = await params;
  const companyInfo = getCompanyInfo(locale);
  // IncrementView: false because crawlers/metadata generation shouldn't count as a view
  // Pass locale to get translated content for SEO tags (title, description)
  const job = await JobService.getJobById(id, {
    incrementView: false,
    locale,
  });

  if (!job) {
    return {
      title: "Job Not Found",
    };
  }

  // Generate keywords from job details
  const keywords = [
    ...(job.tags || []),
    ...(job.jobTags?.map((t) => t.tag.name) || []),
    job.location,
    job.jobType,
    job.title,
    "Việc làm",
    "Tuyển dụng",
  ].filter(Boolean) as string[];

  // Clean description
  const cleanContent =
    job.content?.replace(/<[^>]*>?/gm, "").substring(0, 160) || "";
  const description = `${job.title} tại ${job.location}. ${cleanContent}...`;

  // Fix Canonical: Self-referencing based on locale
  let canonicalPath = `/jobs/${id}`;
  if (locale !== "vi") {
    canonicalPath = `/${locale}/jobs/${id}`;
  }
  const canonicalUrl = `${companyInfo.baseUrl}${canonicalPath}`;

  return SeoHelper.generateSeoMetadata(
    {
      title: job.title,
      description: description,
      ogImage: job.imageUrl,
      canonicalUrl: canonicalUrl,
      keywords: Array.from(new Set(keywords)), // Remove duplicates
      openGraph: {
        title: job.title,
        description: description,
        type: "article",
        images: job.imageUrl ? [{ url: job.imageUrl }] : undefined,
      },
    },
    locale
  );
}

export default async function JobDetailPage({ params }: Props) {
  const { id, locale } = await params;
  let job;

  try {
    job = await JobService.getJobById(id, {
      incrementView: false,
      locale,
    });

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
      <JobPostingSchema job={job} locale={locale} />
      <JobDetailClient initialJob={job} />
    </>
  );
}
