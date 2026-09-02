
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { getAccessToken } from "@/lib/utils/permissions";
import Header from "@/components/common/Header";
import { useLanguage } from "@/lib/context/LanguageContext";
import { memberDashboardTranslations } from "@/constants/translations/member-dashboard";
import { API_URL } from "@/lib/utils/api";

export default function DashboardPage() {
  const { language } = useLanguage();
  const t = memberDashboardTranslations[language];

  // null while loading. A Member who hasn't submitted the onboarding/
  // mobile-money form yet (no `region` on their profile) still sees the
  // dashboard shell — reaching that form is only via the "Complete
  // Membership" entry in the header's account menu, never a forced
  // redirect.
  const [membershipComplete, setMembershipComplete] = useState<boolean | null>(
    null
  );

  useEffect(() => {
    const token = getAccessToken();

    if (!token) {
      return;
    }

    fetch(`${API_URL}/members/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((profile) => setMembershipComplete(!!profile && !!profile.region))
      .catch(() => setMembershipComplete(false));
  }, []);

  if (membershipComplete === null) {
    return (
      <>
        <Header />

        <div className="flex min-h-screen items-center justify-center bg-white pt-16">
          <p className="text-gray-500">{t.loadingDashboard}</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />

      <div className="min-h-screen bg-white pt-32 pb-12 px-4">

        <div className="max-w-4xl mx-auto text-center">

          <h1 className="text-3xl font-bold text-gray-900">
            {t.welcomeHeading}
          </h1>

          <div className="mt-8 grid gap-4 text-left sm:grid-cols-2 lg:grid-cols-3">

            {t.sections.map((section) => (

              <Link
                key={section.title}
                href={section.href}
                className="rounded-2xl border border-gray-100 bg-white p-6
                shadow-md transition hover:shadow-xl hover:-translate-y-1"
              >
                <p className="text-lg font-bold text-gray-900">
                  {section.title}
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  {section.description}
                </p>
              </Link>

            ))}

          </div>

        </div>

      </div>
    </>
  );
}
