"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import NextImage from "next/image";
import {
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  Facebook,
  Music,
  MessageCircleCode,
} from "lucide-react";

export default function Footer() {
  const pathname = usePathname();
  const t = useTranslations("Footer");
  const nt = useTranslations("Navigation");

  const isAdminPage = pathname?.includes("/admin");
  if (isAdminPage) return null;

  return (
    <footer className="bg-white border-t border-gray-100 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Column 1: Company Info */}
          <div className="space-y-6">
            <div className="flex items-center gap-2.5 group">
              <div className="relative w-10 h-10 group-hover:scale-110 transition-transform duration-500">
                <NextImage
                  src="/logo.webp"
                  alt="TTN HR Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="text-xl font-black text-[#9a3709] tracking-tighter">
                TTN
                <span className="text-[#0c2251]"> HR</span>
              </span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed font-medium">
              {t("description")}
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://www.facebook.com/vieclamhrttn"
                target="_blank"
                rel="noopener noreferrer"
                title="Facebook TTN HR"
                aria-label="Facebook TTN HR"
                className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-blue-600 hover:text-white transition-all"
              >
                <Facebook size={18} />
              </a>
              <a
                href="https://www.tiktok.com/@vieclam.ttn.hr"
                target="_blank"
                rel="noopener noreferrer"
                title="TikTok TTN HR"
                aria-label="TikTok TTN HR"
                className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-black hover:text-white transition-all"
              >
                <Music size={18} />
              </a>
              <a
                href="https://zalo.me/0844456787"
                target="_blank"
                rel="noopener noreferrer"
                title="Zalo TTN HR"
                aria-label="Zalo TTN HR"
                className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-blue-500 hover:text-white transition-all"
              >
                <MessageCircleCode size={18} />
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6">
              {t("quickLinksTitle")}
            </h4>
            <ul className="space-y-4">
              {[
                { name: nt("home"), href: "/" },
                { name: nt("jobs"), href: "/jobs" },
                { name: nt("companies"), href: "https://vieclamhr.com/#about" },
                { name: nt("about"), href: "https://vieclamhr.com/#about" },
                { name: nt("contact"), href: "https://vieclamhr.com/#contact" },
              ].map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-500 hover:text-blue-600 text-sm font-bold transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Contact Info */}
          <div>
            <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6">
              {t("contactTitle")}
            </h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="mt-1 p-2 bg-blue-50 rounded-lg text-blue-600">
                  <MapPin size={16} />
                </div>
                <a
                  href="https://www.google.com/maps?cid=8824493389288761795"
                  target="_blank"
                  className="text-gray-500 text-sm font-medium leading-relaxed hover:text-blue-600 transition-colors"
                >
                  {t("address")}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                  <Phone size={16} />
                </div>
                <a
                  href={`tel:${t("hotline").replace(/\s/g, "")}`}
                  className="text-gray-500 text-sm font-bold hover:text-emerald-600 transition-colors"
                >
                  {t("hotline")}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
                  <Mail size={16} />
                </div>
                <a
                  href={`mailto:${t("email")}`}
                  className="text-gray-500 text-sm font-bold hover:text-orange-600 transition-colors"
                >
                  {t("email")}
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Reference Link */}
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 space-y-4">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                Powered by
              </p>
              <a
                href="https://vieclamhr.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-gray-900 hover:text-blue-600 transition-colors group"
              >
                <span className="text-lg font-black tracking-tight">
                  VieclamHR.com
                </span>
                <ExternalLink
                  size={16}
                  className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"
                />
              </a>
              <Link
                href="https://vieclamhr.com/"
                target="_blank"
                className="block"
              >
                <button className="w-full py-3 bg-white border border-gray-200 text-gray-700 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all shadow-sm">
                  {t("referenceButton")}
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Full Width Map Section */}
        <div className="mb-16">
          <div className="rounded-3xl overflow-hidden border border-gray-100 shadow-xl h-96 w-full group relative">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3914.5829034530407!2d106.70197457685981!3d11.144409452294758!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3174c939b66fc887%3A0x7a76e5fbbf56e9c3!2sTTN%20HR%20-%20Vsip%202A!5e0!3m2!1svi!2s!4v1766764447607!5m2!1svi!2s"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={true}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="group-hover:scale-[1.02] transition-transform duration-1000"
            ></iframe>
            {/* <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 shadow-lg pointer-events-none">
              <p className="text-xs font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                <MapPin size={14} className="text-blue-600" />
                {t("address")}
              </p>
            </div> */}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-50 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            {t("copyright", {
              year: new Date().getFullYear(),
              company: t("companyName"),
            })}
          </p>
          <div className="flex gap-8">
            <Link
              href="/privacy"
              className="text-[10px] font-black text-gray-300 hover:text-gray-600 uppercase tracking-widest transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-[10px] font-black text-gray-300 hover:text-gray-600 uppercase tracking-widest transition-colors"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
