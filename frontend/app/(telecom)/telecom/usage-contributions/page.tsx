"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getAccessToken } from "@/lib/utils/permissions";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatusBadge from "@/components/common/StatusBadge";
import { useLanguage } from "@/lib/context/LanguageContext";
import { commonTranslations } from "@/constants/translations/common";
import { telecomUsageContributionsTranslations } from "@/constants/translations/telecom-usage-contributions";

interface UsageEventSummary {
  byUsageType: Record<string, { count: number; totalValuationTzs: string }>;
  byStatus: Record<string, number>;
}

interface UsageEvent {
  usageEventId: number;
  externalTransactionId: string;
  usageType: "VOICE" | "SMS" | "DATA";
  quantity: string;
  unit: string;
  contributionQuantity: string;
  providerValuationTzs: string | null;
  status: string;
  usageTimestamp: string;
  reconciliationStatus: string | null;
}

const PAGE_SIZE = 20;

function formatTsh(amount: number) {
  return `TSh ${amount.toLocaleString("en-TZ")}`;
}

export default function TelecomUsageContributionsPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const t = telecomUsageContributionsTranslations[language];
  const common = commonTranslations[language];

  const TYPE_FILTERS = [
    { label: t.filterAll, value: "" },
    { label: t.filterVoice, value: "VOICE" },
    { label: t.filterSms, value: "SMS" },
    { label: t.filterData, value: "DATA" },
  ];

  const [summary, setSummary] = useState<UsageEventSummary | null>(null);
  const [events, setEvents] = useState<UsageEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [usageType, setUsageType] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getAccessToken();

    if (!token) {
      router.push("/login");
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    setLoading(true);
    setError("");

    Promise.all([
      fetch("http://localhost:3002/telecom/usage-events/summary", { headers }).then(
        async (response) => {
          const data = await response.json();
          if (!response.ok) throw new Error(data.message || t.loadError);
          return data as UsageEventSummary;
        }
      ),
      fetch(
        `http://localhost:3002/telecom/usage-events?${new URLSearchParams({
          page: String(page),
          pageSize: String(PAGE_SIZE),
          ...(usageType ? { usageType } : {}),
        }).toString()}`,
        { headers }
      ).then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || t.loadError);
        return data as { items: UsageEvent[]; total: number };
      }),
    ])
      .then(([summaryData, listData]) => {
        setSummary(summaryData);
        setEvents(listData.items);
        setTotal(listData.total);
      })
      .catch((err) => setError(err instanceof Error ? err.message : t.loadError))
      .finally(() => setLoading(false));
  }, [router, page, usageType, t.loadError]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const typeCard = (key: "VOICE" | "SMS" | "DATA", label: string) => {
    const stat = summary?.byUsageType[key];
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-md">
        <p className="text-sm font-semibold uppercase text-gray-500">{label}</p>
        <p className="mt-2 text-2xl font-bold text-gray-900">
          {formatTsh(Number(stat?.totalValuationTzs ?? 0))}
        </p>
        <p className="mt-1 text-sm text-gray-500">{t.eventsCount(stat?.count ?? 0)}</p>
      </div>
    );
  };

  return (
    <div>
      <DashboardHeader title={t.headerTitle} />

      <div className="p-4 sm:p-8">
        <p className="mb-6 max-w-3xl text-sm text-gray-500">{t.subtitle}</p>

        {error && (
          <div className="mb-6 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          {typeCard("VOICE", t.summaryVoice)}
          {typeCard("SMS", t.summarySms)}
          {typeCard("DATA", t.summaryData)}
        </div>

        {summary && Object.keys(summary.byStatus).length > 0 && (
          <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-md">
            <p className="text-sm font-semibold text-gray-700">{t.statusBreakdownHeading}</p>
            <div className="mt-3 flex flex-wrap gap-3">
              {Object.entries(summary.byStatus).map(([status, count]) => (
                <div
                  key={status}
                  className="flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5"
                >
                  <StatusBadge domain="transaction" status={status} />
                  <span className="text-sm font-semibold text-gray-700">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mb-4 flex flex-wrap gap-2">
          {TYPE_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => {
                setUsageType(filter.value);
                setPage(1);
              }}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                usageType === filter.value
                  ? "bg-blue-700 text-white"
                  : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-gray-500">{common.loading}</p>
        ) : events.length === 0 ? (
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
                    <th className="px-6 py-3 font-semibold">{t.reference}</th>
                    <th className="px-6 py-3 font-semibold">{t.usageType}</th>
                    <th className="px-6 py-3 font-semibold">{t.quantity}</th>
                    <th className="px-6 py-3 font-semibold">{t.contributionQuantity}</th>
                    <th className="px-6 py-3 font-semibold">{t.amount}</th>
                    <th className="px-6 py-3 font-semibold">{t.status}</th>
                    <th className="px-6 py-3 font-semibold">{t.reconciliationStatus}</th>
                    <th className="px-6 py-3 font-semibold">{t.dateTime}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {events.map((event) => (
                    <tr key={event.usageEventId}>
                      <td className="px-6 py-4 text-gray-900">{event.externalTransactionId}</td>
                      <td className="px-6 py-4 text-gray-600">{event.usageType}</td>
                      <td className="px-6 py-4 text-gray-600">
                        {Number(event.quantity).toLocaleString("en-TZ")} {event.unit}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {Number(event.contributionQuantity).toLocaleString("en-TZ")} {event.unit}
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        {event.providerValuationTzs
                          ? formatTsh(Number(event.providerValuationTzs))
                          : "—"}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge domain="transaction" status={event.status} />
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {event.reconciliationStatus ? (
                          <StatusBadge domain="transaction" status={event.reconciliationStatus} />
                        ) : (
                          <span className="text-gray-400">{t.notReconciled}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {new Date(event.usageTimestamp).toLocaleString("en-TZ")}
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
                  className="rounded-lg border border-gray-300 px-4 py-2
                  font-semibold text-gray-700 transition hover:bg-white
                  disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t.previous}
                </button>
                <span className="text-gray-500">{t.pageOf(page, totalPages)}</span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-lg border border-gray-300 px-4 py-2
                  font-semibold text-gray-700 transition hover:bg-white
                  disabled:cursor-not-allowed disabled:opacity-50"
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
