"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getAccessToken } from "@/lib/utils/permissions";
import StatisticCard from "@/components/cards/StatisticCard";
import StatusBadge from "@/components/common/StatusBadge";
import { useLanguage } from "@/lib/context/LanguageContext";
import { commonTranslations } from "@/constants/translations/common";
import { adminFinancialReportsTranslations } from "@/constants/translations/admin-financial-reports";
import { API_URL } from "@/lib/utils/api";

interface BucketStat {
  count: number;
  amount: number;
}

interface FinancialReport {
  totalContributions: BucketStat;
  telecomContributions: BucketStat;
  bankContributions: BucketStat;
  totalInsuranceAllocations: BucketStat;
  allocated: BucketStat;
  pending: BucketStat;
  failed: BucketStat;
  reversed: BucketStat;
  unreconciled: BucketStat;
}

interface FinancialTransaction {
  channel: "AIRTIME" | "BANK_TRANSFER";
  sourceId: number;
  memberId: number;
  memberName: string;
  amount: string;
  status: string;
  contributionReference: string | null;
  internalReference: string | null;
  occurredAt: string;
  sourceName: string;
  allocation: {
    allocationId: number;
    allocationReference: string | null;
    status: string | null;
    amount: string | null;
    insuranceProviderId: number | null;
  } | null;
  reconciled: boolean;
}

interface FilterOption {
  id: number;
  name: string;
}

interface FilterOptions {
  operators: FilterOption[];
  banks: FilterOption[];
  insuranceProviders: FilterOption[];
}

interface Filters {
  dateFrom: string;
  dateTo: string;
  memberId: string;
  operatorId: string;
  bankId: string;
  channel: string;
  status: string;
  insuranceProviderId: string;
  reference: string;
}

const EMPTY_FILTERS: Filters = {
  dateFrom: "",
  dateTo: "",
  memberId: "",
  operatorId: "",
  bankId: "",
  channel: "",
  status: "",
  insuranceProviderId: "",
  reference: "",
};

const STATUS_OPTIONS = [
  "Received",
  "Validated",
  "Allocated",
  "Failed",
  "Reversed",
];

const PAGE_SIZE = 20;
const API_BASE = `${API_URL}`;

function formatTsh(amount: number) {
  return `TSh ${amount.toLocaleString("en-TZ")}`;
}

function buildQuery(filters: Filters, extra: Record<string, string | number> = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  Object.entries(extra).forEach(([key, value]) => {
    params.set(key, String(value));
  });
  return params.toString();
}

