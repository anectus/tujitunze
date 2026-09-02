"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getAccessToken } from "@/lib/utils/permissions";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { useLanguage } from "@/lib/context/LanguageContext";
import { superAdminSavingRulesTranslations } from "@/constants/translations/super-admin-saving-rules";
import { API_URL } from "@/lib/utils/api";

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

export default function SuperAdminSavingRulesPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const t = superAdminSavingRulesTranslations[language];

  const [rules, setRules] = useState<SavingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [form, setForm] = useState(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const [savingRuleId, setSavingRuleId] = useState<number | null>(null);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
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
        return body;
      })
      .then(setRules)
      .catch((err) => setLoadError(err instanceof Error ? err.message : t.loadError))
      .finally(() => setLoading(false));
  }, [router, t.loadError]);

  const updateRuleField = (
    ruleId: number,
    field: "ratePercent" | "isActive",
    value: string | boolean
  ) => {
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

  const ruleTypeOptions =
    form.principle === "RESOURCE_CONVERSION" ? RESOURCE_RULE_TYPES : TRANSACTION_RULE_TYPES;

  function RuleTable({ items }: { items: SavingRule[] }) {
    return (
      <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-md">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
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
              <tr key={rule.ruleId}>
                <td className="px-6 py-4 font-semibold text-gray-900">{rule.ruleType}</td>
                <td className="px-6 py-4">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={rule.ratePercent}
                    onChange={(e) => updateRuleField(rule.ruleId, "ratePercent", e.target.value)}
                    className="w-24 rounded-lg border border-gray-200 px-3 py-1.5 text-sm"
                  />
                </td>
                <td className="px-6 py-4">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={rule.isActive}
                      onChange={(e) => updateRuleField(rule.ruleId, "isActive", e.target.checked)}
                    />
                    <span className="text-gray-600">
                      {rule.isActive ? t.active : t.inactive}
                    </span>
                  </label>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                  {new Date(rule.effectiveDate).toLocaleDateString("en-TZ")}
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    type="button"
                    onClick={() => saveRule(rule)}
                    disabled={savingRuleId === rule.ruleId}
                    className="rounded-lg bg-blue-700 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:opacity-50"
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

  return (
    <div>
      <DashboardHeader title={t.title} />

      <div className="p-4 sm:p-8">
        <p className="mb-6 max-w-3xl text-sm text-gray-500">{t.subtitle}</p>

        {loadError && (
          <div className="mb-6 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
            {loadError}
          </div>
        )}
        {saveError && (
          <div className="mb-6 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
            {saveError}
          </div>
        )}

        {loading ? (
          <p className="text-gray-500">{t.loading}</p>
        ) : (
          <div className="space-y-8">
            <div>
              <h2 className="mb-3 text-lg font-bold text-gray-900">
                {t.resourceConversionHeading}
              </h2>
              <RuleTable items={resourceRules} />
            </div>

            <div>
              <h2 className="mb-2 text-lg font-bold text-gray-900">
                {t.transactionDiversionHeading}
              </h2>
              <p className="mb-3 text-sm text-amber-700">{t.transactionDiversionNote}</p>
              <RuleTable items={transactionRules} />
            </div>
          </div>
        )}

        <div className="mt-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-md">
          <h2 className="text-lg font-bold text-gray-900">{t.createTitle}</h2>
          <p className="mt-1 text-sm text-gray-600">{t.createSubtitle}</p>

          <form onSubmit={handleCreate} className="mt-6 grid gap-4 sm:grid-cols-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">{t.principle}</label>
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
              <label className="block text-sm font-medium text-gray-700">{t.ruleType}</label>
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
              <label className="block text-sm font-medium text-gray-700">{t.ratePercent}</label>
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
                className="w-full rounded-lg bg-blue-700 px-6 py-2.5 font-semibold text-white transition hover:bg-blue-800 disabled:opacity-50"
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
      </div>
    </div>
  );
}
