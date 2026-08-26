"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getAccessToken } from "@/lib/utils/permissions";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatisticCard from "@/components/cards/StatisticCard";
import { useLanguage } from "@/lib/context/LanguageContext";
import { superAdminDashboardTranslations } from "@/constants/translations/super-admin-dashboard";

interface SuperAdminDashboardData {
  usersByRole: Record<string, number>;
  banksByStatus: Record<string, number>;
  operatorsByStatus: Record<string, number>;
  providersByStatus: Record<string, number>;
  roleCount: number;
  permissionCount: number;
  recentAuditLogCount: number;
}

function sumValues(record: Record<string, number>): number {
  return Object.values(record).reduce((sum, count) => sum + count, 0);
}

export default function SuperAdminDashboardPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const t = superAdminDashboardTranslations[language];

  const [data, setData] = useState<SuperAdminDashboardData | null>(null);
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
        const response = await fetch(
          "http://localhost:3002/super-admin/dashboard",
          { headers: { Authorization: `Bearer ${token}` } }
        );

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

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

            <StatisticCard label={t.members} value={data.usersByRole["Member"] ?? 0} />
            <StatisticCard label={t.admins} value={data.usersByRole["Admin"] ?? 0} />
            <StatisticCard label={t.bankStaff} value={data.usersByRole["Bank"] ?? 0} />
            <StatisticCard
              label={t.telecomStaff}
              value={data.usersByRole["Telecom"] ?? 0}
            />
            <StatisticCard
              label={t.insuranceStaff}
              value={data.usersByRole["Insurance"] ?? 0}
            />

            <StatisticCard label={t.banks} value={sumValues(data.banksByStatus)} />
            <StatisticCard
              label={t.telecomOperators}
              value={sumValues(data.operatorsByStatus)}
            />
            <StatisticCard
              label={t.insuranceProviders}
              value={sumValues(data.providersByStatus)}
            />

            <StatisticCard label={t.roles} value={data.roleCount} />
            <StatisticCard label={t.permissions} value={data.permissionCount} />
            <StatisticCard
              label={t.auditLogEntries24h}
              value={data.recentAuditLogCount}
            />

          </div>

        ) : null}

      </div>

    </div>
  );
}
