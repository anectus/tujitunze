"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getAccessToken } from "@/lib/utils/permissions";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatisticCard from "@/components/cards/StatisticCard";
import StatusBadge from "@/components/common/StatusBadge";
import { useLanguage } from "@/lib/context/LanguageContext";
import { commonTranslations } from "@/constants/translations/common";
import { telecomResourceConversionsTranslations } from "@/constants/translations/telecom-resource-conversions";
import { API_URL } from "@/lib/utils/api";

interface ResourceConversion {
  conversionId: number;
  externalTransactionId: string;
  phoneNumber: string;
  resourceType: "VOICE" | "DATA" | "SMS";
  grossUnits: string;
  unit: string;
  savedUnits: string;
  netUnitsToCustomer: string;
  savedValueTzs: string;
  status: string;
  conversionTimestamp: string;
}

interface Summary {
  byResourceType: Record<string, { count: number; totalSavedValueTzs: string }>;
  byStatus: Record<string, number>;
}

const PAGE_SIZE = 20;

function formatTsh(amount: number) {
  return `TSh ${amount.toLocaleString("en-TZ")}`;
}

export default function ResourceConversionsPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const t = telecomResourceConversionsTranslations[language];
  const common = commonTranslations[language];

  const STATUS_FILTERS = [
    { label: t.filterAll, value: "" },
    { label: t.filterSuccessful, value: "SUCCESSFUL" },
    { label: t.filterPendingReview, value: "PENDING_REVIEW" },
    { label: t.filterFailed, value: "FAILED" },
  ];

  const [summary, setSummary] = useState<Summary | null>(null);
  const [items, setItems] = useState<ResourceConversion[]>([]);
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

    fetch(`${API_URL}/telecom/resource-conversions/summary`, {
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

    fetch(`${API_URL}/telecom/resource-conversions?${query.toString()}`, {
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
        <p className="mb-6 max-w-2xl text-sm text-gray-500">{t.subtitle}</p>

        {summary && (
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatisticCard
              label={t.statVoice}
              value={formatTsh(Number(summary.byResourceType.VOICE?.totalSavedValueTzs ?? 0))}
              hint={`${summary.byResourceType.VOICE?.count ?? 0}`}
            />
            <StatisticCard
              label={t.statData}
              value={formatTsh(Number(summary.byResourceType.DATA?.totalSavedValueTzs ?? 0))}
              hint={`${summary.byResourceType.DATA?.count ?? 0}`}
            />
            <StatisticCard
              label={t.statSms}
              value={formatTsh(Number(summary.byResourceType.SMS?.totalSavedValueTzs ?? 0))}
              hint={`${summary.byResourceType.SMS?.count ?? 0}`}
            />
            <StatisticCard
              label={t.statSuccessful}
              value={summary.byStatus.SUCCESSFUL ?? 0}
            />
            <StatisticCard
              label={t.statPendingReview}
              value={summary.byStatus.PENDING_REVIEW ?? 0}
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
                    <th className="px-6 py-3 font-semibold">{t.resourceType}</th>
                    <th className="px-6 py-3 font-semibold">{t.grossUnits}</th>
                    <th className="px-6 py-3 font-semibold">{t.savedUnits}</th>
                    <th className="px-6 py-3 font-semibold">{t.netToCustomer}</th>
                    <th className="px-6 py-3 font-semibold">{t.savedValue}</th>
                    <th className="px-6 py-3 font-semibold">{common.status}</th>
                    <th className="px-6 py-3 font-semibold">{t.dateTime}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((c) => (
                    <tr key={c.conversionId}>
                      <td className="px-6 py-4 font-semibold text-gray-900">{c.resourceType}</td>
                      <td className="px-6 py-4 text-gray-600">
                        {Number(c.grossUnits).toLocaleString("en-TZ")} {c.unit}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {Number(c.savedUnits).toLocaleString("en-TZ")} {c.unit}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {Number(c.netUnitsToCustomer).toLocaleString("en-TZ")} {c.unit}
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        {formatTsh(Number(c.savedValueTzs))}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge domain="transaction" status={c.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {new Date(c.conversionTimestamp).toLocaleString("en-TZ")}
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
