import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ConfirmDialogProvider } from "@/contexts/ConfirmDialogContext";
import AiChatBot from "@/components/AiChatBot";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from "next/navigation";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RecruitWeb - Find Your Dream Job",
  description: "The best place to find jobs.",
};

export default async function RootLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  if (!['vi', 'en', 'zh'].includes(locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className={inter.className}>
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            <ConfirmDialogProvider>
              <div className="flex flex-col min-h-screen">
                <Navbar />
                <main className="flex-grow bg-gray-50/50">
                  {children}
                </main>
                <Footer />
                <AiChatBot />
              </div>
            </ConfirmDialogProvider>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}