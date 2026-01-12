import { Job } from "@/models/Job";
import { getCompanyInfo } from "@/constants/CompanyConstants";

interface Props {
  jobs: Job[];
  locale: string;
  title?: string;
  url?: string;
}

/**
 * ItemList Schema for Job Lists (Search Results, Category Pages)
 * @see https://schema.org/ItemList
 */
export default function ItemListSchema({ jobs, locale, title, url }: Props) {
  const companyInfo = getCompanyInfo(locale);
  const baseUrl = companyInfo.baseUrl;

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    ...(url ? { url: `${baseUrl}${url}` } : {}),
    name: title || "Job List",
    itemListElement: jobs.map((job, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "JobPosting",
        name: job.title,
        description: job.description || job.content,
        url: `${baseUrl}/jobs/${job.id}`,
        datePosted: job.createdAt,
        validThrough: job.deadline || job.expiresAt,
        employmentType: job.jobType,
        hiringOrganization: {
          "@type": "Organization",
          name: job.employer?.name || companyInfo.name,
        },
        jobLocation: {
          "@type": "Place",
          address: {
            "@type": "PostalAddress",
            addressLocality: job.location,
            addressCountry: "VN",
          },
        },
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
    />
  );
}
