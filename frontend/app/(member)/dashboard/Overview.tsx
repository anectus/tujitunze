"use client";

import { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { getAccessToken } from "@/lib/utils/permissions";
import { useLanguage } from "@/lib/context/LanguageContext";
import { overviewTranslations } from "@/constants/translations/member-overview";
import { API_URL } from "@/lib/utils/api";
import StatisticCard from "@/components/cards/StatisticCard";
import SectionHeader from "@/components/dashboard/SectionHeader";
import { CoinsIcon, ShieldIcon, SwapIcon } from "@/components/common/SidebarIcons";

interface WalletTxn {
  walletTransactionId: number;
  transactionType: string;
  amount: number;
  transactionDate: string;
  channel: "AIRTIME" | "BANK_TRANSFER" | "WALLET_TOPUP" | string;
}

interface InsurancePolicy {
  policy_status: string;
}

interface AllocationSummaryItem {
  providerName: string;
  count: number;
  totalTzs: number;
}

const PIE_COLORS = ["#059669", "#10B981", "#34D399", "#6EE7B7", "#A7F3D0"];

// Large enough to cover this demo system's realistic transaction volume
// in one request — GET /members/wallet/transactions has no pageSize cap
// server-side, but there's no cursor-based "give me everything" mode
// either, so this is the pragmatic ceiling rather than a real streaming
// fetch.
const TRANSACTIONS_PAGE_SIZE = 500;

function formatTsh(amount: number) {
  return `TSh ${amount.toLocaleString("en-TZ", { minimumFractionDigits: 2 })}`;
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-md transition hover:-translate-y-0.5 hover:shadow-lg">
      <p className="text-lg font-semibold text-gray-900">{title}</p>
      <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
      <div className="mt-4 h-64">{children}</div>
    </div>
  );
}

