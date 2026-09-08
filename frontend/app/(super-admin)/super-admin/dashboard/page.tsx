"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getAccessToken } from "@/lib/utils/permissions";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import PageContainer from "@/components/dashboard/PageContainer";
import StatGroup from "@/components/dashboard/StatGroup";
import StatisticCard from "@/components/cards/StatisticCard";
import QuickActions, {
  type QuickAction,
} from "@/components/dashboard/QuickActions";
import { useLanguage } from "@/lib/context/LanguageContext";
import { superAdminDashboardTranslations } from "@/constants/translations/super-admin-dashboard";
import { API_URL } from "@/lib/utils/api";
import {
  BuildingIcon,
  ClipboardIcon,
  CoinsIcon,
  KeyIcon,
  LockIcon,
  PlusIcon,
  ShieldIcon,
  SignalIcon,
  UserCircleIcon,
  UsersIcon,
  WalletIcon,
} from "@/components/common/SidebarIcons";

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

  const loadDashboard = async () => {
    const token = getAccessToken();

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/super-admin/dashboard`,
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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch on mount, not a derived-state sync
    loadDashboard();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only fetch, not a value this effect should re-sync to
  }, [router, t.errorFallback]);

  // Read-only stat cards — safe to silently replace on tab focus, unlike
  // the Roles/Saving Rules pages which have unsaved local edits in play.
  useEffect(() => {
    window.addEventListener("focus", loadDashboard);
    return () => window.removeEventListener("focus", loadDashboard);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- subscribe once
  }, []);

  const quickActions: QuickAction[] = [
    {
      label: t.quickActionCreateAdministrator,
      href: "/super-admin/administrators",
      icon: PlusIcon,
    },
    {
      label: t.quickActionRolesPermissions,
      href: "/super-admin/roles",
      icon: KeyIcon,
    },
    {
      label: t.quickActionSavingRules,
      href: "/super-admin/saving-rules",
      icon: CoinsIcon,
    },
    {
      label: t.quickActionAuditLogs,
      href: "/super-admin/audit-logs",
      icon: ClipboardIcon,
    },
  ];

  return (
    <div>

      <DashboardHeader title={t.title} />

      <PageContainer maxWidth="6xl">

        {error && (
          <div className="mb-6 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (

          <p className="text-slate-500">{t.loading}</p>

        ) : data ? (

          <>
            <QuickActions actions={quickActions} />

            <StatGroup title={t.sectionSystemOverview}>
              <StatisticCard
                label={t.members}
                value={data.usersByRole["Member"] ?? 0}
                icon={UsersIcon}
              />
              <StatisticCard
                label={t.admins}
                value={data.usersByRole["Admin"] ?? 0}
                icon={UserCircleIcon}
              />
              <StatisticCard
                label={t.bankStaff}
                value={data.usersByRole["Bank"] ?? 0}
                icon={WalletIcon}
              />
              <StatisticCard
                label={t.telecomStaff}
                value={data.usersByRole["Telecom"] ?? 0}
                icon={SignalIcon}
              />
              <StatisticCard
                label={t.insuranceStaff}
                value={data.usersByRole["Insurance"] ?? 0}
                icon={ShieldIcon}
              />
            </StatGroup>

            <StatGroup title={t.sectionInstitutions}>
              <StatisticCard
                label={t.banks}
                value={sumValues(data.banksByStatus)}
                icon={BuildingIcon}
              />
              <StatisticCard
                label={t.telecomOperators}
                value={sumValues(data.operatorsByStatus)}
                icon={SignalIcon}
              />
              <StatisticCard
                label={t.insuranceProviders}
                value={sumValues(data.providersByStatus)}
                icon={ShieldIcon}
              />
            </StatGroup>

            <StatGroup title={t.sectionGovernance}>
              <StatisticCard
                label={t.roles}
                value={data.roleCount}
                icon={KeyIcon}
              />
              <StatisticCard
                label={t.permissions}
                value={data.permissionCount}
                icon={LockIcon}
              />
              <StatisticCard
                label={t.auditLogEntries24h}
                value={data.recentAuditLogCount}
                icon={ClipboardIcon}
              />
            </StatGroup>
          </>

        ) : null}

      </PageContainer>

    </div>
  );
}
