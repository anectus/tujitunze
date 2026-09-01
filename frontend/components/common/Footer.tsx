"use client";

import Link from "next/link";

import { useLanguage } from "@/lib/context/LanguageContext";
import { footerTranslations } from "@/constants/translations/home";

export default function Footer() {
  const { language } = useLanguage();
  const t = footerTranslations[language];

  return (
    <footer className="bg-slate-950 text-gray-300">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-6 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 divide-y divide-gray-800 sm:divide-y-0">
          {/* Brand Section */}
          <div className="pt-10 first:pt-0 sm:pt-0">
            <Link href="/" className="text-3xl font-bold text-white">
              Tujitunze
            </Link>

            <p className="mt-4 text-sm leading-7 text-gray-400">
              {t.description}
            </p>

            <div className="mt-6 flex gap-4">
              <span
                className="
                h-10 w-10
                rounded-full
                bg-blue-700
                flex items-center justify-center
                text-white
                cursor-pointer
              "
              >
                f
              </span>

              <span
                className="
                h-10 w-10
                rounded-full
                bg-blue-700
                flex items-center justify-center
                text-white
                cursor-pointer
              "
              >
                X
              </span>

              <span
                className="
                h-10 w-10
                rounded-full
                bg-blue-700
                flex items-center justify-center
                text-white
                cursor-pointer
              "
              >
                in
              </span>
            </div>
          </div>

          {/* Navigation */}
          <div className="pt-10 first:pt-0 sm:pt-0">
            <h3
              className="
              text-white
              font-semibold
              text-lg
              mb-5
            "
            >
              {t.navigation}
            </h3>

            <ul className="space-y-3">
              <li>
                <Link href="/" className="hover:text-blue-400 transition">
                  {t.home}
                </Link>
              </li>

              <li>
                <Link href="/about" className="hover:text-blue-400 transition">
                  {t.about}
                </Link>
              </li>

              <li>
                <Link
                  href="/services"
                  className="hover:text-blue-400 transition"
                >
                  {t.services}
                </Link>
              </li>

              <li>
                <Link
                  href="/contact"
                  className="hover:text-blue-400 transition"
                >
                  {t.contact}
                </Link>
              </li>
            </ul>
          </div>

          {/* Tujitunze Services */}
          <div className="pt-10 first:pt-0 sm:pt-0">
            <h3
              className="
              text-white
              font-semibold
              text-lg
              mb-5
            "
            >
              {t.ourServices}
            </h3>

            <ul className="space-y-3 text-sm">
              <li>{t.service1}</li>

              <li>{t.service2}</li>

              <li>{t.service3}</li>

              <li>{t.service5}</li>
            </ul>
          </div>

          {/* Contact */}
          <div className="pt-10 first:pt-0 sm:pt-0">
            <h3
              className="
              text-white
              font-semibold
              text-lg
              mb-5
            "
            >
              {t.contactInfo}
            </h3>

            <ul className="space-y-4 text-sm">
              <li className="flex gap-3">
                <span>📧</span>

                <span>support@Tujitunze.com</span>
              </li>

              <li className="flex gap-3">
                <span>📞</span>

                <span>+255 617672872</span>
              </li>

              <li className="flex gap-3">
                <span>📍</span>

                <span>{t.location}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div
        className="
        border-t
        border-gray-800
      "
      >
        <div
          className="
          max-w-7xl
          mx-auto
          px-6
          py-5
          flex
          flex-col
          md:flex-row
          justify-between
          items-center
          gap-4
        "
        >
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} Tujitunze. {t.rightsReserved}
          </p>

          <div className="flex gap-6 text-sm">
            <Link href="/privacy-policy" className="hover:text-blue-400">
              {t.privacyPolicy}
            </Link>

            <Link href="/terms" className="hover:text-blue-400">
              {t.terms}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );

}