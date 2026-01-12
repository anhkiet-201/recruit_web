import { Job } from "@/models/Job";
import { getCompanyInfo } from "@/constants/CompanyConstants";
import { isHtmlContent } from "@/utils/contentHelper";

/**
 * Sanitize HTML for Schema.org (strip script/style/events)
 */
function sanitizeForSchema(html: string): string {
  if (!html) return "";
  let clean = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
  clean = clean.replace(/ on\w+="[^"]*"/gi, "");
  return clean;
}

/**
 * Get pure description for Schema (with safe HTML)
 */
function getDescriptionForSchema(job: Job): string {
  const content = job.content || job.description || "";
  if (isHtmlContent(content)) {
    return sanitizeForSchema(content).substring(0, 5000);
  }
  return content.substring(0, 5000);
}

/**
 * Map internal JobType to Schema.org format
 */
function mapJobTypeToSchema(jobType?: string): string {
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
  return mapping[jobType?.toLowerCase() || ""] || "FULL_TIME";
}

/**
 * Parse location string to Address Object
 */
function parseLocation(location: string) {
  if (!location) return { addressCountry: "VN" };
  const parts = location.split(",").map((s) => s.trim());
  return {
    addressLocality: parts[0] || location,
    addressRegion: parts[0] || location,
    streetAddress: parts.length > 1 ? parts.slice(1).join(", ") : undefined,
    addressCountry: "VN",
  };
}

// --- GENERATORS ---

export const generateWebSiteSchema = (locale: string) => {
  const companyInfo = getCompanyInfo(locale);
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${companyInfo.baseUrl}/#website`,
    url: companyInfo.baseUrl,
    inLanguage: locale,
    name: companyInfo.name,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${companyInfo.baseUrl}/jobs?title={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
};

export const generateOrganizationSchema = (locale: string) => {
  const companyInfo = getCompanyInfo(locale);
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${companyInfo.baseUrl}/#organization`,
    name: companyInfo.name,
    legalName: companyInfo.legalName,
    url: companyInfo.baseUrl,
    logo: companyInfo.logo,
    image: companyInfo.logo,
    sameAs: [companyInfo.mainDomain, ...companyInfo.socialLinks],
    address: {
      "@type": "PostalAddress",
      streetAddress: companyInfo.address.street,
      addressLocality: companyInfo.address.locality,
      addressRegion: companyInfo.address.region,
      postalCode: companyInfo.address.postalCode,
      addressCountry: companyInfo.address.country,
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: companyInfo.contact.phone,
      email: companyInfo.contact.email,
      contactType: "Customer Service",
      availableLanguage: companyInfo.contact.availableLanguage,
    },
  };
};

export const generateJobPostingSchema = (job: Job, locale: string) => {
  const companyInfo = getCompanyInfo(locale);
  const validThrough =
    job.deadline ||
    job.expiresAt ||
    new Date(
      new Date(job.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000
    ).toISOString();

  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    "@id": `${companyInfo.baseUrl}/jobs/${job.id}#jobposting`,
    title: job.title,
    description: getDescriptionForSchema(job),
    datePosted: job.updatedAt || job.createdAt,
    validThrough: validThrough,
    employmentType: mapJobTypeToSchema(job.jobType),
    directApply: true,
    hiringOrganization: {
      "@type": "Organization",
      name: job.employer?.name || companyInfo.name,
      sameAs: job.employer?.website || companyInfo.baseUrl,
      logo: job.employer?.logo || companyInfo.logo,
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        ...parseLocation(job.location),
      },
    },
    identifier: {
      "@type": "PropertyValue",
      name: companyInfo.name,
      value: job.id,
    },
    applicantLocationRequirements: {
      "@type": "Country",
      name: "VN",
    },
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
  };
};

/**
 * Generate BreadcrumbList
 * @param items Array of { name, item }
 */
export const generateBreadcrumbSchema = (
  items: { name: string; item: string }[]
) => {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: crumb.item,
    })),
  };
};

export const generateItemListSchema = (
  jobs: Job[],
  locale: string,
  title: string = "Job List",
  url?: string
) => {
  const companyInfo = getCompanyInfo(locale);
  const baseUrl = companyInfo.baseUrl;

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    ...(url ? { url: `${baseUrl}${url}` } : {}),
    name: title,
    itemListElement: jobs.map((job, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "JobPosting",
        name: job.title,
        description: getDescriptionForSchema(job), // Reuse description logic
        url: `${baseUrl}/jobs/${job.id}`,
        datePosted: job.createdAt,
        validThrough: job.deadline || job.expiresAt,
        employmentType: mapJobTypeToSchema(job.jobType),
        hiringOrganization: {
          "@type": "Organization",
          name: job.employer?.name || companyInfo.name,
        },
        jobLocation: {
          "@type": "Place",
          address: {
            "@type": "PostalAddress",
            ...parseLocation(job.location),
          },
        },
      },
    })),
  };
};
