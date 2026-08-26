"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { getAccessToken } from "@/lib/utils/permissions";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatisticCard from "@/components/cards/StatisticCard";
import { useLanguage } from "@/lib/context/LanguageContext";
import { bankDashboardTranslations } from "@/constants/translations/bank-dashboard";

interface BankDashboardData {
  bank: { name: string | null; status: string | null };
  linkedAccountCount: number;
  totalFunds: number;
  todayDeposits: number;
  todayWithdrawals: number;
  pendingSettlements: number;
  completedSettlements: number;
  reconciliationStatus: {
    runId: number;
    matchedCount: number;
    unmatchedCount: number;
    runDate: string;
  } | null;
}

function formatTsh(amount: number) {
  return `TSh ${Number(amount).toLocaleString("en-TZ")}`;
}

export default function BankDashboardPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const t = bankDashboardTranslations[language];

  const [data, setData] = useState<BankDashboardData | null>(null);
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
        const response = await fetch("http://localhost:3002/bank/dashboard", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 401) {
          router.push("/login");
          return;
        }

        const body = await response.json();

        if (!response.ok) {
          throw new Error(body.message || t.unableToLoad);
        }

        setData(body);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : t.unableToLoad
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [router]);

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

          <p className="text-gray-500">{t.loadingDashboard}</p>

        ) : data ? (

          <>

            <h2 className="mb-6 text-lg font-semibold text-gray-900">
              {data.bank.name} <span className="text-sm font-normal text-gray-500">({data.bank.status})</span>
            </h2>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

              <StatisticCard label={t.totalFunds} value={formatTsh(data.totalFunds)} />
              <StatisticCard label={t.todaysDeposits} value={formatTsh(data.todayDeposits)} />
              <StatisticCard label={t.todaysWithdrawals} value={formatTsh(data.todayWithdrawals)} />
              <StatisticCard label={t.pendingSettlements} value={data.pendingSettlements} />
              <StatisticCard label={t.completedSettlements} value={data.completedSettlements} />
              <StatisticCard
                label={t.reconciliationStatus}
                value={
                  data.reconciliationStatus
                    ? `${data.reconciliationStatus.matchedCount} ${t.matched} / ${data.reconciliationStatus.unmatchedCount} ${t.unmatched}`
                    : t.notYetRun
                }
                hint={
                  data.reconciliationStatus
                    ? `${t.runNumber}${data.reconciliationStatus.runId}`
                    : undefined
                }
              />

            </div>

            <div className="mt-8 flex flex-wrap gap-3 text-sm">
              <Link href="/bank/fund-accounts" className="font-semibold text-blue-700 hover:text-blue-800">
                {t.manageFundAccounts}
              </Link>
              <span className="text-gray-300">|</span>
              <Link href="/bank/settlements" className="font-semibold text-blue-700 hover:text-blue-800">
                {t.settlementsLink}
              </Link>
              <span className="text-gray-300">|</span>
              <Link href="/bank/reconciliation" className="font-semibold text-blue-700 hover:text-blue-800">
                {t.reconciliationLink}
              </Link>
            </div>

          </>

        ) : null}

      </div>

    </div>
  );
}
