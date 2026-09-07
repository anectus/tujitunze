"use client";

import Link from "next/link";
import { Mail, MapPin, PhoneCall } from "lucide-react";
import { useLanguage } from "@/lib/context/LanguageContext";
import { footerTranslations } from "@/constants/translations/home";

const SOCIAL_LINKS = [
  {
    label: "Facebook",
    glyph: "f",
    href: "https://www.facebook.com/share/1G5E5FSo2i/",
  },
  {
    label: "X",
    glyph: "X",
    href: "https://x.com/anectusphilemon",
  },
  {
    label: "LinkedIn",
    glyph: "in",
    href: "https://www.linkedin.com/in/anectus-philemon-7a901b337",
  },
  {
    label: "Instagram",
    glyph: "IG",
    href: "https://www.instagram.com/anectusphilemon",
  },
  {
    label: "YouTube",
    glyph: "YT",
    href: "https://youtube.com/@anectusphilemon",
  },
] as const;

const LINK_CLASS =
  "text-sm text-emerald-200 hover:text-emerald-400 transition-colors duration-200";

const HEADING_CLASS = "text-sm font-semibold text-white mb-4";

// Public marketing footer — mounted on every logged-out page (home,
// about, services, contact, help, privacy-policy, terms, access-denied).
// Authenticated route groups use DashboardFooter instead (mounted via
// DashboardLayout), which shares this footer's regulatory/data-protection
// line but drops the nav links, social icons, and dark marketing chrome
// that don't belong inside a logged-in dashboard shell.
export default function Footer() {
  const { language } = useLanguage();
  const t = footerTranslations[language];

  return (
    <footer className="border-t border-emerald-800 bg-gradient-to-b from-emerald-950 to-emerald-900 text-emerald-200">
      <div className="max-w-7xl mx-auto px-4 py-8 md:px-8 md:py-12">
        <div className="grid grid-cols-1 gap-8 text-center md:grid-cols-3 md:text-left">

          {/* Left: brand + tagline */}
          <div>
            <Link href="/" className="text-2xl font-bold text-white">
              Tujitunze
            </Link>

            <p className="mt-3 text-sm leading-relaxed text-emerald-200">
              {t.tagline}
            </p>
          </div>

          {/* Center: navigation */}
          <div>
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
              <li>
                <Link href="/privacy-policy" className={LINK_CLASS}>
                  {t.privacyPolicy}
                </Link>
              </li>
              <li>
                <Link href="/terms" className={LINK_CLASS}>
                  {t.terms}
                </Link>
              </li>
            </ul>
          </div>

          {/* Right: contact + social */}
          <div>
            <h3 className={HEADING_CLASS}>{t.contactInfo}</h3>

            <ul className="space-y-3 text-sm text-emerald-200">
              <li className="flex justify-center gap-3 md:justify-start">
                <Mail className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
                <span>tujitunze@gmail.com</span>
              </li>
              <li className="flex justify-center gap-3 md:justify-start">
                <PhoneCall className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
                <span>+255 756 801 149</span>
              </li>
              <li className="flex justify-center gap-3 md:justify-start">
                <MapPin className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{t.location}</span>
              </li>
            </ul>

            <div className="mt-5 flex justify-center gap-3 md:justify-start">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="
                  flex h-11 w-11 md:h-9 md:w-9
                  items-center justify-center
                  rounded-full
                  border border-emerald-800
                  text-xs text-emerald-200
                  transition-colors duration-200
                  hover:border-emerald-400 hover:text-emerald-400
                "
                >
                  {social.glyph}
                </a>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-emerald-800">
        <div className="max-w-7xl mx-auto px-4 py-4 md:px-8 text-center">
          <p className="text-xs text-emerald-200">
            © {new Date().getFullYear()} Tujitunze | {t.regulatoryLine} | {t.dataProtectionNote}
          </p>
        </div>
      </div>
    </footer>
  );
}
