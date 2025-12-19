import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ConfirmDialogProvider } from "@/contexts/ConfirmDialogContext";
import PageTransition from "@/components/ui/PageTransition";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RecruitWeb - Find Your Dream Job",
  description: "The best place to find jobs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
                <AuthProvider>
                  <ConfirmDialogProvider>
                    <div className="flex flex-col min-h-screen">
                      <Navbar />
                      <main className="flex-grow bg-gray-50/50">
                        {children}
                      </main>
                      <Footer />
                    </div>
                  </ConfirmDialogProvider>
                </AuthProvider>
      </body>
    </html>
  );
}
