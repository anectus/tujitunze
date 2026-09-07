"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getAccessToken } from "@/lib/utils/permissions";
import StatusBadge from "@/components/common/StatusBadge";
import Button from "@/components/common/Button";
import { useLanguage } from "@/lib/context/LanguageContext";
import { memberMembershipTranslations } from "@/constants/translations/member-membership";
import { commonTranslations } from "@/constants/translations/common";
import { API_URL } from "@/lib/utils/api";
import PageContainer from "@/components/dashboard/PageContainer";

interface Coverage {
  policyNumber: string;
  status: string;
  planName: string;
  providerName: string;
  coverageAmount: number | null;
}

interface Membership {
  memberId: string;
  memberStatus: string;
  registrationDate: string;
  onboardingComplete: boolean;
  healthcareEligible: boolean;
  fundStatus: {
    balance: number;
    walletStatus: string;
  };
  contributionStatus: {
    hasContributed: boolean;
    lastContributionDate: string | null;
    totalContributed: number;
  };
  coverage: Coverage | null;
}

function formatTsh(amount: number) {
  return `TSh ${amount.toLocaleString("en-TZ", { minimumFractionDigits: 2 })}`;
}

function formatDate(value: string | null) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleDateString("en-TZ", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function MembershipPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const t = memberMembershipTranslations[language];
  const common = commonTranslations[language];

  const [membership, setMembership] = useState<Membership | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getAccessToken();

    if (!token) {
      router.push("/login");
      return;
    }

    fetch(`${API_URL}/members/membership`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        if (response.status === 401) {
          router.push("/login");
          return null;
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || t.errorFallback);
        }

        return data;
      })
      .then((data) => data && setMembership(data))
      .catch((err) =>
        setError(err instanceof Error ? err.message : t.errorFallback)
      )
      .finally(() => setLoading(false));
  }, [router, t.errorFallback]);

  return (
    <PageContainer backHref="/dashboard" backLabel={common.backToDashboard}>

        <h1 className="mt-4 text-3xl font-bold text-gray-900">
          {t.heading}
        </h1>

        {error && (
          <div className="mt-6 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (

          <p className="mt-8 text-gray-500">{common.loading}</p>

        ) : membership ? (

          <div className="mt-8 space-y-6">

            {/* Membership card */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-md">

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-500">
                    {t.memberId}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {membership.memberId}
                  </p>
                </div>

                <StatusBadge domain="member" status={membership.memberStatus} />
              </div>

              <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">

                <div>
                  <dt className="text-xs font-semibold uppercase text-gray-500">
                    {t.registrationDate}
                  </dt>
                  <dd className="mt-1 text-gray-900">
                    {formatDate(membership.registrationDate)}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-semibold uppercase text-gray-500">
                    {t.onboarding}
                  </dt>
                  <dd className="mt-1 text-gray-900">
                    {membership.onboardingComplete ? t.onboardingComplete : t.onboardingNotComplete}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-semibold uppercase text-gray-500">
                    {t.healthcareEligibility}
                  </dt>
                  <dd className="mt-1 text-gray-900">
                    {membership.healthcareEligible
                      ? t.eligible
                      : t.notYetEligible}
                  </dd>
                </div>

              </dl>

            </div>

            {/* Health Fund Status card */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-md">

              <p className="text-lg font-bold text-gray-900">
                {t.healthFundStatus}
              </p>

              <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">

                <div>
                  <dt className="text-xs font-semibold uppercase text-gray-500">
                    {t.healthWalletBalance}
                  </dt>
                  <dd className="mt-1 text-xl font-bold text-gray-900">
                    {formatTsh(membership.fundStatus.balance)}
                  </dd>
                  <dd className="text-xs text-gray-500">
                    {membership.fundStatus.walletStatus}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-semibold uppercase text-gray-500">
                    {t.totalContributed}
                  </dt>
                  <dd className="mt-1 text-xl font-bold text-gray-900">
                    {formatTsh(membership.contributionStatus.totalContributed)}
                  </dd>
                  <dd className="text-xs text-gray-500">
                    {membership.contributionStatus.hasContributed
                      ? `${t.lastContributionPrefix} ${formatDate(membership.contributionStatus.lastContributionDate)}`
                      : t.noContributionsYet}
                  </dd>
                </div>

              </dl>

              <div className="mt-6 border-t border-gray-100 pt-4">

                <p className="text-xs font-semibold uppercase text-gray-500">
                  {t.insuranceCoverage}
                </p>

                {membership.coverage ? (
                  <div className="mt-2 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {membership.coverage.planName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {membership.coverage.providerName} · {t.policyLabel}{" "}
                        {membership.coverage.policyNumber}
                      </p>
                    </div>
                    <StatusBadge domain="coverage" status={membership.coverage.status} />
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-gray-500">
                    {t.noActiveInsurance}
                  </p>
                )}

              </div>

              <div className="mt-6 flex justify-center">
                <Button href="/wallet" size="sm">
                  {t.makeContribution}
                </Button>
              </div>

            </div>

          </div>

        ) : null}

    </PageContainer>
  );
}
