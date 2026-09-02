"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getAccessToken } from "@/lib/utils/permissions";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatisticCard from "@/components/cards/StatisticCard";
import StatusBadge from "@/components/common/StatusBadge";
import { useLanguage } from "@/lib/context/LanguageContext";
import { commonTranslations } from "@/constants/translations/common";
import { telecomDashboardTranslations } from "@/constants/translations/telecom-dashboard";
import { API_URL } from "@/lib/utils/api";

interface TelecomContribution {
  contributionId: number;
  reference: string | null;
  amount: number;
  source: string;
  status: string;
  date: string;
}

interface TelecomDashboardData {
  operator: { name: string | null; status: string | null };
  linkedPhoneCount: number;
  registeredMemberCount: number;
  contributionCount: number;
  contributionTotal: number;
  today: { count: number; total: number };
  statusBreakdown: Record<string, number>;
  recentContributions: TelecomContribution[];
}

export default function TelecomDashboardPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const t = telecomDashboardTranslations[language];
  const common = commonTranslations[language];

  const [data, setData] = useState<TelecomDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      const token = getAccessToken();

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/telecom/dashboard`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.status === 401) {
          router.push("/login");
          return;
        }

        const body = await response.json();

        if (!response.ok) {
          throw new Error(body.message || t.loadError);
        }

        setData(body);
      } catch (err) {
        setError(err instanceof Error ? err.message : t.loadError);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [router]);

  return (
    <div>

      <DashboardHeader title={t.headerTitle} />

      <div className="p-4 sm:p-8">

        {error && (
          <div className="mb-6 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (

          <p className="text-gray-500">{t.loadingDashboard}</p>

        ) : data ? (

          <>

            <h2 className="mb-6 text-lg font-semibold text-gray-900">
              {data.operator.name}{" "}
              <span className="text-sm font-normal text-gray-500">
                ({data.operator.status})
              </span>
            </h2>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

              <StatisticCard label={t.totalRegisteredMembers} value={data.registeredMemberCount} />
              <StatisticCard
                label={t.todaysContributions}
                value={`TSh ${Number(data.today.total).toLocaleString("en-TZ")}`}
                hint={t.todaysContributionsHint(data.today.count)}
              />
              <StatisticCard
                label={t.successfulTransactions}
                value={data.statusBreakdown["Completed"] ?? 0}
              />
              <StatisticCard
                label={t.pendingTransactions}
                value={data.statusBreakdown["Pending"] ?? 0}
              />
              <StatisticCard
                label={t.failedTransactions}
                value={data.statusBreakdown["Failed"] ?? 0}
              />
              <StatisticCard
                label={t.contributionSummary}
                value={`TSh ${Number(data.contributionTotal).toLocaleString("en-TZ")}`}
                hint={t.contributionSummaryHint(data.contributionCount, data.linkedPhoneCount)}
              />

            </div>

            <div className="mt-8 overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-md">

              <table className="w-full text-left text-sm">

                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-6 py-3 font-semibold">{t.reference}</th>
                    <th className="px-6 py-3 font-semibold">{t.source}</th>
                    <th className="px-6 py-3 font-semibold">{t.amount}</th>
                    <th className="px-6 py-3 font-semibold">{common.status}</th>
                    <th className="px-6 py-3 font-semibold">{t.date}</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">

                  {data.recentContributions.length === 0 ? (
                    <tr>
                      <td className="px-6 py-4 text-gray-500" colSpan={5}>
                        {t.noContributionsYet}
                      </td>
                    </tr>
                  ) : (
                    data.recentContributions.map((c) => (
                      <tr key={c.contributionId}>
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {c.reference ?? "—"}
                        </td>
                        <td className="px-6 py-4 text-gray-600">{c.source}</td>
                        <td className="px-6 py-4 text-gray-600">{c.amount}</td>
                        <td className="px-6 py-4 text-gray-600">
                          <StatusBadge domain="transaction" status={c.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                          {new Date(c.date).toLocaleDateString("en-TZ")}
                        </td>
                      </tr>
                    ))
                  )}

                </tbody>

              </table>

            </div>

          </>

        ) : null}

      </div>

    </div>
  );
}
