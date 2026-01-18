"use client";

import "./globals.css";
import NotFoundContent from "@/components/NotFoundContent";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "600", "700", "900"],
  display: "swap",
});

export default function GlobalNotFound() {
  return (
    <div
      className={`flex flex-col min-h-screen items-center justify-center ${inter.className}`}
    >
      <NotFoundContent />
    </div>
  );
}
