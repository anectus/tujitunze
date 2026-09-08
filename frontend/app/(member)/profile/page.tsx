
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import { getAccessToken } from "@/lib/utils/permissions";
import StatusBadge from "@/components/common/StatusBadge";
import { useLanguage } from "@/lib/context/LanguageContext";
import { memberProfileTranslations } from "@/constants/translations/member-profile";
import { commonTranslations } from "@/constants/translations/common";
import { API_URL } from "@/lib/utils/api";
import {
  BadgeCheckIcon,
  ChartBarIcon,
  PhoneIcon,
  UserCircleIcon,
  WalletIcon,
} from "@/components/common/SidebarIcons";

interface TelecomOperator {
  operator_id: number;
  operator_name: string;
}

interface Bank {
  bank_id: number;
  bank_name: string;
}

interface PhoneNumber {
  phoneId: number;
  phoneNumber: string;
  operatorId: number;
  accountNumber: string | null;
  isPrimary: boolean;
  phoneStatus: string;
}

interface BankAccount {
  memberBankAccountId: number;
  bankId: number;
  accountNumber: string;
  accountHolderName: string;
  accountType: string | null;
  isPrimary: boolean;
  accountStatus: string;
  verificationStatus: string;
}

interface MemberProfile {
  userId: number;
  firstName: string;
  secondName: string | null;
  surname: string;
  email: string | null;
  nidaNumber: string;
  memberStatus: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: string;
  phoneNumbers: PhoneNumber[];
  bankAccounts: BankAccount[];
}

interface RecentTransaction {
  walletTransactionId: number;
  transactionType: string;
  amount: number;
  transactionDate: string;
}

const RECENT_ACTIVITY_PAGE_SIZE = 3;

function formatTsh(amount: number) {
  return `TSh ${amount.toLocaleString("en-TZ", { minimumFractionDigits: 2 })}`;
}

// Matches backend/src/modules/members/members.service.ts's own
// `TB${String(userId).padStart(6, '0')}` exactly — that helper only ever
// runs server-side (inside the /members/membership summary), so this is
// the same formula reproduced here rather than an extra fetch just to
// get a display string /members/me already gives us the input for.
function formatMemberId(userId: number): string {
  return `TB${String(userId).padStart(6, "0")}`;
}

