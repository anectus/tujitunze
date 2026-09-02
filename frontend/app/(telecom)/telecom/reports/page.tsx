"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { getAccessToken } from "@/lib/utils/permissions";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { useLanguage } from "@/lib/context/LanguageContext";
import { commonTranslations } from "@/constants/translations/common";
import { telecomReportsTranslations } from "@/constants/translations/telecom-reports";
import { API_URL } from "@/lib/utils/api";

type Period = "daily" | "weekly" | "monthly";

interface Bucket {
  bucket: string;
  count: number;
  total: string;
}

interface FailedReason {
  processing_status: string;
  count: number;
}

interface Report {
  period: Period;
  buckets: Bucket[];
  failedByReason: FailedReason[];
}

export default function TelecomReportsPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const t = telecomReportsTranslations[language];
  const common = commonTranslations[language];

  const PERIODS: { label: string; value: Period }[] = [
    { label: t.dailyReport, value: "daily" },
    { label: t.weeklyReport, value: "weekly" },
    { label: t.monthlyReport, value: "monthly" },
  ];

  const [period, setPeriod] = useState<Period>("daily");
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getAccessToken();

    if (!token) {
      router.push("/login");
      return;
    }

    fetch(`${API_URL}/telecom/reports?period=${period}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || t.loadError);
        }

        return data;
      })
      .then(setReport)
      .catch((err) => setError(err instanceof Error ? err.message : t.loadError))
      .finally(() => setLoading(false));
  }, [router, period]);

  return (
    <div>

      <DashboardHeader title={t.headerTitle} />

      <div className="p-4 sm:p-8">

        <div className="mb-6 flex flex-wrap gap-2">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPeriod(p.value)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                period === p.value
                  ? "bg-blue-700 text-white"
                  : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (

          <p className="text-gray-500">{common.loading}</p>

        ) : report ? (

          <div className="space-y-6">

            {/* Contribution Report */}
            <div>
              <p className="mb-2 text-sm font-semibold text-gray-700">{t.contributionReportHeading}</p>

              {report.buckets.length === 0 ? (

                <p className="text-sm text-gray-500">{t.noContributionsPeriod}</p>

              ) : (

                <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-md">

                  <table className="w-full text-left text-sm">

                    <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                      <tr>
                        <th className="px-6 py-3 font-semibold">{t.period}</th>
                        <th className="px-6 py-3 font-semibold">{t.transactions}</th>
                        <th className="px-6 py-3 font-semibold">{t.total}</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">

                      {report.buckets.map((bucket) => (
                        <tr key={bucket.bucket}>
                          <td className="px-6 py-4 text-gray-900">
                            {new Date(bucket.bucket).toLocaleDateString("en-TZ")}
                          </td>
                          <td className="px-6 py-4 text-gray-600">{bucket.count}</td>
                          <td className="px-6 py-4 font-semibold text-gray-900">
                            TSh {Number(bucket.total).toLocaleString("en-TZ")}
                          </td>
                        </tr>
                      ))}

                    </tbody>

                  </table>

                </div>

              )}
            </div>

            {/* Failed Transaction Report */}
            <div>
              <p className="mb-2 text-sm font-semibold text-gray-700">{t.failedReportHeading}</p>

              {report.failedByReason.length === 0 ? (

                <p className="text-sm text-gray-500">{t.noFailedOrPending}</p>

              ) : (

                <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-md">

                  <table className="w-full text-left text-sm">

                    <tbody className="divide-y divide-gray-100">

                      {report.failedByReason.map((row) => (
                        <tr key={row.processing_status}>
                          <td className="px-6 py-4 text-gray-900">{row.processing_status}</td>
                          <td className="px-6 py-4 text-gray-600">{row.count}</td>
                        </tr>
                      ))}

                    </tbody>

                  </table>

                </div>

              )}
            </div>

            {/* Reconciliation Report */}
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center">
              <p className="text-gray-600">{t.reconciliationReportHeading}</p>
              <p className="mt-2 text-sm text-gray-400">
                {t.reconciliationReportBodyPrefix}{" "}
                <Link href="/telecom/reconciliation" className="font-semibold text-blue-700">
                  {t.reconciliationReportLinkText}
                </Link>{" "}
                {t.reconciliationReportBodySuffix}
              </p>
            </div>

          </div>

        ) : null}

      </div>

    </div>
  );
}
