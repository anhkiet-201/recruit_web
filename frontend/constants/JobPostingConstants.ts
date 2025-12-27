import { Job } from "@/models/Job";

export const getJobPostingSchema = (job: Job) => {
  return {
    "@context": "https://schema.org/",
    "@type": "JobPosting",
    title: job.title,
    description: job.content,
    identifier: {
      "@type": "PropertyValue",
      name: job.author?.name || "TTN Hr",
      value: job.id,
    },
    datePosted: job.createdAt ? job.createdAt.split("T")[0] : "",
    validThrough: job.deadline ? job.deadline.split("T")[0] : undefined,
    employmentType: job.jobType === "unskilled" ? "CONTRACTOR" : "FULL_TIME",
    hiringOrganization: {
      "@type": "Organization",
      name: job.author?.name || "TTN Hr",
      logo: job.author?.avatarUrl,
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: job.location,
        addressCountry: "VN",
      },
    },
    baseSalary:
      job.salaryMin || job.salaryMax
        ? {
            "@type": "MonetaryAmount",
            currency: "VND",
            value: {
              "@type": "QuantitativeValue",
              minValue: job.salaryMin,
              maxValue: job.salaryMax,
              unitText: "MONTH",
            },
          }
        : undefined,
  };
};