export default function AdminFinancialReportsPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const t = adminFinancialReportsTranslations[language];
  const common = commonTranslations[language];

  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<Filters>(EMPTY_FILTERS);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);

  const [report, setReport] = useState<FinancialReport | null>(null);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(
    async (activeFilters: Filters, activePage: number) => {
      const token = getAccessToken();
      if (!token) {
        router.push("/login");
        return;
      }

      setLoading(true);
      setError("");

      try {
        const [reportRes, transactionsRes] = await Promise.all([
          fetch(
            `${API_BASE}/admin/reports/financial?${buildQuery(activeFilters)}`,
            { headers: { Authorization: `Bearer ${token}` } }
          ),
          fetch(
            `${API_BASE}/admin/reports/financial/transactions?${buildQuery(
              activeFilters,
              { page: activePage, pageSize: PAGE_SIZE }
            )}`,
            { headers: { Authorization: `Bearer ${token}` } }
          ),
        ]);

        if (reportRes.status === 401 || transactionsRes.status === 401) {
          router.push("/login");
          return;
        }
        if (reportRes.status === 403 || transactionsRes.status === 403) {
          router.push("/access-denied");
          return;
        }

        const reportBody = await reportRes.json();
        const transactionsBody = await transactionsRes.json();

        if (!reportRes.ok) {
          throw new Error(reportBody.message || t.loadError);
        }
        if (!transactionsRes.ok) {
          throw new Error(transactionsBody.message || t.loadError);
        }

        setReport(reportBody);
        setTransactions(transactionsBody.items);
        setTotal(transactionsBody.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : t.loadError);
      } finally {
        setLoading(false);
      }
    },
    [router, t.loadError]
  );

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.push("/login");
      return;
    }

    fetch(`${API_BASE}/admin/reports/financial/filters`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setFilterOptions(data))
      .catch(() => setFilterOptions(null));
  }, [router]);

  useEffect(() => {
    load(appliedFilters, page);
  }, [load, appliedFilters, page]);

  const applyFilters = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setAppliedFilters(filters);
  };

  const resetFilters = () => {
    setFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="min-h-screen bg-white py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900">{t.title}</h1>
        <p className="mt-2 text-sm text-gray-600">{t.subtitle}</p>

        {error && (
          <div className="mt-6 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form
          onSubmit={applyFilters}
          className="mt-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-md"
        >
          <p className="text-lg font-bold text-gray-900">{t.filtersTitle}</p>

          <div className="mt-4 grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                {t.dateFromLabel}
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, dateFrom: e.target.value }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                {t.dateToLabel}
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, dateTo: e.target.value }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                {t.memberIdLabel}
              </label>
              <input
                type="number"
                min="1"
                value={filters.memberId}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, memberId: e.target.value }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                {t.referenceLabel}
              </label>
              <input
                type="text"
                value={filters.reference}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, reference: e.target.value }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                {t.channelLabel}
              </label>
              <select
                value={filters.channel}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, channel: e.target.value }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-200"
              >
                <option value="">{t.allChannels}</option>
                <option value="AIRTIME">{t.channelAirtime}</option>
                <option value="BANK_TRANSFER">{t.channelBank}</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                {t.statusLabel}
              </label>
              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, status: e.target.value }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-200"
              >
                <option value="">{t.allStatuses}</option>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                {t.operatorLabel}
              </label>
              <select
                value={filters.operatorId}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, operatorId: e.target.value }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-200"
              >
                <option value="">{t.allOperators}</option>
                {filterOptions?.operators.map((op) => (
                  <option key={op.id} value={op.id}>
                    {op.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                {t.bankLabel}
              </label>
              <select
                value={filters.bankId}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, bankId: e.target.value }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-200"
              >
                <option value="">{t.allBanks}</option>
                {filterOptions?.banks.map((bank) => (
                  <option key={bank.id} value={bank.id}>
                    {bank.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                {t.insuranceLabel}
              </label>
              <select
                value={filters.insuranceProviderId}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    insuranceProviderId: e.target.value,
                  }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-200"
              >
                <option value="">{t.allInsurers}</option>
                {filterOptions?.insuranceProviders.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              type="submit"
              className="rounded-lg bg-blue-700 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800"
            >
              {t.applyButton}
            </button>
            <button
              type="button"
              onClick={resetFilters}
              className="rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              {t.resetButton}
            </button>
          </div>
        </form>

        {loading ? (
          <p className="mt-8 text-gray-500">{common.loading}</p>
        ) : (
          <>
            {report && (
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <StatisticCard
                  label={t.totalContributions}
                  value={formatTsh(report.totalContributions.amount)}
                  hint={t.countSuffix(report.totalContributions.count)}
                />
                <StatisticCard
                  label={t.telecomContributions}
                  value={formatTsh(report.telecomContributions.amount)}
                  hint={t.countSuffix(report.telecomContributions.count)}
                />
                <StatisticCard
                  label={t.bankContributions}
                  value={formatTsh(report.bankContributions.amount)}
                  hint={t.countSuffix(report.bankContributions.count)}
                />
                <StatisticCard
                  label={t.totalInsuranceAllocations}
                  value={formatTsh(report.totalInsuranceAllocations.amount)}
                  hint={t.countSuffix(report.totalInsuranceAllocations.count)}
                />
                <StatisticCard
                  label={t.allocatedAllocations}
                  value={formatTsh(report.allocated.amount)}
                  hint={t.countSuffix(report.allocated.count)}
                />
                <StatisticCard
                  label={t.pendingAllocations}
                  value={formatTsh(report.pending.amount)}
                  hint={t.countSuffix(report.pending.count)}
                />
                <StatisticCard
                  label={t.failedAllocations}
                  value={formatTsh(report.failed.amount)}
                  hint={t.countSuffix(report.failed.count)}
                />
                <StatisticCard
                  label={t.reversedAllocations}
                  value={formatTsh(report.reversed.amount)}
                  hint={t.countSuffix(report.reversed.count)}
                />
                <StatisticCard
                  label={t.unreconciled}
                  value={formatTsh(report.unreconciled.amount)}
                  hint={t.countSuffix(report.unreconciled.count)}
                />
              </div>
            )}

            <div className="mt-10">
              <p className="text-lg font-bold text-gray-900">{t.tableTitle}</p>

              {transactions.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center">
                  <p className="text-gray-600">{t.emptyTitle}</p>
                </div>
              ) : (
                <>
                  <div className="mt-4 overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-md">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                        <tr>
                          <th className="px-6 py-3 font-semibold">{t.colChannel}</th>
                          <th className="px-6 py-3 font-semibold">{t.colMember}</th>
                          <th className="px-6 py-3 font-semibold">
                            {t.colContributionRef}
                          </th>
                          <th className="px-6 py-3 font-semibold">
                            {t.colAllocationRef}
                          </th>
                          <th className="px-6 py-3 font-semibold">{t.colAmount}</th>
                          <th className="px-6 py-3 font-semibold">{t.colStatus}</th>
                          <th className="px-6 py-3 font-semibold">{t.colDate}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {transactions.map((tx) => (
                          <tr key={`${tx.channel}-${tx.sourceId}`}>
                            <td className="px-6 py-4 text-gray-600">
                              {tx.channel === "AIRTIME"
                                ? t.channelAirtime
                                : t.channelBank}
                            </td>
                            <td className="px-6 py-4 text-gray-900">
                              {tx.memberName}
                            </td>
                            <td className="px-6 py-4 text-gray-600">
                              {tx.contributionReference ?? "—"}
                            </td>
                            <td className="px-6 py-4 text-gray-600">
                              {tx.allocation?.allocationReference ?? t.noAllocation}
                            </td>
                            <td className="px-6 py-4 font-semibold text-gray-900">
                              {formatTsh(Number(tx.amount))}
                            </td>
                            <td className="px-6 py-4">
                              <StatusBadge domain="transaction" status={tx.status} />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                              {new Date(tx.occurredAt).toLocaleString("en-TZ")}
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
                      <span className="text-gray-500">
                        {t.pageOf(page, totalPages)}
                      </span>
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
          </>
        )}
      </div>
    </div>
  );
}
