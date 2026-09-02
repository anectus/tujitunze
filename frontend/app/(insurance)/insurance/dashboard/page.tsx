"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getAccessToken } from "@/lib/utils/permissions";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatisticCard from "@/components/cards/StatisticCard";
import StatusBadge from "@/components/common/StatusBadge";
import { useLanguage } from "@/lib/context/LanguageContext";
import { insuranceDashboardTranslations } from "@/constants/translations/insurance-dashboard";
import { API_URL } from "@/lib/utils/api";

const API_BASE = `${API_URL}`;
const PAGE_SIZE = 20;

interface BreakdownRow {
  count: number;
  amount: number;
}

interface LatestAllocation {
  allocationId: number;
  amount: number;
  status: string;
  allocationReference: string | null;
  contributionReference: string | null;
  channel: "AIRTIME" | "BANK_TRANSFER";
  createdAt: string;
}

interface ActivityItem {
  auditId: number;
  type: string;
  actionType: string;
  createdAt: string;
}

interface DashboardSummary {
  provider: { name: string | null; status: string | null };
  contributions: {
    total: number;
    totalCount: number;
    airtime: number;
    airtimeCount: number;
    bankTransfer: number;
    bankTransferCount: number;
    byOperator: { operatorName: string; count: number; amount: number }[];
    byBank: { bankName: string; count: number; amount: number }[];
  };
  allocations: {
    totalCollected: number;
    totalAllocated: number;
    pending: number;
    failed: number;
    reversed: number;
    recordCount: number;
    latest: LatestAllocation[];
  };
  members: {
    total: number;
    active: number;
    inactive: number;
    eligible: number;
    covered: number;
  };
  claims: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    claimedAmount: number;
    approvedAmount: number;
    settledAmount: number;
  };
  availableFunds: number;
  recentActivity: ActivityItem[];
}

interface AllocationRow {
  allocationId: number;
  memberId: number;
  amount: string;
  currency: string;
  allocationStatus: string;
  allocationReference: string | null;
  contributionReference: string | null;
  createdAt: string;
  completedAt: string | null;
  channel: "AIRTIME" | "BANK_TRANSFER";
}

interface Filters {
  dateFrom: string;
  dateTo: string;
  channel: string;
  status: string;
}

const EMPTY_FILTERS: Filters = {
  dateFrom: "",
  dateTo: "",
  channel: "",
  status: "",
};

const STATUS_OPTIONS = [
  "Pending",
  "Processing",
  "Allocated",
  "Failed",
  "Reversed",
];

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

