"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getAccessToken } from "@/lib/utils/permissions";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatisticCard from "@/components/cards/StatisticCard";
import StatusBadge from "@/components/common/StatusBadge";
import { useLanguage } from "@/lib/context/LanguageContext";
import { commonTranslations } from "@/constants/translations/common";
import { telecomOutgoingDiversionsTranslations } from "@/constants/translations/telecom-outgoing-diversions";
import { API_URL } from "@/lib/utils/api";

interface Diversion {
  diversionId: number;
  externalTransactionId: string;
  phoneNumber: string;
  transactionType: "TUMA" | "LIPA_NAMBA" | "TOA" | "BILL_PAYMENT";
  grossAmountTzs: string;
  savedAmountTzs: string;
  status: string;
  transactionTimestamp: string;
}

interface Summary {
  byTransactionType: Record<string, { count: number; totalSavedAmountTzs: string }>;
  byStatus: Record<string, number>;
}

const PAGE_SIZE = 20;

function formatTsh(amount: number) {
  return `TSh ${amount.toLocaleString("en-TZ")}`;
}

export default function OutgoingDiversionsPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const t = telecomOutgoingDiversionsTranslations[language];
  const common = commonTranslations[language];

  const STATUS_FILTERS = [
    { label: t.filterAll, value: "" },
    { label: t.filterSuccessful, value: "SUCCESSFUL" },
    { label: t.filterSkipped, value: "SKIPPED" },
    { label: t.filterPendingReview, value: "PENDING_REVIEW" },
  ];

  const [summary, setSummary] = useState<Summary | null>(null);
  const [items, setItems] = useState<Diversion[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.push("/login");
      return;
    }

    fetch(`${API_URL}/telecom/outgoing-diversions/summary`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => (response.ok ? response.json() : null))
      .then(setSummary)
      .catch(() => setSummary(null));
  }, [router]);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.push("/login");
      return;
    }

    const query = new URLSearchParams({
      page: String(page),
      pageSize: String(PAGE_SIZE),
      ...(status ? { status } : {}),
    });

    setLoading(true);

    fetch(`${API_URL}/telecom/outgoing-diversions?${query.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || t.loadError);
        return data;
      })
      .then((data) => {
        setItems(data.items);
        setTotal(data.total);
      })
      .catch((err) => setError(err instanceof Error ? err.message : t.loadError))
      .finally(() => setLoading(false));
  }, [router, page, status, t.loadError]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <DashboardHeader title={t.headerTitle} />

      <div className="p-4 sm:p-8">
        <p className="mb-3 max-w-2xl text-sm text-gray-500">{t.subtitle}</p>

        <div className="mb-6 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          {t.inactiveNotice}
        </div>

        {summary && (
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatisticCard
              label={t.statTuma}
              value={formatTsh(Number(summary.byTransactionType.TUMA?.totalSavedAmountTzs ?? 0))}
              hint={`${summary.byTransactionType.TUMA?.count ?? 0}`}
            />
            <StatisticCard
              label={t.statLipaNamba}
              value={formatTsh(Number(summary.byTransactionType.LIPA_NAMBA?.totalSavedAmountTzs ?? 0))}
              hint={`${summary.byTransactionType.LIPA_NAMBA?.count ?? 0}`}
            />
            <StatisticCard
              label={t.statToa}
              value={formatTsh(Number(summary.byTransactionType.TOA?.totalSavedAmountTzs ?? 0))}
              hint={`${summary.byTransactionType.TOA?.count ?? 0}`}
            />
            <StatisticCard
              label={t.statBillPayment}
              value={formatTsh(Number(summary.byTransactionType.BILL_PAYMENT?.totalSavedAmountTzs ?? 0))}
              hint={`${summary.byTransactionType.BILL_PAYMENT?.count ?? 0}`}
            />
          </div>
        )}

        <div className="mb-4 flex flex-wrap gap-2">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => {
                setStatus(filter.value);
                setPage(1);
              }}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                status === filter.value
                  ? "bg-blue-700 text-white"
                  : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {filter.label}
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
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center">
            <p className="text-gray-600">{t.emptyTitle}</p>
            <p className="mt-2 text-sm text-gray-400">{t.emptyBody}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-md">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-6 py-3 font-semibold">{t.transactionType}</th>
                    <th className="px-6 py-3 font-semibold">{t.grossAmount}</th>
                    <th className="px-6 py-3 font-semibold">{t.savedAmount}</th>
                    <th className="px-6 py-3 font-semibold">{common.status}</th>
                    <th className="px-6 py-3 font-semibold">{t.dateTime}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((d) => (
                    <tr key={d.diversionId}>
                      <td className="px-6 py-4 font-semibold text-gray-900">{d.transactionType}</td>
                      <td className="px-6 py-4 text-gray-600">{formatTsh(Number(d.grossAmountTzs))}</td>
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        {formatTsh(Number(d.savedAmountTzs))}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge domain="transaction" status={d.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {new Date(d.transactionTimestamp).toLocaleString("en-TZ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between text-sm">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t.previous}
                </button>
                <span className="text-gray-500">{t.pageOf(page, totalPages)}</span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t.next}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
