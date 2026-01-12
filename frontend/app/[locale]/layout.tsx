import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Inter } from "next/font/google";
import "../globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ConfirmDialogProvider } from "@/contexts/ConfirmDialogContext";
import AiChatBot from "@/components/AiChatBot";
import JsonLdScript from "@/components/seo/JsonLdScript";
import OrganizationSchema from "@/components/seo/OrganizationSchema";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import GoogleAuthProvider from "@/components/GoogleAuthProvider";
import { getCompanyInfo } from "@/constants/CompanyConstants";
import { getSeoConstants } from "@/constants/SeoConstants";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "600", "700", "900"],
  display: "swap",
  preload: true,
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const headerList = await headers();
  const currentPath = headerList.get("x-current-path") || "";
  const companyInfo = getCompanyInfo(locale);
  const seoData = getSeoConstants(locale);
  const ogLocale =
    locale === "vi" ? "vi_VN" : locale === "zh" ? "zh_CN" : "en_US";

  return {
    title: {
      default: seoData.DEFAULT_TITLE,
      template: `%s | ${seoData.SITE_NAME}`,
    },
    description: companyInfo.description || seoData.DEFAULT_DESCRIPTION,
    keywords: companyInfo.areaServed
      ? [...companyInfo.areaServed, "Tuyển dụng", "Việc làm", "Human Resources"]
      : ["Tuyển dụng", "Việc làm"],
    authors: [{ name: companyInfo.legalName }],
    openGraph: {
      title: seoData.DEFAULT_TITLE,
      description: companyInfo.description || seoData.DEFAULT_DESCRIPTION,
      locale: ogLocale,
      siteName: seoData.SITE_NAME,
      images: [
        {
          url: companyInfo.logo,
          width: 1200,
          height: 630,
          alt: companyInfo.name,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: seoData.DEFAULT_TITLE,
      description: companyInfo.description || seoData.DEFAULT_DESCRIPTION,
      images: [companyInfo.logo],
      creator: seoData.TWITTER_HANDLE,
    },
    icons: {
      icon: "/favicon.ico",
    },
    alternates: {
      languages: {
        "vi-VN": `${companyInfo.baseUrl}${currentPath}`,
        "en-US": `${companyInfo.baseUrl}/en${currentPath}`,
        "zh-CN": `${companyInfo.baseUrl}/zh${currentPath}`,
        "x-default": `${companyInfo.baseUrl}${currentPath}`,
      },
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  if (!["vi", "en", "zh"].includes(locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className={inter.className}>
        <JsonLdScript locale={locale} />
        <OrganizationSchema locale={locale} />
        <NextIntlClientProvider messages={messages}>
          <GoogleAuthProvider
            clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}
          >
            <AuthProvider>
              <ConfirmDialogProvider>
                <div className="flex flex-col min-h-screen">
                  <header className="sticky top-0 z-1000">
                    <Navbar />
                  </header>
                  <main className="grow bg-gray-50/90">{children}</main>
                  <Footer />
                  <AiChatBot />
                </div>
              </ConfirmDialogProvider>
            </AuthProvider>
          </GoogleAuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