// Shared card shell — clear title + icon, subtle border, hover elevation.
// whileHover (not a Tailwind hover:-translate-y class) is deliberate:
// framer-motion's own whileInView entrance animation below already
// drives this element's `transform` via inline style for its lifetime,
// which would silently outrank a CSS hover:translate-y class in the
// cascade. Box-shadow isn't part of that inline style, so the shadow
// half of the hover effect is a plain Tailwind transition instead.
function ProfileCard({
  title,
  icon: Icon,
  action,
  delay = 0,
  children,
}: {
  title: string;
  icon: typeof UserCircleIcon;
  action?: React.ReactNode;
  delay?: number;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, ease: "easeOut", delay }}
      className="rounded-xl border border-gray-100 bg-white p-6 shadow-md transition-shadow duration-300 hover:shadow-lg md:p-8"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <Icon className="h-5 w-5 shrink-0 text-[#064E3B]" />
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        </div>
        {action}
      </div>

      <div className="mt-4">{children}</div>
    </motion.div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { language } = useLanguage();
  const t = memberProfileTranslations[language];
  const common = commonTranslations[language];

  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [operators, setOperators] = useState<TelecomOperator[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentTransaction[] | null>(
    null
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [settingPrimaryId, setSettingPrimaryId] = useState<number | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      const token = getAccessToken();

      if (!token) {
        router.push("/login");
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      try {
        const [profileResponse, operatorsResponse, banksResponse] = await Promise.all([
          fetch(`${API_URL}/members/me`, { headers }),
          fetch(`${API_URL}/members/telecom-operators`),
          fetch(`${API_URL}/members/banks`),
        ]);

        if (profileResponse.status === 401) {
          router.push("/login");
          return;
        }

        const profileData = await profileResponse.json();

        if (!profileResponse.ok) {
          throw new Error(
            profileData.message || t.loadErrorFallback
          );
        }

        setProfile(profileData);

        if (operatorsResponse.ok) {
          setOperators(await operatorsResponse.json());
        }

        if (banksResponse.ok) {
          setBanks(await banksResponse.json());
        }
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError(t.genericErrorFallback);
        }
      } finally {
        setLoading(false);
      }

      // Activity Summary — best-effort, separate from the profile load
      // above: a failure here shouldn't block the rest of the page, it
      // just leaves that one card showing "no recent activity".
      fetch(
        `${API_URL}/members/wallet/transactions?pageSize=${RECENT_ACTIVITY_PAGE_SIZE}`,
        { headers }
      )
        .then((response) => (response.ok ? response.json() : null))
        .then((data) => setRecentActivity(data?.items ?? []))
        .catch(() => setRecentActivity([]));
    };

    loadProfile();
  }, [router, t.loadErrorFallback, t.genericErrorFallback]);

  // Update local state directly rather than refetching the whole profile —
  // the new primary is already known from a successful PATCH.
  const setPrimaryPhone = async (phoneId: number) => {
    const token = getAccessToken();

    if (!token) {
      router.push("/login");
      return;
    }

    setSettingPrimaryId(phoneId);

    try {
      await fetch(`${API_URL}/members/phone-numbers/${phoneId}/primary`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });

      setProfile((current) =>
        current
          ? {
              ...current,
              phoneNumbers: current.phoneNumbers.map((phone) => ({
                ...phone,
                isPrimary: phone.phoneId === phoneId,
              })),
            }
          : current
      );
    } finally {
      setSettingPrimaryId(null);
    }
  };

  const operatorName = (operatorId: number) =>
    operators.find((operator) => operator.operator_id === operatorId)
      ?.operator_name ?? t.unknownNetwork;

  const bankName = (bankId: number) =>
    banks.find((bank) => bank.bank_id === bankId)?.bank_name ?? t.unknownBank;

  const fullName = profile
    ? [profile.firstName, profile.secondName, profile.surname]
        .filter(Boolean)
        .join(" ")
    : "";

  const initials = profile
    ? `${profile.firstName[0] ?? ""}${profile.surname[0] ?? ""}`.toUpperCase()
    : "";

  // Derived from the two real verification booleans — there's no single
  // stored "verification status" column, so this is computed here rather
  // than reusing memberStatus (Active/Pending/Inactive/Suspended, a
  // different concept: account status, still shown separately below in
  // Personal Information).
  const verification = !profile
    ? null
    : profile.emailVerified && profile.phoneVerified
      ? { label: t.verificationFull, tone: "success" as const }
      : profile.emailVerified || profile.phoneVerified
        ? { label: t.verificationPartial, tone: "warning" as const }
        : { label: t.verificationNone, tone: "neutral" as const };

  const verificationBadgeClass =
    verification?.tone === "success"
      ? "bg-emerald-100 text-[#064E3B]"
      : verification?.tone === "warning"
        ? "bg-amber-100 text-amber-800"
        : "bg-gray-100 text-gray-600";

  return (
    <div className="min-h-screen bg-[#F0FDF4] px-4 py-12">

      <div className="mx-auto max-w-5xl">

        <Link
          href="/dashboard"
          className="text-sm font-medium text-[#064E3B] hover:text-[#065F46]"
        >
          ← {common.backToDashboard}
        </Link>

        <h1 className="mt-4 text-3xl font-bold text-gray-900">
          {t.title}
        </h1>

        {loading && (
          <p className="mt-8 text-gray-500">{t.loadingProfile}</p>
        )}

        {error && (
          <div className="mt-8 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {profile && (
          <>
            {/* Profile header — avatar, name, member ID, verification
                badge, tagline, and the one Edit Profile entry point.
                There's no dedicated "edit profile" page in this app —
                PATCH /members/me is only ever called from the
                onboarding/mobile-money form, so that's genuinely where
                this button goes, not a link to a page that doesn't
                exist. */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="mt-6 rounded-xl border border-gray-100 bg-white p-6 shadow-md md:p-8"
            >
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">

                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xl font-bold text-[#064E3B]">
                    {initials}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-lg font-semibold text-gray-900">
                        {fullName}
                      </p>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">
                        {formatMemberId(profile.userId)}
                      </span>
                      {verification && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${verificationBadgeClass}`}
                        >
                          {verification.label}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-600">
                      {t.memberSince.replace(
                        "{year}",
                        String(new Date(profile.createdAt).getFullYear())
                      )}
                      {" | "}
                      {t.healthSaverTag}
                    </p>
                  </div>
                </div>

                <Link
                  href="/onboarding/mobile-money"
                  className="inline-flex shrink-0 items-center justify-center rounded-lg bg-[#064E3B] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#065F46] sm:self-start"
                >
                  {t.editProfile}
                </Link>

              </div>
            </motion.div>

            {/* Two-column grid: Personal Information on the left, the
                dynamic sections (contact/financial/activity) on the
                right — stacks to one column below lg. */}
            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">

              <div className="lg:col-span-1">
                <ProfileCard title={t.personalInfoTitle} icon={UserCircleIcon}>
                  <dl className="space-y-4">
                    <div>
                      <dt className="text-xs font-semibold uppercase text-gray-500">
                        {t.nidaNumber}
                      </dt>
                      <dd className="mt-1 text-gray-900">{profile.nidaNumber}</dd>
                    </div>

                    <div>
                      <dt className="text-xs font-semibold uppercase text-gray-500">
                        {t.email}
                      </dt>
                      <dd className="mt-1 text-gray-900">
                        {profile.email || common.notProvided}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-xs font-semibold uppercase text-gray-500">
                        {t.accountStatus}
                      </dt>
                      <dd className="mt-1">
                        <StatusBadge domain="member" status={profile.memberStatus} />
                      </dd>
                    </div>

                    <div>
                      <dt className="text-xs font-semibold uppercase text-gray-500">
                        {t.verificationStatusLabel}
                      </dt>
                      <dd className="mt-1 text-sm text-gray-600">
                        {t.emailVerification}: {profile.emailVerified ? t.verified : t.notVerified}
                        <br />
                        {t.phoneVerification}: {profile.phoneVerified ? t.verified : t.notVerified}
                      </dd>
                    </div>
                  </dl>
                </ProfileCard>
              </div>

              <div className="space-y-6 lg:col-span-2">

                {/* Contact Information */}
                <ProfileCard
                  title={t.contactInfoTitle}
                  icon={PhoneIcon}
                  delay={0.1}
                  action={
                    <Link
                      href="/onboarding/mobile-money"
                      className="text-sm font-semibold text-[#064E3B] hover:text-[#065F46]"
                    >
                      {t.addAnother}
                    </Link>
                  }
                >
                  <ul className="divide-y divide-gray-100">
                    {profile.phoneNumbers.map((phone) => (
                      <li
                        key={phone.phoneId}
                        className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                      >
                        <div>
                          <p className="font-semibold text-gray-900">
                            {phone.phoneNumber}
                            {phone.isPrimary && (
                              <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-[#064E3B]">
                                {t.primary}
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-gray-600">
                            {operatorName(phone.operatorId)}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-600">
                            {phone.phoneStatus}
                          </span>

                          {!phone.isPrimary && (
                            <button
                              type="button"
                              onClick={() => setPrimaryPhone(phone.phoneId)}
                              disabled={settingPrimaryId === phone.phoneId}
                              className="text-xs font-semibold text-[#064E3B]
                              hover:text-[#065F46] disabled:cursor-not-allowed
                              disabled:opacity-50"
                            >
                              {settingPrimaryId === phone.phoneId ? t.setting : t.setAsPrimary}
                            </button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </ProfileCard>

                {/* Financial Information */}
                <ProfileCard
                  title={t.financialInfoTitle}
                  icon={WalletIcon}
                  delay={0.2}
                  action={
                    <Link
                      href="/onboarding/mobile-money"
                      className="text-sm font-semibold text-[#064E3B] hover:text-[#065F46]"
                    >
                      {t.addAnother}
                    </Link>
                  }
                >
                  {profile.bankAccounts.length === 0 ? (
                    <p className="text-sm text-gray-600">{t.noBankAccount}</p>
                  ) : (
                    <ul className="divide-y divide-gray-100">
                      {profile.bankAccounts.map((account) => (
                        <li
                          key={account.memberBankAccountId}
                          className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                        >
                          <div>
                            <p className="font-semibold text-gray-900">
                              {bankName(account.bankId)} · ····{account.accountNumber.slice(-4)}
                              {account.isPrimary && (
                                <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-[#064E3B]">
                                  {t.primary}
                                </span>
                              )}
                            </p>
                            <p className="text-sm text-gray-600">
                              {account.accountHolderName}
                            </p>
                          </div>

                          <span className="text-sm text-gray-600">
                            {account.verificationStatus}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </ProfileCard>

                {/* Activity Summary — the 3 most recent wallet
                    transactions, reusing the same endpoint the Wallet
                    page's own transaction list already calls. */}
                <ProfileCard
                  title={t.activitySummaryTitle}
                  icon={ChartBarIcon}
                  delay={0.3}
                  action={
                    <Link
                      href="/wallet"
                      className="text-sm font-semibold text-[#064E3B] hover:text-[#065F46]"
                    >
                      {common.view}
                    </Link>
                  }
                >
                  {recentActivity === null ? (
                    <p className="text-sm text-gray-600">{t.loadingActivity}</p>
                  ) : recentActivity.length === 0 ? (
                    <p className="text-sm text-gray-600">{t.noRecentActivity}</p>
                  ) : (
                    <ul className="divide-y divide-gray-100">
                      {recentActivity.map((txn) => (
                        <li
                          key={txn.walletTransactionId}
                          className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                        >
                          <div className="flex items-center gap-2.5">
                            <BadgeCheckIcon className="h-4 w-4 shrink-0 text-slate-400" />
                            <div>
                              <p className="font-medium text-gray-900">
                                {txn.transactionType}
                              </p>
                              <p className="text-sm text-gray-600">
                                {new Date(txn.transactionDate).toLocaleDateString("en-TZ")}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`text-sm font-semibold ${
                              Number(txn.amount) < 0 ? "text-red-600" : "text-[#064E3B]"
                            }`}
                          >
                            {formatTsh(Number(txn.amount))}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </ProfileCard>

              </div>

            </div>
          </>
        )}

      </div>

    </div>
  );
}
