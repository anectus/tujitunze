"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { getAccessToken } from "@/lib/utils/permissions";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import PageContainer from "@/components/dashboard/PageContainer";
import StatGroup from "@/components/dashboard/StatGroup";
import StatisticCard from "@/components/cards/StatisticCard";
import QuickActions, {
  type QuickAction,
} from "@/components/dashboard/QuickActions";
import { useLanguage, type Language } from "@/lib/context/LanguageContext";
import { superAdminSavingRulesTranslations } from "@/constants/translations/super-admin-saving-rules";
import { superAdminDashboardTranslations } from "@/constants/translations/super-admin-dashboard";
import { API_URL } from "@/lib/utils/api";
import {
  BadgeCheckIcon,
  ClipboardIcon,
  CoinsIcon,
  KeyIcon,
  PlusIcon,
  SwapIcon,
} from "@/components/common/SidebarIcons";

type Principle = "RESOURCE_CONVERSION" | "TRANSACTION_DIVERSION";

interface SavingRule {
  ruleId: number;
  ruleType: string;
  principle: Principle;
  transactionType: string | null;
  channel: string | null;
  ratePercent: string;
  minimumAmount: string;
  effectiveDate: string;
  isActive: boolean;
}

const RESOURCE_RULE_TYPES = ["VOICE", "DATA", "SMS"];
const TRANSACTION_RULE_TYPES = ["TUMA", "LIPA_NAMBA", "TOA", "BILL_PAYMENT"];

const EMPTY_FORM = {
  principle: "RESOURCE_CONVERSION" as Principle,
  ruleType: RESOURCE_RULE_TYPES[0],
  ratePercent: "",
};

function extractMessage(body: unknown, fallback: string): string {
  if (body && typeof body === "object" && "message" in body) {
    const message = (body as { message: unknown }).message;
    if (Array.isArray(message)) return message.join(" ");
    if (typeof message === "string") return message;
  }
  return fallback;
}

type SavingRulesText = (typeof superAdminSavingRulesTranslations)[Language];