export default function InsuranceDashboardPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const t = insuranceDashboardTranslations[language];

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<Filters>(EMPTY_FILTERS);
  const [allocations, setAllocations] = useState<AllocationRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [allocationsLoading, setAllocationsLoading] = useState(true);
  const [allocationsError, setAllocationsError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      const token = getAccessToken();

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/insurance/dashboard/summary`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 401) {
          router.push("/login");
          return;
        }
        if (response.status === 403) {
          router.push("/access-denied");
          return;
        }

        const body = await response.json();

        if (!response.ok) {
          throw new Error(body.message || t.errorFallback);
        }

        setSummary(body);
      } catch (err) {
        setError(err instanceof Error ? err.message : t.errorFallback);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [router, t.errorFallback]);

  const loadAllocations = useCallback(
    async (activeFilters: Filters, activePage: number) => {
      const token = getAccessToken();
      if (!token) {
        router.push("/login");
        return;
      }

      setAllocationsLoading(true);
      setAllocationsError("");

      try {
        const response = await fetch(
          `${API_BASE}/insurance/allocations?${buildQuery(activeFilters, {
            page: activePage,
            pageSize: PAGE_SIZE,
          })}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.status === 401) {
          router.push("/login");
          return;
        }

        const body = await response.json();

        if (!response.ok) {
          throw new Error(body.message || t.loadAllocationsError);
        }

        setAllocations(body.items);
        setTotal(body.total);
      } catch (err) {
        setAllocationsError(
          err instanceof Error ? err.message : t.loadAllocationsError
        );
      } finally {
        setAllocationsLoading(false);
      }
    },
    [router, t.loadAllocationsError]
  );

  useEffect(() => {
    loadAllocations(appliedFilters, page);
  }, [loadAllocations, appliedFilters, page]);

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
    <div>

      <DashboardHeader title={t.title} />

      <div className="p-4 sm:p-8">

        {error && (
          <div className="mb-6 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (

          <p className="text-gray-500">{t.loading}</p>

        ) : summary ? (

          <>

            <h2 className="mb-6 text-lg font-semibold text-gray-900">
              {summary.provider.name}{" "}
              <span className="text-sm font-normal text-gray-500">
                ({summary.provider.status})
              </span>
            </h2>

            {/* Contributions */}
            <h3 className="mb-3 text-base font-bold text-gray-900">
              {t.contributionsSectionTitle}
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <StatisticCard
                label={t.totalContributions}
                value={formatTsh(summary.contributions.total)}
                hint={t.countSuffix(summary.contributions.totalCount)}
              />
              <StatisticCard
                label={t.airtimeContributions}
                value={formatTsh(summary.contributions.airtime)}
                hint={t.countSuffix(summary.contributions.airtimeCount)}
              />
              <StatisticCard
                label={t.bankTransferContributions}
                value={formatTsh(summary.contributions.bankTransfer)}
                hint={t.countSuffix(summary.contributions.bankTransferCount)}
              />
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-md">
                <p className="mb-3 text-sm font-semibold text-gray-700">
                  {t.byOperatorTitle}
                </p>
                {summary.contributions.byOperator.length === 0 ? (
                  <p className="text-sm text-gray-400">{t.noBreakdownData}</p>
                ) : (
                  <ul className="space-y-2">
                    {summary.contributions.byOperator.map((row) => (
                      <li
                        key={row.operatorName}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-gray-600">{row.operatorName}</span>
                        <span className="font-semibold text-gray-900">
                          {formatTsh(row.amount)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-md">
                <p className="mb-3 text-sm font-semibold text-gray-700">
                  {t.byBankTitle}
                </p>
                {summary.contributions.byBank.length === 0 ? (
                  <p className="text-sm text-gray-400">{t.noBreakdownData}</p>
                ) : (
                  <ul className="space-y-2">
                    {summary.contributions.byBank.map((row) => (
                      <li
                        key={row.bankName}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-gray-600">{row.bankName}</span>
                        <span className="font-semibold text-gray-900">
                          {formatTsh(row.amount)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Allocation */}
            <h3 className="mt-10 mb-3 text-base font-bold text-gray-900">
              {t.allocationsSectionTitle}
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <StatisticCard
                label={t.totalAllocated}
                value={formatTsh(summary.allocations.totalAllocated)}
              />
              <StatisticCard
                label={t.pendingAllocation}
                value={formatTsh(summary.allocations.pending)}
              />
              <StatisticCard
                label={t.allocationRecords}
                value={summary.allocations.recordCount}
              />
              <StatisticCard
                label={t.availableFunds}
                value={formatTsh(summary.availableFunds)}
              />
            </div>

            <div className="mt-4">
              <p className="mb-2 text-sm font-semibold text-gray-700">
                {t.latestAllocationsTitle}
              </p>
              {summary.allocations.latest.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center">
                  <p className="text-sm text-gray-500">{t.noAllocationsYet}</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-md">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                      <tr>
                        <th className="px-6 py-3 font-semibold">{t.colChannel}</th>
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
                      {summary.allocations.latest.map((row) => (
                        <tr key={row.allocationId}>
                          <td className="px-6 py-4 text-gray-600">
                            {row.channel === "AIRTIME"
                              ? t.channelAirtime
                              : t.channelBank}
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            {row.contributionReference ?? "—"}
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            {row.allocationReference ?? "—"}
                          </td>
                          <td className="px-6 py-4 font-semibold text-gray-900">
                            {formatTsh(row.amount)}
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge domain="transaction" status={row.status} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                            {new Date(row.createdAt).toLocaleString("en-TZ")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Member coverage */}
            <h3 className="mt-10 mb-3 text-base font-bold text-gray-900">
              {t.membersSectionTitle}
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <StatisticCard
                label={t.totalMembersCovered}
                value={summary.members.total}
              />
              <StatisticCard label={t.activeMembers} value={summary.members.active} />
              <StatisticCard
                label={t.inactiveMembers}
                value={summary.members.inactive}
              />
              <StatisticCard
                label={t.eligibleMembers}
                value={summary.members.eligible}
              />
              <StatisticCard
                label={t.coveredMembers}
                value={summary.members.covered}
              />
            </div>

            {/* Claims */}
            <h3 className="mt-10 mb-3 text-base font-bold text-gray-900">
              {t.claimsSectionTitle}
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <StatisticCard label={t.totalClaims} value={summary.claims.total} />
              <StatisticCard label={t.pendingClaims} value={summary.claims.pending} />
              <StatisticCard
                label={t.approvedClaims}
                value={summary.claims.approved}
              />
              <StatisticCard
                label={t.rejectedClaims}
                value={summary.claims.rejected}
              />
              <StatisticCard
                label={t.claimedAmount}
                value={formatTsh(summary.claims.claimedAmount)}
              />
              <StatisticCard
                label={t.approvedAmount}
                value={formatTsh(summary.claims.approvedAmount)}
              />
              <StatisticCard
                label={t.settledAmount}
                value={formatTsh(summary.claims.settledAmount)}
              />
            </div>

            {/* Recent activity */}
            <h3 className="mt-10 mb-3 text-base font-bold text-gray-900">
              {t.activitySectionTitle}
            </h3>
            {summary.recentActivity.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center">
                <p className="text-sm text-gray-500">{t.noActivity}</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-md">
                <ul className="divide-y divide-gray-100">
                  {summary.recentActivity.map((item) => (
                    <li
                      key={item.auditId}
                      className="flex items-center justify-between px-6 py-3 text-sm"
                    >
                      <span className="text-gray-900">{item.type}</span>
                      <span className="whitespace-nowrap text-gray-500">
                        {new Date(item.createdAt).toLocaleString("en-TZ")}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Filterable allocations table */}
            <form
              onSubmit={applyFilters}
              className="mt-10 rounded-2xl border border-gray-100 bg-white p-6 shadow-md"
            >
              <p className="text-lg font-bold text-gray-900">{t.filtersTitle}</p>

              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

            <div className="mt-8">
              <p className="text-lg font-bold text-gray-900">{t.tableTitle}</p>

              {allocationsError && (
                <div className="mt-4 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
                  {allocationsError}
                </div>
              )}

              {allocationsLoading ? (
                <p className="mt-4 text-gray-500">{t.loading}</p>
              ) : allocations.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center">
                  <p className="text-gray-600">{t.emptyAllocations}</p>
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
                        {allocations.map((row) => (
                          <tr key={row.allocationId}>
                            <td className="px-6 py-4 text-gray-600">
                              {row.channel === "AIRTIME"
                                ? t.channelAirtime
                                : t.channelBank}
                            </td>
                            <td className="px-6 py-4 text-gray-600">
                              #{row.memberId}
                            </td>
                            <td className="px-6 py-4 text-gray-600">
                              {row.contributionReference ?? "—"}
                            </td>
                            <td className="px-6 py-4 text-gray-600">
                              {row.allocationReference ?? "—"}
                            </td>
                            <td className="px-6 py-4 font-semibold text-gray-900">
                              {formatTsh(Number(row.amount))}
                            </td>
                            <td className="px-6 py-4">
                              <StatusBadge
                                domain="transaction"
                                status={row.allocationStatus}
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                              {new Date(row.createdAt).toLocaleString("en-TZ")}
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

        ) : null}

      </div>

    </div>
  );
}