// Charts, KPIs, and CSV/PDF export for the Member dashboard — every
// number here is derived from the member's own real data (wallet
// transactions + insurance-allocations-summary), never sample/fake
// data. jspdf/jspdf-autotable and recharts are dynamically imported so
// their bundle weight (~genuinely large for a client component) only
// loads for members who actually reach the dashboard.
export default function Overview() {
  const { language } = useLanguage();
  const t = overviewTranslations[language];

  const [transactions, setTransactions] = useState<WalletTxn[] | null>(null);
  const [policies, setPolicies] = useState<InsurancePolicy[] | null>(null);
  const [allocations, setAllocations] = useState<
    AllocationSummaryItem[] | null
  >(null);
  const [error, setError] = useState("");

  const loadOverview = () => {
    const token = getAccessToken();

    if (!token) {
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    fetch(
      `${API_URL}/members/wallet/transactions?pageSize=${TRANSACTIONS_PAGE_SIZE}`,
      { headers }
    )
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => setTransactions(data?.items ?? []))
      .catch(() => setError(t.errorFallback));

    fetch(`${API_URL}/members/insurance`, { headers })
      .then((response) => (response.ok ? response.json() : []))
      .then((data) => setPolicies(data ?? []))
      .catch(() => setPolicies([]));

    fetch(`${API_URL}/members/insurance-allocations-summary`, { headers })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => setAllocations(data?.items ?? []))
      .catch(() => setAllocations([]));
  };

  useEffect(() => {
    loadOverview();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only fetch, not a value this effect should re-sync to
  }, [t.errorFallback]);

  // Real-time-ish refresh: contributions/policies are read-only here, so
  // it's safe to silently replace them when the member tabs back in —
  // same reasoning as the Super-admin dashboard's own focus refresh.
  useEffect(() => {
    window.addEventListener("focus", loadOverview);
    return () => window.removeEventListener("focus", loadOverview);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- subscribe once
  }, []);

  const balanceHistory = useMemo(() => {
    if (!transactions) {
      return [];
    }

    const sorted = [...transactions].sort(
      (a, b) =>
        new Date(a.transactionDate).getTime() -
        new Date(b.transactionDate).getTime()
    );

    let running = 0;

    return sorted.map((txn) => {
      running = Number((running + Number(txn.amount)).toFixed(2));
      return {
        date: new Date(txn.transactionDate).toLocaleDateString("en-TZ", {
          month: "short",
          day: "numeric",
        }),
        balance: running,
      };
    });
  }, [transactions]);

  const contributionsBySource = useMemo(() => {
    let telecom = 0;
    let bank = 0;

    for (const txn of transactions ?? []) {
      const amount = Number(txn.amount);

      if (amount <= 0) {
        continue; // refunds/reversals aren't "contributions by source"
      }

      if (txn.channel === "AIRTIME") {
        telecom += amount;
      } else if (txn.channel === "BANK_TRANSFER") {
        bank += amount;
      }
    }

    return [
      { source: t.telecom, amount: Number(telecom.toFixed(2)) },
      { source: t.bank, amount: Number(bank.toFixed(2)) },
    ];
  }, [transactions, t.telecom, t.bank]);

  const pieData = useMemo(
    () =>
      (allocations ?? []).map((allocation) => ({
        name: allocation.providerName,
        value: allocation.totalTzs,
      })),
    [allocations]
  );

  const totalContributions = useMemo(
    () =>
      (transactions ?? []).reduce((sum, txn) => {
        const amount = Number(txn.amount);
        return amount > 0 ? sum + amount : sum;
      }, 0),
    [transactions]
  );

  const activePoliciesCount = useMemo(
    () =>
      (policies ?? []).filter((policy) => policy.policy_status === "Active")
        .length,
    [policies]
  );

  const refundsCount = useMemo(
    () =>
      (transactions ?? []).filter(
        (txn) => Number(txn.amount) < 0 && txn.transactionType.startsWith("Contribution")
      ).length,
    [transactions]
  );

  const handleExportCsv = () => {
    if (!transactions) {
      return;
    }

    const header = "Date,Type,Channel,Amount\n";
    const rows = transactions.map((txn) =>
      [
        new Date(txn.transactionDate).toISOString(),
        txn.transactionType,
        txn.channel,
        txn.amount,
      ]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(",")
    );

    const blob = new Blob([header + rows.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "tujitunze-overview.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = async () => {
    if (!transactions) {
      return;
    }

    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(t.pdfTitle, 14, 16);

    doc.setFontSize(10);
    doc.text(`${t.kpiTotalContributions}: ${formatTsh(totalContributions)}`, 14, 26);
    doc.text(`${t.kpiActivePolicies}: ${activePoliciesCount}`, 14, 32);
    doc.text(`${t.kpiRefunds}: ${refundsCount}`, 14, 38);

    autoTable(doc, {
      startY: 46,
      head: [["Date", "Type", "Channel", "Amount"]],
      body: transactions.map((txn) => [
        new Date(txn.transactionDate).toLocaleDateString(),
        txn.transactionType,
        txn.channel,
        formatTsh(Number(txn.amount)),
      ]),
    });

    doc.save("tujitunze-overview.pdf");
  };

  if (transactions === null && !error) {
    return <p className="text-base text-gray-500">{t.loading}</p>;
  }

  return (
    <div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Overview — KPIs */}
      <SectionHeader
        title={t.sectionOverviewTitle}
        subtitle={t.sectionOverviewSubtitle}
      />

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatisticCard
          label={t.kpiTotalContributions}
          value={formatTsh(totalContributions)}
          icon={CoinsIcon}
        />
        <StatisticCard
          label={t.kpiActivePolicies}
          value={activePoliciesCount}
          icon={ShieldIcon}
        />
        <StatisticCard
          label={t.kpiRefunds}
          value={refundsCount}
          icon={SwapIcon}
        />
      </div>

      {/* Export buttons */}
      <div className="mt-4 flex justify-end gap-3">
        <button
          type="button"
          onClick={handleExportCsv}
          disabled={!transactions?.length}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm
          font-semibold text-gray-700 transition hover:bg-gray-50
          disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t.exportCsv}
        </button>
        <button
          type="button"
          onClick={handleExportPdf}
          disabled={!transactions?.length}
          className="rounded-lg bg-emerald-700 px-4 py-2 text-sm
          font-semibold text-white transition hover:bg-emerald-800
          disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t.exportPdf}
        </button>
      </div>

      {/* Insights — charts */}
      <SectionHeader
        title={t.sectionInsightsTitle}
        subtitle={t.sectionInsightsSubtitle}
      />

      <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-3">

        <ChartCard
          title={t.balanceChartTitle}
          subtitle={t.balanceChartSubtitle}
        >
          {balanceHistory.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={balanceHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} width={70} />
                <Tooltip formatter={(value) => formatTsh(Number(value))} />
                <Line
                  type="monotone"
                  dataKey="balance"
                  stroke="#059669"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="flex h-full items-center justify-center text-sm text-gray-400">
              {t.noData}
            </p>
          )}
        </ChartCard>

        <ChartCard
          title={t.sourceChartTitle}
          subtitle={t.sourceChartSubtitle}
        >
          {contributionsBySource.some((row) => row.amount > 0) ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={contributionsBySource}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="source" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} width={70} />
                <Tooltip formatter={(value) => formatTsh(Number(value))} />
                <Bar dataKey="amount" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="flex h-full items-center justify-center text-sm text-gray-400">
              {t.noData}
            </p>
          )}
        </ChartCard>

        <ChartCard
          title={t.allocationChartTitle}
          subtitle={t.allocationChartSubtitle}
        >
          {pieData.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={80}
                  label={({ name }: { name?: string }) => name ?? ""}
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatTsh(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="flex h-full items-center justify-center text-sm text-gray-400">
              {t.noData}
            </p>
          )}
        </ChartCard>

      </div>

    </div>
  );
}
