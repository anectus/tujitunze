
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { ComponentType, SVGProps } from "react";

import { getAccessToken } from "@/lib/utils/permissions";
import { useMembershipGate } from "@/lib/hooks/useMembershipGate";
import { useLanguage } from "@/lib/context/LanguageContext";
import { memberDashboardTranslations } from "@/constants/translations/member-dashboard";
import { commonTranslations } from "@/constants/translations/common";
import { API_URL } from "@/lib/utils/api";
import PageContainer from "@/components/dashboard/PageContainer";
import SectionHeader from "@/components/dashboard/SectionHeader";
import MembershipGateSpinner from "@/components/dashboard/MembershipGateSpinner";
import {
  BellIcon,
  CoinsIcon,
  ShieldIcon,
  WalletIcon,
} from "@/components/common/SidebarIcons";
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

// Icon per Quick Access card, keyed by href (stable across languages) —
// same lookup-by-href convention cardDetail/cardActive below use.
const CARD_ICONS: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
  "/insurance/plans": ShieldIcon,
  "/savings": CoinsIcon,
  "/notifications": BellIcon,
};

// Quick Access card: rounded-2xl/shadow-md/border, matching StatisticCard's
// hover elevation. `active` toggles the emerald-tinted "real, current data"
// treatment vs. the gray "coming soon / nothing to show yet" one — the
// whole card stays one <Link> (not a nested <a>) for a single large,
// keyboard-reachable target; "View Details" is a purely visual affordance
// inside it, not a second interactive element.
function QuickAccessCard({
  href,
  title,
  subtitle,
  detail,
  active,
  progress,
  viewDetailsLabel,
}: {
  href: string;
  title: string;
  subtitle: string;
  detail?: string;
  active: boolean;
  progress?: { percent: number; label: string };
  viewDetailsLabel: string;
}) {
  const Icon = CARD_ICONS[href] ?? WalletIcon;

  return (
    <Link
      href={href}
      className={`group flex flex-col justify-between rounded-2xl border border-gray-100 p-6 shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 ${
        active ? "bg-emerald-50" : "bg-gray-50"
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xl font-semibold text-gray-900">{title}</p>
            <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
          </div>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-[#064E3B] shadow-sm">
            <Icon className="h-5 w-5" />
          </span>
        </div>

        {detail && (
          <p
            className={`mt-4 text-2xl font-bold ${
              active ? "text-emerald-700" : "text-gray-400"
            }`}
          >
            {detail}
          </p>
        )}

        {progress && (
          <div className="mt-4">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white">
              <div
                className="h-full rounded-full bg-emerald-600"
                style={{
                  width: `${Math.min(100, Math.max(0, progress.percent))}%`,
                }}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">{progress.label}</p>
          </div>
        )}
      </div>

      <span className="mt-6 inline-flex w-fit items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-[#064E3B] shadow-sm transition group-hover:bg-emerald-100">
        {viewDetailsLabel}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
          className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m0 0l-6-6m6 6l-6 6" />
        </svg>
      </span>
    </Link>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language } = useLanguage();
  const t = memberDashboardTranslations[language];
  const ct = commonTranslations[language];

  // null: not resolved yet (show a spinner). false: the backend's
  // membershipComplete flag (see members.service.ts's
  // isMembershipComplete — gender + region + an active phone number) is
  // false, and useMembershipGate is already redirecting to the
  // completion form — nothing past this point (Overview's own fetches
  // included) mounts in that case, only in the `true` branch, so no
  // dashboard data fetch ever fires for an incomplete profile.
  const membershipComplete = useMembershipGate("requireComplete");

  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [activePolicy, setActivePolicy] = useState<InsurancePolicy | null>(null);
  const [savings, setSavings] = useState<SavingsSummary | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // "?welcome=1" is set by MobileMoneyAccountForm's post-completion
  // redirect (see handleSubmit there) — a one-shot signal, not
  // persisted state, so it's stripped from the URL right after reading
  // it and never reappears on refresh/back-navigation.
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(
    searchParams.get("welcome") === "1"
  );

  useEffect(() => {
    if (searchParams.get("welcome") !== "1") {
      return;
    }

    router.replace("/dashboard");

    const timeout = setTimeout(() => setShowWelcomeBanner(false), 6000);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reads the param once on the mount that carries it
  }, []);

  const loadQuickAccessData = () => {
    const token = getAccessToken();

    if (!token) {
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };

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
  };

  useEffect(() => {
    if (membershipComplete !== true) {
      return;
    }

    loadQuickAccessData();
  }, [membershipComplete]);

  // Wallet balance, active policy, savings, and unread count are all
  // read-only here — safe to silently refresh on tab focus, same
  // reasoning the Super-admin dashboard's own focus refresh uses. Same
  // membershipComplete guard as above, for the same reason.
  useEffect(() => {
    if (membershipComplete !== true) {
      return;
    }

    window.addEventListener("focus", loadQuickAccessData);
    return () => window.removeEventListener("focus", loadQuickAccessData);
  }, [membershipComplete]);

  if (membershipComplete === null) {
    return <MembershipGateSpinner label={t.loadingDashboard} />;
  }

  if (membershipComplete === false) {
    // The redirect effect above is already navigating away — render the
    // same spinner rather than any dashboard content/data fetch while
    // that navigation completes.
    return <MembershipGateSpinner label={t.loadingDashboard} />;
  }

  // Keyed by href (stable across languages) rather than the translated
  // title, since t.cards's order/wording can change independently of
  // which figure belongs on which card.
  const cardDetail = (href: string): string | undefined => {
    switch (href) {
      case "/insurance/plans":
        return activePolicy ? activePolicy.provider_name : t.noActivePolicy;
      case "/savings":
        return savings ? formatTsh(savings.totalSavedTzs) : undefined;
      case "/notifications":
        return unreadCount > 0
          ? t.unreadTemplate.replace("{count}", String(unreadCount))
          : t.allCaughtUp;
      default:
        return undefined;
    }
  };

  // Emerald = real, current data; gray = nothing to show yet (no active
  // policy, or notifications with nothing unread) — same active/inactive
  // language the KPI cards above use.
  const cardActive = (href: string): boolean => {
    switch (href) {
      case "/insurance/plans":
        return !!activePolicy;
      case "/savings":
        return !!savings;
      case "/notifications":
        return unreadCount > 0;
      default:
        return false;
    }
  };

  // A real, derived ratio — not a fabricated goal — since the backend
  // has no wallet/savings "target" concept: what share of the current
  // wallet balance the automatic micro-savings engine actually
  // contributed, per the dual-mode savings design (every saving event
  // ultimately credits the wallet via WalletsService.creditContribution).
  const savingsProgress =
    wallet && savings && wallet.balance > 0
      ? Math.round((savings.totalSavedTzs / wallet.balance) * 100)
      : null;

  return (
    <PageContainer>

      {/* "Membership verified successfully!" toast — one-shot, driven by
          ?welcome=1 from MobileMoneyAccountForm's post-completion
          redirect. Fixed/top-right so it overlays without shifting the
          page layout underneath it. */}
      {showWelcomeBanner && (
        <div
          role="status"
          className="fixed right-4 top-4 z-50 flex items-start gap-3 rounded-lg border border-emerald-100 bg-white px-4 py-3 shadow-xl [animation:fade-in_0.3s_ease-out_forwards] motion-reduce:[animation:none]"
        >
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[#064E3B]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              aria-hidden="true"
              className="h-3.5 w-3.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </span>
          <p className="text-sm font-medium text-gray-900">
            {t.membershipVerifiedToast}
          </p>
          <button
            type="button"
            onClick={() => setShowWelcomeBanner(false)}
            aria-label={ct.close}
            className="ml-2 shrink-0 rounded p-0.5 text-gray-400 transition hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
              className="h-4 w-4"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="text-sm text-gray-500">
        <span className="font-semibold text-gray-900">
          {t.breadcrumbCurrent}
        </span>
      </nav>

      <h1 className="mt-2 text-3xl font-bold text-gray-900">
        {t.welcomeHeading}
      </h1>

      {/* Overview + Insights — KPIs, balance/contribution/allocation
          charts, and CSV/PDF export. See ./Overview.tsx, which renders
          its own section headers for both. */}
      <div className="mt-6">
        <Overview />
      </div>

      {/* Quick Access — Insurance, Savings, Notifications */}
      <SectionHeader
        title={t.quickAccessHeading}
        subtitle={t.quickAccessSubtitle}
      />

      <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {t.cards.map((card) => (
          <QuickAccessCard
            key={card.title}
            href={card.href}
            title={card.title}
            subtitle={card.subtitle}
            detail={cardDetail(card.href)}
            active={cardActive(card.href)}
            viewDetailsLabel={t.viewDetails}
            progress={
              card.href === "/savings" && savingsProgress !== null
                ? {
                    percent: savingsProgress,
                    label: t.savingsProgressTemplate.replace(
                      "{percent}",
                      String(savingsProgress)
                    ),
                  }
                : undefined
            }
          />
        ))}
      </div>

    </PageContainer>
  );
}
