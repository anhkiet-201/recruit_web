import { Job } from "@/models/Job";
import { getCompanyInfo } from "@/constants/CompanyConstants";
import { isHtmlContent } from "@/utils/contentHelper";

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
 * Sanitize HTML for Schema.org - Remove script/style but keep formatting tags.
 */
function sanitizeForSchema(html: string): string {
  if (!html) return "";
  // Remove script and style tags and their content
  let clean = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");

  // Remove event handlers (on...)
  clean = clean.replace(/ on\w+="[^"]*"/gi, "");

  return clean;
}

/**
 * Get description for schema - Preserves HTML for Google Jobs
 * Truncates to 5000 chars
 */
function getDescriptionForSchema(job: Job): string {
  const content = job.content || job.description || "";

  // If HTML, sanitize but keep tags
  if (isHtmlContent(content)) {
    return sanitizeForSchema(content).substring(0, 5000);
  }

  // Plain text - just truncate
  return content.substring(0, 5000);
}

/**
 * Parse location string into structured address components for Schema.org
 * Examples:
 * - "Hồ Chí Minh" => { addressLocality: "Hồ Chí Minh" }
 * - "Hà Nội, Quận Hoàn Kiếm" => { addressLocality: "Hà Nội", streetAddress: "Quận Hoàn Kiếm" }
 */
function parseLocation(location: string) {
  if (!location) return { addressCountry: "VN" };

  const parts = location.split(",").map((s) => s.trim());

  return {
    addressLocality: parts[0] || location, // City/Province
    addressRegion: parts[0] || location, // Same as locality for Vietnam
    streetAddress: parts.length > 1 ? parts.slice(1).join(", ") : undefined,
    addressCountry: "VN",
  };
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
    datePosted: job.updatedAt || job.createdAt,
    validThrough: validThrough,
    employmentType: mapJobTypeToSchemaFormat(job.jobType || "full-time"),
    directApply: true,

    // Hiring Organization
    hiringOrganization: {
      "@type": "Organization",
      name: job.employer?.name || companyInfo.name,
      sameAs: job.employer?.website || companyInfo.baseUrl,
      logo: job.employer?.logo || companyInfo.logo,
    },

    // Job Location - Structured address
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        ...parseLocation(job.location),
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
