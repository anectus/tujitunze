"use client";

import Link from "next/link";

import { useLanguage } from "@/lib/context/LanguageContext";
import { commonTranslations } from "@/constants/translations/common";

interface PageContainerProps {
  children: React.ReactNode;
  backHref?: string;
  backLabel?: string;
  // "5xl" (default) matches every Member/staff page that predates this;
  // "6xl" is for a page whose content is a wide multi-column grid (the
  // Super-admin dashboard and its sibling pages) that would feel
  // cramped at 5xl.
  maxWidth?: "5xl" | "6xl";
}

// The one content wrapper every authenticated (member/staff) page renders
// inside. DashboardLayout already supplies the surrounding chrome
// (Sidebar, DashboardHeader, DashboardFooter) — this owns only the
// content column, matching the padding/max-width the Member dashboard
// hub (app/(member)/dashboard/page.tsx) established, so every page sits
// at the same width instead of each inventing its own min-h-screen shell
// (min-h-screen is redundant here — DashboardLayout's own flex column is
// already full height) and max-w-{lg,2xl,3xl,4xl}. The optional back link
// uses the app's emerald brand color (matching Sidebar/LoginForm) rather
// than the blue-700 several older pages used, which didn't match the
// rest of the authenticated shell.
export default function PageContainer({
  children,
  backHref,
  backLabel,
  maxWidth = "5xl",
}: PageContainerProps) {
  const { language } = useLanguage();
  const t = commonTranslations[language];

  return (
    <div className="p-4 md:p-8">
      <div className={`mx-auto ${maxWidth === "6xl" ? "max-w-6xl" : "max-w-5xl"}`}>
        {backHref && (
          <Link
            href={backHref}
            className="rounded text-sm font-medium text-emerald-700 hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
          >
            ← {backLabel ?? t.backToDashboard}
          </Link>
        )}

        {children}
      </div>
    </div>
  );
}
