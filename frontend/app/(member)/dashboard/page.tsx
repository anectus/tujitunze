
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { getAccessToken } from "@/lib/utils/permissions";
import { useLanguage } from "@/lib/context/LanguageContext";
import { memberDashboardTranslations } from "@/constants/translations/member-dashboard";
import { API_URL } from "@/lib/utils/api";
import PageContainer from "@/components/dashboard/PageContainer";
import Overview from "./Overview";

interface Wallet {
  balance: number;
}

interface InsurancePolicy {
  policy_status: string;
  provider_name: string;
  start_date: string;
}

interface SavingsSummary {
  totalSavedTzs: number;
}

function formatTsh(amount: number) {
  return `TSh ${amount.toLocaleString("en-TZ", { minimumFractionDigits: 2 })}`;
}

// Card: the one shared visual unit every dashboard section renders in —
// rounded-xl/shadow-md/bg-white/p-6, title text-lg font-semibold, an
// optional muted subtitle, and an optional bold "detail" line (the
// at-a-glance figure each card surfaces alongside its description).
function Card({
  href,
  title,
  subtitle,
  detail,
}: {
  href: string;
  title: string;
  subtitle: string;
  detail?: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-xl bg-white p-6 shadow-md transition hover:shadow-lg hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
    >
      <p className="text-lg font-semibold text-gray-900">{title}</p>
      <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
      {detail && (
        <p className="mt-4 text-base font-semibold text-emerald-700">
          {detail}
        </p>
      )}
    </Link>
  );
}

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

  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [activePolicy, setActivePolicy] = useState<InsurancePolicy | null>(null);
  const [savings, setSavings] = useState<SavingsSummary | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const token = getAccessToken();

    if (!token) {
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    fetch(`${API_URL}/members/me`, { headers })
      .then((response) => (response.ok ? response.json() : null))
      .then((profile) => setMembershipComplete(!!profile && !!profile.region))
      .catch(() => setMembershipComplete(false));

    fetch(`${API_URL}/members/wallet`, { headers })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => setWallet(data))
      .catch(() => setWallet(null));

    fetch(`${API_URL}/members/insurance`, { headers })
      .then((response) => (response.ok ? response.json() : []))
      .then((policies: InsurancePolicy[]) =>
        setActivePolicy(
          policies.find((policy) => policy.policy_status === "Active") ?? null
        )
      )
      .catch(() => setActivePolicy(null));

    fetch(`${API_URL}/members/savings-summary`, { headers })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => setSavings(data))
      .catch(() => setSavings(null));

    fetch(`${API_URL}/members/notifications?pageSize=1`, { headers })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => setUnreadCount(data?.unreadCount ?? 0))
      .catch(() => setUnreadCount(0));
  }, []);

  if (membershipComplete === null) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-base text-gray-500">{t.loadingDashboard}</p>
      </div>
    );
  }

  // Keyed by href (stable across languages) rather than the translated
  // title, since t.cards's order/wording can change independently of
  // which figure belongs on which card.
  const cardDetail = (href: string): string | undefined => {
    switch (href) {
      case "/wallet":
        return wallet ? formatTsh(wallet.balance) : undefined;
      case "/insurance/plans":
        return activePolicy ? activePolicy.provider_name : t.noActivePolicy;
      case "/savings":
        return savings ? formatTsh(savings.totalSavedTzs) : undefined;
      case "/telecom":
        return t.comingSoon;
      case "/notifications":
        return unreadCount > 0
          ? t.unreadTemplate.replace("{count}", String(unreadCount))
          : t.allCaughtUp;
      default:
        return undefined;
    }
  };

  return (
    <PageContainer>

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="text-sm text-gray-500">
        <span className="font-semibold text-gray-900">
          {t.breadcrumbCurrent}
        </span>
      </nav>

      <h1 className="mt-2 text-3xl font-bold text-gray-900">
        {t.welcomeHeading}
      </h1>

      {/* Overview — KPIs, balance/contribution/allocation charts, and
          CSV/PDF export. See ./Overview.tsx. */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold text-gray-900">
          {t.overviewHeading}
        </h2>

        <div className="mt-4">
          <Overview />
        </div>
      </section>

      {/* Sections — Wallet, Insurance, Savings, Telecom, Notifications */}
      <section className="mt-12">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {t.cards.map((card) => (
            <Card
              key={card.title}
              href={card.href}
              title={card.title}
              subtitle={card.subtitle}
              detail={cardDetail(card.href)}
            />
          ))}
        </div>
      </section>

    </PageContainer>
  );
}
