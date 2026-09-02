"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/context/LanguageContext";
import { footerTranslations } from "@/constants/translations/home";

const SOCIAL_LINKS = [
  { label: "Facebook", glyph: "f" },
  { label: "X", glyph: "X" },
  { label: "LinkedIn", glyph: "in" },
] as const;

const LINK_CLASS =
  "text-sm text-[#D1FAE5] hover:text-[#10B981] transition-colors duration-300 ease-in-out";

const BOTTOM_LINK_CLASS =
  "text-xs text-[#9CA3AF] hover:text-[#10B981] transition-colors duration-300 ease-in-out";

const HEADING_CLASS =
  "text-sm font-semibold text-[#ECFDF5] uppercase tracking-wide mb-4";

export default function Footer() {
  const { language } = useLanguage();
  const t = footerTranslations[language];

  return (
    <footer className="bg-gradient-to-b from-[#064E3B] to-[#065F46] text-[#D1FAE5]">
      {/* Main Footer — a compact 3-column layout (brand, navigation,
          contact) rather than 4: dropping the services list keeps the
          footer's footprint light, in line with everything else in it
          being toned down (muted text, thin divider, no filled social
          badges). */}
      <div className="max-w-7xl mx-auto px-6 py-8 sm:py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 divide-y divide-[#065F46] sm:divide-y-0">
          {/* Brand */}
          <div className="pt-6 first:pt-0 sm:pt-0 text-center sm:text-left">
            <Link href="/" className="text-2xl font-bold text-[#ECFDF5]">
              Tujitunze
            </Link>

            <p className="mt-3 text-xs leading-relaxed text-[#D1FAE5]/70">
              {t.description}
            </p>
          </div>

          {/* Navigation */}
          <div className="pt-6 first:pt-0 sm:pt-0 text-center sm:text-left">
            <h3 className={HEADING_CLASS}>{t.navigation}</h3>

            <ul className="space-y-3">
              <li>
                <Link href="/" className={LINK_CLASS}>
                  {t.home}
                </Link>
              </li>

              <li>
                <Link href="/about" className={LINK_CLASS}>
                  {t.about}
                </Link>
              </li>

              <li>
                <Link href="/services" className={LINK_CLASS}>
                  {t.services}
                </Link>
              </li>

              <li>
                <Link href="/contact" className={LINK_CLASS}>
                  {t.contact}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact + social */}
          <div className="pt-6 first:pt-0 sm:pt-0 text-center sm:text-left">
            <h3 className={HEADING_CLASS}>{t.contactInfo}</h3>

            <ul className="space-y-3 text-sm">
              <li className="flex justify-center sm:justify-start gap-3">
                <span>📧</span>
                <span>support@Tujitunze.com</span>
              </li>

              <li className="flex justify-center sm:justify-start gap-3">
                <span>📞</span>
                <span>+255 617672872</span>
              </li>

              <li className="flex justify-center sm:justify-start gap-3">
                <span>📍</span>
                <span>{t.location}</span>
              </li>
            </ul>

            <div className="mt-5 flex justify-center sm:justify-start gap-3">
              {SOCIAL_LINKS.map((social) => (
                <span
                  key={social.label}
                  role="button"
                  aria-label={social.label}
                  className="
                  flex h-11 w-11 sm:h-9 sm:w-9
                  items-center justify-center
                  rounded-full
                  border border-[#10B981]/40
                  text-xs text-[#D1FAE5]
                  cursor-pointer
                  transition-colors duration-300 ease-in-out
                  hover:border-[#10B981] hover:text-[#10B981]
                "
                >
                  {social.glyph}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="border-t border-[#065F46] mt-2">
        <div
          className="
          max-w-7xl
          mx-auto
          px-6
          py-4
          flex
          flex-col
          items-center
          gap-3
          text-center
        "
        >
          <p className="text-xs text-[#9CA3AF]">
            © {new Date().getFullYear()} Tujitunze. {t.rightsReserved}
          </p>

          <div className="flex justify-center gap-6 sm:gap-8">
            <Link href="/privacy-policy" className={`${BOTTOM_LINK_CLASS} py-1`}>
              {t.privacyPolicy}
            </Link>

            <Link href="/terms" className={`${BOTTOM_LINK_CLASS} py-1`}>
              {t.terms}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
