"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getAccessToken } from "@/lib/utils/permissions";
import { formatNidaNumber } from "@/lib/utils/nida";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import PageContainer from "@/components/dashboard/PageContainer";
import StatGroup from "@/components/dashboard/StatGroup";
import StatisticCard from "@/components/cards/StatisticCard";
import QuickActions, {
  type QuickAction,
} from "@/components/dashboard/QuickActions";
import StatusBadge from "@/components/common/StatusBadge";
import { useLanguage } from "@/lib/context/LanguageContext";
import { superAdminAdministratorsTranslations } from "@/constants/translations/super-admin-administrators";
import { superAdminDashboardTranslations } from "@/constants/translations/super-admin-dashboard";
import { roleLabelTranslations } from "@/constants/translations/common";
import { API_URL } from "@/lib/utils/api";
import {
  ClipboardIcon,
  CoinsIcon,
  KeyIcon,
  PlusIcon,
  ShieldIcon,
  UserCircleIcon,
  UsersIcon,
  WalletIcon,
} from "@/components/common/SidebarIcons";

const STAFF_ROLES = [
  "Admin",
  "Bank",
  "Telecom",
  "Insurance",
  "Super-admin",
] as const;

type StaffRole = (typeof STAFF_ROLES)[number];

const TENANT_ROLE_KEY: Partial<Record<StaffRole, keyof TenantOptions>> = {
  Bank: "banks",
  Telecom: "telecomOperators",
  Insurance: "insuranceProviders",
};

interface Administrator {
  userId: number;
  firstName: string;
  secondName: string | null;
  surname: string;
  email: string | null;
  status: string;
  createdAt: string;
  role: string;
  tenantName: string | null;
}

interface TenantOption {
  id: number;
  name: string;
}

interface TenantOptions {
  banks: TenantOption[];
  telecomOperators: TenantOption[];
  insuranceProviders: TenantOption[];
}

const EMPTY_TENANTS: TenantOptions = {
  banks: [],
  telecomOperators: [],
  insuranceProviders: [],
};

const EMPTY_FORM = {
  firstName: "",
  secondName: "",
  surname: "",
  email: "",
  nidaNumber: "",
  password: "",
  role: "Bank" as StaffRole,
  tenantId: "",
};

function extractMessage(body: unknown, fallback: string): string {
  if (body && typeof body === "object" && "message" in body) {
    const message = (body as { message: unknown }).message;
    if (Array.isArray(message)) return message.join(" ");
    if (typeof message === "string") return message;
  }
  return fallback;
}

export default function SuperAdminAdministratorsPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const t = superAdminAdministratorsTranslations[language];
  const dt = superAdminDashboardTranslations[language];
  const roleLabels = roleLabelTranslations[language];

  const [administrators, setAdministrators] = useState<Administrator[]>([]);
  const [tenants, setTenants] = useState<TenantOptions>(EMPTY_TENANTS);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const loadData = async () => {
    const token = getAccessToken();

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const [administratorsRes, tenantsRes] = await Promise.all([
        fetch(`${API_URL}/super-admin/administrators`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/super-admin/tenants`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (administratorsRes.status === 401 || tenantsRes.status === 401) {
        router.push("/login");
        return;
      }

      const administratorsBody = await administratorsRes.json();
      const tenantsBody = await tenantsRes.json();

      if (!administratorsRes.ok) {
        throw new Error(
          extractMessage(administratorsBody, t.loadAdministratorsError)
        );
      }

      if (!tenantsRes.ok) {
        throw new Error(extractMessage(tenantsBody, t.loadTenantsError));
      }

      setAdministrators(administratorsBody);
      setTenants(tenantsBody);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : t.loadPageError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch on mount, not a derived-state sync
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only fetch, not a value this effect should re-sync to
  }, [router, t.loadAdministratorsError, t.loadTenantsError, t.loadPageError]);

  // Revalidate on tab focus — a change made elsewhere (another tab, a
  // teammate) shows up without a full reload. See the Saving Rules page
  // for the same pattern and why this is scoped to focus rather than a
  // data-fetching library.
  useEffect(() => {
    window.addEventListener("focus", loadData);
    return () => window.removeEventListener("focus", loadData);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- subscribe once; loadData reads current state via closures at call time
  }, []);

  const tenantOptionsForRole = (role: StaffRole): TenantOption[] => {
    const key = TENANT_ROLE_KEY[role];
    return key ? tenants[key] : [];
  };

  const requiresTenant = Boolean(TENANT_ROLE_KEY[form.role]);

  const quickActions: QuickAction[] = [
    {
      label: dt.quickActionRolesPermissions,
      href: "/super-admin/roles",
      icon: KeyIcon,
    },
    {
      label: dt.quickActionSavingRules,
      href: "/super-admin/saving-rules",
      icon: CoinsIcon,
    },
    {
      label: dt.quickActionAuditLogs,
      href: "/super-admin/audit-logs",
      icon: ClipboardIcon,
    },
  ];

  const tenantLinkedCount = administrators.filter((admin) =>
    (["Bank", "Telecom", "Insurance"] as StaffRole[]).includes(
      admin.role as StaffRole
    )
  ).length;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError("");

    const token = getAccessToken();
    if (!token) {
      router.push("/login");
      return;
    }

    if (requiresTenant && !form.tenantId) {
      setFormError(
        t.tenantRequiredError.replace("{role}", roleLabels[form.role])
      );
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(
        `${API_URL}/super-admin/administrators`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            firstName: form.firstName,
            secondName: form.secondName || undefined,
            surname: form.surname,
            email: form.email,
            nidaNumber: form.nidaNumber,
            password: form.password,
            role: form.role,
            tenantId: requiresTenant ? Number(form.tenantId) : undefined,
          }),
        }
      );

      const body = await response.json();

      if (!response.ok) {
        throw new Error(extractMessage(body, t.createError));
      }

      setAdministrators((prev) => [
        {
          userId: body.userId,
          firstName: body.firstName,
          secondName: body.secondName,
          surname: body.surname,
          email: body.email,
          status: body.memberStatus,
          createdAt: body.createdAt,
          role: body.role,
          tenantName:
            tenantOptionsForRole(form.role).find(
              (option) => option.id === Number(form.tenantId)
            )?.name ?? null,
        },
        ...prev,
      ]);

      setForm(EMPTY_FORM);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t.createError);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>

      <DashboardHeader title={t.title} />

      <PageContainer maxWidth="6xl">

        <QuickActions actions={quickActions} />

        {loadError && (
          <div className="mt-6 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
            {loadError}
          </div>
        )}

        {!loading && (
          <StatGroup title={dt.sectionStaffOverview}>
            <StatisticCard
              label={dt.totalAdministrators}
              value={administrators.length}
              icon={UsersIcon}
            />
            <StatisticCard
              label={dt.admins}
              value={administrators.filter((a) => a.role === "Admin").length}
              icon={UserCircleIcon}
            />
            <StatisticCard
              label={t.colTenant}
              value={tenantLinkedCount}
              icon={WalletIcon}
            />
            <StatisticCard
              label={roleLabels["Super-admin"]}
              value={
                administrators.filter((a) => a.role === "Super-admin").length
              }
              icon={ShieldIcon}
            />
          </StatGroup>
        )}

        <div className="mt-10 rounded-2xl border border-gray-100 bg-white p-6 shadow-md">

          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-[#064E3B]">
              <PlusIcon className="h-5 w-5" />
            </span>
            <h2 className="text-lg font-bold text-gray-900">{t.createTitle}</h2>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            {t.createSubtitle}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">

            <div>
              <label className="block text-sm font-medium text-slate-700">{t.firstName}</label>
              <input
                required
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">{t.surname}</label>
              <input
                required
                value={form.surname}
                onChange={(e) => setForm({ ...form, surname: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">{t.email}</label>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">{t.nidaNumber}</label>
              <input
                required
                value={form.nidaNumber}
                onChange={(e) =>
                  setForm({ ...form, nidaNumber: formatNidaNumber(e.target.value) })
                }
                placeholder="00000000-00000-00000-00"
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">{t.password}</label>
              <input
                required
                type="password"
                minLength={8}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">{t.role}</label>
              <select
                value={form.role}
                onChange={(e) =>
                  setForm({
                    ...form,
                    role: e.target.value as StaffRole,
                    tenantId: "",
                  })
                }
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              >
                {STAFF_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {roleLabels[role]}
                  </option>
                ))}
              </select>
            </div>

            {requiresTenant && (
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700">
                  {roleLabels[form.role]}
                </label>
                <select
                  required
                  value={form.tenantId}
                  onChange={(e) => setForm({ ...form, tenantId: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                >
                  <option value="">
                    {t.selectTenantPrefix} {roleLabels[form.role]}...
                  </option>
                  {tenantOptionsForRole(form.role).map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {formError && (
              <div className="sm:col-span-2 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
                {formError}
              </div>
            )}

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-emerald-700 px-6 py-3 font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-50"
              >
                {submitting ? t.creating : t.createButton}
              </button>
            </div>

          </form>

        </div>

        <div className="mt-8 overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-md">

          <table className="w-full text-left text-sm">

            <thead className="bg-gray-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-6 py-3 font-semibold">{t.colName}</th>
                <th className="px-6 py-3 font-semibold">{t.colEmail}</th>
                <th className="px-6 py-3 font-semibold">{t.colRole}</th>
                <th className="px-6 py-3 font-semibold">{t.colTenant}</th>
                <th className="px-6 py-3 font-semibold">{t.colStatus}</th>
                <th className="px-6 py-3 font-semibold">{t.colCreated}</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">

              {loading ? (
                <tr>
                  <td className="px-6 py-4 text-slate-500" colSpan={6}>
                    {t.loadingRow}
                  </td>
                </tr>
              ) : administrators.length === 0 ? (
                <tr>
                  <td className="px-6 py-4 text-slate-500" colSpan={6}>
                    {t.emptyRow}
                  </td>
                </tr>
              ) : (
                administrators.map((admin) => (
                  <tr key={admin.userId} className="transition hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {admin.firstName} {admin.surname}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{admin.email}</td>
                    <td className="px-6 py-4 text-slate-600">
                      {roleLabels[admin.role as StaffRole] ?? admin.role}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {admin.tenantName ?? "—"}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge domain="member" status={admin.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                      {new Date(admin.createdAt).toLocaleDateString("en-TZ")}
                    </td>
                  </tr>
                ))
              )}

            </tbody>

          </table>

        </div>

      </PageContainer>

    </div>
  );
}
