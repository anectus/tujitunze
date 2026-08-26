"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getAccessToken } from "@/lib/utils/permissions";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatisticCard from "@/components/cards/StatisticCard";
import { useLanguage } from "@/lib/context/LanguageContext";
import { adminDashboardTranslations } from "@/constants/translations/admin-dashboard";

interface AdminDashboardData {
  membersByStatus: Record<string, number>;
  recentAuditLogCount: number;
}

function sumValues(record: Record<string, number>): number {
  return Object.values(record).reduce((sum, count) => sum + count, 0);
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const t = adminDashboardTranslations[language];

  const [data, setData] = useState<AdminDashboardData | null>(null);
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
        const response = await fetch("http://localhost:3002/admin/dashboard", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 401 || response.status === 403) {
          router.push("/login");
          return;
        }

        const body = await response.json();

        if (!response.ok) {
          throw new Error(body.message || t.errorFallback);
        }

        setData(body);
      } catch (err) {
        setError(err instanceof Error ? err.message : t.errorFallback);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [router, t.errorFallback]);

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

        ) : data ? (

          <>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

              <StatisticCard
                label={t.totalMembers}
                value={sumValues(data.membersByStatus)}
              />

              <StatisticCard
                label={t.activeMembers}
                value={data.membersByStatus["Active"] ?? 0}
              />

              <StatisticCard
                label={t.pendingMembers}
                value={data.membersByStatus["Pending"] ?? 0}
              />

              <StatisticCard
                label={t.auditLogEntries24h}
                value={data.recentAuditLogCount}
              />

            </div>

          </>

        ) : null}

      </div>

    </div>
  );
}
