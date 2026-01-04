export interface SeoData {
  DEFAULT_TITLE: string;
  DEFAULT_DESCRIPTION: string;
  DEFAULT_OG_IMAGE: string;
  SITE_NAME: string;
  TWITTER_HANDLE: string;
  SEPARATOR: string;
}

const COMMON_DATA = {
  DEFAULT_OG_IMAGE: "https://timviec.vieclamhr.com/logo.webp",
  TWITTER_HANDLE: "@vieclamhr_ttn",
  SEPARATOR: " | ",
};

export const SEO_DATA: Record<string, SeoData> = {
  vi: {
    ...COMMON_DATA,
    DEFAULT_TITLE: "TTN HR - Tìm việc mơ ước",
    DEFAULT_DESCRIPTION:
      "Nền tảng tuyển dụng uy tín, kết nối ứng viên và nhà tuyển dụng chuyên nghiệp.",
    SITE_NAME: "TTN HR",
  },
  en: {
    ...COMMON_DATA,
    DEFAULT_TITLE: "TTN HR - Find Your Dream Job",
    DEFAULT_DESCRIPTION:
      "The trusted platform to find jobs, connect with employers, and build your career.",
    SITE_NAME: "TTN HR",
  },
  zh: {
    ...COMMON_DATA,
    DEFAULT_TITLE: "TTN HR - 寻找梦想工作",
    DEFAULT_DESCRIPTION: "值得信赖的招聘平台，连接求职者和雇主。",
    SITE_NAME: "TTN HR",
  },
};

export const getSeoConstants = (locale: string): SeoData => {
  return SEO_DATA[locale] || SEO_DATA["vi"];
};

// Deprecated: Backwards compatibility if needed, but better to remove
// export const SEO_CONSTANTS = SEO_DATA['vi'];

export const getJobBreadcrumbSchema = (
  job: { id: string; title: string },
  locale: string
) => {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: locale === "vi" ? "Trang chủ" : "Home",
        item: `https://timviec.vieclamhr.com/${locale}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: locale === "vi" ? "Việc làm" : "Jobs",
        item: `https://timviec.vieclamhr.com/${locale}/jobs`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: job.title,
        item: `https://timviec.vieclamhr.com/${locale}/jobs/${job.id}`,
      },
    ],
  };
};

export const getHomeBreadcrumbSchema = (locale: string) => {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: locale === "vi" ? "Trang chủ" : locale === "zh" ? "主页" : "Home",
        item: `https://timviec.vieclamhr.com/${locale}`,
      },
    ],
  };
};
