import { Job } from "@/models/Job";
import { getCompanyInfo } from "@/constants/CompanyConstants";
import { isHtmlContent, htmlToPlainText } from "@/utils/contentHelper";

interface Props {
  job: Job;
  locale: string;
}

/**
 * Maps internal job type to Schema.org EmploymentType format
 */
function mapJobTypeToSchemaFormat(jobType: string): string {
  const mapping: Record<string, string> = {
    "full-time": "FULL_TIME",
    "part-time": "PART_TIME",
    contract: "CONTRACTOR",
    temporary: "TEMPORARY",
    internship: "INTERN",
    skilled: "FULL_TIME",
    unskilled: "FULL_TIME",
    professional: "FULL_TIME",
  };

  return mapping[jobType?.toLowerCase()] || "FULL_TIME";
}

/**
 * Get description for schema - converts HTML to plain text if needed
 * Truncates to 5000 chars (Google limit)
 */
function getDescriptionForSchema(job: Job): string {
  const content = job.content || job.description || "";

  // If HTML, convert to plain text
  if (isHtmlContent(content)) {
    const plainText = htmlToPlainText(content);
    return plainText.substring(0, 5000);
  }

  // Plain text - just truncate
  return content.substring(0, 5000);
}

/**
 * Component to render JobPosting structured data
 * Follows Schema.org JobPosting specification
 * @see https://schema.org/JobPosting
 */
export default function JobPostingSchema({ job, locale }: Props) {
  const companyInfo = getCompanyInfo(locale);

  // Calculate valid through date (30 days from creation if not specified)
  const validThrough =
    job.expiresAt ||
    new Date(
      new Date(job.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000
    ).toISOString();

  const jobPostingSchema = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    "@id": `${companyInfo.baseUrl}/jobs/${job.id}#jobposting`,
    title: job.title,
    description: getDescriptionForSchema(job),
    datePosted: job.createdAt,
    validThrough: validThrough,
    employmentType: mapJobTypeToSchemaFormat(job.jobType || "full-time"),

    // Hiring Organization
    hiringOrganization: {
      "@type": "Organization",
      name: job.employer?.name || companyInfo.name,
      sameAs: job.employer?.website || companyInfo.baseUrl,
      logo: job.employer?.logo || companyInfo.logo,
    },

    // Job Location
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: job.location,
        addressRegion: job.location.includes("Bình Dương")
          ? "Bình Dương"
          : job.location.includes("Hồ Chí Minh")
          ? "Hồ Chí Minh"
          : undefined,
        addressCountry: "VN",
      },
    },

    // Salary (if available)
    ...(job.salaryMin || job.salaryMax || job.salary
      ? {
          baseSalary: {
            "@type": "MonetaryAmount",
            currency: "VND",
            value: job.salary
              ? {
                  "@type": "QuantitativeValue",
                  value: job.salary,
                  unitText: "MONTH",
                }
              : {
                  "@type": "QuantitativeValue",
                  minValue: job.salaryMin,
                  maxValue: job.salaryMax,
                  unitText: "MONTH",
                },
          },
        }
      : {}),

    // Identifier
    identifier: {
      "@type": "PropertyValue",
      name: companyInfo.name,
      value: job.id,
    },

    // Application details
    applicantLocationRequirements: {
      "@type": "Country",
      name: "VN",
    },

    // Job benefits (if available in tags)
    ...(job.jobTags && job.jobTags.length > 0
      ? {
          jobBenefits: job.jobTags.map((t) => t.tag.name).join(", "),
        }
      : {}),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPostingSchema) }}
    />
  );
}
