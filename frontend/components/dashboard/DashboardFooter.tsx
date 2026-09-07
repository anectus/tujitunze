"use client";

import { useLanguage } from "@/lib/context/LanguageContext";
import { footerTranslations } from "@/constants/translations/home";

// Mounted at the bottom of every authenticated route group via
// DashboardLayout, in place of the public marketing Footer (that one's
// nav links, social icons, and newsletter framing belong to the
// logged-out site, not an authenticated dashboard shell). Shares
// DashboardHeader's bg-white/border-gray-100 chrome since the two
// bookend the same page. Reuses footerTranslations' regulatoryLine /
// dataProtectionNote strings rather than duplicating the legal text, so
// the two footers can't drift out of sync with each other.
export default function DashboardFooter() {
  const { language } = useLanguage();
  const t = footerTranslations[language];

  return (
    <footer className="border-t border-gray-100 bg-white px-4 py-4 sm:px-8">
      <p className="text-center text-xs text-gray-500">
        © {new Date().getFullYear()} Tujitunze | {t.regulatoryLine} | {t.dataProtectionNote}
      </p>
    </footer>
  );
}
