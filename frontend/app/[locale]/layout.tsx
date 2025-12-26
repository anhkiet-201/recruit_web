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
import GoogleAuthProvider from "@/components/GoogleAuthProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TTN HR - Tìm công việc mơ ước",
  description: "Nơi tìm kiếm công việc mơ ước",
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
          <GoogleAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}>
            <AuthProvider>
              <ConfirmDialogProvider>
                <div className="flex flex-col min-h-screen">
                  <header>
                    <Navbar />
                  </header>
                  <main className="flex-grow bg-gray-50/50">
                    {children}
                  </main>
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