// Hoisted to module scope (not a helper defined inside the page
// component) — a component declared during render loses its state on
// every re-render, since React sees it as a brand-new component type
// each time.
function RuleTable({
  items,
  t,
  savingRuleId,
  onRateChange,
  onActiveChange,
  onSave,
}: {
  items: SavingRule[];
  t: SavingRulesText;
  savingRuleId: number | null;
  onRateChange: (ruleId: number, value: string) => void;
  onActiveChange: (ruleId: number, value: boolean) => void;
  onSave: (rule: SavingRule) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-md">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-6 py-3 font-semibold">{t.ruleType}</th>
            <th className="px-6 py-3 font-semibold">{t.ratePercent}</th>
            <th className="px-6 py-3 font-semibold">{t.active}</th>
            <th className="px-6 py-3 font-semibold">{t.lastUpdated}</th>
            <th className="px-6 py-3 font-semibold"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {items.map((rule) => (
            <tr key={rule.ruleId} className="transition hover:bg-gray-50">
              <td className="px-6 py-4 font-semibold text-gray-900">{rule.ruleType}</td>
              <td className="px-6 py-4">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={rule.ratePercent}
                  onChange={(e) => onRateChange(rule.ruleId, e.target.value)}
                  className="w-24 rounded-lg border border-gray-200 px-3 py-1.5 text-sm"
                />
              </td>
              <td className="px-6 py-4">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={rule.isActive}
                    onChange={(e) => onActiveChange(rule.ruleId, e.target.checked)}
                  />
                  <span className="text-slate-600">
                    {rule.isActive ? t.active : t.inactive}
                  </span>
                </label>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                {new Date(rule.effectiveDate).toLocaleDateString("en-TZ")}
              </td>
              <td className="px-6 py-4 text-right">
                <button
                  type="button"
                  onClick={() => onSave(rule)}
                  disabled={savingRuleId === rule.ruleId}
                  className="rounded-lg bg-emerald-700 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-50"
                >
                  {savingRuleId === rule.ruleId ? t.saving : t.save}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function SuperAdminSavingRulesPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const t = superAdminSavingRulesTranslations[language];
  const dt = superAdminDashboardTranslations[language];

  const [rules, setRules] = useState<SavingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [form, setForm] = useState(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const [savingRuleId, setSavingRuleId] = useState<number | null>(null);
  const [saveError, setSaveError] = useState("");

  // The last value confirmed by the server for each rule — set on initial
  // load and after every successful Save. Lets revalidate-on-focus tell
  // "this row matches what the server last told us" (safe to replace with
  // fresh data) apart from "this row has an unsaved local edit" (must not
  // be clobbered), without needing a separate dirty flag per row.
  const lastSyncedRulesRef = useRef<Map<number, SavingRule>>(new Map());

  const loadRules = () => {
    const token = getAccessToken();
    if (!token) {
      router.push("/login");
      return;
    }

    fetch(`${API_URL}/super-admin/saving-rules`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(extractMessage(body, t.loadError));
        return body as SavingRule[];
      })
      .then((body) => {
        lastSyncedRulesRef.current = new Map(body.map((r) => [r.ruleId, r]));
        setRules(body);
      })
      .catch((err) => setLoadError(err instanceof Error ? err.message : t.loadError))
      .finally(() => setLoading(false));
  };

  useEffect(loadRules, [router, t.loadError]);

  // Revalidate on tab focus — merges in fresh server data rather than
  // replacing wholesale, since a row's rate/active checkbox is locally
  // edited before its own per-row Save: a row still matching its last
  // server-confirmed value adopts the fresh data, but a row with an
  // unsaved local edit (differs from lastSyncedRulesRef) is left alone
  // rather than silently clobbered.
  useEffect(() => {
    const revalidate = async () => {
      const token = getAccessToken();
      if (!token) return;

      const response = await fetch(`${API_URL}/super-admin/saving-rules`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return;

      const serverRules = (await response.json()) as SavingRule[];

      setRules((current) =>
        serverRules.map((serverRule) => {
          const currentRow = current.find((r) => r.ruleId === serverRule.ruleId);
          const lastSynced = lastSyncedRulesRef.current.get(serverRule.ruleId);
          const isDirty =
            currentRow && JSON.stringify(currentRow) !== JSON.stringify(lastSynced);
          return isDirty ? currentRow! : serverRule;
        })
      );
      lastSyncedRulesRef.current = new Map(
        serverRules.map((r) => [r.ruleId, r])
      );
    };

    window.addEventListener("focus", revalidate);
    return () => window.removeEventListener("focus", revalidate);
     
  }, []);

  const updateRuleField = (
    ruleId: number,
    field: "ratePercent" | "isActive",
    value: string | boolean
  ) => {
    if (field === "isActive" && value === false) {
      const rule = rules.find((r) => r.ruleId === ruleId);
      if (
        rule?.principle === "RESOURCE_CONVERSION" &&
        !window.confirm(t.deactivateResourceConversionConfirm.replace("{ruleType}", rule.ruleType))
      ) {
        return;
      }
    }

    setRules((prev) =>
      prev.map((r) => (r.ruleId === ruleId ? { ...r, [field]: value } : r))
    );
  };

  const saveRule = async (rule: SavingRule) => {
    setSaveError("");
    const token = getAccessToken();
    if (!token) {
      router.push("/login");
      return;
    }

    setSavingRuleId(rule.ruleId);

    try {
      const response = await fetch(
        `${API_URL}/super-admin/saving-rules/${rule.ruleId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ratePercent: Number(rule.ratePercent),
            isActive: rule.isActive,
          }),
        }
      );

      const body = await response.json();
      if (!response.ok) throw new Error(extractMessage(body, t.saveError));

      // Keep the dirty-check baseline in sync — otherwise the next
      // focus-triggered revalidate would compare this now-clean row
      // against its stale pre-save snapshot and wrongly treat it as still
      // having an unsaved edit, leaving it stuck on old data forever.
      lastSyncedRulesRef.current.set(rule.ruleId, body as SavingRule);
      setRules((prev) => prev.map((r) => (r.ruleId === rule.ruleId ? body : r)));
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : t.saveError);
    } finally {
      setSavingRuleId(null);
    }
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setCreateError("");
    const token = getAccessToken();
    if (!token) {
      router.push("/login");
      return;
    }

    setCreating(true);

    try {
      const response = await fetch(`${API_URL}/super-admin/saving-rules`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          principle: form.principle,
          ruleType: form.ruleType,
          ratePercent: Number(form.ratePercent),
        }),
      });

      const body = await response.json();
      if (!response.ok) throw new Error(extractMessage(body, t.createError));

      lastSyncedRulesRef.current.set((body as SavingRule).ruleId, body as SavingRule);
      setRules((prev) => [...prev, body]);
      setForm(EMPTY_FORM);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : t.createError);
    } finally {
      setCreating(false);
    }
  };

  const resourceRules = rules.filter((r) => r.principle === "RESOURCE_CONVERSION");
  const transactionRules = rules.filter((r) => r.principle === "TRANSACTION_DIVERSION");
  const activeRuleCount = rules.filter((r) => r.isActive).length;

  const ruleTypeOptions =
    form.principle === "RESOURCE_CONVERSION" ? RESOURCE_RULE_TYPES : TRANSACTION_RULE_TYPES;

  const quickActions: QuickAction[] = [
    {
      label: dt.quickActionCreateAdministrator,
      href: "/super-admin/administrators",
      icon: PlusIcon,
    },
    {
      label: dt.quickActionRolesPermissions,
      href: "/super-admin/roles",
      icon: KeyIcon,
    },
    {
      label: dt.quickActionAuditLogs,
      href: "/super-admin/audit-logs",
      icon: ClipboardIcon,
    },
  ];

  return (
    <div>
      <DashboardHeader title={t.title} />

      <PageContainer maxWidth="6xl">

        <QuickActions actions={quickActions} />

        <p className="mt-6 max-w-3xl text-sm text-slate-500">{t.subtitle}</p>

        {loadError && (
          <div className="mt-6 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
            {loadError}
          </div>
        )}
        {saveError && (
          <div className="mt-6 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
            {saveError}
          </div>
        )}

        {!loading && (
          <StatGroup title={dt.sectionGovernance}>
            <StatisticCard
              label={dt.activeRules}
              value={activeRuleCount}
              icon={BadgeCheckIcon}
            />
            <StatisticCard
              label={dt.inactiveRules}
              value={rules.length - activeRuleCount}
              icon={ClipboardIcon}
            />
            <StatisticCard
              label={dt.resourceConversionRules}
              value={resourceRules.length}
              icon={CoinsIcon}
            />
            <StatisticCard
              label={dt.transactionDiversionRules}
              value={transactionRules.length}
              icon={SwapIcon}
            />
          </StatGroup>
        )}

        {loading ? (
          <p className="mt-8 text-slate-500">{t.loading}</p>
        ) : (
          <div className="mt-10 space-y-8">
            <div>
              <h2 className="mb-2 text-lg font-bold text-gray-900">
                {t.resourceConversionHeading}
              </h2>
              <p className="mb-3 text-sm text-emerald-700">{t.resourceConversionNote}</p>
              <RuleTable
                items={resourceRules}
                t={t}
                savingRuleId={savingRuleId}
                onRateChange={(ruleId, value) => updateRuleField(ruleId, "ratePercent", value)}
                onActiveChange={(ruleId, value) => updateRuleField(ruleId, "isActive", value)}
                onSave={saveRule}
              />
            </div>

            <div>
              <h2 className="mb-2 text-lg font-bold text-gray-900">
                {t.transactionDiversionHeading}
              </h2>
              <p className="mb-3 text-sm text-amber-700">{t.transactionDiversionNote}</p>
              <RuleTable
                items={transactionRules}
                t={t}
                savingRuleId={savingRuleId}
                onRateChange={(ruleId, value) => updateRuleField(ruleId, "ratePercent", value)}
                onActiveChange={(ruleId, value) => updateRuleField(ruleId, "isActive", value)}
                onSave={saveRule}
              />
            </div>
          </div>
        )}

        <div className="mt-10 rounded-2xl border border-gray-100 bg-white p-6 shadow-md">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-[#064E3B]">
              <PlusIcon className="h-5 w-5" />
            </span>
            <h2 className="text-lg font-bold text-gray-900">{t.createTitle}</h2>
          </div>
          <p className="mt-1 text-sm text-slate-600">{t.createSubtitle}</p>

          <form onSubmit={handleCreate} className="mt-6 grid gap-4 sm:grid-cols-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">{t.principle}</label>
              <select
                value={form.principle}
                onChange={(e) =>
                  setForm({
                    principle: e.target.value as Principle,
                    ruleType:
                      e.target.value === "RESOURCE_CONVERSION"
                        ? RESOURCE_RULE_TYPES[0]
                        : TRANSACTION_RULE_TYPES[0],
                    ratePercent: form.ratePercent,
                  })
                }
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              >
                <option value="RESOURCE_CONVERSION">{t.resourceConversionHeading}</option>
                <option value="TRANSACTION_DIVERSION">{t.transactionDiversionHeading}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">{t.ruleType}</label>
              <select
                value={form.ruleType}
                onChange={(e) => setForm({ ...form, ruleType: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              >
                {ruleTypeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">{t.ratePercent}</label>
              <input
                type="number"
                required
                min="0"
                max="100"
                step="0.01"
                value={form.ratePercent}
                onChange={(e) => setForm({ ...form, ratePercent: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={creating}
                className="w-full rounded-lg bg-emerald-700 px-6 py-2.5 font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-50"
              >
                {creating ? t.creating : t.createButton}
              </button>
            </div>

            {createError && (
              <div className="sm:col-span-4 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
                {createError}
              </div>
            )}
          </form>
        </div>
      </PageContainer>
    </div>
  );
}
