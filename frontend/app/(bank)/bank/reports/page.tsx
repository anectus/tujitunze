"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { getAccessToken } from "@/lib/utils/permissions";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { useLanguage } from "@/lib/context/LanguageContext";
import { bankReportsTranslations } from "@/constants/translations/bank-reports";
import { API_URL } from "@/lib/utils/api";

type Period = "daily" | "weekly" | "monthly";

interface Bucket {
  bucket: string;
  transaction_type: string;
  count: number;
  total: string;
}

interface SettlementTotal {
  settlement_status: string;
  count: number;
  total: string;
}

interface Report {
  period: Period;
  buckets: Bucket[];
  settlementTotals: SettlementTotal[];
}

export default function BankReportsPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const t = bankReportsTranslations[language];

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

    fetch(`${API_URL}/bank/reports?period=${period}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || t.unableToLoad);
        }

        return data;
      })
      .then(setReport)
      .catch((err) => setError(err instanceof Error ? err.message : t.unableToLoad))
      .finally(() => setLoading(false));
  }, [router, period, t.unableToLoad]);

  const deposits = report?.buckets.filter((b) => b.transaction_type === "Deposit") ?? [];
  const withdrawals = report?.buckets.filter((b) => b.transaction_type === "Withdrawal") ?? [];

  return (
    <div>

      <DashboardHeader title={t.title} />

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

          <p className="text-gray-500">{t.loading}</p>

        ) : report ? (

          <div className="space-y-6">

            {/* Deposit Report */}
            <div>
              <p className="mb-2 text-sm font-semibold text-gray-700">{t.depositReportTitle}</p>

              {deposits.length === 0 ? (
                <p className="text-sm text-gray-500">{t.noDepositsPeriod}</p>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-md">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                      <tr>
                        <th className="px-6 py-3 font-semibold">{t.period}</th>
                        <th className="px-6 py-3 font-semibold">{t.count}</th>
                        <th className="px-6 py-3 font-semibold">{t.total}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {deposits.map((b) => (
                        <tr key={`${b.bucket}-deposit`}>
                          <td className="px-6 py-4 text-gray-900">
                            {new Date(b.bucket).toLocaleDateString("en-TZ")}
                          </td>
                          <td className="px-6 py-4 text-gray-600">{b.count}</td>
                          <td className="px-6 py-4 font-semibold text-gray-900">
                            TSh {Number(b.total).toLocaleString("en-TZ")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Withdrawal Report */}
            <div>
              <p className="mb-2 text-sm font-semibold text-gray-700">{t.withdrawalReportTitle}</p>

              {withdrawals.length === 0 ? (
                <p className="text-sm text-gray-500">{t.noWithdrawalsPeriod}</p>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-md">
                  <table className="w-full text-left text-sm">
                    <tbody className="divide-y divide-gray-100">
                      {withdrawals.map((b) => (
                        <tr key={`${b.bucket}-withdrawal`}>
                          <td className="px-6 py-4 text-gray-900">
                            {new Date(b.bucket).toLocaleDateString("en-TZ")}
                          </td>
                          <td className="px-6 py-4 text-gray-600">{b.count}</td>
                          <td className="px-6 py-4 font-semibold text-gray-900">
                            TSh {Number(b.total).toLocaleString("en-TZ")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Settlement Report */}
            <div>
              <p className="mb-2 text-sm font-semibold text-gray-700">{t.settlementReportTitle}</p>

              {report.settlementTotals.length === 0 ? (
                <p className="text-sm text-gray-500">{t.noSettlements}</p>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-md">
                  <table className="w-full text-left text-sm">
                    <tbody className="divide-y divide-gray-100">
                      {report.settlementTotals.map((s) => (
                        <tr key={s.settlement_status}>
                          <td className="px-6 py-4 text-gray-900">{s.settlement_status}</td>
                          <td className="px-6 py-4 text-gray-600">{s.count}</td>
                          <td className="px-6 py-4 font-semibold text-gray-900">
                            TSh {Number(s.total).toLocaleString("en-TZ")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Reconciliation Report */}
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center">
              <p className="text-gray-600">{t.reconciliationReportTitle}</p>
              <p className="mt-2 text-sm text-gray-400">
                {t.seeThe}{" "}
                <Link href="/bank/reconciliation" className="font-semibold text-blue-700">
                  {t.reconciliationLink}
                </Link>{" "}
                {t.reconciliationReportNote}
              </p>
            </div>

          </div>

        ) : null}

      </div>

    </div>
  );
}
