import { MetadataRoute } from "next";
import { getCompanyInfo } from "../constants/CompanyConstants";

export default function robots(): MetadataRoute.Robots {
  const companyInfo = getCompanyInfo("vi");
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || companyInfo.baseUrl;

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/dashboard/", "/api/"],
        crawlDelay: 1,
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/admin/", "/dashboard/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
