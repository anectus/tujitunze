"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { useLanguage } from "@/lib/context/LanguageContext";
import { footerTranslations } from "@/constants/translations/home";

// Mounted at the bottom of every authenticated route group via
// DashboardLayout, in place of the public marketing Footer (that one's
// nav links, social icons, and newsletter framing belong to the
// logged-out site, not an authenticated dashboard shell). Shares
// DashboardHeader's bg-white/border-gray-100 chrome since the two
// bookend the same page. Reuses footerTranslations' regulatoryLine /
// dataProtectionNote strings rather than duplicating the legal text, so
// the two footers can't drift out of sync with each other. The extra
// tagline line only applies to Member — gated on the JWT's roles rather
// than a prop, same reasoning DashboardHeader's own member-only bell/
// "Complete Membership" nudge uses: one shared footer instead of a
// near-duplicate Member-only component.
export default function DashboardFooter() {
  const { roles } = useAuth();
  const { language } = useLanguage();
  const t = footerTranslations[language];
  const isMember = roles.includes("Member");

  return (
    <footer className="border-t border-gray-100 bg-white px-4 py-4 sm:px-8">
      <p className="text-center text-xs text-gray-500">
        © {new Date().getFullYear()} Tujitunze | {t.regulatoryLine} | {t.dataProtectionNote}
      </p>
      {isMember && (
        <p className="mt-1 text-center text-xs font-medium text-emerald-700">
          {t.memberDashboardTagline}
        </p>
      )}
    </footer>
  );
}
