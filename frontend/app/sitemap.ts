import { MetadataRoute } from "next";
import { JobService } from "@/services/jobService";
import { getCompanyInfo } from "@/constants/CompanyConstants";

export const dynamic = "force-dynamic";

const LOCALES = ["vi", "en", "zh"] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const companyInfo = getCompanyInfo("vi");
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || companyInfo.baseUrl;

  const routes: MetadataRoute.Sitemap = [];

  // Helper to generate correct URL based on locale prefix strategy (as-needed)
  // vi: no prefix
  // en, zh: with prefix
  const getUrl = (locale: string, path: string) => {
    if (locale === "vi") {
      return `${baseUrl}${path}`;
    }
    return `${baseUrl}/${locale}${path}`;
  };

  // Helper function to generate alternates
  const getAlternates = (path: string) => ({
    languages: {
      vi: getUrl("vi", path),
      en: getUrl("en", path),
      zh: getUrl("zh", path),
      "x-default": getUrl("vi", path), // x-default points to default locale (no prefix)
    },
  });

  // Static routes
  LOCALES.forEach((locale) => {
    // Homepage
    routes.push({
      url: getUrl(locale, ""),
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
      alternates: getAlternates(""),
    });

    // Jobs listing page
    routes.push({
      url: getUrl(locale, "/jobs"),
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
      alternates: getAlternates("/jobs"),
    });
  });

  try {
    // Fetch jobs for dynamic routes (increased limit to 500)
    const { items: jobs } = await JobService.getAllJobs({ limit: 500 });

    // Generate job detail routes for each locale
    LOCALES.forEach((locale) => {
      const jobRoutes: MetadataRoute.Sitemap = jobs.map((job) => ({
        url: getUrl(locale, `/jobs/${job.id}`),
        lastModified: new Date(job.updatedAt || job.createdAt),
        changeFrequency: "weekly" as const,
        priority: 0.6,
        alternates: getAlternates(`/jobs/${job.id}`),
      }));

      routes.push(...jobRoutes);
    });

    return routes;
  } catch (error) {
    console.error("Sitemap generation error:", error);
    return routes;
  }
}
